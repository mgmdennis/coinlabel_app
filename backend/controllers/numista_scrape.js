const axios = require('axios');

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
            orientation: typeData.orientation || "Unknown",
            
            // FIXED: references.catalogue is an object containing 'code' (e.g., KM)
            references: typeData.references 
                ? typeData.references.map(ref => `${ref.catalogue.code} ${ref.number}`) 
                : [],
            
            numistaRef: typeData.id,
            
            // Mapping mintage table from GET /types/{type_id}/issues
            variations: (issuesData || []).map(issue => ({
                date: issue.year || "N.D.",
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