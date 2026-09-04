const axios = require('axios');

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
    return text.replace(
        /\b(first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth)\s+edition\b/gi,
        (match, word) => ORDINAL_ABBR[word.toLowerCase()] || match
    );
}

/**
 * Fetch an OCRE coin type by its identifier (e.g. "ric.2_3(2).hdn.1907")
 * and parse the JSON-LD response into a flat object suitable for the frontend.
 */
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

            // The authority belongs in the notes, not the citation — strip it
            // from the reference (e.g. "RIC II, Part 3 (second edition) Hadrian
            // 1907" -> "RIC II, Part 3 (second edition) 1907").
            const authority = getLabel(typeNode['nmo:hasAuthority']);
            let reference = prefLabel;
            if (authority) {
                const escaped = authority.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                reference = prefLabel
                    .replace(new RegExp(`\\s*${escaped}\\s*`, 'gi'), ' ')
                    .replace(/\s{2,}/g, ' ')
                    .trim();
            }
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
            // Obverse
            obverseLegend: getLabel(obvNode?.['nmo:hasLegend']),
            obverseDescription: getLabel(obvNode?.['dcterms:description']),
            // Reverse
            reverseLegend: getLabel(revNode?.['nmo:hasLegend']),
            reverseDescription: getLabel(revNode?.['dcterms:description']),
            // Source
            source: 'OCRE',
        };

        console.log('OCRE features extracted:', features.title);
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