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
 * Removes a denomination and leading special characters from a title.
 * @param {string} denomination - The prefix to remove (e.g., "1 Dollar").
 * @param {string} title - The full title string.
 * @returns {string} - The cleaned title.
 */
function cleanTitle(denomination, title) {
  // Escape special characters in denomination to prevent Regex errors
  const escapedDenom = denomination.replace(/[.*+?^$|[\]\\]/g, '\\$&');

  // Regex breakdown:
    // ^               : Start of the string
    // ${escapedDenom}     : The specific denomination
    // [^a-zA-Z0-9'"]* : Match any character that is NOT a letter, number, single quote, or double quote
    const regex = new RegExp(`^${escapedDenom}[^a-zA-Z0-9'"()]*`, 'i');

    return title.replace(regex, '').trim();
}

/**
 * Formats a title with its primary date and an optional Gregorian date.
 * * @param {string} title - The title of the entry.
 * @param {string} date - The primary date string.
 * @param {string} gregorianDate - The Gregorian date string to compare.
 * @param {string} denomination - The denomination to clean from the title.
 * @returns {string} The formatted string.
 */
function formatComments(title, date, gregorianDate, denomination) {
    // Convert inputs to strings and handle null/undefined with empty strings
    const strDate = String(date || "");
    const strGregorianDate = String(gregorianDate || "");

    // Remove all non-numeric characters
    const cleanDate = strDate.replace(/[^\d]/g, '');
    const cleanGregorianDate = strGregorianDate.replace(/[^\d]/g, '');

    console.log("Raw Details: ", { title, date, gregorianDate, denomination });

    let result = title ? cleanTitle(denomination, title) : "";

    // Compare the cleaned numeric versions
    if (cleanDate !== cleanGregorianDate && cleanGregorianDate !== "") {
        result = `(${cleanGregorianDate})\n${result}`;
    }

    console.log("Formatted Details: ", result);

    return result;
}

/**
 * Fetches coin details from Numista API v3.
 * Performs parallel calls for type data and mintage issues with retry logic for rate limiting.
 */
async function getNumistaDetailsJSON(numistaNumber) {
    const apiKey = process.env.NUMISTA_API_KEY;
    const typeId = String(numistaNumber).trim();
    const baseUrl = `https://api.numista.com/v3/types/${typeId}`;

    // Retry logic for rate limiting
    const maxRetries = 3;
    const baseDelay = 1000; // Start with 1 second delay

    async function makeRequest(url, retries = 0) {
        try {
            return await axios.get(url, {
                headers: { 'Numista-API-Key': apiKey, 'User-Agent': 'CoinLabelApp/1.0' }
            });
        } catch (err) {
            if (err.response?.status === 429 && retries < maxRetries) {
                const delayMs = baseDelay * Math.pow(2, retries); // Exponential backoff
                console.log(`⏳ Rate limited (429). Waiting ${delayMs}ms before retry ${retries + 1}/${maxRetries}...`);
                await new Promise(resolve => setTimeout(resolve, delayMs));
                return makeRequest(url, retries + 1);
            }
            throw err;
        }
    }

    try {
        console.log('Fetching full Numista API data for ID:', typeId);

        // Making sequential calls to avoid hitting rate limits with parallel requests
        const typeResponse = await makeRequest(baseUrl);
        const issuesResponse = await makeRequest(`${baseUrl}/issues`);

        const typeData = typeResponse.data;
        const issuesData = issuesResponse.data;

        // Fetch coin images and convert to base64 so the frontend doesn't need a proxy
        async function fetchImageAsBase64(url) {
            if (!url) return null;
            try {
                console.log(`📷 Fetching image: ${url}`);
                const resp = await axios.get(url, {
                    responseType: 'arraybuffer',
                    headers: { 'Numista-API-Key': apiKey, 'User-Agent': 'CoinLabelApp/1.0' }
                });
                const contentType = resp.headers['content-type'] || 'image/jpeg';
                const base64 = `data:${contentType};base64,${Buffer.from(resp.data).toString('base64')}`;
                console.log(`✅ Image fetched successfully (${Math.round(base64.length / 1024)}KB)`);
                return base64;
            } catch (imgErr) {
                console.warn(`⚠️ Failed to fetch image ${url}: ${imgErr.response?.status} ${imgErr.message}`);
                return null; // Return null instead of broken URL
            }
        }

        const [obverseBase64, reverseBase64] = await Promise.all([
            fetchImageAsBase64(typeData.obverse?.picture),
            fetchImageAsBase64(typeData.reverse?.picture)
        ]);

        // Validate category - only coins and exonumia (medals/tokens) are supported
        const category = typeData.category || 'unknown';
        if (category === 'banknote') {
            console.warn(`❌ N# ${typeId} is a banknote — not supported`);
            return { error: `This item (N# ${typeId}) is a banknote. Only coins, medals, and tokens are supported.`, category };
        }
        if (!['coin', 'exonumia'].includes(category)) {
            console.warn(`❌ N# ${typeId} has unsupported category: ${category}`);
            return { error: `This item (N# ${typeId}) has an unsupported category: "${category}".`, category };
        }

        const features = {
            // General type information from GET /types/{type_id}
            title: typeData.title || "Unknown",
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
            obverseImage: obverseBase64, 
            reverseImage: reverseBase64,
            obverseDescription: typeData.obverse?.description || "",
            reverseDescription: typeData.reverse?.description || "",
            
            // Mapping mintage table from GET /types/{type_id}/issues
            variations: (issuesData || []).map(issue => ({
                // date: issue.year || "N.D.",
                date: formatCoinYear(issue.gregorian_year, issue.year) + (issue.mint_letter ? ` ${issue.mint_letter}` : ""),
                mintage: issue.mintage ? issue.mintage.toLocaleString() : "",
                comment: formatComments(
                    issue.comment || "",
                    issue.year || "",
                    issue.gregorian_year ? String(issue.gregorian_year) : "",
                    typeData.value?.text || ""
                ),
                marks_picture: issue.marks?.[0]?.picture || null,
                marks: issue.marks?.map(mark => ({
                    type: mark.type || "",
                    picture: mark.picture || null
                })) || []
            })),

            description: cleanTitle(typeData.value?.text || "Unknown", typeData.title) || "",
        };

        console.log("Verified features structure generated.");
        return features;

    } catch (err) {
        if (err.response) {
            const status = err.response.status;
            console.error(`Numista API Error: ${status} at ${err.config.url}`);
            if (status === 404) {
                return { error: `Item N# ${typeId} was not found on Numista. Please check the number and try again.`, status: 404 };
            }
            return { error: `Numista API returned an error (${status}). Please try again later.`, status };
        } else {
            console.error("General API Connection Error:", err.message);
            return { error: "Failed to connect to Numista API. Please check your connection and try again." };
        }
    }
}

module.exports.getNumistaDetailsJSON = getNumistaDetailsJSON;