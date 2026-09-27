// One-time recovery: find OCRE ids for Roman coins created before OCRE
// integration (no ocreId stored).
//
// How it works, per coin:
//   1. Identify the emperor from the coin's obverse legend and build candidate
//      OCRE ids from the citation's RIC number (edition/suffix variants).
//   2. If that misses, try the WildWinds reverse concordance (the citation's
//      RSC number -> a RIC number, suffix-tolerant: "213a" matches 213).
//   3. If that misses, search OCRE by the coin's obverse legend text and
//      verify the results (old-edition numbers rarely match OCRE numbering).
//   A hit is accepted ONLY if the coin's legends match the OCRE record —
//   legends, or the obverse/reverse descriptions for records that carry no
//   legends — so a renumbered same-number different-coin cannot sneak through.
//
// Usage:
//   node scripts/recoverOcreIds.js            # dry run (no writes)
//   node scripts/recoverOcreIds.js --apply    # write verified ocreIds
//
// Reads MONGODB_URI from the environment (repo .env fallback). Only
// unambiguous, verified hits are written.

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const axios = require('axios');
const cheerio = require('cheerio');
const { MongoClient } = require('mongodb');

const OCRE_URL = (id) => `https://numismatics.org/ocre/id/${encodeURIComponent(id)}.jsonld`;
const OCRE_SEARCH_URL = (q) => `https://numismatics.org/ocre/results?q=${encodeURIComponent(q)}`;

const norm = (s) => String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, '');

// Obverse-legend patterns (tested against the normalized legend — uppercase,
// non-alphanumerics stripped, so no spaces) -> candidate id prefixes.
// Slugs verified against OCRE itself: Trajan is ric.2.tr, Domitian
// ric.2_1(2).dom, Lucius Verus / late Commodus under ric.3.m_aur,
// Geta-as-Caesar ric.4.crl.
const LEGEND_PATTERNS = [
    [/HADRIAN/, 'hadrian'],
    [/DIVAFAVSTINA|FAVSTINA/, 'faustina'],
    [/DIVVSANTONINVS/, 'divvs antoninvs'],
    [/ANTONINVSAVGPIVS/, 'antoninvs avg pivs'],
    [/IMPANTONINVSAVG/, 'imp antoninvs avg'],   // Elagabalus styled Antoninus
    [/IVLIASOAEMIAS/, 'ivlia soaemias'],
    [/IVLIAAVGVSTA/, 'ivlia avgvsta'],          // Julia Domna
    [/GETA/, 'geta'],
    [/DOMIT/, 'domit'],
    [/TRAIANOOPTIM|TRAINOOPTIM/, 'traiano optim'], // "TRAINO"/"TRAIANO OPTIM"
    [/TRAIANOAVG|TRAINOAVG/, 'traiano avg'],
    [/LVERVS/, 'l versv'],
    [/COMM/, 'comm'],
    [/POSTVMVS/, 'postvmvs'],
    [/MAXIMIANVS/, 'maximianvs'],
];

const CANDIDATES = {
    hadrian: ['ric.2_3(2).hdn', 'ric.2.hdn'],
    faustina: ['ric.3.ant'],
    'divvs antoninvs': ['ric.3.m_aur', 'ric.3.ant'],
    'antoninvs avg pivs': ['ric.3.ant'],
    'imp antoninvs avg': ['ric.4.el'],
    'ivlia soaemias': ['ric.4.el'],
    'ivlia avgvsta': ['ric.4.ss', 'ric.4.car', 'ric.4.iul', 'ric.4.el', 'ric.4.macr'],
    geta: ['ric.4.ge', 'ric.4.crl', 'ric.4.ss', 'ric.4.get'],
    domit: ['ric.2_1(2).dom', 'ric.2.dom', 'ric.2_2.dom', 'ric.2_2(2).dom'],
    'traiano optim': ['ric.2.tr', 'ric.2.tra'],
    'traiano avg': ['ric.2.tr', 'ric.2.tra'],
    'l versv': ['ric.3.m_aur', 'ric.3.l_ver'],
    comm: ['ric.3.com', 'ric.3.m_aur'],
    postvmvs: ['ric.5.post'],
    maximianvs: ['ric.6.sis'],                 // RIC VI mint slugs
};

// WHO -> WildWinds page slug for the reverse concordance.
const WHO_WW_PAGE = {
    hadrian: 'hadrian',
    faustina: 'faustina_I',
    'divvs antoninvs': 'antoninus_pius',
    'antoninvs avg pivs': 'antoninus_pius',
    'imp antoninvs avg': 'elagabalus',
    'ivlia soaemias': 'julia_soaemias',
    'ivlia avgvsta': 'julia_domna',
    geta: 'geta',
    domit: 'domitian',
    'traiano optim': 'trajan',
    'traiano avg': 'trajan',
    'l versv': 'lucius_verus',
    comm: 'commodus',
    postvmvs: 'postumus',
};

function resolveCandidates(coin) {
    const obv = norm(coin.legendObv || '');
    for (const [re, who] of LEGEND_PATTERNS) {
        if (re.test(obv)) return [who, CANDIDATES[who]];
    }
    return [null, []];
}

// Pull the RIC number from the citation lines. Handles "RIC 147", "RIC IV 21",
// "RIC IV.2 241", "RIC VI Siscia 146", "RIC S587", "RIC M441", "RIC 111c".
function parseRicNumber(reference) {
    for (const line of String(reference || '').split(/\n/)) {
        const m = /(?:^|\s)RIC\s+(?:[IVX]+(?:\.\d+)?)?\s*(?:[A-Za-z]+\s*)?(\d+[A-Za-z]*)/i.exec(line);
        if (m) return m[1];
    }
    return null;
}

// Pull the RSC/Cohen number from the citation ("RSC 357", "RSC/Cohen 26").
function parseRscNumber(reference) {
    const m = /\bRSC(?:\/Cohen)?\s*#?\s*([0-9]+[a-z]?)/i.exec(String(reference || ''));
    return m ? m[1] : null;
}

// Number segment variants for probing: "111c" -> ["111c", "111C"].
function numberVariants(num) {
    const m = /^(\d+)([a-z]+)?$/i.exec(String(num).trim());
    if (!m) return [String(num).trim()];
    const digits = parseInt(m[1], 10);
    const suffix = m[2] || '';
    return [...new Set([`${digits}${suffix}`, `${digits}${suffix.toUpperCase()}`])];
}

async function fetchOcre(id) {
    try {
        const res = await axios.get(OCRE_URL(id), {
            headers: { Accept: 'application/ld+json' },
            timeout: 12000,
        });
        return res.data;
    } catch {
        return null;
    }
}

function ocreFacts(jsonld) {
    const g = jsonld['@graph'];
    const typeNode = g.find((n) => n['@id'] && !n['@id'].includes('#'));
    const obv = g.find((n) => n['@id'] && n['@id'].includes('#obverse')) || {};
    const rev = g.find((n) => n['@id'] && n['@id'].includes('#reverse')) || {};
    const one = (v) => (Array.isArray(v) ? v[0]?.['@value'] || '' : v?.['@value'] || '');
    return {
        // Canonical id straight from the record (fixes case variants).
        id: String(typeNode['@id'] || '').split('/id/').pop() || null,
        title: one(typeNode['skos:prefLabel']),
        obvLegend: one(obv['nmo:hasLegend']),
        revLegend: one(rev['nmo:hasLegend']),
        obvDesc: one(obv['dcterms:description']),
        revDesc: one(rev['dcterms:description']),
    };
}

// A coin accepts an OCRE record only if every non-empty coin legend LINE
// appears (normalized, parenthetical asides like "(in ex.)" stripped first)
// in the record's corresponding legend — or, when the record has no legends,
// in its descriptions. Line-wise matching survives reordered exergue text.
function coinLegendSegments(legend) {
    return String(legend || '')
        .replace(/\([^)]*\)/g, ' ')        // "(in ex.)", "(around)" notes
        .split(/\n/)
        .map((s) => norm(s))
        .filter(Boolean);
}

function legendsMatch(coin, f) {
    const ocreObv = norm(f.obvLegend) + ' ' + norm(f.obvDesc);
    const ocreRev = norm(f.revLegend) + ' ' + norm(f.revDesc);
    const obvOk = coinLegendSegments(coin.legendObv)
        .every((seg) => ocreObv.includes(seg));
    const revOk = coinLegendSegments(coin.legendRev)
        .every((seg) => ocreRev.includes(seg));
    return obvOk && revOk;
}

async function verifyIds(ids, coin) {
    const hits = new Map();
    for (const id of ids) {
        const jsonld = await fetchOcre(id);
        if (!jsonld) continue;
        const f = ocreFacts(jsonld);
        if (f.id && legendsMatch(coin, f)) hits.set(f.id, f.title);
    }
    return hits;
}

// Search OCRE by the coin's obverse legend text and collect result ids.
// (OCRE's PHP search expects '+'-joined terms — %20 encoding returns an
// empty result page.)
async function legendSearch(coin) {
    const q = String(coin.legendObv || '')
        .replace(/\([^)]*\)/g, ' ')
        .replace(/[.·•]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .split(' ')
        .join('+')
        .slice(0, 60);
    if (!q) return [];
    try {
        const res = await axios.get(`https://numismatics.org/ocre/results?q=${q}`, { timeout: 15000, responseType: 'text' });
        const $ = cheerio.load(res.data);
        const ids = [];
        $('a[href]').each((_, a) => {
            const m = /\/ocre\/id\/(ric\.[a-zA-Z0-9_.()]+[0-9A-Za-z]*)$/.exec($(a).attr('href') || '');
            if (m) ids.push(m[1]);
        });
        return [...new Set(ids)];
    } catch {
        return [];
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
    const concordances = client.db().collection('concordances');

    const roman = await coins.find(
        { ocreId: { $in: ['', null] }, $or: [{ issuer: 'Roman Empire' }, { reference: /RIC/ }] },
        { projection: { reference: 1, legendObv: 1, legendRev: 1, year: 1 } }
    ).toArray();
    console.log(`Roman coins without ocreId: ${roman.length}. Mode: ${apply ? 'APPLY (writes)' : 'DRY RUN'}\n`);

    let recovered = 0, ambiguous = 0, missed = 0;
    for (const coin of roman) {
        const [who, prefixes] = resolveCandidates(coin);
        if (!who) {
            console.log(`· ${coin._id} ${JSON.stringify(coin.reference)} — emperor unknown from legends — SKIPPED`);
            missed++;
            continue;
        }

        // Attempt 1: citation's RIC number against the emperor's id prefixes.
        let hits = new Map();
        let sources = [];
        const citationNumber = parseRicNumber(coin.reference);
        if (citationNumber) {
            const ids = [];
            for (const p of prefixes) for (const n of numberVariants(citationNumber)) ids.push(`${p}.${n}`);
            hits = await verifyIds(ids, coin);
            sources.push(`citation RIC ${citationNumber}`);
        }

        // Attempt 2: WildWinds reverse concordance — the citation's RSC
        // number maps to a RIC number on the emperor's page (suffix-tolerant).
        if (!hits.size) {
            const rsc = parseRscNumber(coin.reference);
            const page = WHO_WW_PAGE[who];
            if (rsc && page) {
                const base = rsc.replace(/[a-z]$/i, '');
                const rows = await concordances
                    .find({ emperor: page, rsc: { $regex: `^${base}[a-z]?$`, $options: 'i' } })
                    .limit(5)
                    .toArray();
                const unique = [...new Set(rows.map((r) => r.number))];
                if (unique.length === 1 && unique[0] !== citationNumber) {
                    const ids = [];
                    for (const p of prefixes) for (const n of numberVariants(unique[0])) ids.push(`${p}.${n}`);
                    hits = await verifyIds(ids, coin);
                    sources.push(`reverse-concordance RSC ${rsc} -> RIC ${unique[0]} on ${page}`);
                }
            }
        }

        // Attempt 3: search OCRE by the coin's obverse legend (old-edition
        // citations rarely match OCRE's own numbering; legends don't lie).
        if (!hits.size) {
            const ids = await legendSearch(coin);
            if (ids.length) {
                hits = await verifyIds(ids.slice(0, 25), coin);
                sources.push(`OCRE legend search`);
            }
        }

        if (hits.size === 1) {
            const [[id, title]] = [...hits];
            recovered++;
            console.log(`✔ ${coin._id} ${JSON.stringify(coin.reference)} [via ${sources.join('; ')}]`);
            console.log(`   => ${id} (${title})`);
            if (apply) await coins.updateOne({ _id: coin._id }, { $set: { ocreId: id } });
        } else if (hits.size > 1) {
            ambiguous++;
            console.log(`⚠ ${coin._id} ${JSON.stringify(coin.reference)} — ${hits.size} verified candidates: ${[...hits.keys()].join(', ')} — NOT written`);
        } else {
            missed++;
            console.log(`✖ ${coin._id} ${JSON.stringify(coin.reference)} [${sources.join('; ') || 'no attempts'}] — no verified hit`);
        }
    }

    console.log(`\nDone. ${recovered} recovered, ${ambiguous} ambiguous (not written), ${missed} missed.`);
    if (!apply && recovered > 0) console.log('Re-run with --apply to write the verified ids.');
    await client.close();
}

if (require.main === module) {
    main().catch((err) => { console.error(err); process.exit(1); });
}

module.exports = { parseRicNumber, parseRscNumber, legendsMatch, norm };
