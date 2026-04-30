const express = require('express');
const router = express.Router();
const axios = require('axios');
const crypto = require('crypto');
const Sketch = require('../models/sketchModel');
const { LABEL_WIDTH_MM, SKETCH_WIDTH } = require('../sketch/constants');
const { applyAiSketch } = require('../sketch/aiSketch');
const { handleScriptSketch } = require('../sketch/scriptSketch');
const { applyRawSketch } = require('../sketch/rawSketch');

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
        const cleanYear = year ? year.replace(/\D/g, '') : '';

        // Calculate scale based on coin diameter
        const scale = coinDiameter ? (coinDiameter / LABEL_WIDTH_MM) : 1;
        const scaledSize = Math.round(SKETCH_WIDTH * scale);
        
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
            return applyAiSketch(res, { resolvedImageData, numistaNumber, year, cleanYear, hasDates, coinDiameter, side, sourceHash, scaledSize });
        } else if (method === 'SCRIPT') {
            return handleScriptSketch(res, { resolvedImageData, numistaNumber, side, sourceHash, year, scaledSize });
        } else if (method === 'RAW') {
            return applyRawSketch(res, { resolvedImageData, numistaNumber, side, sourceHash, year, scaledSize });
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