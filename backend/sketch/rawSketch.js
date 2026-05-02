const { Jimp } = require('jimp');
const { dataUriToJimp, jimpToDataUri, detectBgThreshold, trimBackground } = require('./imageUtils');
const { saveSketch } = require('./saveSketch');

/**
 * Handle the RAW pipeline: greyscale + trim + fit-to-square.
 * @param {object} res         - Express response object
 * @param {object} opts
 * @param {string} opts.resolvedImageData
 * @param {string} opts.numistaNumber
 * @param {string} opts.side
 * @param {string} opts.sourceHash
 * @param {string} opts.year
 * @param {number} opts.scaledSize
 */
async function applyRawSketch(res, { resolvedImageData, numistaNumber, side, sourceHash, year, scaledSize }) {
    console.log(`📷 Processing RAW (grayscale + trim) for #${numistaNumber}...`);

    const image = await dataUriToJimp(resolvedImageData);

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

module.exports = { applyRawSketch };
