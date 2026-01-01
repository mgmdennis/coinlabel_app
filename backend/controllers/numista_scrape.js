const axios = require('axios');


/**
 * Maps Numista orientation strings to arrow symbols.
 */
function mapOrientationToArrows(orientation) {
    const orientationMap = {
        'medal': '↑↑',
        'coin': '↑↓',
        'three': '↑→',
        'nine': '↑←'
    };
    return orientationMap[orientation?.toLowerCase()] || '';
}

/**
 * Identifies the coin dating system and returns a formatted string.
 * - AD: Returns only the year (no prefix).
 * - JE: Long-form conversion, no space (e.g., JE5735).
 * - Japan & China: "Yr. " prefix with space (e.g., Yr. 115).
 * - Others: No space for prefixes without periods (e.g., AH1447).
 */
function formatCoinYear(adYear, coinYear) {
    const diff = adYear - coinYear;
    let prefix = '';
    let displayYear = coinYear;

    // 1. Gregorian (No prefix)
    if (diff === 0) {
        return `${coinYear}`;
    } 
    // 2. Jewish Era (JE)
    else if ([ -3760, -3761, 1240, 1241 ].includes(diff)) {
        prefix = 'JE';
        if (coinYear < 1000) displayYear = coinYear + 5000;
    }
    // 3. Japan & Republic of China (Minguo)
    else if ([ 1867, 1911, 1925, 1988, 2018 ].includes(diff)) {
        prefix = 'Yr.';
    }
    // 4. Other Major Systems
    else if (diff === -543) prefix = 'BE';
    else if (diff === -57)  prefix = 'VS';
    else if (diff === 621 || diff === 622) prefix = 'SH';
    else if (diff === 7 || diff === 8) prefix = 'EE';
    else if (diff >= 575 && diff <= 623) prefix = 'AH';
    else {
        return `${coinYear}`; // Default for unknown systems
    }

    // Format based on the period rule
    return `${prefix} ${displayYear}`;
}

/**
 * Fetches coin details from Numista API v3.
 * Performs parallel calls for type data and mintage issues.
 */
async function getNumistaDetailsJSON(numistaNumber) {
    const apiKey = process.env.NUMISTA_API_KEY;
    const typeId = String(numistaNumber).trim();
    const baseUrl = `https://api.numista.com/v3/types/${typeId}`; // Matches Swagger Base URL

    try {
        console.log('Fetching full Numista API data for ID:', typeId);

        // Making parallel calls as established: one for general info, one for mintage issues
        const [typeResponse, issuesResponse] = await Promise.all([
            axios.get(baseUrl, {
                headers: { 'Numista-API-Key': apiKey, 'User-Agent': 'CoinLabelApp/1.0' }
            }),
            axios.get(`${baseUrl}/issues`, {
                headers: { 'Numista-API-Key': apiKey, 'User-Agent': 'CoinLabelApp/1.0' }
            })
        ]);

        const typeData = typeResponse.data;
        const issuesData = issuesResponse.data;

        const features = {
            // General type information from GET /types/{type_id}
            denomination: typeData.value?.text || "Unknown",
            issuer: typeData.issuer?.name || "Unknown",
            composition: typeData.composition?.text || "Unknown",
            mass: typeData.weight ? `${typeData.weight} g` : "Unknown",
            diameter: typeData.size ? `${typeData.size} mm` : "Unknown",
            orientation: mapOrientationToArrows(typeData.orientation),
            references: typeData.references 
                ? typeData.references.map(ref => `${ref.catalogue.code} ${ref.number}`) 
                : [],
            
            numistaRef: typeData.id,
            
            // Mapping mintage table from GET /types/{type_id}/issues
            variations: (issuesData || []).map(issue => ({
                // date: issue.year || "N.D.",
                date: formatCoinYear(issue.gregorian_year, issue.year),
                mintage: issue.mintage ? issue.mintage.toLocaleString() : "---",
                comment: issue.comment || ""
            })),
            
            description: typeData.title || ""
        };

        console.log("Verified features structure generated.");
        return features;

    } catch (err) {
        if (err.response) {
            console.error(`Numista API Error: ${err.response.status} at ${err.config.url}`);
        } else {
            console.error("General API Connection Error:", err.message);
        }
        return { error: "Failed to fetch complete data from Numista API" };
    }
}

module.exports.getNumistaDetailsJSON = getNumistaDetailsJSON;