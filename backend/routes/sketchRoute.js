const express = require('express');
const router = express.Router();
const axios = require('axios');
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

        console.log(`🔗 Proxying image for frontend capture: ${url}`);
        const response = await axios.get(url, {
            responseType: 'arraybuffer',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36...',
                'Referer': 'https://en.numista.com/'
            }
        });

        res.set('Content-Type', response.headers['content-type']);
        res.send(response.data);
    } catch (error) {
        console.error("Proxy Error:", error.message);
        res.status(500).send('Could not bridge image');
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
        const { numistaNumber, method, imageData, coinDiameter, year, hasDates, side } = req.body;

        if (!imageData) {
            console.error("❌ No imageData received in body");
            return res.status(400).json({ error: "No image data provided" });
        }

        if (!numistaNumber || !method || !side) {
            console.error("❌ Missing required fields - numistaNumber:", numistaNumber, "method:", method, "side:", side);
            return res.status(400).json({ error: "Missing required fields: numistaNumber, method, side" });
        }

        // Extract only numerals from year (for Georgian/Gregorian calendar only)
        // Only include year in prompt if this side has a date
        const cleanYear = (year && hasDates) ? year.replace(/\D/g, '') : '';

        // Calculate scale based on coin diameter
        // If coin is 22mm and label is 44mm, scale = 0.5
        const scale = coinDiameter ? (coinDiameter / LABEL_WIDTH_MM) : 1;
        const scaledSize = Math.round(SKETCH_WIDTH * scale);  // Use for BOTH width and height to keep it square
        
        console.log(`📐 Coin: #${numistaNumber}, Method: ${method}, Side: ${side}, Diameter: ${coinDiameter}mm, Scale: ${scale.toFixed(2)}, Scaled dimensions: ${scaledSize}x${scaledSize}px`);

        // Check cache including year and side so different dates and sides have different sketches
        const existingSketch = await Sketch.findOne({ numistaNumber, method, year, side });
        if (existingSketch) {
            console.log(`♻️ Returning cached ${method} sketch for #${numistaNumber} (${year}) - ${side}`);
            return res.json({ sketchId: existingSketch._id });
        }

        if (method === 'AI') {
            console.log(`🎨 Requesting AI Engraving for #${numistaNumber}...`);
            console.log(`📤 Image data received: ${imageData.substring(0, 100)}...`);

            // Build prompt with year only if the side has dates
            let prompt = `Convert this coin image EXACTLY to a bold line art sketch for printing at ${coinDiameter}mm diameter.`;
            if (cleanYear) {
                prompt += ` Year variant: ${cleanYear}.`;
            }
            prompt += ` CRITICAL: Preserve the EXACT design of the coin - DO NOT add, remove, or hallucinate any details not clearly visible in the original image. Convert only the visible elements to black line art. Use CLEAR, DARK BLACK LINES on pure white background. Scale line weight appropriately for ${coinDiameter}mm printing - thicker lines for visibility at small sizes. DO NOT modify, embellish, or creatively reinterpret the design. Strict faithful reproduction of the coin's actual design.`;

            const output = await replicate.run(
                "google/nano-banana", 
                {
                    input: {
                        prompt: prompt,
                        image_input: [imageData],
                    }
                }
            );

            console.log(`✅ AI Response type: ${typeof output}`);
            
            const aiUrl = output.url ? output.url() : (Array.isArray(output) ? output[0] : output);
            console.log(`📥 Generated image URL: ${aiUrl}`);

            const response = await axios.get(aiUrl, { responseType: 'arraybuffer' });
            const aiBuffer = Buffer.from(response.data, 'binary');
            
            // Resize to scaled dimensions (square to avoid squishing circular coins)
            let resizedImage = await Jimp.read(aiBuffer);
            // Resize to fit within the square, maintaining aspect ratio
            resizedImage.resize({ w: scaledSize, h: scaledSize, fit: 'contain' });
            
            // Create a new white canvas of exact size and composite the image onto it
            const canvas = new Jimp({ width: scaledSize, height: scaledSize, color: 0xFFFFFFFF });
            const xOffset = Math.floor((scaledSize - resizedImage.width) / 2);
            const yOffset = Math.floor((scaledSize - resizedImage.height) / 2);
            canvas.composite(resizedImage, xOffset, yOffset);
            
            const resizedBuffer = await canvas.getBuffer('image/png');
            const aiBase64 = `data:image/png;base64,${resizedBuffer.toString('base64')}`;

            const newSketch = await Sketch.create({
                numistaNumber,
                year,
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
            
            const base64Data = imageData.replace(/^data:image\/\w+;base64,/, "");
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
            const mimeType = "image/jpeg";
            const processedBuffer = await canvas.getBuffer(mimeType);
            const finalBase64 = `data:${mimeType};base64,${processedBuffer.toString('base64')}`;

            const newSketch = await Sketch.create({
                numistaNumber,
                year,
                side,
                imageData: finalBase64,
                method: 'SCRIPT',
                width: scaledSize,
                height: scaledSize,
                status: 'completed'
            });

            console.log(`✅ SCRIPT Sketch saved for #${numistaNumber} (${year}) - ${side}: ${newSketch._id}`);
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