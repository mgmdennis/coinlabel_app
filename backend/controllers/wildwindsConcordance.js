const Concordance = require('../models/concordanceModel');

// OCRE emperor slugs (the second-to-last ocreId segment, e.g.
// "ric.1(2).aug.7A" -> "aug") mapped to WildWinds RIC page slugs. Unmapped
// slugs fall back to slugifying the OCRE issuer/authority label.
const EMPEROR_MAP = {
    aug: 'augustus', tib: 'tiberius', gai: 'caligula', clau: 'claudius',
    ner: 'nero', gal: 'galba', otho: 'otho', vit: 'vitellius',
    ves: 'vespasian', tit: 'titus', dom: 'domitian', tra: 'trajan',
    hdn: 'hadrian', sab: 'sabina',
    ant: 'antoninus_pius', anth_w: 'antoninus_pius',
    m_aur: 'marcus_aurelius', mar: 'marcus_aurelius',
    l_ver: 'lucius_verus', ver: 'lucius_verus',
    com: 'commodus',
    sev: 'septimius_severus', ss: 'septimius_severus',
    iul: 'julia_domna', car: 'caracalla', get: 'geta',
    ela: 'elagabalus', s_alex: 'severus_alexander', saxa: 'severus_alexander',
};

// WildWinds uses different names than OCRE labels for a few emperors.
const LABEL_ALIASES = {
    gaius: 'caligula',
    m_aurelius: 'marcus_aurelius',
    trajanus: 'trajan',
    lucius_aurelius_verus: 'lucius_verus',
};

function slugifyLabel(label) {
    if (!label) return null;
    const slug = String(label).toLowerCase().trim()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '');
    return LABEL_ALIASES[slug] || slug || null;
}

// WildWinds-style key for an OCRE number segment ("7A" -> "7A", "007a" -> "7A").
function normalizeRicNumber(raw) {
    const m = /^(\d+)\s*([A-Za-z]*)/.exec(String(raw).trim());
    if (!m) return null;
    const digits = String(parseInt(m[1], 10));
    const suffix = (m[2] || '').toUpperCase();
    if (!digits || digits === '0') return null;
    return digits + (suffix || '');
}

/**
 * Look up RSC/BMC cross-references for an OCRE coin type in the
 * `concordances` collection (swept from WildWinds). Returns
 * { rsc: [..], bmc: [..], heading } or null. Never throws — the OCRE flow
 * must not fail because the concordance is missing or the slug is unknown.
 */
async function findConcordance(ocreId, issuerLabel) {
    try {
        const segments = String(ocreId || '').split('.');
        if (segments[0] !== 'ric' || segments.length < 3) return null;
        const number = normalizeRicNumber(segments[segments.length - 1]);
        if (!number) return null;
        const slug = segments[segments.length - 2].toLowerCase();
        const emperor = EMPEROR_MAP[slug] || slugifyLabel(issuerLabel);
        if (!emperor) return null;

        const rows = await Concordance.find({ emperor, number })
            .sort({ rowIndex: 1 })
            .lean();
        if (!rows.length) return null;
        // Prefer the first row that actually carries references (sub-entries
        // like the aureus listing sometimes have none).
        const preferred = rows.find(r => (r.rsc && r.rsc.length) || (r.bmc && r.bmc.length));
        if (!preferred) return null;
        return { rsc: preferred.rsc, bmc: preferred.bmc, heading: preferred.heading, sourceUrl: preferred.sourceUrl };
    } catch (err) {
        console.error('Concordance lookup failed (ignored):', err.message);
        return null;
    }
}

module.exports = { findConcordance, EMPEROR_MAP };
