const Concordance = require('../models/concordanceModel');

// OCRE emperor slugs (the second-to-last ocreId segment, e.g.
// "ric.1(2).aug.7A" -> "aug") that map to exactly one WildWinds RIC page.
// Series slugs where several emperors share the numbering (val_i, ph_i, cg,
// car, dio, gall_sala(1), ...) are deliberately NOT mapped — the prefLabel's
// own emperor name picks the page for those (see findConcordance).
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
    iul: 'julia_domna',
    // NOTE: 'car' is deliberately unmapped — Caracalla in ric.4 but the
    // Carus/Carinus/Numerian series in ric.5. The prefLabel's emperor name
    // disambiguates ("Caracalla" vs "Carus"), so it picks the page instead.
    // Elagabalus' OCRE slug is 'el' (verified via OCRE search) — deliberately
    // NOT mapped here: his series also carries Julia Soaemias, and the
    // prefLabel path picks the right page per coin (elagabalus vs
    // julia_soaemias). Same for 'tr' (Trajan) and 'ge' (Geta).
    gor_iii: 'gordian_III',
    sals: 'saloninus', 'sala(1)': 'salonina',
    post: 'postumus', vict: 'victorinus', aur: 'aurelian', tac: 'tacitus',
    tet_i: 'tetricus_I', tet_ii: 'tetricus_II', aem: 'aemilian',
};

// WildWinds uses different names than OCRE labels for a few emperors.
// Roman numerals are preserved by slugifyLabel (Philip I -> philip_I,
// Tetricus II -> tetricus_II, Gordian III -> gordian_III).
const LABEL_ALIASES = {
    gaius: 'caligula',
    trajanus: 'trajan',
    maximian: 'maximianus',
    valerian: 'valerian_I',
    claudius_II_gothicus: 'claudius_II',
    claudius_gothicus: 'claudius_II',
    philip_the_arab: 'philip_I',
};

function slugifyLabel(label) {
    if (!label) return null;
    const words = String(label).toLowerCase().trim().split(/\s+/).filter(Boolean);
    if (!words.length) return null;
    // First name of a joint reign ("Valerian and Gallienus" -> Valerian).
    const first = [];
    for (const w of words) {
        if (w === 'and' || w === '&') break;
        first.push(w);
    }
    if (!first.length) return null;
    const slug = first
        .map((w) => (/^[ivx]+$/.test(w) ? w.toUpperCase() : w))
        .join('_')
        .replace(/[^a-z0-9_]/gi, '')
        .replace(/^_+|_+$/g, '');
    return LABEL_ALIASES[slug] || slug || null;
}

/**
 * Parse an OCRE prefLabel ("RIC <volume> <EmperorName(s)> <number>", e.g.
 * "RIC II, Part 3 (2nd) Hadrian 1907" or "RIC V Saloninus 36". Returns
 * { names: [..], number } — the middle segment names the emperor(s) shown on
 * the coin, which is both what gets stripped from the citation and what keys
 * the WildWinds page. Returns null for unparsable labels.
 */
function parsePrefLabel(prefLabel) {
    if (!prefLabel) return null;
    const m = /^RIC\s+(?:[IVX]+(?:,\s*part\s*\d+)?(?:\s*\(\d+(?:st|nd|rd|th)\))?\s+)?(.+?)\s+(\d+[A-Za-z]*(?:-\d+[A-Za-z]*)?)$/i
        .exec(String(prefLabel).trim());
    if (!m) return null;
    // Labels without an emperor segment ("RIC X 2807") leave the volume
    // numeral as the middle — a bare roman numeral is not a name.
    const names = m[1]
        .split(/\s+(?:and|&)\s+/i)
        .map((s) => s.trim())
        .filter((s) => s && !/^[IVX]+$/i.test(s));
    return { names, number: m[2] };
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
 * Look up RSC/BMC/Sear cross-references for an OCRE coin type in the
 * `concordances` collection (swept from WildWinds). The emperor resolves from
 * the ocreId slug first (junior emperors carry their senior co-rulers as
 * authorities — "RIC V Saloninus 36" has Valerian and Gallienus as
 * authorities), then from the prefLabel's own emperor name (series slugs like
 * ph_i/cg/car/dio share numbering across emperors). Returns
 * { rsc: [..], bmc: [..], sear: [..], heading } or null. Never throws — the
 * OCRE flow must not fail because the concordance is missing.
 */
async function findConcordance(ocreId, prefLabel) {
    try {
        const segments = String(ocreId || '').split('.');
        if (segments[0] !== 'ric' || segments.length < 3) return null;
        const parsed = parsePrefLabel(prefLabel);
        const number = normalizeRicNumber(segments[segments.length - 1])
            || (parsed && normalizeRicNumber(parsed.number));
        if (!number) return null;
        const slug = segments[segments.length - 2].toLowerCase();
        const mapped = EMPEROR_MAP[slug];
        const emperor = mapped !== undefined
            ? mapped
            : (parsed && parsed.names.length ? slugifyLabel(parsed.names[0]) : null);
        if (!emperor) return null;

        const rows = await Concordance.find({ emperor, number })
            .sort({ rowIndex: 1 })
            .lean();
        if (!rows.length) return null;
        // Prefer the first row that actually carries references (sub-entries
        // like the aureus listing sometimes have none).
        const preferred = rows.find(r => (r.rsc && r.rsc.length) || (r.bmc && r.bmc.length) || (r.sear && r.sear.length));
        if (!preferred) return null;
        return {
            rsc: preferred.rsc, bmc: preferred.bmc, sear: preferred.sear,
            heading: preferred.heading, sourceUrl: preferred.sourceUrl,
        };
    } catch (err) {
        console.error('Concordance lookup failed (ignored):', err.message);
        return null;
    }
}

module.exports = { findConcordance, parsePrefLabel, slugifyLabel, EMPEROR_MAP };
