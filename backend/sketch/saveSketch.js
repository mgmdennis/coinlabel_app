const Sketch = require('../models/sketchModel');

/**
 * Persist a completed sketch and return its id to the client.
 * @param {object} res        - Express response object
 * @param {object} opts
 * @param {string} opts.imageData
 * @param {string} opts.method
 * @param {string} opts.side
 * @param {string} opts.sourceHash
 * @param {string} opts.numistaNumber
 * @param {string} opts.year
 * @param {number} opts.scaledSize
 */
async function saveSketch(res, { imageData, method, side, sourceHash, numistaNumber, year, scaledSize }) {
    const description = `${side} - ${numistaNumber ? 'N#' + numistaNumber : 'Manual'}${year ? ' (' + year + ')' : ''}`;
    const sketch = await Sketch.create({
        sourceHash, numistaNumber, year, description, side,
        imageData, method, width: scaledSize, height: scaledSize, status: 'completed',
    });
    console.log(`✅ ${method} Sketch saved: ${sketch._id}`);
    return res.json({ sketchId: sketch._id });
}

module.exports = { saveSketch };
