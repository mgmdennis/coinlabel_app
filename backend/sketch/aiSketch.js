const axios = require('axios');
const Replicate = require('replicate');
const { Jimp } = require('jimp');
const { dataUriToJimp, jimpToDataUri, detectBgThreshold, trimBackground, trimAndSquareCrop } = require('./imageUtils');
const { saveSketch } = require('./saveSketch');

const replicate = new Replicate({
    auth: process.env.REPLICATE_API_TOKEN,
});

/**
 * Handle the AI/Replicate pipeline.
 * @param {object} res         - Express response object
 * @param {object} opts
 * @param {string} opts.resolvedImageData
 * @param {string} opts.numistaNumber
 * @param {string} opts.year
 * @param {string} opts.cleanYear
 * @param {boolean} opts.hasDates
 * @param {number}  opts.coinDiameter
 * @param {string}  opts.side
 * @param {string}  opts.sourceHash
 * @param {number}  opts.scaledSize
 */
async function applyAiSketch(res, { resolvedImageData, numistaNumber, year, cleanYear, hasDates, coinDiameter, side, sourceHash, scaledSize }) {
    console.log(`🎨 Requesting AI Engraving for #${numistaNumber} (Year: "${year}", CleanYear: "${cleanYear}")...`);

    // Pre-trim the source so the AI model receives a well-framed coin
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
    if (cleanYear && hasDates) {
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

    trimBackground(aiImage, detectBgThreshold(aiImage), 0.02, 'AI-output');
    aiImage.resize({ w: scaledSize, h: scaledSize });

    return saveSketch(res, {
        imageData: await jimpToDataUri(aiImage),
        method: 'AI', side, sourceHash, numistaNumber, year, scaledSize,
    });
}

module.exports = { applyAiSketch };
