const express = require('express');
const router = express.Router();
const axios = require('axios');
const crypto = require('crypto');
const Replicate = require('replicate');
const { Jimp } = require('jimp'); // Destructured for Jimp v1.0+
const Sketch = require('../models/sketchModel');

const replicate = new Replicate({
    auth: process.env.REPLICATE_API_TOKEN,
});

/**
 * @route   GET /api/generate-sketch/image-proxy
 */
router.get('/image-proxy', async (req, res) => {
    try {
        const { url } = req.query;
        if (!url) return res.status(400).send('URL is required');

        console.log(`🔗 Proxying image: ${url}`);
        
        let response;
        try {
            // Try direct fetch first
            response = await axios.get(url, {
                responseType: 'arraybuffer',
                headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' }
            });
        } catch (directErr) {
            console.log(`⚠️ Direct proxy failed (${directErr.response?.status || directErr.message}), trying relay...`);
            const relayUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
            response = await axios.get(relayUrl, { responseType: 'arraybuffer' });
        }

        res.set('Content-Type', response.headers['content-type']);
        res.send(response.data);
    } catch (error) {
        console.error("Proxy Error:", error.message);
        res.status(500).send('Could not bridge image');
    }
});

/**
 * @route   GET /api/generate-sketch/list
 * Returns all cached sketches (id, description, method, side, dimensions, createdAt)
 * with a small thumbnail preview. Supports optional ?numistaNumber= filter.
 */
router.get('/list', async (req, res) => {
    try {
        const filter = {};
        if (req.query.numistaNumber) {
            filter.numistaNumber = req.query.numistaNumber;
        }
        const sketches = await Sketch.find(filter)
            .sort({ createdAt: -1 })
            .select('_id numistaNumber year description method side width height createdAt imageData');
        
        // Return sketches with imageData included for thumbnail display
        res.json(sketches);
    } catch (error) {
        console.error('Error listing sketches:', error);
        res.status(500).json({ error: 'Failed to list sketches' });
    }
});

/**
 * @route   POST /api/generate-sketch
 * Print dimensions: 44mm x 45.5mm at 300 DPI = 520 x 537 pixels
 * Sketch area: 61% of height = 327 pixels (approximately)
 */
const LABEL_WIDTH_MM = 44;
const SKETCH_WIDTH = 520;  // 44mm at 300 DPI
const SKETCH_HEIGHT = 327; // ~27.7mm at 300 DPI (61% of label height)

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
        // Average of RGB channels (image may already be greyscale)
        return (bmp.data[idx] + bmp.data[idx + 1] + bmp.data[idx + 2]) / 3;
    };
    for (let dy = 0; dy < bs; dy++) {
        for (let dx = 0; dx < bs; dx++) {
            sum += sample(dx, dy);              // top-left
            sum += sample(w - 1 - dx, dy);      // top-right
            sum += sample(dx, h - 1 - dy);      // bottom-left
            sum += sample(w - 1 - dx, h - 1 - dy); // bottom-right
            count += 4;
        }
    }
    const bgBrightness = sum / count;
    // Threshold is background brightness minus a tolerance of 25 so coin rim
    // highlights (which may be nearly as bright) are not stripped away.
    const threshold = Math.max(180, bgBrightness - 25);
    console.log(`🎨 Corner bg brightness: ${bgBrightness.toFixed(1)}, trim threshold: ${threshold.toFixed(1)}`);
    return threshold;
}

/**
 * Trim uniform background from a Jimp image then center-square-crop it (in-place).
 * @param {object} image       - Jimp instance (mutated)
 * @param {number} threshold   - channels >= this value are treated as background
 * @param {number} padFraction - fraction of the trimmed size to restore as padding
 * @param {string} label       - label used in the log line
 */
function trimAndSquareCrop(image, threshold, padFraction, label) {
    trimBackground(image, threshold, padFraction, label);
    // Center-square-crop
    const minDim = Math.min(image.width, image.height);
    image.crop({
        x: Math.floor((image.width  - minDim) / 2),
        y: Math.floor((image.height - minDim) / 2),
        w: minDim, h: minDim,
    });
}

/**
 * Trim uniform background only (no square-crop). Mutates image in-place.
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
    // Only crop if a meaningful border was found (coin doesn't already fill the frame)
    if (trimW > 10 && trimH > 10 && trimW < w * 0.99) {
        const pad = Math.round(Math.max(trimW, trimH) * padFraction);
        const px = Math.max(0, left - pad), py = Math.max(0, top - pad);
        const pw = Math.min(w, right + pad + 1) - px;
        const ph = Math.min(h, bottom + pad + 1) - py;
        console.log(`✂️  ${label} trim: (${left},${top})→(${right},${bottom}) ${trimW}x${trimH} pad=${pad}`);
        image.crop({ x: px, y: py, w: pw, h: ph });
    }
}

/** Persist a completed sketch and return its id to the client. */
async function saveSketch(res, { imageData, method, side, sourceHash, numistaNumber, year, scaledSize }) {
    const description = `${side} - ${numistaNumber ? 'N#' + numistaNumber : 'Manual'}${year ? ' (' + year + ')' : ''}`;
    const sketch = await Sketch.create({
        sourceHash, numistaNumber, year, description, side,
        imageData, method, width: scaledSize, height: scaledSize, status: 'completed',
    });
    console.log(`✅ ${method} Sketch saved: ${sketch._id}`);
    return res.json({ sketchId: sketch._id });
}

router.post('/', async (req, res) => {
    try {
        const { numistaNumber, method, imageData, imageUrl, coinDiameter, year, hasDates, swapDate, side } = req.body;

        // Resolve imageData: accept either inline base64 (PASTED) or a URL to fetch (NUMISTA)
        let resolvedImageData = imageData;
        if (!resolvedImageData && imageUrl) {
            console.log(`📷 Fetching source image: ${imageUrl}`);
            try {
                // Try direct fetch first (works locally / most servers)
                const directResp = await axios.get(imageUrl, {
                    responseType: 'arraybuffer',
                    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' }
                });
                const ct = directResp.headers['content-type'] || 'image/jpeg';
                resolvedImageData = `data:${ct};base64,${Buffer.from(directResp.data).toString('base64')}`;
                console.log(`✅ Direct fetch succeeded (${Math.round(resolvedImageData.length / 1024)}KB)`);
            } catch (directErr) {
                console.log(`⚠️ Direct fetch failed (${directErr.response?.status || directErr.message}), trying relay...`);
                const relayUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(imageUrl)}`;
                const relayResp = await axios.get(relayUrl, { responseType: 'arraybuffer' });
                const ct = relayResp.headers['content-type'] || 'image/jpeg';
                resolvedImageData = `data:${ct};base64,${Buffer.from(relayResp.data).toString('base64')}`;
                console.log(`✅ Relay fetch succeeded (${Math.round(resolvedImageData.length / 1024)}KB)`);
            }
        }

        if (!resolvedImageData) {
            console.error("❌ No imageData or imageUrl received in body");
            return res.status(400).json({ error: "No image data provided" });
        }

        if (!method || !side) {
            console.error("❌ Missing required fields - method:", method, "side:", side);
            return res.status(400).json({ error: "Missing required fields: method, side" });
        }

        // Extract only numerals from year (for Georgian/Gregorian calendar only)
        // Include year if it exists, regardless of whether description mentions dates
        const cleanYear = year ? year.replace(/\D/g, '') : '';

        // Calculate scale based on coin diameter
        // If coin is 22mm and label is 44mm, scale = 0.5
        const scale = coinDiameter ? (coinDiameter / LABEL_WIDTH_MM) : 1;
        const scaledSize = Math.round(SKETCH_WIDTH * scale);  // Use for BOTH width and height to keep it square
        
        console.log(`📐 Coin: #${numistaNumber}, Method: ${method}, Side: ${side}, Year: "${year}", CleanYear: "${cleanYear}", HasDates: ${hasDates}, Diameter: ${coinDiameter}mm, Scale: ${scale.toFixed(2)}, Scaled dimensions: ${scaledSize}x${scaledSize}px`);

        // Generate a hash of the source image for deduplication
        const sourceHash = crypto.createHash('md5').update(resolvedImageData).digest('hex');

        // Check cache by source image hash + method + side
        // Skip cache for PASTED images since the source image can change each time
        if (side !== 'PASTED') {
            const existingSketch = await Sketch.findOne({ sourceHash, method, side });
            if (existingSketch) {
                console.log(`♻️ Returning cached ${method} sketch (hash: ${sourceHash.substring(0,8)}...) - ${side}`);
                return res.json({ sketchId: existingSketch._id });
            }
        } else {
            // For PASTED, delete any previous sketch with the same hash so the new one replaces it
            await Sketch.deleteMany({ sourceHash, method, side: 'PASTED' });
            console.log(`🗑️ Cleared previous PASTED sketches with same hash`);
        }

        if (method === 'AI') {
            console.log(`🎨 Requesting AI Engraving for #${numistaNumber} (Year: "${year}", CleanYear: "${cleanYear}")...`);

            // Pre-trim the source so the AI model receives a well-framed coin
            // (removes grey/beige photo backgrounds before sending to Replicate)
            let aiInputData = resolvedImageData;
            try {
                const srcImage = await dataUriToJimp(resolvedImageData);
                srcImage.greyscale();
                trimAndSquareCrop(srcImage, detectBgThreshold(srcImage), 0.02, 'AI-source');
                const trimmedBuf = await srcImage.getBuffer('image/jpeg');
                aiInputData = `data:image/jpeg;base64,${trimmedBuf.toString('base64')}`;
            } catch (e) {
                console.log(`⚠️  AI source pre-trim failed (${e.message}), using original`);
            }

            // Build prompt
            const lineThicknessPercent = Math.max(2, Math.min(5, 100 / coinDiameter));
            const lineThicknessMM = (coinDiameter * lineThicknessPercent / 100).toFixed(2);
            let prompt = `Create a PRECISE black and white line art tracing of this coin image for printing at ${coinDiameter}mm diameter. STRICT REQUIREMENTS:
1. ONLY trace elements that are CLEARLY VISIBLE in the source image - if an area is blank or empty in the source, leave it blank and empty
2. DO NOT add ANY decorative elements, flourishes, ornaments, sprigs, leaves, dots, stars, or filler of any kind that are not in the source image
3. DO NOT fill empty space - if there is empty space on the coin, LEAVE IT EMPTY
4. Use a woodcut or engraving style with clear, bold lines suitable for small-scale printing at ${coinDiameter}mm size reminiscent of coin catalog engravings, focusing on clarity and accuracy over artistic flair
5. Use BOLD, THICK black lines on pure white background - lines should be approximately ${lineThicknessMM}mm thick (${lineThicknessPercent.toFixed(1)}% of coin diameter)
6. Lines must be thick enough to remain visible when printed at ${coinDiameter}mm size - err on the side of thicker rather than thinner
7. For coins under 20mm, use EXTRA BOLD lines to ensure visibility
8. ABSOLUTELY NO HALLUCINATION - compare your output against the source image element by element. Every mark in your output must correspond to something visible in the source. Remove anything you are not 100% certain is in the original.
9. DO NOT use your knowledge of coins, heraldry, or history to "correct" or modify what you see. If an eagle has no crown in the source, it must have no crown in the output. Trace EXACTLY what is there, even if it seems wrong or incomplete.
10. The coin must fill the ENTIRE image with NO border, margin, or padding. The edge of the coin should touch the edges of the image.`;
            if (cleanYear && swapDate) {
                prompt += `\n11. If NO year/date is visible in the source image, do NOT add one. If a year/date is visible in the source image, replace it with "${cleanYear}".`;
            }
            prompt += `\n\nTHIS IS A STRICT TRACING TASK. Trace ONLY what exists. Do NOT add any text, numbers, or symbols that are not clearly visible in the source image.`;

            const output = await replicate.run('google/nano-banana', {
                input: { prompt, image_input: [aiInputData], creativity: 0.1, output_format: 'png', output_quality: 100 }
            });
            const aiUrl = output.url ? output.url() : (Array.isArray(output) ? output[0] : output);
            console.log(`📥 Generated image URL: ${aiUrl}`);

            const response = await axios.get(aiUrl, { responseType: 'arraybuffer' });
            const aiImage = await Jimp.read(Buffer.from(response.data, 'binary'));
            console.log(`📐 AI output dimensions: ${aiImage.width}x${aiImage.height}`);

            // Trim whitespace border from AI output and resize to target
            trimBackground(aiImage, detectBgThreshold(aiImage), 0.02, 'AI-output');
            aiImage.resize({ w: scaledSize, h: scaledSize });

            return saveSketch(res, {
                imageData: await jimpToDataUri(aiImage),
                method: 'AI', side, sourceHash, numistaNumber, year, scaledSize,
            });

        } else if (method === 'SCRIPT') {
            console.log(`💻 Processing Script Sketch for #${numistaNumber}...`);

            const image = await dataUriToJimp(resolvedImageData);

            // Trim background on greyscale version before aggressive filters
            image.greyscale();
            trimBackground(image, detectBgThreshold(image), 0.02, 'SCRIPT');

            image.contrast(0.95);
            try { image.blur(1); } catch (e) { console.log('Blur skipped'); }
            try {
                image.convolute([[-1,-1,-1],[-1,9,-1],[-1,-1,-1]]);
            } catch (e) { console.log('Sharpening skipped'); }
            try {
                image.scan(0, 0, image.bitmap.width, image.bitmap.height, function (x, y, idx) {
                    const v = this.bitmap.data[idx];
                    this.bitmap.data[idx] = v > 128 ? 255 : 0;
                });
            } catch (e) { console.log('Thresholding skipped'); }

            // Fit into square canvas (preserves full coin, no clipping)
            image.resize({ w: scaledSize, h: scaledSize, fit: 'contain' });
            const scriptCanvas = new Jimp({ width: scaledSize, height: scaledSize, color: 0xFFFFFFFF });
            scriptCanvas.composite(image, Math.floor((scaledSize - image.width) / 2), Math.floor((scaledSize - image.height) / 2));

            return saveSketch(res, {
                imageData: await jimpToDataUri(scriptCanvas),
                method: 'SCRIPT', side, sourceHash, numistaNumber, year, scaledSize,
            });

        } else if (method === 'RAW') {
            console.log(`📷 Processing RAW (grayscale + trim) for #${numistaNumber}...`);

            const image = await dataUriToJimp(resolvedImageData);

            // Trim background using adaptive corner-sampled threshold.
            image.greyscale();
            trimBackground(image, detectBgThreshold(image), 0.02, 'RAW');

            // Fit into square canvas (preserves full coin, no clipping)
            image.resize({ w: scaledSize, h: scaledSize, fit: 'contain' });
            const rawCanvas = new Jimp({ width: scaledSize, height: scaledSize, color: 0xFFFFFFFF });
            rawCanvas.composite(image, Math.floor((scaledSize - image.width) / 2), Math.floor((scaledSize - image.height) / 2));

            return saveSketch(res, {
                imageData: await jimpToDataUri(rawCanvas),
                method: 'RAW', side, sourceHash, numistaNumber, year, scaledSize,
            });
        }

    } catch (error) {
        console.error("❌ Generation Error:", error.stack);
        res.status(500).json({ error: error.message });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const sketch = await Sketch.findById(req.params.id);
        if (!sketch) return res.status(404).json({ error: "Sketch not found" });
        
        // Ensure imageData is properly formatted as a string
        if (sketch.imageData && typeof sketch.imageData !== 'string') {
            // If it's a Buffer, convert to base64 string with data URI prefix
            const base64String = Buffer.from(sketch.imageData).toString('base64');
            sketch.imageData = `data:${sketch.contentType};base64,${base64String}`;
        } else if (sketch.imageData && !sketch.imageData.startsWith('data:')) {
            // If it's a plain base64 string, add the data URI prefix
            sketch.imageData = `data:${sketch.contentType};base64,${sketch.imageData}`;
        }
        
        res.json(sketch);
    } catch (error) {
        console.error("Database lookup error:", error);
        res.status(500).json({ error: "Database lookup failed" });
    }
});

module.exports = router;