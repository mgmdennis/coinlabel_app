const { Jimp } = require('jimp');
const { dataUriToJimp, jimpToDataUri, detectBgThreshold, trimBackground } = require('./imageUtils');
const { saveSketch } = require('./saveSketch');

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Return the value at the given percentile (0–100) of a sorted numeric array. */
function percentile(sorted, pct) {
    const idx = Math.max(0, Math.min(sorted.length - 1, Math.floor(sorted.length * pct / 100)));
    return sorted[idx];
}

/**
 * Step 3 – Adaptive histogram normalisation.
 * Stretches the 2nd–98th percentile range to the full 0–255 output range.
 */
function adaptiveNormalise(data, w, h) {
    const vals = new Uint8Array(w * h);
    for (let i = 0; i < w * h; i++) vals[i] = data[i * 4]; // greyscale: R==G==B
    const sorted = Array.from(vals).sort((a, b) => a - b);
    const lo = percentile(sorted, 2);
    const hi = percentile(sorted, 98);
    const range = hi - lo || 1;
    for (let i = 0; i < w * h; i++) {
        const v = Math.round(Math.max(0, Math.min(255, ((vals[i] - lo) / range) * 255)));
        data[i * 4] = data[i * 4 + 1] = data[i * 4 + 2] = v;
    }
}

/**
 * Step 4 – Dark-field detection.
 * Sample a ring of pixels at ~35–45% radius from the image centre.
 * Returns true when the field is dark (median < 100) and the image should be inverted.
 */
function isDarkField(data, w, h) {
    const cx = w / 2, cy = h / 2;
    const innerR = Math.min(w, h) * 0.35;
    const outerR = Math.min(w, h) * 0.45;
    const samples = [];
    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            const dx = x - cx, dy = y - cy;
            const r = Math.sqrt(dx * dx + dy * dy);
            if (r >= innerR && r <= outerR) {
                samples.push(data[(y * w + x) * 4]);
            }
        }
    }
    if (samples.length === 0) return false;
    samples.sort((a, b) => a - b);
    const median = samples[Math.floor(samples.length / 2)];
    console.log(`🌑 Ring median brightness: ${median}`);
    return median < 100;
}

/** Invert greyscale pixels in-place. */
function invertGreyscale(data, w, h) {
    for (let i = 0; i < w * h; i++) {
        const v = 255 - data[i * 4];
        data[i * 4] = data[i * 4 + 1] = data[i * 4 + 2] = v;
    }
}

/**
 * Step 5 – 3×3 Gaussian blur (kernel sum = 16).
 * Returns a new Float32Array of greyscale values.
 */
function gaussianBlur(data, w, h) {
    const K = [1, 2, 1, 2, 4, 2, 1, 2, 1];
    const out = new Float32Array(w * h);
    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            let sum = 0, weight = 0;
            for (let ky = -1; ky <= 1; ky++) {
                for (let kx = -1; kx <= 1; kx++) {
                    const nx = x + kx, ny = y + ky;
                    if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
                        const k = K[(ky + 1) * 3 + (kx + 1)];
                        sum += data[(ny * w + nx) * 4] * k;
                        weight += k;
                    }
                }
            }
            out[y * w + x] = sum / weight;
        }
    }
    return out;
}

/**
 * Step 6 – Sobel gradient.
 * Returns { mag: Float32Array, dir: Float32Array } in the same flat pixel order.
 */
function sobelGradient(blurred, w, h) {
    const mag = new Float32Array(w * h);
    const dir = new Float32Array(w * h);
    for (let y = 1; y < h - 1; y++) {
        for (let x = 1; x < w - 1; x++) {
            const tl = blurred[(y - 1) * w + (x - 1)], tc = blurred[(y - 1) * w + x], tr = blurred[(y - 1) * w + (x + 1)];
            const ml = blurred[y * w + (x - 1)],                                          mr = blurred[y * w + (x + 1)];
            const bl = blurred[(y + 1) * w + (x - 1)], bc = blurred[(y + 1) * w + x], br = blurred[(y + 1) * w + (x + 1)];
            const gx = -tl - 2 * ml - bl + tr + 2 * mr + br;
            const gy = -tl - 2 * tc - tr + bl + 2 * bc + br;
            mag[y * w + x] = Math.sqrt(gx * gx + gy * gy);
            dir[y * w + x] = Math.atan2(gy, gx);
        }
    }
    return { mag, dir };
}

/**
 * Step 7 – Non-maximum suppression.
 * Returns a new Float32Array with only local-maximum edge ridges retained.
 */
function nonMaxSuppression(mag, dir, w, h) {
    const nms = new Float32Array(w * h);
    for (let y = 1; y < h - 1; y++) {
        for (let x = 1; x < w - 1; x++) {
            const m = mag[y * w + x];
            if (m === 0) continue;
            // Snap angle to nearest 45°
            const angle = (dir[y * w + x] * 180 / Math.PI + 180) % 180;
            let n1, n2;
            if (angle < 22.5 || angle >= 157.5) {
                n1 = mag[y * w + (x - 1)]; n2 = mag[y * w + (x + 1)];
            } else if (angle < 67.5) {
                n1 = mag[(y - 1) * w + (x + 1)]; n2 = mag[(y + 1) * w + (x - 1)];
            } else if (angle < 112.5) {
                n1 = mag[(y - 1) * w + x]; n2 = mag[(y + 1) * w + x];
            } else {
                n1 = mag[(y - 1) * w + (x - 1)]; n2 = mag[(y + 1) * w + (x + 1)];
            }
            if (m >= n1 && m >= n2) nms[y * w + x] = m;
        }
    }
    return nms;
}

/**
 * Step 8 – Double-threshold hysteresis.
 * Returns a Uint8Array: 255 = strong edge, 0 = nothing.
 */
function doubleThresholdHysteresis(nms, w, h) {
    // Collect non-zero magnitudes to compute adaptive thresholds
    const nonZero = [];
    for (let i = 0; i < nms.length; i++) {
        if (nms[i] > 0) nonZero.push(nms[i]);
    }
    nonZero.sort((a, b) => a - b);
    const highT = nonZero.length > 0 ? percentile(nonZero, 90) : 128;
    const lowT  = nonZero.length > 0 ? percentile(nonZero, 70) : 64;
    console.log(`🔍 Hysteresis thresholds: low=${lowT.toFixed(1)}, high=${highT.toFixed(1)}`);

    const STRONG = 255, WEAK = 128;
    const edges = new Uint8Array(w * h);
    for (let i = 0; i < nms.length; i++) {
        if (nms[i] >= highT) edges[i] = STRONG;
        else if (nms[i] >= lowT) edges[i] = WEAK;
    }

    // BFS flood-fill: promote weak edges connected to strong ones
    const queue = [];
    for (let i = 0; i < edges.length; i++) {
        if (edges[i] === STRONG) queue.push(i);
    }
    let qi = 0;
    while (qi < queue.length) {
        const i = queue[qi++];
        const x = i % w, y = Math.floor(i / w);
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                if (dx === 0 && dy === 0) continue;
                const nx = x + dx, ny = y + dy;
                if (nx < 0 || nx >= w || ny < 0 || ny >= h) continue;
                const ni = ny * w + nx;
                if (edges[ni] === WEAK) {
                    edges[ni] = STRONG;
                    queue.push(ni);
                }
            }
        }
    }

    // Discard remaining weak pixels
    for (let i = 0; i < edges.length; i++) {
        if (edges[i] !== STRONG) edges[i] = 0;
    }
    return edges;
}

/**
 * Step 10 – Selective dilation (1-pixel expansion of edge pixels).
 * Mutates `edges` in-place.
 */
function dilateEdges(edges, w, h) {
    const copy = new Uint8Array(edges);
    for (let y = 1; y < h - 1; y++) {
        for (let x = 1; x < w - 1; x++) {
            if (copy[y * w + x] === 255) continue;
            outer: for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    if (copy[(y + dy) * w + (x + dx)] === 255) {
                        edges[y * w + x] = 255;
                        break outer;
                    }
                }
            }
        }
    }
}

// ---------------------------------------------------------------------------
// Public interface
// ---------------------------------------------------------------------------

/**
 * Apply the Canny-inspired edge detection pipeline and return a black-on-white
 * Jimp instance ready for compositing.
 *
 * @param {object} image      - Jimp instance (will be mutated)
 * @param {number} scaledSize - target output size in pixels (square)
 * @returns {Promise<object>} - Jimp instance containing the finished sketch
 */
async function applyScriptSketch(image, scaledSize) {
    // Step 1 – Greyscale
    image.greyscale();

    // Step 2 – Trim background
    trimBackground(image, detectBgThreshold(image), 0.02, 'SCRIPT');

    const bmp = image.bitmap;
    const w = bmp.width, h = bmp.height;
    const data = bmp.data; // Uint8Array, 4 bytes per pixel (RGBA)

    // Step 3 – Adaptive histogram normalisation
    adaptiveNormalise(data, w, h);

    // Step 4 – Dark-field detection + optional inversion
    if (isDarkField(data, w, h)) {
        console.log(`🔄 Dark field detected — inverting image`);
        invertGreyscale(data, w, h);
    }

    // Step 5 – Gaussian blur
    const blurred = gaussianBlur(data, w, h);

    // Step 6 – Sobel gradient
    const { mag, dir } = sobelGradient(blurred, w, h);

    // Step 7 – Non-maximum suppression
    const nms = nonMaxSuppression(mag, dir, w, h);

    // Step 8 – Double-threshold hysteresis
    const edges = doubleThresholdHysteresis(nms, w, h);

    // Step 10 – Selective dilation for small coins (applied to edges array before rendering)
    if (scaledSize < 200) {
        console.log(`🔵 Small coin (${scaledSize}px) — applying dilation`);
        dilateEdges(edges, w, h);
    }

    // Step 9 – Write black-on-white output back into the Jimp bitmap
    // (applied last so dilation can expand edge pixels before the final render)
    for (let i = 0; i < w * h; i++) {
        const v = edges[i] === 255 ? 0 : 255;
        data[i * 4] = data[i * 4 + 1] = data[i * 4 + 2] = v;
        data[i * 4 + 3] = 255;
    }

    return image;
}

/**
 * Handle the SCRIPT pipeline end-to-end.
 * @param {object} res         - Express response object
 * @param {object} opts
 * @param {string} opts.resolvedImageData
 * @param {string} opts.numistaNumber
 * @param {string} opts.side
 * @param {string} opts.sourceHash
 * @param {string} opts.year
 * @param {number} opts.scaledSize
 */
async function handleScriptSketch(res, { resolvedImageData, numistaNumber, side, sourceHash, year, scaledSize }) {
    console.log(`💻 Processing Script Sketch for #${numistaNumber}...`);

    const image = await dataUriToJimp(resolvedImageData);
    await applyScriptSketch(image, scaledSize);

    // Fit into square canvas (preserves full coin, no clipping)
    image.resize({ w: scaledSize, h: scaledSize, fit: 'contain' });
    const canvas = new Jimp({ width: scaledSize, height: scaledSize, color: 0xFFFFFFFF });
    canvas.composite(image, Math.floor((scaledSize - image.width) / 2), Math.floor((scaledSize - image.height) / 2));

    return saveSketch(res, {
        imageData: await jimpToDataUri(canvas),
        method: 'SCRIPT', side, sourceHash, numistaNumber, year, scaledSize,
    });
}

module.exports = { applyScriptSketch, handleScriptSketch };
