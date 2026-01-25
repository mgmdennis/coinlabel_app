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
 */
router.post('/', async (req, res) => {
    try {
        // --- FIX 1: Destructure 'imageData' to match your create.js call ---
        const { numistaNumber, method, imageData } = req.body;

        if (!imageData) {
            console.error("❌ No imageData received in body");
            return res.status(400).json({ error: "No image data provided" });
        }

        const existingSketch = await Sketch.findOne({ numistaNumber, method });
        if (existingSketch) {
            console.log(`♻️ Returning cached ${method} sketch for #${numistaNumber}`);
            return res.json({ sketchId: existingSketch._id });
        }

        if (method === 'AI') {
    console.log(`🎨 Requesting AI Engraving for #${numistaNumber}...`);
    
const output = await replicate.run(
    // Flux is currently the gold standard for detail and following prompts in 2026
    "black-forest-labs/flux-1.1-pro", 
    {
        input: {
            // We refine the prompt to focus on "Technical Numismatic Illustration"
            prompt: "Technical numismatic line art illustration of this specific coin. High-contrast black ink on a pure white background. Crisp, clean vector-style lines. Professional coin catalog engraving style. No shading, no gray, only solid black lines and white background.",
            aspect_ratio: "1:1",
            output_format: "webp",
            // If using a model that supports image-to-image:
            image: imageData,
            prompt_strength: 0.8, // Higher strength to force the AI to follow the "Line Art" instruction
        }
    }
);

    // 1. Get the URL from Replicate
    const aiUrl = Array.isArray(output) ? output[0] : output;

    // 2. DOWNLOAD the image so we don't save a "Stream" or a "URL"
    const response = await axios.get(aiUrl, { responseType: 'arraybuffer' });
    const aiBuffer = Buffer.from(response.data, 'binary');
    
    // 3. Convert to a Base64 string for the database
    const aiBase64 = `data:image/webp;base64,${aiBuffer.toString('base64')}`;

    // 4. Save the actual data to Mongoose
    const newSketch = await Sketch.create({
        numistaNumber,
        imageData: aiBase64, // Matches your Schema key
        method: 'AI',
        status: 'completed'
    });

    return res.json({ sketchId: newSketch._id });
} else {
            console.log(`💻 Processing Script Sketch for #${numistaNumber}...`);
            
            const base64Data = imageData.replace(/^data:image\/\w+;base64,/, "");
            const imageBuffer = Buffer.from(base64Data, 'base64');

            // 1. Read the image
            const image = await Jimp.read(imageBuffer);
            
            // 2. Apply filters (New Jimp v1 syntax)
            // Note: In newer Jimp, many methods are now on the image object 
            // but require separate calls or specific syntax.
            image.greyscale(); 
            image.contrast(0.4);
            image.brightness(0.1);

            // 3. For the sharpening (convolution), we use the internal method
            // If convolute fails, we can skip it or use the new syntax:
            try {
                image.convolute([
                    [-1, -1, -1],
                    [-1,  9, -1],
                    [-1, -1, -1]
                ]);
            } catch (e) {
                console.log("Sharpening skipped or not supported in this Jimp build.");
            }

            // 4. Export to Base64 (Async)
            const processedBase64 = await image.getBase64("image/jpeg");

            const newSketch = await Sketch.create({
                numistaNumber,
                imageData: processedBase64, // Matches your Schema 'imageData'
                method: 'SCRIPT',
                status: 'completed'
            });

            return res.json({ sketchId: newSketch._id });
        }

    } catch (error) {
        console.error("❌ Generation Error:", error.stack); // Use stack for better debugging
        res.status(500).json({ error: error.message });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const sketch = await Sketch.findById(req.params.id);
        if (!sketch) return res.status(404).json({ error: "Sketch not found" });
        res.json(sketch);
    } catch (error) {
        res.status(500).json({ error: "Database lookup failed" });
    }
});

module.exports = router;