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

router.post('/', async (req, res) => {
    try {
        const { numistaNumber, method, imageData, imageUrl, coinDiameter, year, hasDates, side } = req.body;

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
            console.log(`📤 Image data received: ${resolvedImageData.substring(0, 100)}...`);

            // Build prompt with year emphasis based on whether there are multiple date variations
            // Calculate recommended line thickness as percentage of diameter
            const lineThicknessPercent = Math.max(2, Math.min(5, 100 / coinDiameter)); // 2-5% of diameter
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
            if (cleanYear && hasDates) {
                prompt += `\n11. If NO year/date is visible in the source image, do NOT add one. If a year/date is visible in the source image, replace it with "${cleanYear}".`;
            }
            prompt += `\n\nTHIS IS A STRICT TRACING TASK. Trace ONLY what exists. Do NOT add any text, numbers, or symbols that are not clearly visible in the source image.`;

            const output = await replicate.run(
                "google/nano-banana", 
                {
                    input: {
                        prompt: prompt,
                        image_input: [resolvedImageData],
                        creativity: 0.2,  // Balance between accuracy and quality
                        output_format: "png",
                        output_quality: 100
                    }
                }
            );

            console.log(`✅ AI Response type: ${typeof output}`);
            
            const aiUrl = output.url ? output.url() : (Array.isArray(output) ? output[0] : output);
            console.log(`📥 Generated image URL: ${aiUrl}`);

            const response = await axios.get(aiUrl, { responseType: 'arraybuffer' });
            const aiBuffer = Buffer.from(response.data, 'binary');
            
            // Read the AI output and log its actual dimensions
            let resizedImage = await Jimp.read(aiBuffer);
            console.log(`📐 AI output dimensions: ${resizedImage.width}x${resizedImage.height}`);
            
            // Auto-trim whitespace border around the coin
            // Use bitmap.data directly (RGBA, 4 bytes per pixel)
            const trimThreshold = 240; // Pixels brighter than this are considered white
            const bmp = resizedImage.bitmap;
            const w = bmp.width, h = bmp.height;
            let top = 0, bottom = h - 1, left = 0, right = w - 1;
            
            const isWhitePixel = (x, y) => {
                const idx = (y * w + x) * 4;
                return bmp.data[idx] >= trimThreshold && bmp.data[idx + 1] >= trimThreshold && bmp.data[idx + 2] >= trimThreshold;
            };
            
            // Find top edge
            topScan: for (let y = 0; y < h; y++) {
                for (let x = 0; x < w; x++) {
                    if (!isWhitePixel(x, y)) { top = y; break topScan; }
                }
            }
            // Find bottom edge
            bottomScan: for (let y = h - 1; y >= 0; y--) {
                for (let x = 0; x < w; x++) {
                    if (!isWhitePixel(x, y)) { bottom = y; break bottomScan; }
                }
            }
            // Find left edge
            leftScan: for (let x = 0; x < w; x++) {
                for (let y = 0; y < h; y++) {
                    if (!isWhitePixel(x, y)) { left = x; break leftScan; }
                }
            }
            // Find right edge
            rightScan: for (let x = w - 1; x >= 0; x--) {
                for (let y = 0; y < h; y++) {
                    if (!isWhitePixel(x, y)) { right = x; break rightScan; }
                }
            }
            
            const trimW = right - left + 1;
            const trimH = bottom - top + 1;
            if (trimW > 10 && trimH > 10) {
                console.log(`✂️ Trimming whitespace: (${left},${top}) to (${right},${bottom}) = ${trimW}x${trimH}`);
                resizedImage.crop({ x: left, y: top, w: trimW, h: trimH });
            }
            
            // Center-crop to square (preserves aspect ratio, no squishing)
            const minDim = Math.min(resizedImage.width, resizedImage.height);
            const cropX = Math.floor((resizedImage.width - minDim) / 2);
            const cropY = Math.floor((resizedImage.height - minDim) / 2);
            resizedImage.crop({ x: cropX, y: cropY, w: minDim, h: minDim });
            
            // Now resize the square crop to target size
            resizedImage.resize({ w: scaledSize, h: scaledSize });
            
            const resizedBuffer = await resizedImage.getBuffer('image/png');
            const aiBase64 = `data:image/png;base64,${resizedBuffer.toString('base64')}`;

            const newSketch = await Sketch.create({
                sourceHash,
                numistaNumber,
                year,
                description: `${side} - ${numistaNumber ? 'N#' + numistaNumber : 'Manual'}${year ? ' (' + year + ')' : ''}`,
                side,
                imageData: aiBase64,
                method: 'AI',
                width: scaledSize,
                height: scaledSize,
                status: 'completed'
            });

            console.log(`✅ AI Sketch saved: ${newSketch._id}`);
            return res.json({ sketchId: newSketch._id });
        } else if (method === 'SCRIPT') {
            console.log(`💻 Processing Script Sketch for #${numistaNumber}...`);
            
            const base64Data = resolvedImageData.replace(/^data:image\/\w+;base64,/, "");
            const imageBuffer = Buffer.from(base64Data, 'base64');

            // 1. Read the image
            const image = await Jimp.read(imageBuffer);
            
            // 2. Apply filters to create a crisp sketch effect
            image.greyscale();
            image.contrast(0.95);
            
            // 3. Apply blur to reduce noise
            try {
                image.blur(1);
            } catch (e) {
                console.log("Blur skipped");
            }
            
            // 4. Apply sharpening for edge definition
            try {
                image.convolute([
                    [-1, -1, -1],
                    [-1,  9, -1],
                    [-1, -1, -1]
                ]);
            } catch (e) {
                console.log("Sharpening skipped");
            }

            // 5. Apply adaptive thresholding
            try {
                image.scan(0, 0, image.bitmap.width, image.bitmap.height, function (x, y, idx) {
                    const intensity = this.bitmap.data[idx];
                    const threshold = 128;
                    this.bitmap.data[idx] = intensity > threshold ? 255 : 0;
                });
            } catch (e) {
                console.log("Adaptive thresholding skipped");
            }

            // 6. Resize to scaled dimensions (square to avoid squishing circular coins)
            // First resize to fit within the square maintaining aspect ratio
            image.resize({ w: scaledSize, h: scaledSize, fit: 'contain' });
            
            // Create a new white canvas of exact size and composite the image onto it
            const canvas = new Jimp({ width: scaledSize, height: scaledSize, color: 0xFFFFFFFF });
            const xOffset = Math.floor((scaledSize - image.width) / 2);
            const yOffset = Math.floor((scaledSize - image.height) / 2);
            canvas.composite(image, xOffset, yOffset);

            // 7. Export to Base64
            const mimeType = "image/png";
            const processedBuffer = await canvas.getBuffer(mimeType);
            const finalBase64 = `data:${mimeType};base64,${processedBuffer.toString('base64')}`;

            const newSketch = await Sketch.create({
                sourceHash,
                numistaNumber,
                year,
                description: `${side} - ${numistaNumber ? 'N#' + numistaNumber : 'Manual'}${year ? ' (' + year + ')' : ''}`,
                side,
                imageData: finalBase64,
                method: 'SCRIPT',
                width: scaledSize,
                height: scaledSize,
                status: 'completed'
            });

            console.log(`✅ SCRIPT Sketch saved for #${numistaNumber} (${year}) - ${side}: ${newSketch._id}`);
            return res.json({ sketchId: newSketch._id });
        } else if (method === 'RAW') {
            console.log(`📷 Processing RAW (grayscale + trim) for #${numistaNumber}...`);
            
            const base64Data = resolvedImageData.replace(/^data:image\/\w+;base64,/, "");
            const imageBuffer = Buffer.from(base64Data, 'base64');

            // 1. Read the image
            const image = await Jimp.read(imageBuffer);
            
            // 2. Convert to greyscale only — no sketch effects
            image.greyscale();
            
            // 3. Auto-trim whitespace border
            const trimThreshold = 240;
            const bmp = image.bitmap;
            const w = bmp.width, h = bmp.height;
            let top = 0, bottom = h - 1, left = 0, right = w - 1;
            
            const isWhite = (x, y) => {
                const idx = (y * w + x) * 4;
                return bmp.data[idx] >= trimThreshold && bmp.data[idx + 1] >= trimThreshold && bmp.data[idx + 2] >= trimThreshold;
            };
            
            topScan: for (let y = 0; y < h; y++) {
                for (let x = 0; x < w; x++) { if (!isWhite(x, y)) { top = y; break topScan; } }
            }
            bottomScan: for (let y = h - 1; y >= 0; y--) {
                for (let x = 0; x < w; x++) { if (!isWhite(x, y)) { bottom = y; break bottomScan; } }
            }
            leftScan: for (let x = 0; x < w; x++) {
                for (let y = 0; y < h; y++) { if (!isWhite(x, y)) { left = x; break leftScan; } }
            }
            rightScan: for (let x = w - 1; x >= 0; x--) {
                for (let y = 0; y < h; y++) { if (!isWhite(x, y)) { right = x; break rightScan; } }
            }
            
            const trimW = right - left + 1;
            const trimH = bottom - top + 1;
            if (trimW > 10 && trimH > 10) {
                console.log(`✂️ Trimming: (${left},${top}) to (${right},${bottom}) = ${trimW}x${trimH}`);
                image.crop({ x: left, y: top, w: trimW, h: trimH });
            }
            
            // 4. Center-crop to square
            const minDim = Math.min(image.width, image.height);
            const cropX = Math.floor((image.width - minDim) / 2);
            const cropY = Math.floor((image.height - minDim) / 2);
            image.crop({ x: cropX, y: cropY, w: minDim, h: minDim });
            
            // 5. Resize to target
            image.resize({ w: scaledSize, h: scaledSize });

            // 6. Export
            const mimeType = "image/png";
            const processedBuffer = await image.getBuffer(mimeType);
            const finalBase64 = `data:${mimeType};base64,${processedBuffer.toString('base64')}`;

            const newSketch = await Sketch.create({
                sourceHash,
                numistaNumber,
                year,
                description: `${side} - ${numistaNumber ? 'N#' + numistaNumber : 'Manual'}${year ? ' (' + year + ')' : ''}`,
                side,
                imageData: finalBase64,
                method: 'RAW',
                width: scaledSize,
                height: scaledSize,
                status: 'completed'
            });

            console.log(`✅ RAW Sketch saved for #${numistaNumber} (${year}) - ${side}: ${newSketch._id}`);
            return res.json({ sketchId: newSketch._id });
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