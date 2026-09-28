// One-time rebuild: refresh the label legends (legendObv / legendRev) of
// Roman coins from their OCRE ids, so they read clean and consistent:
//   OCRE: "IMP CAES DOMIT AVG GERM P M TR P VIIII"
//   vs legacy dotted Numista style: "IMP. CAES. DOMIT . AVG . GERM . ..."
//
// Usage:
//   node scripts/rebuildOcreLegends.js            # dry run (no writes)
//   node scripts/rebuildOcreLegends.js --apply    # write legends
//
// Reads MONGODB_URI from the environment (repo .env fallback). OCRE/timeout
// failures are reported and can be retried by re-running (idempotent).

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const axios = require('axios');
const { MongoClient } = require('mongodb');

async function fetchOcreLegends(ocreId) {
    try {
        const res = await axios.get(
            `https://numismatics.org/ocre/id/${encodeURIComponent(ocreId)}.jsonld`,
            { headers: { Accept: 'application/ld+json' }, timeout: 12000 }
        );
        const g = res.data['@graph'];
        const obv = g.find((n) => n['@id'] && n['@id'].includes('#obverse')) || {};
        const rev = g.find((n) => n['@id'] && n['@id'].includes('#reverse')) || {};
        const one = (v) => (Array.isArray(v) ? v[0]?.['@value'] || '' : v?.['@value'] || '');
        return { obvLegend: one(obv['nmo:hasLegend']), revLegend: one(rev['nmo:hasLegend']) };
    } catch {
        return null;
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

    const roman = await coins.find(
        { ocreId: { $gt: '' }, $or: [{ issuer: 'Roman Empire' }, { reference: /RIC/ }] },
        { projection: { reference: 1, ocreId: 1, legendObv: 1, legendRev: 1 } }
    ).toArray();
    console.log(`Roman coins with ocreId: ${roman.length}. Mode: ${apply ? 'APPLY (writes)' : 'DRY RUN'}\n`);

    let updated = 0, same = 0, failed = 0;
    for (const coin of roman) {
        const f = await fetchOcreLegends(coin.ocreId);
        // A record without legends can't be rebuilt from — leave the coin as is.
        if (!f || (!f.obvLegend && !f.revLegend)) {
            failed++;
            console.log(`✖ ${coin._id} ${coin.ocreId} — no legends on the OCRE record`);
            continue;
        }
        const next = { legendObv: f.obvLegend, legendRev: f.revLegend };
        if (next.legendObv === (coin.legendObv || '') && next.legendRev === (coin.legendRev || '')) {
            same++;
            continue;
        }
        updated++;
        console.log(`✔ ${coin._id} ${coin.ocreId} [${JSON.stringify(coin.reference || '')}]`);
        console.log(`   obv before: ${JSON.stringify(coin.legendObv || '')}`);
        console.log(`   obv after:  ${JSON.stringify(next.legendObv)}`);
        console.log(`   rev before: ${JSON.stringify(coin.legendRev || '')}`);
        console.log(`   rev after:  ${JSON.stringify(next.legendRev)}`);
        if (apply) await coins.updateOne({ _id: coin._id }, { $set: next });
    }

    console.log(`\nDone. ${updated} ${apply ? 'rebuilt' : 'would rebuild'}, ${same} already match, ${failed} could not be rebuilt.`);
    if (!apply && updated > 0) console.log('Re-run with --apply to write these changes.');
    await client.close();
}

if (require.main === module) {
    main().catch((err) => { console.error(err); process.exit(1); });
}
