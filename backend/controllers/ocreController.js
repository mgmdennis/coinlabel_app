const axios = require('axios');
const { findConcordance, parsePrefLabel } = require('./wildwindsConcordance');

/**
 * Parse a Nomisma URI to a human-readable label.
 * e.g. http://nomisma.org/id/hadrian -> "Hadrian"
 * e.g. http://nomisma.org/id/sestertius -> "Sestertius"
 */
function uriToLabel(uri) {
    if (!uri || typeof uri !== 'string') return '';
    const parts = uri.split('/').pop();
    return parts
        .split(/[_-]/)
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
}

/**
 * Format a year string from OCRE (e.g. "0130" or "-0025") to a readable year.
 */
function formatYear(yearStr) {
    if (!yearStr) return '';
    const year = parseInt(yearStr, 10);
    if (isNaN(year)) return '';
    if (year < 0) return `${Math.abs(year)} BC`;
    if (year < 1000) return `${year} AD`;
    return `${year}`;
}

/**
 * Format a date range from OCRE start/end dates.
 * Condenses AD/BC ranges:
 *   AD 305–AD 306 → AD 305–6
 *   35 BC–2 BC → 35–2 BC
 *   AD 98–AD 117 → AD 98–117
 *   25 BC–23 BC → 25–23 BC
 */
function formatDateRange(startDate, endDate) {
    if (!startDate || !endDate) {
        return formatYear(startDate) || formatYear(endDate) || '';
    }
    const startY = parseInt(startDate, 10);
    const endY = parseInt(endDate, 10);
    if (isNaN(startY) || isNaN(endY)) return formatYear(startDate) || formatYear(endDate) || '';

    const bothAD = startY >= 0 && endY >= 0;
    const bothBC = startY < 0 && endY < 0;

    if (bothAD) {
        if (startY === endY) return `AD ${startY}`;
        // Same century — drop century digits from end: AD 305–6
        if (Math.floor(startY / 100) === Math.floor(endY / 100)) {
            const endShort = endY % 100;
            return `AD ${startY}–${endShort}`;
        }
        return `AD ${startY}–${endY}`;
    }
    if (bothBC) {
        const s = Math.abs(startY);
        const e = Math.abs(endY);
        if (s === e) return `${s} BC`;
        return `${s}–${e} BC`;
    }
    // Mixed BC/AD (rare for Roman coins)
    return `${formatYear(startDate)}–${formatYear(endDate)}`;
}

// Map Nomisma material URIs to standard numismatic abbreviations
const MATERIAL_ABBR = {
    'ar': 'AR', 'av': 'AV', 'ae': 'Æ', 'orichalcum': 'Æ',
    'cu': 'Cu', 'billon': 'Bl', 'lead': 'Pb', 'electrum': 'El',
};

function uriToMaterialAbbr(uri) {
    if (!uri || typeof uri !== 'string') return '';
    const slug = uri.split('/').pop();
    return MATERIAL_ABBR[slug] || '';
}
function formatReference(ocreId) {
    if (!ocreId) return '';
    // Use the skos:prefLabel if available — handled by caller.
    // Fall back to the raw ID.
    return ocreId;
}

// Spelled-out edition ordinals take up a lot of room on a small label —
// abbreviate them (e.g. "(second edition)" -> "(2nd)").
const ORDINAL_ABBR = {
    first: '1st', second: '2nd', third: '3rd', fourth: '4th', fifth: '5th',
    sixth: '6th', seventh: '7th', eighth: '8th', ninth: '9th', tenth: '10th',
};

function abbreviateEditions(text) {
    if (!text) return text;
    return text
        .replace(
            /\b(first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth)\s+edition\b/gi,
            (match, word) => ORDINAL_ABBR[word.toLowerCase()] || match
        )
        // Mark's label convention: drop Part/edition markers entirely —
        // "RIC II, Part 1 (2nd) 689" -> "RIC II 689", "RIC I (2nd) 7A" ->
        // "RIC I 7A". The ocreId keeps the full precision.
        .replace(/,\s*Part\s*\d+(\s*\(\d+(?:st|nd|rd|th)\))?/gi, '')
        .replace(/\s*\(\d+(?:st|nd|rd|th)\)\s+([IVX]+\b)?/gi, ' $1')
        .replace(/\s{2,}/g, ' ')
        .trim();
}

/**
 * Fetch an OCRE coin type by its identifier (e.g. "ric.2_3(2).hdn.1907")
 * and parse the JSON-LD response into a flat object suitable for the frontend.
 */

// Compose the label's obverse block ("Ruler: X\nObv: ...") — the Ruler is
// OCRE's filing emperor (prefLabel), NOT necessarily the effigy: consecration
// and family coinage ("RIC III Marcus Aurelius 441" = DIVVS ANTONINVS) show
// someone else's portrait. When the effigy matches the ruler, the Obv line
// stays short ("Bust, laureate, draped, right."); when it differs the line
// keeps the name ("Obv: Head of Antoninus Pius, bare, right.").
const normName = (s) => String(s || '').toUpperCase().replace(/[^A-Z]/g, '');

function composeObverseDescription(obvDesc, prefLabel) {
    const parsed = parsePrefLabel(prefLabel);
    const rulerNames = (parsed && parsed.names && parsed.names.length) ? parsed.names : [];
    const text = String(obvDesc || '').trim().replace(/\.$/, '');
    const head = /^(?:(Laureate|Radiate|Draped|Cuirassed)\s+)?([Bb]ust|[Hh]ead|[Pp]ortrait)\s+of\s+([^.]+)$/.exec(text);
    if (!head) {
        return [rulerNames.length ? `Ruler: ${rulerNames[0]}` : '', text].filter(Boolean).join('\n');
    }

    const parts = head[3].split(',').map((s) => s.trim()).filter(Boolean);
    let effigy = parts.shift() || '';
    effigy = effigy.replace(/\s+(the\s+[A-Za-z]+)$/i, '').replace(/\s+[IVX]+$/, '').trim();

    const mods = [];
    if (head[1]) mods.push(head[1].toLowerCase());
    for (const p of parts) {
        const m = p.replace(/,?\s*viewed from.*$/i, '').trim();
        if (m) mods.push(m);
    }

    // Effigy matches the ruler when the normalized names overlap.
    // The prefLabel can drag edition fragments in ("(second edition)
    // Hadrian") — clean them before comparing with the effigy name.
    const cleanLabelName = (rn) => normName(String(rn).replace(/\([^)]*\)/g, '').replace(/^\s*\S+\s+/, '').trim());
    const effigyNorm = normName(effigy);
    const same = effigyNorm && rulerNames.some((rn) => {
        const r = normName(String(rn).replace(/\([^)]*\)/g, '').trim());
        const r2 = normName(String(rn).replace(/\([^)]*\)/g, '').replace(/^\s*\S+\s+/, '').trim());
        return r === effigyNorm || r2 === effigyNorm || (r2.length > 3 && effigyNorm.includes(r2)) || (r.length > 3 && effigyNorm.includes(r));
    });

    const noun = head[2][0].toUpperCase() + head[2].slice(1).toLowerCase();
    const cleanRuler = rulerNames
        .map((rn) => String(rn).replace(/\([^)]*\)/g, '').trim())
        .filter(Boolean)
        .sort((a, b) => a.length - b.length)[0];
    if (same) {
        const plain = [noun, ...mods].filter(Boolean).join(', ');
        return `Ruler: ${cleanRuler || effigy}\nObv: ${plain ? plain + '.' : ''}`.trim();
    }
    const obvBody = `${noun} of ${effigy}${mods.length ? ', ' + mods.join(', ') : ''}`;
    return `Ruler: ${cleanRuler || effigy}\nObv: ${obvBody}.`.trim();
}

async function getOcreDetailsJSON(ocreId) {
    const id = String(ocreId).trim();

    try {
        console.log('Fetching OCRE data for ID:', id);

        const url = `https://numismatics.org/ocre/id/${encodeURIComponent(id)}.jsonld`;
        const res = await axios.get(url, {
            headers: { 'Accept': 'application/ld+json' },
            timeout: 10000,
        });

        const graph = res.data['@graph'];
        if (!graph || !Array.isArray(graph)) {
            return { error: 'Invalid OCRE response: no @graph array' };
        }

        // The first node is the coin type; find obverse and reverse nodes by #obverse/#reverse
        const typeNode = graph.find(n => n['@id'] && !n['@id'].includes('#'));
        const obvNode = graph.find(n => n['@id'] && n['@id'].includes('#obverse'));
        const revNode = graph.find(n => n['@id'] && n['@id'].includes('#reverse'));

        if (!typeNode) {
            return { error: 'Coin type node not found in OCRE response' };
        }

        // Extract label
        const prefLabel = typeNode['skos:prefLabel']?.find(l => l['@language'] === 'en')?.['@value']
            || typeNode['skos:prefLabel']?.[0]?.['@value']
            || id;

        // Extract URIs to labels
        const getFirst = (arr) => Array.isArray(arr) && arr.length > 0 ? arr[0] : null;
        const getUri = (arr) => {
            const v = getFirst(arr);
            return v?.['@id'] || '';
        };
        const getLabel = (arr) => {
            const v = getFirst(arr);
            if (!v) return '';
            if (v['@value']) return v['@value'];
            if (v['@id']) return uriToLabel(v['@id']);
            return '';
        };

        const denomLabel = getLabel(typeNode['nmo:hasDenomination']);
            const materialAbbr = uriToMaterialAbbr(getUri(typeNode['nmo:hasMaterial']));
            const denomination = materialAbbr && denomLabel ? `${materialAbbr} ${denomLabel}` : denomLabel;

        // The emperor belongs in the notes, not the citation — strip it from
        // the reference (e.g. "RIC V Saloninus 36" -> "RIC V 36", "RIC IV
        // Philip I 53" -> "RIC IV 53"). Sources of the name to strip:
        //   1. EVERY authority label (joint reigns list several), and
        //   2. the prefLabel's own emperor segment (junior emperors carry
        //      their senior co-rulers as authorities — Saloninus's are
        //      Valerian and Gallienus — so the prefLabel is the only place
        //      his name actually appears).
        const authorities = typeNode['nmo:hasAuthority'] || [];
        const authorityLabels = (Array.isArray(authorities) ? authorities : [authorities])
            .map((a) => (a && typeof a === 'object' ? (a['@value'] || uriToLabel(a['@id'])) : a))
            .filter(Boolean);
        const parsedLabel = parsePrefLabel(prefLabel);
        const mintLabel = getLabel(typeNode['nmo:hasMint']);
        // RIC VI-style prefLabels carry a MINT in the emperor segment
        // ("RIC VI Siscia 146") — the mint belongs on the citation, so
        // never strip a segment that names the record's mint.
        const mintName = String(mintLabel || '').toLowerCase().replace(/[^a-z]/g, '');
        const namesToStrip = [...((parsedLabel && parsedLabel.names) || [])]
            .filter((name) => !mintName || name.toLowerCase().replace(/[^a-z]/g, '') !== mintName);
        let reference = prefLabel;
        for (const name of new Set([...authorityLabels, ...namesToStrip])) {
            const escaped = String(name).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            reference = reference.replace(new RegExp(`\\s*${escaped}\\s*`, 'gi'), ' ');
        }
        // Orphaned conjunctions/punctuation left by the stripped names
        // ("Valerian and Gallienus" -> " and "), then tidy whitespace.
        reference = reference
            .replace(/\s*\b(?:and|&)\b\s*/gi, ' ')
            .replace(/\s+,/g, ',')
            .replace(/\s{2,}/g, ' ')
            .trim();
            reference = abbreviateEditions(reference);

            const features = {
            ocreId: id,
            title: prefLabel,
            reference,
            denomination: denomination,
            issuer: getLabel(typeNode['nmo:hasIssuer']),
            authority: getLabel(typeNode['nmo:hasAuthority']),
            mint: getLabel(typeNode['nmo:hasMint']),
            material: getLabel(typeNode['nmo:hasMaterial']),
            manufacture: getLabel(typeNode['nmo:hasManufacture']),
            dateRange: formatDateRange(
                getFirst(typeNode['nmo:hasStartDate'])?.['@value'],
                getFirst(typeNode['nmo:hasEndDate'])?.['@value']
            ),
            year: formatDateRange(
                getFirst(typeNode['nmo:hasStartDate'])?.['@value'],
                getFirst(typeNode['nmo:hasEndDate'])?.['@value']
            ),
            // Obverse (with ruler/effigy-aware label composition)
            obverseLegend: getLabel(obvNode?.['nmo:hasLegend']),
            obverseDescription: getLabel(obvNode?.['dcterms:description']),
            obverseText: composeObverseDescription(getLabel(obvNode?.['dcterms:description']), prefLabel),
            // Reverse
            reverseLegend: getLabel(revNode?.['nmo:hasLegend']),
            reverseDescription: getLabel(revNode?.['dcterms:description']),
            // Source
            source: 'OCRE',
        };

            console.log('OCRE features extracted:', features.title);

            // Enrich with RSC/BMC cross-references from the local WildWinds
            // concordance (swept into the `concordances` collection). Label
            // convention: RSC line, BMC line, then the RIC citation. Cohen
            // numbers render as RSC (same corpus/numbering, matches existing
            // labels). Missing concordance leaves the reference unchanged.
            const concordance = await findConcordance(id, prefLabel);
            if (concordance) {
                const lines = [];
                if (concordance.rsc.length) lines.push(`RSC ${concordance.rsc[0]}`);
                // Sear is a fallback when BMC is missing (Sear's numbering
                // lumps RIC variants, so BMC/RSC stay preferred).
                if (concordance.bmc.length) lines.push(`BMC ${concordance.bmc[0]}`);
                else if (concordance.sear.length) lines.push(`Sear ${concordance.sear[0]}`);
                if (lines.length) {
                    features.reference = [...lines, reference].join('\n');
                    // Provenance for the frontend — lets the user one-click the
                    // WildWinds entry and verify the cross-references.
                    features.concordance = {
                        rsc: concordance.rsc[0] || null,
                        bmc: concordance.bmc[0] || null,
                        sear: concordance.sear[0] || null,
                        sourceUrl: concordance.sourceUrl,
                    };
                }
            }

            return features;

    } catch (err) {
        if (err.response) {
            const status = err.response.status;
            console.error(`OCRE API Error: ${status}`);
            if (status === 404) {
                return { error: `OCRE record "${id}" was not found. Check the identifier and try again.`, status: 404 };
            }
            return { error: `OCRE API returned an error (${status}).`, status };
        }
        console.error('OCRE API Connection Error:', err.message);
        return { error: 'Failed to connect to OCRE. Please check your connection and try again.' };
    }
}

module.exports.getOcreDetailsJSON = getOcreDetailsJSON;
module.exports.composeObverseDescription = composeObverseDescription;