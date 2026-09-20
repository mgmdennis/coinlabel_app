// One-time migration: convert stored collection photos to white-background
// JPEG (≤1024px, quality 75) — same encoding the frontend now produces on
// upload. Alpha PNGs and oversized legacy photos shrink several-fold.
//
// Usage:
//   node scripts/recompressCollectionImages.js            # dry run (no writes)
//   node scripts/recompressCollectionImages.js --apply    # write smaller results
//   MONGODB_URI="..." node scripts/recompressCollectionImages.js --apply
//
// Reads MONGODB_URI from the environment (repo .env is loaded as fallback;
// an explicit env var wins). Processes one image at a time and only updates
// a field when the re-encoded result is smaller than what's stored.

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const crypto = require('crypto');
const { MongoClient } = require('mongodb');
const { Jimp } = require('jimp');

const MAX_DIMENSION = 1024;
const JPEG_QUALITY = 75;
// A stored JPEG under this size is already near-optimal — skip decoding it.
const JPEG_SKIP_BYTES = 400 * 1024;
const FIELDS = ['collectionObvImage', 'collectionRevImage'];
const VERSION_FIELDS = { collectionObvImage: 'obvImageVersion', collectionRevImage: 'revImageVersion' };

/** Stable cache-bust key for a stored photo (mirrors coinController.imageVersion). */
const imageVersion = (value) =>
  value ? crypto.createHash('md5').update(String(value)).digest('hex').slice(0, 12) : '';

const DATA_URI_RE = /^data:(image\/[a-z0-9.+-]+);base64,(.+)$/is;

/** Extract { mime, base64 } from a stored value (raw base64 treated as JPEG). */
function parseStoredImage(value) {
    const m = DATA_URI_RE.exec(String(value));
    if (m) return { mime: m[1], base64: m[2] };
    return { mime: 'image/jpeg', base64: String(value) };
}

/** Decode → downscale → flatten onto white → JPEG data-URI. */
async function toWhiteJpegDataUri(buffer) {
    let image = await Jimp.read(buffer);
    let { width, height } = image;
    if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        const scale = MAX_DIMENSION / Math.max(width, height);
        width = Math.max(1, Math.round(width * scale));
        height = Math.max(1, Math.round(height * scale));
        image = image.resize({ w: width, h: height });
    }
    const canvas = new Jimp({ width, height, color: 0xFFFFFFFF });
    canvas.composite(image, 0, 0);
    const out = await canvas.getBuffer('image/jpeg', { quality: JPEG_QUALITY });
    return `data:image/jpeg;base64,${out.toString('base64')}`;
}

/**
 * Convert one stored field value. Returns { converted, before, after, value }
 * (sizes in bytes of the base64 payload). Never throws — decode failures
 * return converted:false so the original is left untouched.
 */
async function convertStoredImage(value) {
    try {
        const { mime, base64 } = parseStoredImage(value);
        const beforeBytes = Buffer.byteLength(base64, 'utf8');
        if (mime === 'image/jpeg' && beforeBytes < JPEG_SKIP_BYTES) {
            return { converted: false, reason: 'already optimal', before: beforeBytes, after: beforeBytes, value };
        }
        const converted = await toWhiteJpegDataUri(Buffer.from(base64, 'base64'));
        const afterBytes = Buffer.byteLength(converted.split(',')[1] || '', 'utf8');
        if (afterBytes >= beforeBytes) {
            return { converted: false, reason: 'original is smaller', before: beforeBytes, after: afterBytes, value };
        }
        return { converted: true, reason: 're-encoded', before: beforeBytes, after: afterBytes, value: converted };
    } catch (err) {
        return { converted: false, reason: `decode failed: ${err.message}`, before: 0, after: 0, value };
    }
}

async function main() {
    const apply = process.argv.includes('--apply');
    const uri = process.env.MONGODB_URI;
    if (!uri) {
        console.error('MONGODB_URI is not set');
        process.exit(1);
    }

    const client = new MongoClient(uri);
    await client.connect();
    const coins = client.db().collection('coins');

    const query = { $or: FIELDS.map(f => ({ [f]: { $exists: true, $gt: '' } })) };
    const total = await coins.countDocuments(query);
    console.log(`Found ${total} coin(s) with stored photos. Mode: ${apply ? 'APPLY (writes)' : 'DRY RUN'}\n`);

    let imagesSeen = 0, imagesConverted = 0, bytesBefore = 0, bytesAfter = 0;

    const cursor = coins.find(query, { projection: { collectionObvImage: 1, collectionRevImage: 1 } });
    for await (const doc of cursor) {
        const updates = {};
        for (const field of FIELDS) {
            const value = doc[field];
            if (!value) continue;
            imagesSeen++;
            const result = await convertStoredImage(value);
            const kb = (n) => `${(n / 1024).toFixed(0)}KB`;
            if (result.converted) {
                imagesConverted++;
                bytesBefore += result.before;
                bytesAfter += result.after;
                updates[field] = result.value;
                updates[VERSION_FIELDS[field]] = imageVersion(result.value);
                console.log(`  ✔ ${doc._id} ${field}: ${kb(result.before)} → ${kb(result.after)}`);
            } else {
                console.log(`  · ${doc._id} ${field}: skipped (${result.reason})`);
            }
        }
        if (apply && Object.keys(updates).length) {
            await coins.updateOne({ _id: doc._id }, { $set: updates });
        }
    }

    console.log(`\nDone. ${imagesSeen} image(s) seen, ${imagesConverted} would${apply ? '' : ' be'} converted,` +
        ` ${(bytesBefore / 1024 / 1024).toFixed(1)}MB → ${(bytesAfter / 1024 / 1024).toFixed(1)}MB.`);
    if (!apply && imagesConverted > 0) console.log('Re-run with --apply to write these changes.');
    await client.close();
}

if (require.main === module) {
    main().catch(err => { console.error(err); process.exit(1); });
}

module.exports = { parseStoredImage, toWhiteJpegDataUri, convertStoredImage };
