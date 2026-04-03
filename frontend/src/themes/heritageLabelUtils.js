/**
 * Heritage label display utilities.
 * Converts full country names and denomination strings into
 * the compact codes used on ICCS/NGC-style slab labels.
 */

// ---------------------------------------------------------------------------
// Issuer (country) shortening
// ---------------------------------------------------------------------------

const ISSUER_MAP = {
  // Americas
  'canada': 'CAN',
  'united states': 'US',
  'united states of america': 'US',
  'mexico': 'MEX',
  'brazil': 'BRA',
  'argentina': 'ARG',
  'chile': 'CHL',
  'colombia': 'COL',
  'peru': 'PER',
  'venezuela': 'VEN',
  'cuba': 'CUB',
  'jamaica': 'JAM',
  'trinidad and tobago': 'T&T',
  'barbados': 'BRB',
  'bahamas': 'BAH',
  'bahamas, the': 'BAH',
  'bermuda': 'BER',
  'cayman islands': 'CAY',
  'cayman islands, the': 'CAY',
  'belize': 'BLZ',
  'guatemala': 'GTM',
  'honduras': 'HND',
  'el salvador': 'SLV',
  'nicaragua': 'NIC',
  'costa rica': 'CRC',
  'panama': 'PAN',
  'ecuador': 'ECU',
  'bolivia': 'BOL',
  'paraguay': 'PRY',
  'uruguay': 'URY',
  'guyana': 'GUY',
  'suriname': 'SUR',
  'haiti': 'HAI',
  'dominican republic': 'DOM',

  // Europe
  'united kingdom': 'UK',
  'great britain': 'GB',
  'england': 'ENG',
  'scotland': 'SCO',
  'wales': 'WAL',
  'ireland': 'IRL',
  'northern ireland': 'N.IRL',
  'france': 'FR',
  'germany': 'GER',
  'west germany': 'W.GER',
  'east germany': 'E.GER',
  'federal republic of germany': 'GER',
  'austria': 'AUT',
  'switzerland': 'SUI',
  'italy': 'ITA',
  'spain': 'ESP',
  'portugal': 'POR',
  'netherlands': 'NL',
  'belgium': 'BEL',
  'luxembourg': 'LUX',
  'sweden': 'SWE',
  'norway': 'NOR',
  'denmark': 'DEN',
  'finland': 'FIN',
  'iceland': 'ISL',
  'greece': 'GRC',
  'turkey': 'TUR',
  'russia': 'RUS',
  'soviet union': 'USSR',
  'poland': 'POL',
  'czech republic': 'CZE',
  'czechia': 'CZE',
  'czechoslovakia': 'CSK',
  'slovakia': 'SVK',
  'hungary': 'HUN',
  'romania': 'ROM',
  'bulgaria': 'BUL',
  'yugoslavia': 'YUG',
  'serbia': 'SRB',
  'croatia': 'CRO',
  'slovenia': 'SLO',
  'ukraine': 'UKR',
  'estonia': 'EST',
  'latvia': 'LAT',
  'lithuania': 'LIT',
  'albania': 'ALB',
  'monaco': 'MON',
  'san marino': 'SMR',
  'vatican city': 'VAT',
  'holy roman empire': 'HRE',
  'prussia': 'PRU',
  'bavaria': 'BAV',
  'saxony': 'SAX',
  'malta': 'MLT',
  'cyprus': 'CYP',
  'georgia': 'GEO',
  'armenia': 'ARM',
  'azerbaijan': 'AZE',

  // Middle East
  'israel': 'ISR',
  'saudi arabia': 'KSA',
  'iran': 'IRN',
  'iraq': 'IRQ',
  'jordan': 'JOR',
  'kuwait': 'KWT',
  'bahrain': 'BHR',
  'qatar': 'QAT',
  'united arab emirates': 'UAE',
  'oman': 'OMN',
  'yemen': 'YEM',
  'syria': 'SYR',
  'lebanon': 'LBN',

  // Africa
  'egypt': 'EGY',
  'south africa': 'SA',
  'nigeria': 'NGR',
  'ghana': 'GHA',
  'kenya': 'KEN',
  'zimbabwe': 'ZIM',
  'rhodesia': 'RHO',
  'zambia': 'ZMB',
  'ethiopia': 'ETH',
  'morocco': 'MAR',
  'algeria': 'ALG',
  'tunisia': 'TUN',
  'libya': 'LBY',
  'sudan': 'SDN',
  'tanzania': 'TZA',
  'uganda': 'UGA',
  'mozambique': 'MOZ',
  'british west africa': 'BWA',
  'british east africa': 'BEA',

  // Asia / Pacific
  'india': 'IND',
  'british india': 'B.IND',
  'china': 'CHN',
  "people's republic of china": 'PRC',
  'republic of china': 'ROC',
  'japan': 'JPN',
  'south korea': 'KOR',
  'korea': 'KOR',
  'north korea': 'PRK',
  'taiwan': 'TWN',
  'hong kong': 'HKG',
  'singapore': 'SGP',
  'malaysia': 'MAS',
  'indonesia': 'IDN',
  'thailand': 'THA',
  'vietnam': 'VNM',
  'philippines': 'PHI',
  'pakistan': 'PAK',
  'bangladesh': 'BGD',
  'myanmar': 'MMR',
  'burma': 'BUR',
  'nepal': 'NPL',
  'sri lanka': 'SRI',
  'ceylon': 'CEY',
  'afghanistan': 'AFG',
  'cambodia': 'KHM',
  'laos': 'LAO',
  'mongolia': 'MNG',

  // Oceania
  'australia': 'AUS',
  'new zealand': 'NZ',
  'papua new guinea': 'PNG',
  'fiji': 'FIJ',
};

/**
 * Returns a short display code for the given issuer string.
 * Strips parenthetical year ranges (e.g. "Canada (1858-date)") before lookup.
 * Falls back to the original string if no mapping is found.
 */
export function shortenIssuer(issuer) {
  if (!issuer) return issuer;
  const key = issuer
    .toLowerCase()
    .trim()
    .replace(/\s*\([^)]*\)/g, '') // strip "(1858-date)" etc.
    .trim();
  return ISSUER_MAP[key] || issuer;
}

// ---------------------------------------------------------------------------
// Denomination shortening
// ---------------------------------------------------------------------------
// Rules: order is critical — more specific patterns must come before general ones.
// Pre-position symbols ($, €, £, ¥, ₩, ₹) are repositioned after substitution.

const DENOM_REPLACEMENTS = [
  // --- Multi-word / compound — must come first ---
  [/\beuro[\s-]?cents?\b/gi,           '¢'],
  [/\bnew\s+penn(?:ies|y|ce|ces|s)\b/gi, 'p'], // decimalized UK penny
  [/\bdeutsche?\s*marks?\b/gi,          'DM'],

  // --- Major modern currencies ---
  [/\bdollars?\b/gi,                    '$'],
  [/\bpesos?\b/gi,                      '$'],
  [/\bdólares?\b/gi,                    '$'],
  [/\beuros?\b/gi,                      '€'],
  [/\bpounds?\b/gi,                     '£'],
  [/\blibras?\b/gi,                     '£'], // Spanish/Italian pound
  [/\blivres?\b/gi,                     '£'], // French pound

  // --- Minor units: cents ---
  [/\bcents?\b/gi,                      '¢'],
  [/\bcentavos?\b/gi,                   '¢'],
  [/\bcéntimos?\b/gi,                   '¢'],
  [/\bcentimos?\b/gi,                   '¢'],
  [/\bcentésimos?\b/gi,                 '¢'],
  [/\bcentesimos?\b/gi,                 '¢'],
  [/\böre\b/gi,                         '¢'], // Scandinavian minor unit
  [/\børe\b/gi,                         '¢'],
  [/\bore\b/gi,                         '¢'],
  [/\bstotinki?\b/gi,                   '¢'], // Bulgarian
  [/\bgroszy\b/gi,                      'gr'],
  [/\bgrosz\b/gi,                       'gr'],

  // --- Pre-decimal British ---
  [/\bpenn(?:ies|y|ce|ces|s)\b/gi,     'd'], // pre-decimal penny/pence
  [/\bshillings?\b/gi,                  's'],
  [/\bflorins?\b/gi,                    'fl'],
  [/\bcrowns?\b/gi,                     'Cr'],
  [/\bhalfpenn(?:y|ies)\b/gi,          '½d'],
  [/\bfarthings?\b/gi,                  '¼d'],
  [/\bgroat\b/gi,                       '4d'],

  // --- Franc family ---
  [/\bfrancs?\b/gi,                     'Fr'],
  [/\bfranken\b/gi,                     'Fr'],
  [/\bfranchi\b/gi,                     'Fr'], // Italian franc

  // --- German ---
  [/\bpfennigs?\b/gi,                   'Pf'],
  [/\bmarks?\b/gi,                      'M'],
  [/\bgroschen\b/gi,                    'g'],
  [/\bhellers?\b/gi,                    'h'],
  [/\bhalers?\b/gi,                     'h'],
  [/\bhaliers?\b/gi,                    'h'],

  // --- Austro-Hungarian / Central European ---
  [/\bkronens?\b/gi,                    'Kr'],
  [/\bkrones?\b/gi,                     'Kr'],
  [/\bkronas?\b/gi,                     'Kr'],
  [/\bkorunas?\b/gi,                    'Kč'],
  [/\bkoronas?\b/gi,                    'Kr'],
  [/\bforints?\b/gi,                    'Ft'],
  [/\bzłot(?:y|ych)\b/gi,              'zł'],
  [/\bzlot(?:y|ych)\b/gi,              'zł'],

  // --- Lira / Lire ---
  [/\blir[ae]\b/gi,                     'L'],
  [/\bkuruş\b/gi,                       'k'],
  [/\bkurus\b/gi,                       'k'],

  // --- Ruble / Kopek ---
  [/\brubl(?:e|es|ya|i|ey)\b/gi,       '₽'],
  [/\broubles?\b/gi,                    '₽'],
  [/\bkopeks?\b/gi,                     'k'],
  [/\bkopecks?\b/gi,                    'k'],

  // --- Drachma ---
  [/\bdrachm(?:a|ae|ai|as|e|en|os|oi)\b/gi, 'Dr'],

  // --- Guilder / Florin ---
  [/\bguilders?\b/gi,                   'fl'],
  [/\bgulden\b/gi,                      'fl'],

  // --- Thaler ---
  [/\bthaler\b/gi,                      'Tl'],
  [/\btaler\b/gi,                       'Tl'],

  // --- Real / Reis ---
  [/\breals?\b/gi,                      'R'],
  [/\breis\b/gi,                        'R'],

  // --- East Asian ---
  [/\byen\b/gi,                         '¥'],
  [/\byuan\b/gi,                        '¥'],
  [/\bwon\b/gi,                         '₩'],
  [/\bjiao\b/gi,                        '角'],
  [/\bfen\b/gi,                         '分'],

  // --- South / Southeast Asian ---
  [/\brupees?\b/gi,                     '₹'],
  [/\brupias?\b/gi,                     '₹'],
  [/\bpaisas?\b/gi,                     'p'],
  [/\bpaise\b/gi,                       'p'],
  [/\bannas?\b/gi,                      'a'],
  [/\bdong\b/gi,                        '₫'],
  [/\bbaht\b/gi,                        '฿'],
  [/\bsatang\b/gi,                      's'],

  // --- Middle Eastern ---
  [/\bdirhams?\b/gi,                    'Dh'],
  [/\bfilss?\b/gi,                      'f'],
  [/\briyals?\b/gi,                     'Rl'],
  [/\bdinars?\b/gi,                     'D'],
  [/\bqirsh\b/gi,                       'q'],
  [/\bpiastres?\b/gi,                   'P'],

  // --- Israeli ---
  [/\bagorot\b/gi,                      'a'],
  [/\bagoras?\b/gi,                     'a'],

  // --- Misc ---
  [/\bmils?\b/gi,                       'm'],
  [/\bsens?\b/gi,                       's'],  // Japanese sen / sene
];

/**
 * Returns a compact denomination string for Heritage label display.
 * Applies regex substitutions in order, then repositions pre-fix symbols.
 */
export function shortenDenomination(denom) {
  if (!denom) return denom;

  let result = denom;
  for (const [pattern, replacement] of DENOM_REPLACEMENTS) {
    result = result.replace(pattern, replacement);
  }

  // Reposition pre-fix currency symbols that ended up after the number:
  // e.g. "1 $" → "$1",  "5 €" → "€5",  "50 £" → "£50"
  result = result.replace(/([\d\/½¼¾]+)\s*([$€£¥₩₹₺])/g, '$2$1');

  // Tighten post-fix symbols: "50 ¢" → "50¢"
  result = result.replace(/([$€£¥₩₹₺\d])\s+([¢pds])\b/g, '$1$2');

  return result.replace(/\s+/g, ' ').trim();
}
