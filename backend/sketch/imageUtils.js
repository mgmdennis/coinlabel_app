const { Jimp } = require('jimp');

/** Decode a data-URI and return a Jimp image instance. */
async function dataUriToJimp(dataUri) {
    const base64 = dataUri.replace(/^data:image\/\w+;base64,/, '');
    return Jimp.read(Buffer.from(base64, 'base64'));
}

/** Export a Jimp image to a PNG data-URI string. */
async function jimpToDataUri(image) {
    const buf = await image.getBuffer('image/png');
    return `data:image/png;base64,${buf.toString('base64')}`;
}

/**
 * Sample the average greyscale brightness of a small block of corner pixels
 * to determine what the background colour is. Returns a threshold value such
 * that pixels >= threshold are considered background.
 * Uses all four corners of size `blockSize` x `blockSize`.
 */
function detectBgThreshold(image, blockSize = 8) {
    const bmp = image.bitmap;
    const w = bmp.width, h = bmp.height;
    const bs = Math.min(blockSize, Math.floor(Math.min(w, h) / 4));
    let sum = 0, count = 0;
    const sample = (x, y) => {
        const idx = (y * w + x) * 4;
        return (bmp.data[idx] + bmp.data[idx + 1] + bmp.data[idx + 2]) / 3;
    };
    for (let dy = 0; dy < bs; dy++) {
        for (let dx = 0; dx < bs; dx++) {
            sum += sample(dx, dy);
            sum += sample(w - 1 - dx, dy);
            sum += sample(dx, h - 1 - dy);
            sum += sample(w - 1 - dx, h - 1 - dy);
            count += 4;
        }
    }
    const bgBrightness = sum / count;
    const threshold = Math.max(180, bgBrightness - 25);
    console.log(`🎨 Corner bg brightness: ${bgBrightness.toFixed(1)}, trim threshold: ${threshold.toFixed(1)}`);
    return threshold;
}

/**
 * Trim uniform background only (no square-crop). Mutates image in-place.
 * @param {object} image       - Jimp instance (mutated)
 * @param {number} threshold   - channels >= this value are treated as background
 * @param {number} padFraction - fraction of the trimmed size to restore as padding
 * @param {string} label       - label used in the log line
 */
function trimBackground(image, threshold, padFraction, label) {
    const bmp = image.bitmap;
    const w = bmp.width, h = bmp.height;
    let top = 0, bottom = h - 1, left = 0, right = w - 1;
    const isBg = (x, y) => {
        const idx = (y * w + x) * 4;
        return bmp.data[idx] >= threshold && bmp.data[idx + 1] >= threshold && bmp.data[idx + 2] >= threshold;
    };
    scanTop:    for (let y = 0; y < h; y++)      { for (let x = 0; x < w; x++) { if (!isBg(x, y)) { top    = y; break scanTop;    } } }
    scanBottom: for (let y = h - 1; y >= 0; y--) { for (let x = 0; x < w; x++) { if (!isBg(x, y)) { bottom = y; break scanBottom; } } }
    scanLeft:   for (let x = 0; x < w; x++)      { for (let y = 0; y < h; y++) { if (!isBg(x, y)) { left   = x; break scanLeft;   } } }
    scanRight:  for (let x = w - 1; x >= 0; x--) { for (let y = 0; y < h; y++) { if (!isBg(x, y)) { right  = x; break scanRight;  } } }
    const trimW = right - left + 1, trimH = bottom - top + 1;
    if (trimW > 10 && trimH > 10 && trimW < w * 0.99) {
        const pad = Math.round(Math.max(trimW, trimH) * padFraction);
        const px = Math.max(0, left - pad), py = Math.max(0, top - pad);
        const pw = Math.min(w, right + pad + 1) - px;
        const ph = Math.min(h, bottom + pad + 1) - py;
        console.log(`✂️  ${label} trim: (${left},${top})→(${right},${bottom}) ${trimW}x${trimH} pad=${pad}`);
        image.crop({ x: px, y: py, w: pw, h: ph });
    }
}

/**
 * Trim uniform background then center-square-crop in-place.
 * @param {object} image       - Jimp instance (mutated)
 * @param {number} threshold   - channels >= this value are treated as background
 * @param {number} padFraction - fraction of the trimmed size to restore as padding
 * @param {string} label       - label used in the log line
 */
function trimAndSquareCrop(image, threshold, padFraction, label) {
    trimBackground(image, threshold, padFraction, label);
    const minDim = Math.min(image.width, image.height);
    image.crop({
        x: Math.floor((image.width  - minDim) / 2),
        y: Math.floor((image.height - minDim) / 2),
        w: minDim, h: minDim,
    });
}

module.exports = { dataUriToJimp, jimpToDataUri, detectBgThreshold, trimBackground, trimAndSquareCrop };
