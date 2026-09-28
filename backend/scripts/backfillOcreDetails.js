// One-time backfill: rewrite the label `details` of Roman coins from their
// (recovered) OCRE ids, in the new label format:
//   "(<Ruler>)\nObv: <bust noun, modifiers>.\nRev: <full reverse description>"
// Full words by default — the label abbreviates at display time only when
// the text won't fit or grade notes are set (frontend/src/utils/condenseDetails.js
// is the source of truth for the format; this script mirrors it for CJS).
//
// Usage:
//   node scripts/backfillOcreDetails.js            # dry run (no writes)
//   node scripts/backfillOcreDetails.js --apply    # write the new details
//
// Only coins whose stored details still use the legacy terse convention
// (no "Obv:" line) are rewritten — hand-enriched details are left alone.
// Reads MONGODB_URI from the environment (repo .env fallback).

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const axios = require('axios');
const { MongoClient } = require('mongodb');

// Mirrors formatObverse in frontend/src/utils/condenseDetails.js.
function formatObverse(desc) {
    if (!desc) return '';
    const text = String(desc).trim().replace(/\.$/, '');
    const head = /^(?:(Laureate|Radiate|Draped|Cuirassed)\s+)?([Bb]ust|[Hh]ead|[Pp]ortrait)\s+of\s+([^.]+)$/.exec(text);
    if (!head) return String(desc).trim();

    const parts = head[3].split(',').map((s) => s.trim()).filter(Boolean);
    let ruler = parts.shift() || '';
    ruler = ruler.replace(/\s+(the\s+[A-Za-z]+)$/i, '').replace(/\s+[IVX]+$/, '').trim();

    let modifiers = [];
    if (head[1]) modifiers.push(head[1].toLowerCase());
    modifiers = modifiers.concat(parts.filter((p) => !/^viewed from\b/i.test(p)));
    modifiers = modifiers.map((p) => p.replace(/,?\s*viewed from.*$/gi, ''))
        .filter((p) => !/^(?:sometimes)?\s*$/.test(p));

    const body = [head[2][0].toUpperCase() + head[2].slice(1).toLowerCase(), ...modifiers].filter(Boolean).join(', ');
    return `Ruler: ${ruler}\nObv: ${body ? body + '.' : ''}`.trim();
}


async function fetchOcreFacts(ocreId) {
    try {
        const res = await axios.get(
            `https://numismatics.org/ocre/id/${encodeURIComponent(ocreId)}.jsonld`,
            { headers: { Accept: 'application/ld+json' }, timeout: 12000 }
        );
        const g = res.data['@graph'];
        const obv = g.find((n) => n['@id'] && n['@id'].includes('#obverse')) || {};
        const rev = g.find((n) => n['@id'] && n['@id'].includes('#reverse')) || {};
        const typeNode = g.find((n) => n['@id'] && !n['@id'].includes('#')) || {};
        const one = (v) => (Array.isArray(v) ? v[0]?.['@value'] || '' : v?.['@value'] || '');
        const mintUri = (Array.isArray(typeNode['nmo:hasMint']) ? typeNode['nmo:hasMint'][0] : typeNode['nmo:hasMint']) || {};
        const mintSlug = String(mintUri['@id'] || '').split('/').pop();
        const mint = /^uncertain/i.test(mintSlug) ? 'Unknown' : mintSlug.split(/[_-]/).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        const { composeObverseDescription } = require('../controllers/ocreController');
        const prefLabel = one(typeNode['skos:prefLabel']);
        return { obvDesc: one(obv['dcterms:description']), revDesc: one(rev['dcterms:description']), mint, obverseText: composeObverseDescription(one(obv['dcterms:description']), prefLabel) };
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
        { projection: { reference: 1, details: 1, ocreId: 1 } }
    ).toArray();
    console.log(`Roman coins with ocreId: ${roman.length}. Mode: ${apply ? 'APPLY (writes)' : 'DRY RUN'}\n`);

    let updated = 0, skippedLegacy = 0, failed = 0;
    for (const coin of roman) {
        // Rewrites the machine-generated details (yesterday's backfill format)
        // to add the Mint line — coins without an "Obv:" line are legacy terse
        // and get the full format. Hand-tuned details would be clobbered only
        // if they still differ from the recomposition — review the dry run.
        // One-off full recompute — skip detection disabled so prod gets the
        // ruler/effigy-aware Obv lines everywhere (this script now diffs
        // before writing, so machines-only coins stay idempotent).
        const f = await fetchOcreFacts(coin.ocreId);
        if (!f || (!f.obvDesc && !f.revDesc)) {
            failed++;
            console.log(`✖ ${coin._id} ${coin.ocreId} — OCRE record unusable`);
            continue;
        }
        // Preserve hand-added extra lines ("Contemporary Forgery", etc.) —
        // anything that isn't a machine-format line keeps its position.
        const machineRe = /^Ruler:|^\((?:[^)]+)\)$|^Obv:|^Rev:|^Mint:/i;
        const extras = String(coin.details || '').split('\n').filter((l) => l.trim() && !machineRe.test(l.trim()));
        const parts = [
            f.obverseText || formatObverse(f.obvDesc),
            f.revDesc ? `Rev: ${f.revDesc}` : '',
            ...extras,
            f.mint ? `Mint: ${f.mint}` : '',
        ].filter(Boolean);
        const details = parts.join('\n');
        if (details === (coin.details || '')) {
            skippedLegacy++;
            continue;
        }
        updated++;
        console.log(`✔ ${coin._id} ${coin.ocreId} [${JSON.stringify(coin.reference)}]`);
        console.log(`   before: ${JSON.stringify(coin.details)}`);
        console.log(`   after:  ${JSON.stringify(details)}`);
        if (apply) await coins.updateOne({ _id: coin._id }, { $set: { details } });
    }

    console.log(`\nDone. ${updated} ${apply ? 'updated' : 'would update'}, ${skippedLegacy} already fine, ${failed} failed.`);
    if (!apply && updated > 0) console.log('Re-run with --apply to write these changes.');
    await client.close();
}

if (require.main === module) {
    main().catch((err) => { console.error(err); process.exit(1); });
}

module.exports = { formatObverse };
