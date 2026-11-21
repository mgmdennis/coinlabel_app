// One-time cleanup: delete "totally empty" coin records — auto-created stubs
// that were never actually filled in and now litter the collection.
//
// Matches the frontend's isEmptyCoinPayload (create.jsx): a record is a
// delete-able stub only when it holds nothing beyond the bare lookup key —
// data the catalogue lookup actually RETURNED (year/issuer/denomination/etc.)
// counts as content and keeps the coin (Mark, 2026-11-21). In manual mode
// everything is user-typed, so anything non-blank keeps the coin.
// Collection-linked labels, print-listed coins and coins with quest picks are
// never touched.
//
// Usage:
//   node scripts/deleteEmptyCoins.js              # dry run (no writes)
//   node scripts/deleteEmptyCoins.js --apply      # delete matches
//   node scripts/deleteEmptyCoins.js --user <id>  # restrict to one user
//   node scripts/deleteEmptyCoins.js --days 30    # only entries older than N days
//
// Reads MONGODB_URI from the environment (repo .env as fallback; an explicit
// env var wins). Dry-run is the default — always eyeball the list first.

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const { MongoClient, ObjectId } = require('mongodb');

function isTotallyEmpty(c) {
    if (c.isCollectionItem) return false;
    if (c.printListed === true) return false;
    if (c.questPicks && Object.keys(c.questPicks).length) return false;
    if (Array.isArray(c.marks) && c.marks.length) return false;
    const typed = c.isManual
        ? [c.numistaNumber, c.ocreId, c.year, c.issuer, c.denomination, c.grade,
           c.gradeDetails, c.details, c.reference, c.composition, c.physicalDetails,
           c.mintage, c.legendObv, c.legendRev, c.collectionObvImage,
           c.collectionRevImage, c.sketchId, c.marksPicture]
        : [c.year, c.issuer, c.denomination, c.grade, c.gradeDetails, c.details,
           c.reference, c.composition, c.physicalDetails, c.mintage,
           c.legendObv, c.legendRev, c.collectionObvImage, c.collectionRevImage,
           c.sketchId, c.marksPicture];
    return !typed.some(v => v && String(v).trim());
}

async function main() {
    const apply = process.argv.includes('--apply');
    const userIdx = process.argv.indexOf('--user');
    const daysIdx = process.argv.indexOf('--days');
    const userId = userIdx > -1 ? process.argv[userIdx + 1] : null;
    const days = daysIdx > -1 ? parseInt(process.argv[daysIdx + 1], 10) : null;

    const uri = process.env.MONGODB_URI;
    if (!uri) {
        console.error('MONGODB_URI is not set');
        process.exit(1);
    }

    const client = new MongoClient(uri);
    await client.connect();
    const coins = client.db().collection('coins');

    const query = {};
    if (userId) query.userId = ObjectId.isValid(userId) ? new ObjectId(userId) : userId;
    if (days) {
        const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
        // dateAdded is an ISO string; createdAt (timestamps) is a real date.
        query.$or = [
            { createdAt: { $lt: cutoff } },
            { createdAt: { $exists: false }, dateAdded: { $lt: cutoff.toISOString() } },
        ];
    }

    const total = await coins.countDocuments(query);
    console.log(`Scanning ${total} coin(s)${userId ? ` for user ${userId}` : ''}${days ? ` older than ${days} day(s)` : ''}...`);

    let scanned = 0, matches = 0, deleted = 0;
    for await (const c of coins.find(query, { _id: 1, userId: 1, numistaNumber: 1, isManual: 1, dateAdded: 1, createdAt: 1 })) {
        scanned++;
        if (!isTotallyEmpty(c)) continue;
        matches++;
        const when = c.dateAdded || (c.createdAt && c.createdAt.toISOString().slice(0, 10)) || '?';
        console.log(`${apply ? 'Deleting' : 'Would delete'} ${c._id} (user ${c.userId}, ${c.isManual ? 'manual' : `numista ${c.numistaNumber || '-'}`}, ${when})`);
        if (apply) {
            const r = await coins.deleteOne({ _id: c._id });
            if (r.deletedCount) deleted++;
        }
        // Print progress before heavy work so it never looks hung.
        if (scanned % 500 === 0) console.log(`... scanned ${scanned}/${total}`);
    }

    console.log(`Scanned ${scanned}, empty-stub matches: ${matches}${apply ? `, deleted: ${deleted}` : ' (dry run — rerun with --apply to delete)'}`);
    await client.close();
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
