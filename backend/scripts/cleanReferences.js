// One-time cleanup: normalize the label `reference` field on all coins —
// strip commas and trailing periods (junk from pasted catalog citations).
// Mid-string periods are legitimate sub-numbers (e.g. "KM 490.1") and stay.
//
// Usage:
//   node scripts/cleanReferences.js            # dry run (no writes)
//   node scripts/cleanReferences.js --apply    # write cleaned values
//
// Reads MONGODB_URI from the environment (repo .env is loaded as fallback;
// an explicit env var wins). Idempotent — rerunning skips already-clean docs.

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const { MongoClient } = require('mongodb');

/**
 * Remove commas and the trailing period from a reference string.
 * Also tidies whitespace left behind by the removals.
 */
function cleanReference(value) {
    if (!value) return value;
    return String(value)
        .replace(/,/g, '')          // all commas
        .replace(/[.\s]+$/, '')     // trailing period(s) / whitespace
        .replace(/\s{2,}/g, ' ')    // collapse double spaces
        .trim();
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

    // Only docs whose reference would actually change — projection keeps
    // this read tiny (never touches the base64 photo fields).
    const all = await coins.find(
        { reference: { $exists: true, $gt: '' } },
        { projection: { reference: 1 } }
    ).toArray();
    console.log(`Found ${all.length} coin(s) with a reference. Mode: ${apply ? 'APPLY (writes)' : 'DRY RUN'}\n`);

    let changed = 0;
    for (const doc of all) {
        const cleaned = cleanReference(doc.reference);
        if (cleaned === doc.reference) continue;
        changed++;
        console.log(`  ${doc._id} ${JSON.stringify(doc.reference)} → ${JSON.stringify(cleaned)}`);
        if (apply) {
            await coins.updateOne({ _id: doc._id }, { $set: { reference: cleaned } });
        }
    }

    console.log(`\nDone. ${changed} reference(s) ${apply ? 'cleaned' : 'would be cleaned'}; ${all.length - changed} already clean.`);
    if (!apply && changed > 0) console.log('Re-run with --apply to write these changes.');
    await client.close();
}

if (require.main === module) {
    main().catch(err => { console.error(err); process.exit(1); });
}

module.exports = { cleanReference };
