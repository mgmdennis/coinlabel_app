/**
 * Parse Numista coin data text and extract relevant fields
 */
export const parseNumistaText = (
    text,
    setNumistaNumber,
    setIssuer,
    setYear,
    setComposition,
    setPhysicalDetails,
    setReference,
    setDenomination
) => {
    // Extract Numista Number (e.g., "Number	N#277174" or "Number	277174")
    const numistaMatch = text.match(/Number\s+(?:N#)?(\d+)/i);
    if (numistaMatch) {
        setNumistaNumber(numistaMatch[1].trim());
    }

    // Extract Issuer (e.g., "Issuer	United Kingdom")
    const issuerMatch = text.match(/Issuer\s+([^\n]+)/i);
    if (issuerMatch) {
        setIssuer(issuerMatch[1].trim());
    }

    // Extract Year if it's a single year, not a range (e.g., "Year	2021" but not "Year	2020-2021")
    const yearMatch = text.match(/Year\s+(\d{4})(?!\s*[-–])/i);
    if (yearMatch) {
        setYear(yearMatch[1]);
    }

    // Extract Diameter (e.g., "Diameter\t27.3 mm")
    const diameterMatch = text.match(/Diameter\s+(\d+(?:\.\d+)?)\s*mm/i);
    if (diameterMatch) {
        // Limit to 4 significant digits (e.g. 25.75, 28.5, 28)
        let diam = diameterMatch[1];
        if (diam.replace('.', '').length > 4) {
            const num = parseFloat(diam);
            const intPart = Math.floor(num).toString();
            const decimals = Math.max(0, 4 - intPart.length);
            diam = parseFloat(num.toFixed(decimals)).toString();
        }
        setPhysicalDetails(prev => {
            const lines = prev.split('\n').filter(line => line.trim() && !line.match(/\d+(?:\.\d+)?\s*mm/));
            lines.push(`⌀ ${diam} mm`);
            return lines.join('\n');
        });
    }

        // Extract Weight/Mass (e.g., "Weight\t8 g" or "Weight\t8g")
    const weightMatch = text.match(/Weight\s+(\d+(?:\.\d+)?)\s*g/i);
    if (weightMatch) {
        setPhysicalDetails(prev => {
            const lines = prev.split('\n').filter(line => line.trim() && !line.includes('g'));
            lines.push(`${weightMatch[1]} g`);
            return lines.join('\n');
        });
    }

    // Extract Composition (e.g., "Composition\tCopper-nickel")
    const compositionMatch = text.match(/Composition\s+([^\n]+)/i);
    if (compositionMatch) {
        setComposition(compositionMatch[1].trim());
    }

    // Extract Orientation arrows only (e.g., "↑↑" from "Orientation\tMedal alignment ↑↑")
    const orientationMatch = text.match(/Orientation\s+([^\n]*[↑↓←→][^\n]*)/i);
    if (orientationMatch) {
        const arrowMatch = orientationMatch[1].match(/[↑↓←→]+/);
        if (arrowMatch) {
            setPhysicalDetails(prev => {
                const lines = prev.split('\n').filter(line => line.trim() && !line.match(/[↑↓←→]/));
                lines.unshift(arrowMatch[0]);
                return lines.join('\n');
            });
        }
    }

    // Extract References (KM# and Y# prioritized)
    const referencesMatch = text.match(/References\s+([^\n]+)/i);
    if (referencesMatch) {
        const refText = referencesMatch[1];
        // Try to extract KM# first, then Y#
        const kmMatch = refText.match(/KM#\s*(\S+)/i);
        const yMatch = refText.match(/Y#\s*(\S+)/i);
        if (kmMatch) {
            setReference(`KM# ${kmMatch[1]}`);
        } else if (yMatch) {
            setReference(`Y# ${yMatch[1]}`);
        } else {
            setReference(refText.trim());
        }
    }

    // Extract Denomination/Value (e.g., "Value	50 Pence" or "Denomination	50 Pence")
    const denominationMatch = text.match(/(?:Value|Denomination)\s+([^\n]+)/i);
    if (denominationMatch) {
        setDenomination(denominationMatch[1].trim());
    }
};
