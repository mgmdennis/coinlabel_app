// One-time (refreshable) sweep of WildWinds' Roman Imperial RIC pages into
// the `concordances` collection, so the app can turn a RIC number into
// RSC/BMC cross-references with a local millisecond query — no runtime
// dependency on wildwinds.com.
//
// Usage:
//   node scripts/sweepWildwindsConcordance.js                          # dry run, all emperors
//   node scripts/sweepWildwindsConcordance.js --apply                  # upsert everything
//   node scripts/sweepWildwindsConcordance.js --apply --emperors=augustus,hadrian
//   node scripts/sweepWildwindsConcordance.js --apply --force          # re-sweep already-swept emperors
//
// Reads MONGODB_URI from the environment (repo .env is loaded as fallback;
// an explicit env var wins). Honors robots.txt Crawl-delay (30s) between
// page fetches. Idempotent: emperors already present in the collection are
// skipped unless --force; a swept emperor is replaced wholesale.

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const axios = require('axios');
const cheerio = require('cheerio');
const { MongoClient } = require('mongodb');

const INDEX_URL = 'http://www.wildwinds.com/coins/ric/i.html';
const PAGE_URL = (emperor) => `http://www.wildwinds.com/coins/ric/${emperor}/i.html`;
const CRAWL_DELAY_MS = 30 * 1000; // per robots.txt
const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36';

// Qualifier suffixes that describe the coin, not the catalogue number.
const QUALIFIER_SUFFIXES = /^(?:VAR|CF|V|NOTE)$/i;

/**
 * Normalize a RIC number token ("007a", "63a", "136cf", "47a var") to a
 * stable key ("7A", "63A", "136", "47A"). Returns null for ranges ("96-101")
 * and other unparsable headings.
 */
function normalizeRicNumber(raw) {
    const m = /^(\d+)\s*([A-Za-z]*)/.exec(String(raw).trim());
    if (!m) return null;
    const digits = String(parseInt(m[1], 10));
    let suffix = (m[2] || '');
    // Heading cells glue <br> words onto the number ("63aDenarius") —
    // cut the suffix at the first lowercase->uppercase boundary.
    suffix = suffix.replace(/^([a-z]+)[A-Z].*$/, '$1').toUpperCase();
    if (QUALIFIER_SUFFIXES.test(suffix)) suffix = '';
    if (!/^[A-D]*$/.test(suffix)) suffix = '';
    if (!digits || digits === '0') return null;
    return digits + suffix;
}

/**
 * Extract RSC/Cohen and BMC/BMCRE cross-reference numbers from an entry's
 * description text. BMCRR (Roman Republic) is deliberately excluded, as are
 * Sear/Calico/Paris/etc. Ranges ("534-40") and series letters ("M766",
 * "W163-5") are kept as-is.
 */
const REF_PATTERNS = [
    // \s* (not \s+) because some entries write "BMC550" with no space.
    // BMCRR (Roman Republic) still can't match: "RR" fails the number pattern.
    { key: 'rsc', re: /\b(?:RSC|Cohen)\s*([A-Za-z]?\d+(?:[A-Za-z]+)?(?:-[A-Za-z]?\d+(?:[A-Za-z]+)?)?)/g },
    { key: 'bmc', re: /\bBMC(?:RE)?\s*([A-Za-z]?\d+(?:[A-Za-z]+)?(?:-[A-Za-z]?\d+(?:[A-Za-z]+)?)?)/g },
    // Sear is a fallback reference when BMC is missing. Edition-tagged
    // citations ("Sear'88 #484" — 1988 edition, different numbering) don't
    // match: the apostrophe fails \s*[#,]?\s* before the digits.
    { key: 'sear', re: /\bSear\s*[#,]?\s*(\d+[a-z]?)/g },
];

function extractRefs(text) {
    const out = { rsc: [], bmc: [], sear: [] };
    for (const { key, re } of REF_PATTERNS) {
        const seen = new Set();
        re.lastIndex = 0;
        let m;
        while ((m = re.exec(text)) !== null) {
            const token = m[1].replace(/[.,;:]+$/, '');
            if (token && !seen.has(token)) {
                seen.add(token);
                out[key].push(token);
            }
        }
    }
    return out;
}

/**
 * Parse one emperor page's HTML into concordance rows.
 * Entries are <tr> rows: first cell = heading ("RIC 7a"), second cell =
 * description ("... BMC 281, RSC 405.").
 */
function parseEmperorPage(html, emperor, sourceUrl) {
    const $ = cheerio.load(html);
    const rows = [];
    let rowIndex = 0;
    $('tr').each((_, tr) => {
        const cells = $(tr).find('td');
        if (cells.length < 2) return;
        const heading = $(cells[0]).text().replace(/\s+/g, ' ').trim();
        const description = $(cells[1]).text().replace(/\s+/g, ' ').trim();
        if (!/^RIC\b/i.test(heading)) return; // "INFO TO ...", BMCRE/Cohen-headed rows, etc.

        // Optional leading roman volume in headings like "RIC III 217".
        // (?![\d\[]) skips cross-listings like "RIC 63[tib]" (another volume's
        // number) and stops the regex from backtracking a partial number.
        const hm = /^RIC\s+(?:([IVX]+)\s+)?([0-9]+[A-Za-z]*(?:-[0-9]+[A-Za-z]*)?)(?![\d[])/i.exec(heading);
        if (!hm) return;
        if (hm[2].includes('-')) return; // range headings ("RIC 96-101") aren't coin numbers
        const number = normalizeRicNumber(hm[2]);
        if (!number) return;

        // Headings often cross-list the Sear number ("RIC 1a  Sear 1642"),
        // so extract from heading + description combined.
        const refs = extractRefs(`${heading} ${description}`);
        if (refs.rsc.length === 0 && refs.bmc.length === 0 && refs.sear.length === 0) {
            return; // nothing to offer lookups
        }

        rows.push({
            emperor,
            number,
            volume: (hm[1] || '').toUpperCase(),
            rowIndex: rowIndex++,
            rsc: refs.rsc,
            bmc: refs.bmc,
            sear: refs.sear,
            heading,
            sourceUrl,
            fetchedAt: new Date(),
        });
    });
    return rows;
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchPage(url) {
    const res = await axios.get(url, {
        timeout: 30000,
        headers: { 'User-Agent': USER_AGENT },
        responseType: 'text',
        // WildWinds serves latin-1-ish HTML; keep axios from mangling bytes.
        transformResponse: [(data) => data],
    });
    return res.data;
}

async function main() {
    const apply = process.argv.includes('--apply');
    const force = process.argv.includes('--force');
    const emperorsArg = (process.argv.find((a) => a.startsWith('--emperors=')) || '').split('=').pop();
    const wanted = emperorsArg ? emperorsArg.split(',').map((s) => s.trim()).filter(Boolean) : null;

    const uri = process.env.MONGODB_URI;
    if (!uri) {
        console.error('MONGODB_URI is not set');
        process.exit(1);
    }

    console.log(`Fetching emperor index: ${INDEX_URL}`);
    const indexHtml = await fetchPage(INDEX_URL);
    const $ = cheerio.load(indexHtml);
    const allEmperors = [];
    $('a[href]').each((_, a) => {
        const m = /^([a-z_0-9]+)\/i\.html$/i.exec($(a).attr('href') || '');
        if (m) allEmperors.push(m[1].toLowerCase());
    });
    const emperors = wanted
        ? wanted.filter((e) => allEmperors.includes(e.toLowerCase()))
        : allEmperors;
    const skippedArg = wanted ? wanted.filter((e) => !allEmperors.includes(e.toLowerCase())) : [];
    if (skippedArg.length) console.log(`(not in index, ignored: ${skippedArg.join(', ')})`);

    const client = new MongoClient(uri);
    await client.connect();
    const concordances = client.db().collection('concordances');

    const swept = new Set(
        (await concordances.distinct('emperor', {})).map((e) => e.toLowerCase())
    );

    console.log(`Index lists ${allEmperors.length} emperor pages; ${emperors.length} to process. ` +
        `Mode: ${apply ? 'APPLY (writes)' : 'DRY RUN'}\n`);

    let totalRows = 0, totalPages = 0, first = true;
    for (const emperor of emperors) {
        if (!force && swept.has(emperor)) {
            console.log(`· ${emperor}: already swept (use --force to refresh) — skipped`);
            continue;
        }
        if (!first) {
            console.log(`  (robots.txt crawl-delay: sleeping ${CRAWL_DELAY_MS / 1000}s)`);
            await sleep(CRAWL_DELAY_MS);
        }
        first = false;

        const url = PAGE_URL(emperor);
        let rows;
        try {
            const html = await fetchPage(url);
            rows = parseEmperorPage(html, emperor, url);
        } catch (err) {
            console.log(`✖ ${emperor}: fetch/parse failed — ${err.message}`);
            continue;
        }
        totalPages++;
        totalRows += rows.length;
        const withBoth = rows.filter((r) => r.rsc.length && r.bmc.length).length;
        console.log(`✔ ${emperor}: ${rows.length} entries with RSC/BMC refs (${withBoth} have both)`);

        if (apply && rows.length) {
            await concordances.deleteMany({ emperor });
            await concordances.insertMany(rows, { ordered: false });
        } else if (apply) {
            await concordances.deleteMany({ emperor });
        }
    }

    console.log(`\nDone. ${totalPages} page(s) processed, ${totalRows} concordance rows ` +
        `${apply ? 'written' : 'would be written'}.`);
    if (!apply && totalRows > 0) console.log('Re-run with --apply to write these changes.');
    await client.close();
}

if (require.main === module) {
    main().catch(err => { console.error(err); process.exit(1); });
}

module.exports = { parseEmperorPage, extractRefs, normalizeRicNumber };
