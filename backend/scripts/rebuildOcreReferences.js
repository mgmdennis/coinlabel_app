// One-time rebuild: merge the label `reference` (catalog numbers) of Roman
// coins with the auto-composition a fresh OCRE lookup produces.
//
// Merge strategy — hand-curated lines always win:
//   - existing RSC/Cohen lines are kept verbatim (WildWinds variant-level
//     RSC flips are known: RSC 74 vs 75, 271 vs 272, 405 vs 406)
//   - existing BMC/BMCRE/RMC and Sear lines are kept; gaps are filled from
//     the lookup's concordance (Sear only when no BMC exists)
//   - the RIC citation is upgraded to OCRE's canonical form (volume,
//     edition, case: "RIC 111c" -> "RIC III 111C")
// Output line order: RSC, BMC/BMCRE/RMC, Sear, RIC.
//
// Usage:
//   node scripts/rebuildOcreReferences.js            # dry run (no writes)
//   node scripts/rebuildOcreReferences.js --apply    # write references
//
// Reads MONGODB_URI from the environment (repo .env fallback). OCRE/timeout
// failures are reported and can be retried by re-running (idempotent).

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const mongoose = require('mongoose');
const { MongoClient } = require('mongodb');
const { getOcreDetailsJSON } = require('../controllers/ocreController');

async function main() {
    const apply = process.argv.includes('--apply');
    const uri = process.env.MONGODB_URI;
    if (!uri) {
        console.error('MONGODB_URI is not set');
        process.exit(1);
    }

    const client = new MongoClient(uri);
    await client.connect();
    const coinsCol = client.db().collection('coins');

    await mongoose.connect(uri);
    const roman = await coinsCol.find(
        { ocreId: { $gt: '' }, $or: [{ issuer: 'Roman Empire' }, { reference: /RIC/ }] },
        { projection: { reference: 1, ocreId: 1 } }
    ).toArray();
    console.log(`Roman coins with ocreId: ${roman.length}. Mode: ${apply ? 'APPLY (writes)' : 'DRY RUN'}\n`);

    // Corpus buckets: RSC/Cohen, BMC/BMCRE/RMC, Sear, and the RIC citation.
    const RSC_RE = /^(RSC)(?:\/Cohen)?\s+(.+)$/i;
    const BMC_RE = /^(BMC(?:RE)?|RMC|BMCRRE?)\s+(.+)$/i;
    const SEAR_RE = /^(Sear)\s*#?\s*(.+)$/i;
    const RIC_RE = /^(RIC(?:\s|\b).*)$/i;

    const bucketize = (lines) => {
        const b = { rsc: [], bmc: [], sear: [], ric: [] };
        for (const line of lines) {
            if (RSC_RE.test(line)) b.rsc.push(line.trim());
            else if (BMC_RE.test(line)) b.bmc.push(line.trim());
            else if (SEAR_RE.test(line)) b.sear.push(line.trim());
            else if (RIC_RE.test(line)) b.ric.push(line.trim());
        }
        return b;
    };

    let changed = 0, same = 0, failed = 0;
    for (const coin of roman) {
        const d = await getOcreDetailsJSON(coin.ocreId);
        if (d.error || !(d.reference || '').trim()) {
            failed++;
            console.log(`✖ ${coin._id} ${coin.ocreId} — ${String(d.error || 'no reference').slice(0, 60)}`);
            continue;
        }

        const have = bucketize(String(coin.reference || '').split(/\n/));
        const fresh = bucketize(String(d.reference).split(/\n/));
        // The OCRE-canonical RIC citation always wins (volume/edition/case).
        const ric = fresh.ric.length ? fresh.ric[0]
            : (have.ric.length ? have.ric[0] : '');

        const merged = [
            ...(have.rsc.length ? have.rsc : fresh.rsc),
            ...(have.bmc.length ? have.bmc : fresh.bmc),
            // Sear is a fallback for missing BMC only:
            ...((have.bmc.length ? [] : have.sear.length ? have.sear : fresh.sear)),
            ...(ric ? [ric] : []),
        ].filter((line) => line.replace(/\s+/g, '')).filter(Boolean);

        const next = [...new Set(merged)].join('\n');
        if (next === (coin.reference || '')) {
            same++;
            console.log(`· ${coin._id} ${coin.ocreId} — already matches`);
            continue;
        }
        changed++;
        console.log(`✔ ${coin._id} ${coin.ocreId}`);
        console.log(`   before: ${JSON.stringify(coin.reference)}`);
        console.log(`   after:  ${JSON.stringify(next)}`);
        if (apply) await coinsCol.updateOne({ _id: coin._id }, { $set: { reference: next } });
    }

    console.log(`\nDone. ${changed} ${apply ? 'rebuilt' : 'would rebuild'}, ${same} already match, ${failed} failed.`);
    if (!apply && changed > 0) console.log('Re-run with --apply to write these changes.');
    await client.close();
    await mongoose.disconnect();
}

if (require.main === module) {
    main().catch((err) => { console.error(err); process.exit(1); });
}
