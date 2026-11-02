// Quest catalog + matching rules for Roman Imperial Quests.
//
// Rules of the road:
//  - Every requirement is individually named with a human-readable
//    explanation of what satisfies it.
//  - A requirement matches a coin when EITHER the OCRE/CRRO id is in the
//    ruler's known id series (authoritative) OR the coin's attribution
//    line ("Ruler: X" / "Issuer: X" / legacy "(X)") names the ruler via
//    a curated alias list (exact, case-insensitive).
//  - When a coin carries both kinds of evidence and they disagree, the
//    coin is flagged "needs review" — never counted automatically.
//  - Within a quest, each coin may satisfy at most one requirement.

// Curated id-series regexes, verified live against OCRE/CRRO on 2026-10-25:
//  - Otho's slug is "ot" (NOT "oth") — ric.1(2).ot.N
//  - Julius Caesar is NOT in OCRE at all (RIC I begins with Augustus); his
//    Imperatorial issue is CRRO territory: RRC 480–484.
//  - "ner" is ambiguous (Nero under ric.1, Nerva under ric.2) — editions
//    pin the assignment.
//  - Villain-proof pattern for ric.2 band: Nerva "ner", Trajan "tr",
//    Hadrian "hdn", Domitian "dom", Titus "tit", Vespasian "ves" are all
//    disjoint slugs regardless of edition suffix (_1 / (2) / _1(2) / _3(2)).
const CATALOG_RULERS = {
  julius_caesar: {
    name: 'Julius Caesar',
    aliases: ['Julius Caesar'],
    ocrePattern: /^rrc-48[0-4]\./, // noble Republic moneyer series (RRC 480–484), not in OCRE
    note: 'Not an OCRE entry — Caesar\'s Imperatorial issues are CRRO (RRC 480–484), or a manually attributed coin.',
  },
  augustus: { name: 'Augustus', aliases: ['Augustus'], ocrePattern: /^ric\.1(\(2\))?\.aug\./ },
  tiberius: { name: 'Tiberius', aliases: ['Tiberius'], ocrePattern: /^ric\.1(\(2\))?\.tib\./ },
  gaius: { name: 'Caligula', aliases: ['Caligula', 'Gaius'], ocrePattern: /^ric\.1(\(2\))?\.gai\./ },
  claudius: { name: 'Claudius', aliases: ['Claudius'], ocrePattern: /^ric\.1(\(2\))?\.clau\./ },
  nero: { name: 'Nero', aliases: ['Nero'], ocrePattern: /^ric\.1(\(2\))?\.ner\./ },
  galba: { name: 'Galba', aliases: ['Galba'], ocrePattern: /^ric\.1(\(2\))?\.gal\./ },
  otho: { name: 'Otho', aliases: ['Otho'], ocrePattern: /^ric\.1(\(2\))?\.ot\./ },
  vitellius: { name: 'Vitellius', aliases: ['Vitellius'], ocrePattern: /^ric\.1(\(2\))?\.vit\./ },
  vespasian: { name: 'Vespasian', aliases: ['Vespasian'], ocrePattern: /^ric\.2(_1)?(\(2\))?\.ves\./ },
  titus: { name: 'Titus', aliases: ['Titus'], ocrePattern: /^ric\.2(_1)?(\(2\))?\.tit\./ },
  domitian: { name: 'Domitian', aliases: ['Domitian'], ocrePattern: /^ric\.2(_1)?(\(2\))?\.dom\./ },
  nerva: { name: 'Nerva', aliases: ['Nerva'], ocrePattern: /^ric\.2[^.]*\.ner\./ },
  trajan: { name: 'Trajan', aliases: ['Trajan', 'Traianus'], ocrePattern: /^ric\.2[^.]*\.tr\./ },
  hadrian: { name: 'Hadrian', aliases: ['Hadrian', 'Hadrianus'], ocrePattern: /^ric\.2[^.]*\.hdn\./ },
  antoninus_pius: { name: 'Antoninus Pius', aliases: ['Antoninus Pius', 'Antoninus'], ocrePattern: /^ric\.3\.ant\./ },
  marcus_aurelius: { name: 'Marcus Aurelius', aliases: ['Marcus Aurelius'], ocrePattern: /^ric\.3\.m_aur\./ },

  // The Imperial Women — one coin per empress. Their issues live INSIDE the
  // issuing emperor's RIC series (Julia Domna under Septimius' ric.4.ss,
  // Faustina Jr and Lucilla inside Marcus' ric.3.m_aur…), so the ocrePattern
  // is only set where the woman has her OWN dedicated series slug — an id in
  // a shared series must never auto-collect a woman's slot. What counts for
  // them instead is the portrait: the coin's card composes
  // "Obv: Bust of <woman>, …" and that bust name is the subject.
  sabina: {
    name: 'Sabina',
    aliases: ['Sabina', 'Vibia Sabina'],
    ocrePattern: /^ric\.2(_3\(2\))?\.sab\./,
    note: "Hadrian's wife — her RIC II Sabina series or a coin that names or portrays her.",
  },
  faustina_senior: {
    name: 'Faustina Senior',
    aliases: ['Faustina Senior', 'Faustina Major', 'Annia Faustina', 'Diva Faustina'],
    ocrePattern: /^ric\.3\.faustina_sen\./,
    note: "Antoninus Pius's wife — her RIC III Faustina Senior series or a coin that names or portrays her.",
  },
  faustina_junior: {
    name: 'Faustina Junior',
    aliases: ['Faustina Junior', 'Faustina Minor', 'Faustina'],
    ocrePattern: /^ric\.3\.faustina_jr\./,
    note: "Marcus Aurelius's wife — a coin that names or portrays her; her own RIC III Faustina Junior series.",
  },
  lucilla: {
    name: 'Lucilla',
    aliases: ['Lucilla'],
    ocrePattern: /^ric\.3\.lucilla\./,
    note: "Lucius Verus's wife — her RIC III Lucilla series or a coin that names or portrays her.",
  },
  crispina: {
    name: 'Crispina',
    aliases: ['Crispina'],
    note: "Commodus's wife — a coin that names or portrays her.",
  },
  julia_domna: {
    name: 'Julia Domna',
    aliases: ['Julia Domna', 'Julia'],
    note: "Septimius Severus's wife — her issues sit inside his and Caracalla's RIC IV series, so a coin that names or portrays her counts.",
  },
  julia_maesa: {
    name: 'Julia Maesa',
    aliases: ['Julia Maesa'],
    note: 'Grandmother of Elagabalus and Severus Alexander — a coin that names or portrays her.',
  },
  julia_soemias: {
    name: 'Julia Soaemias',
    aliases: ['Julia Soaemias'],
    note: "Elagabalus's mother — a coin that names or portrays her.",
  },
  julia_mamaea: {
    name: 'Julia Mamaea',
    aliases: ['Julia Mamaea'],
    note: "Severus Alexander's mother — a coin that names or portrays her.",
  },
  otacilia_severa: {
    name: 'Otacilia Severa',
    aliases: ['Otacilia Severa'],
    ocrePattern: /^ric\.4\.oc_s\./,
    note: "Philip I's wife — her RIC IV Otacilia series or a coin that names or portrays her.",
  },
  salonina: {
    name: 'Salonina',
    aliases: ['Salonina'],
    ocrePattern: /^ric\.5\.sal\./,
    note: "Gallienus's wife — her RIC V Salonina series or a coin that names or portrays her.",
  },
  severina: {
    name: 'Severina',
    aliases: ['Severina'],
    note: "Aurelian's wife — a coin that names or portrays her.",
  },
};

// "Any coin of <ruler>" — denomination/mint don't matter; the app doesn't
// yet model mint or reverse type reliably, so quests deliberately don't
// gate on those.
const anyCoinExplanation = (name, note) => {
  const base = `Any coin of ${name} — any denomination, any mint, any grade.`;
  return note ? `${base} (${note})` : base;
};

const QUESTS = [
  {
    id: 'twelve-caesars',
    title: "Suetonius' Twelve Caesars",
    dates: '44 BC – AD 96',
    badge: '👑',
    badgeName: 'Twelve Caesars',
    blurb: 'One coin for each of the twelve rulers Suetonius chronicled, from Caesar to Domitian.',
    intro: "Twelve rulers, one coin each — any denomination, any mint. Caesar's inclusion makes this a historical set, not a strictly Imperial one: his Imperatorial issues fall outside OCRE and are matched by CRRO reference instead.",
    historicalNote: "Suetonius' De Vita Caesarum covers Julius Caesar and the eleven emperors who followed him. Caesar struck his coins before the Principate existed — only the other eleven were 'Imperial' in the strict sense.",
    allowSharedCoins: false,
    requirements: [
      { ruler: 'julius_caesar' },
      { ruler: 'augustus' },
      { ruler: 'tiberius' },
      { ruler: 'gaius' },
      { ruler: 'claudius' },
      { ruler: 'nero' },
      { ruler: 'galba' },
      { ruler: 'otho' },
      { ruler: 'vitellius' },
      { ruler: 'vespasian' },
      { ruler: 'titus' },
      { ruler: 'domitian' },
    ],
  },
  {
    id: 'year-four-emperors',
    title: 'The Year of Four Emperors',
    dates: 'AD 69',
    badge: '⚔️',
    badgeName: 'Year of Four Emperors',
    blurb: 'The chaos of AD 69 in four reigns: Galba, Otho, Vitellius, Vespasian.',
    intro: 'AD 69: two emperors murdered, one executed, and a coinage issued in four regnal names within thirteen months. All four rulers on one coin each — genuinely hard, because the first three barely had time to strike.',
    historicalNote: "Galba was killed in the Forum in January, Otho died by his own hand in April, Vitellius was dragged from his unfinished palace eight months later — and Vespasian closed the year at the Palatine. The tiny time-windows make every coin scarce except Vespasian's.",
    allowSharedCoins: false,
    requirements: [
      { ruler: 'galba' },
      { ruler: 'otho' },
      { ruler: 'vitellius' },
      { ruler: 'vespasian' },
    ],
  },
  {
    id: 'five-good-emperors',
    title: 'The Five Good Emperors',
    dates: 'AD 96–180',
    badge: '🏛️',
    badgeName: 'Five Good Emperors',
    blurb: 'Nerva, Trajan, Hadrian, Antoninus Pius, Marcus Aurelius — the adoptive golden run.',
    intro: "Five emperors, AD 96–180 — Machiavelli's golden run of adoptive rulers. It ends not with Marcus Aurelius' death but with his break from the system, when he named his natural son Commodus.",
    historicalNote: 'The successions were adoptive every time except the last, when Marcus Aurelius named Commodus. Cassius Dio judged the five by merit rather than blood — Machiavelli named them "the five good emperors" fourteen centuries later.',
    allowSharedCoins: false,
    requirements: [
      { ruler: 'nerva' },
      { ruler: 'trajan' },
      { ruler: 'hadrian' },
      { ruler: 'antoninus_pius' },
      { ruler: 'marcus_aurelius' },
    ],
  },
  {
    id: 'imperial-women',
    title: 'The Imperial Women',
    dates: 'AD 98 – AD 491',
    badge: '💐',
    badgeName: 'The Imperial Women',
    blurb: 'Sabina, Faustina Senior and Junior, Lucilla, Julia Domna, Julia Maesa, Julia Mamaea, Otacilia Severa, Salonina, and Severina — one coin each.',
    intro: 'Every dynasty had its power behind the throne - and often ON the throne: the empresses held their own coinage programs for five centuries. Twelve women, one coin each.',
    historicalNote: "Imperial women's issues are formally their own series inside RIC — Faustina Sr. and Jr. both carry long dedicated sequences; Julia Domna's portrait spans her husband's and sons' reigns. Several were deified and struck consecration issues, often the most available denomination for a collector.",
    allowSharedCoins: false,
    requirements: [
      { ruler: 'sabina' },
      { ruler: 'faustina_senior' },
      { ruler: 'faustina_junior' },
      { ruler: 'lucilla' },
      { ruler: 'crispina' },
      { ruler: 'julia_domna' },
      { ruler: 'julia_maesa' },
      { ruler: 'julia_soemias' },
      { ruler: 'julia_mamaea' },
      { ruler: 'otacilia_severa' },
      { ruler: 'salonina' },
      { ruler: 'severina' },
    ],
  },
];

// Coins only enter the matching universe when they could plausibly be Roman:
// a Roman issuer, an OCRE/CRRO id, or an explicit ruler attribution line.
// This keeps a Canada coin with a stray pasted id from counting as Rome.
const ROMAN_ISSUERS = ['Roman Empire', 'Roman Republic'];

const isRomanCandidate = (coin) =>
  ROMAN_ISSUERS.includes(coin.issuer) || /^(ric\.|rrc-)/.test(coin.ocreId || '');

// Collect every catalog ruler a coin's OCRE/CRRO id could belong to.
const ocreRulersForCoin = (coin) =>
  Object.entries(CATALOG_RULERS)
    .filter(([, r]) => r.ocrePattern?.test(coin.ocreId || ''))
    .map(([id]) => id);

// Exact (case-insensitive) ruler-name match from the attribution lines:
//  "Ruler: Marcus Aurelius" (OCRE compose), "Issuer: <moneyer>" (CRRO
//  compose / legacy), or a leading "(Ruler)" parenthetical on legacy coins.
const extractRulerName = (coin) => {
  const details = String(coin.details || '');
  const lines = [/^Ruler:\s*([^\n]+)/m, /^Issuer:\s*([^\n]+)/m, /^\(([^)\n]+)\)/m];
  for (const re of lines) {
    const m = re.exec(details);
    if (m) {
      const name = m[1].trim().replace(/\s*—.*$/, '');
      if (name) return name;
    }
  }
  return '';
};

const rulerIdForName = (name) => {
  if (!name) return null;
  const n = name.toLowerCase().trim();
  for (const [id, r] of Object.entries(CATALOG_RULERS)) {
    if (r.aliases.some(a => a.toLowerCase() === n)) return id;
  }
  return null;
};

// Person named on the obverse portrait — the "Bust of <name>" description.
// Empress issues are catalogued under their emperor's RIC series, so a Julia
// Domna denarius is carded "Ruler: Septimius Severus / Obv: Bust of Julia
// Domna, …". The bust name is the coin's actual subject; emperors qualify by
// the attribution line, empresses by the portrait (or their name lines).
// Only "Bust of <name>" carries a person — bare bust descriptions ("Draped
// bust right") name nobody; direction words after the name are stripped.
const extractBustName = (coin) => {
  const obv = /^Obv:\s*([^\n]+)/m.exec(String(coin.details || ''))?.[1];
  if (!obv) return '';
  const m = /bust\s+of\s+([^,.]+)/i.exec(obv);
  if (!m) return '';
  return m[1]
    .replace(/\s+(right|left|facing|bareheaded|laureate|diademed|draped|cuirassed|veiled|helmeted)\b.*$/i, '')
    .trim();
};

const portraitRulerForCoin = (coin) => rulerIdForName(extractBustName(coin));

module.exports = {
  QUESTS,
  CATALOG_RULERS,
  isRomanCandidate,
  ocreRulersForCoin,
  extractRulerName,
  extractBustName,
  rulerIdForName,
  portraitRulerForCoin,
  anyCoinExplanation,
};
