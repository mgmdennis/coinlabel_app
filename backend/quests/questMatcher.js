// Pure quest-matching logic — no DB, no I/O. Consumed by the quest
// controller (live evaluation over the current collection, so progress
// can never drift from add/edit/delete) and by the test suite.
//
// Roman Imperial Quests through the Open Design engine (conceptEngine.js +
// conceptData.js): ruler quests match the effective issuer claim, OCRE/CRRO
// ranges, or the obverse portrait; theme quests (metal, denomination,
// reverse type, mint, moneyer) match typed fields. The real NumisTag coin
// docs carry their label as the composed `details` string, so the adapter
// derives the engine's typed fields from it:
//   reverseType ← leading word(s) of the "Rev: <type>, …" line
//   mint        ← the "Mint: <name>" line
//   moneyer     ← the "Issuer: <moneyer>" line (CRRO compose)
//   issuer      ← the "Ruler:/Issuer:/(X)" attribution line, else issuer
const { QUEST_CATALOG } = require('./conceptData');
const {
  normalizeName,
  attributionName,
  bustNameOf,
  evaluateAllQuests,
} = require('./conceptEngine');

// Index every roster name (rulers, issuers, aliases) once — the portrait
// doctrine (2026-10-31, Mark): who is ON the coin owns it. When the obverse
// bust names a catalog person, that name supersedes the issuing emperor's
// "Ruler:" line for RULER quests everywhere. A coin depicting Faustina under
// Antoninus counts as Faustina, never Antoninus; a Licinius bust under any
// claim counts as Licinius. Theme quests (metal/denomination/reverse/mint)
// still count — they never depended on the ruler. A bare "Faustina"/"Diva
// Faustina" bust has no owner (the engine surfaces it for review instead).
const ROSTER_NAMES = new Set();
for (const q of QUEST_CATALOG) {
  for (const r of q.requirements) {
    for (const name of [r.ruler, ...(r.issuers ?? []), ...(r.aliases ?? [])]) {
      const key = normalizeName(name);
      if (key) ROSTER_NAMES.add(key);
    }
  }
}
const AMBIGUOUS_FAUSTINA = new Set(['faustina', 'diva faustina', 'faustina?']);
// Names the two Faustina slots accept — a claim into THIS set is an
// explicit confirmation (the popup writes it); a claim into the rest of the
// roster (e.g. the issuing husband) does not resolve the bust ambiguity.
const FAUSTINA_ACCEPTED = new Set();
for (const r of QUEST_CATALOG.find((q) => q.id === 'imperial-women').requirements) {
  if (r.id === 'faustina-elder' || r.id === 'faustina-younger') {
    for (const n of [r.ruler, ...(r.issuers ?? []), ...(r.aliases ?? [])]) {
      const k = normalizeName(n);
      if (k) FAUSTINA_ACCEPTED.add(k);
    }
  }
}

// Coins only enter the matching universe when they could plausibly be Roman:
// a Roman issuer, an OCRE/CRRO id, or Roman-style label lines. This keeps a
// Canada coin with a stray pasted id from counting as Rome.
const ROMAN_ISSUERS = ['Roman Empire', 'Roman Republic'];

const isRomanCandidate = (coin) =>
  ROMAN_ISSUERS.includes(coin.issuer) ||
  /^(ric\.|rrc-)/.test(coin.ocreId || '') ||
  /^(Ruler:|Issuer:)/m.test(String(coin.details || ''));

// Lean coin view for quest cards — same H12 discipline as the list
// endpoints: never touch the fat photo fields.
function questCoinView(coin) {
  return {
    _id: coin._id,
    issuer: coin.issuerEff || coin.issuer,
    denomination: coin.denomination,
    year: coin.year,
    details: coin.details,
    hasObvImage: coin.hasObvImage,
    hasRevImage: coin.hasRevImage,
    obvImageVersion: coin.obvImageVersion,
    revImageVersion: coin.revImageVersion,
  };
}

// Per-requirement explanation lines — the "what counts" text the detail
// rows render. The Imperial Women notes teach the portrait rule (2026-10-31
// roster); everything else uses the catalog's qualifies text verbatim.
const WOMEN_NOTES = {
  plotina: "Trajan's wife — a coin that names or portrays her.",
  sabina: "Hadrian's wife — a coin that names or portrays her.",
  'faustina-elder': "Antoninus Pius's wife — a coin that names or portrays her.",
  'faustina-younger': "Marcus Aurelius's wife — a coin that names or portrays her.",
  'julia-domna': "Septimius Severus's wife — her issues sit inside his and Caracalla's RIC IV series, so a coin that names or portrays her counts.",
  'julia-maesa': 'Grandmother of Elagabalus and Severus Alexander — a coin that names or portrays her.',
  'julia-mamaea': "Severus Alexander's mother — a coin that names or portrays her.",
  lucilla: "Lucius Verus's wife — her issues sit inside Marcus Aurelius's RIC III series and her own.",
  crispina: "Commodus's wife — her issues sit inside his RIC III series.",
  'julia-soemias': "Elagabalus's mother and the power of his reign — a coin that names or portrays her.",
  severina: "Aurelian's wife — her issues run inside his RIC V mint series.",
  'otacilia-severa': "Philip I's wife — a coin that names or portrays her.",
  salonina: "Gallienus's wife — a coin that names or portrays her.",
  helena: "Constantine's mother — a coin that names or portrays her.",
  'galla-placidia': 'Regent of the West — a coin that names or portrays her.',
  'aelia-verina': "Leo I's wife, empress in the East and West — a coin that names or portrays her.",
};

function explanationFor(quest, requirement) {
  if (quest.id === 'imperial-women') {
    const note = WOMEN_NOTES[requirement.id];
    if (note) return `${requirement.qualifies} (${note})`;
  }
  return requirement.qualifies;
}

// matchQuests(array of lean/aggregated coin docs) → NumisTag quest snapshots.
function matchQuests(coins) {
  const roman = coins.filter(isRomanCandidate).map((coin) => {
    const details = String(coin.details || '');
    // Identity resolution — portrait wins over issuing authority, with one
    // carve-out: an explicit user confirmation (the popup's Confirm-as)
    // writes a roster-named claim onto the coin, and that decision outranks
    // the ambiguous portrait it disambiguates.
    const claim = attributionName(coin) || coin.issuer;
    const claimKey = normalizeName(claim);
    const bust = bustNameOf(coin);
    const bustKey = normalizeName(bust);
    let issuerEff;
    if (bustKey && AMBIGUOUS_FAUSTINA.has(bustKey)) {
      if (claimKey && FAUSTINA_ACCEPTED.has(claimKey)) {
        // The user told us which Faustina this is — trust the claim.
        issuerEff = claim;
      } else {
        // Depicts a Faustina but cannot tell which — the engine surfaces it
        // for review on both Faustina slots; this identity matches nothing.
        issuerEff = 'Faustina ambiguous';
      }
    } else if (bustKey && ROSTER_NAMES.has(bustKey)) {
      issuerEff = bust;
    } else {
      issuerEff = claim;
    }
    // Paint the resolution onto the coin: when a bare-Faustina bust was
    // resolved by an explicit claim (the popup's Confirm-as), the engine
    // must see the resolved name as the bust — otherwise the raw "Bust of
    // Faustina" would re-ambiguate the confirmed coin forever.
    if (bustKey && AMBIGUOUS_FAUSTINA.has(bustKey) && issuerEff === claim) {
      coin = { ...coin, bustOverride: claim };
    }
    // The portrait owns the id as well: an OCRE id inside the issuing
    // emperor's range must not fill his slots for a coin whose bust names
    // someone else (Faustina Senior under Antoninus stays a Faustina coin) —
    // unless the user confirmed an identity the id belongs to.
    let ocreEff = coin.ocreId || '';
    // Id owners: the roster slots whose prefixes match the id — if the
    // resolved identity is not among them (Lucius Verus claim inside
    // ric.3.m_aur), the id must not credit the other person.
    const idOwners = [];
    for (const q of QUEST_CATALOG) {
      for (const rq of q.requirements) {
        const prefixes = rq.ocrePrefixes ?? [];
        if (prefixes.some((p) => ocreEff.toLowerCase().startsWith(p.toLowerCase()))) {
          idOwners.push(rq.ruler);
        }
      }
    }
    // Only a DEFINITE resolved identity neutralizes the id — a vague issuer
    // ("Roman Empire", "Uncertain?") has no conflict, and per the catalog's
    // rules of the road the OCRE id is authoritative. An unresolved bare
    // Faustina also blocks (a Faustina bust under Antoninus must not credit
    // Antoninus until the empress is confirmed).
    const resolvedKey = normalizeName(issuerEff);
    const definite =
      ROSTER_NAMES.has(resolvedKey) || resolvedKey === 'faustina ambiguous';
    if (
      definite &&
      idOwners.length > 0 &&
      !idOwners.some((owner) => normalizeName(owner) === resolvedKey)
    ) ocreEff = '';
    // Engine's typed fields, derived from the composed label:
    const revLine = /^Rev:\s*([^\n]+)/m.exec(details)?.[1] ?? '';
    const revType = revLine.split(/[,.;:—-]/)[0]?.trim() ?? '';
    const mintLine = /^Mint:\s*([^\n]+)/mi.exec(details)?.[1]?.trim() ?? '';
    const moneyerLine = /^Issuer:\s*([^\n]+)/m.exec(details)?.[1]?.trim() ?? '';
    return {
      ...coin,
      id: String(coin._id),
      issuer: issuerEff || coin.issuer,
      ocreId: ocreEff,
      reverseType: revType,
      mint: mintLine,
      moneyer: moneyerLine,
    };
  });

  const snapshot = evaluateAllQuests(QUEST_CATALOG, roman);

  return snapshot.results.map(({ quest, ...result }) => ({
    id: quest.id,
    title: quest.title,
    dates: quest.dates ?? '',
    family: quest.family ?? '',
    unit: quest.unit ?? 'requirements',
    unitSingular: quest.unitSingular ?? 'requirement',
    badge: quest.badge,
    blurb: quest.summary ?? '',
    intro: quest.intro ?? quest.summary ?? '',
    historicalNote: quest.historicalNote ?? '',
    sections: quest.sections ?? null,
    progress: { collected: result.collected, total: result.total, complete: result.complete },
    requirements: result.requirements.map((req) => {
      const out = {
        id: req.id,
        name: req.ruler,
        reign: req.reign ?? '',
        explanation: explanationFor(quest, req),
        // Status vocabulary stays NumisTag-side: the engine calls open slots
        // 'missing'; the UI filter pills say "Still needed".
        status: req.status === 'missing' ? 'needed' : req.status,
        section: req.section ?? null,
        position: req.position,
        kind: req.kind ?? 'issuer',
        alternates: req.alternates ?? 0,
        picked: !!req.picked,
        candidates: req.candidates ?? [],
        matchType: req.matchType ?? null,
        coin: null,
        matchReason: null,
      };
      if (out.status === 'collected' && req.coin) {
        out.coin = questCoinView(req.coin);
        out.matchReason = req.reason;
      } else if (out.status === 'review' && (req.possibleMatches ?? []).length > 0) {
        const first = req.possibleMatches[0];
        out.coin = questCoinView(first.coin);
        out.matchReason = first.reason;
      }
      return out;
    }),
    reviews: [],
  }));
}

module.exports = { matchQuests };
