// CommonJS port of the Open Design quest-engine rewrite (2026-10-31) — the
// single matcher for every quest kind. Plus one extension kept from our
// earlier integration: empress coins are matched through the obverse
// portrait ("Obv: Bust of Julia Domna…") because their cards carry their
// emperor's "Ruler:" line — Mark-approved doctrine (2026-10-25).
const normalizeName = (value) =>
  String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

const isUncertain = (coin) =>
  coin.issuerConfidence === 'uncertain' ||
  /[?]/.test(String(coin.issuer ?? '')) ||
  /\b(uncertain|unattributed|possibly)\b/i.test(String(coin.issuer ?? ''));

const chooseMatch = (exact, possible, usedCoinIds) => {
  if (exact.length > 0) {
    exact.sort((a, b) => coinPreference(b.coin) - coinPreference(a.coin));
    const chosen = exact[0];
    usedCoinIds.add(chosen.coin.id);
    return {
      status: 'collected',
      coin: chosen.coin,
      reason: chosen.reason,
      matchType: chosen.matchType,
      alternates: exact.length - 1,
      possibleMatches: [],
    };
  }

  if (possible.length > 0) {
    return {
      status: 'review',
      coin: null,
      reason: `${possible.length === 1 ? 'A possible match is' : `${possible.length} possible matches are`} waiting for attribution review.`,
      matchType: null,
      alternates: 0,
      possibleMatches: possible,
    };
  }

  return {
    status: 'missing',
    coin: null,
    reason: '',
    matchType: null,
    alternates: 0,
    possibleMatches: [],
  };
};

// Attribution line — "Ruler: X" (OCRE compose), "Issuer: X" (CRRO/legacy),
// or a leading "(X)" parenthetical on old manual coins. The effective issuer
// claim of the card.
const attributionName = (coin) => {
  const details = String(coin.details || '');
  const fromLine =
    /^Ruler:\s*([^\n]+)/m.exec(details)?.[1] ||
    /^Issuer:\s*([^\n]+)/m.exec(details)?.[1] ||
    /^\(([^)\n]+)\)/m.exec(details)?.[1];
  if (fromLine) {
    const name = String(fromLine).trim().replace(/\s*—.*$/, '');
    if (name) return name;
  }
  return '';
};

// Subject named on the obverse portrait — "Obv: Bust of Julia Domna, …".
// Only "Bust of <name>" carries a person; bare bust descriptions ("Draped
// bust right") name nobody; direction words after the name are stripped.
// The adapter may pass `coin.bustOverride` after resolving identity (the
// popup's Confirm-as writes an explicit claim the raw bust contradicts —
// the override wins so a confirmation can never bounce back to review).
const bustNameOf = (coin) => {
  if (typeof (coin && coin.bustOverride) === 'string') return coin.bustOverride;
  const obv = /^Obv:\s*([^\n]+)/m.exec(String(coin.details || ''))?.[1];
  if (!obv) return '';
  const m = /(?:bust|head)\s+of\s+([^,.]+)/i.exec(obv);
  if (!m) return '';
  return m[1]
    .replace(/\s+(right|left|facing|bareheaded|laureate|diademed|draped|cuirassed|veiled|helmeted)\b.*$/i, '')
    .trim();
};

// Bare "Faustina"/"Diva Faustina" is deliberately ambiguous: both Faustinas
// are struck with unqualified labels, so the coin goes to review instead of
// silently filling a slot (2026-10-31, per Mark's Faustina finding).
const isAmbiguousFaustina = (name) =>
  ['faustina', 'diva faustina', 'faustina?'].includes(normalizeName(name));

const issuerMatchKind = (requirement, coin) => {
  const accept = [requirement.ruler, ...(requirement.issuers ?? []), ...(requirement.aliases ?? [])];
  const bust = normalizeName(bustNameOf(coin));
  const claim = attributionName(coin) || coin.issuer;
  // The bare-Faustina ambiguity matters ONLY on the two Faustina slots —
  // otherwise the coin would park for review in every quest whose roster
  // includes Antoninus Pius (she always strikes under her husband).
  const isFaustinaSlot = requirement.id === 'faustina-elder' || requirement.id === 'faustina-younger';
  if (isFaustinaSlot && (isAmbiguousFaustina(bust) || isAmbiguousFaustina(claim))) return 'faustina-ambiguous';
  if (bust && accept.some((name) => normalizeName(name) === bust)) return 'bust';
  const key = normalizeName(coin.issuer);
  if (!key) return null;
  if (normalizeName(requirement.ruler) === key) return 'ruler';
  if ((requirement.issuers ?? []).some((name) => normalizeName(name) === key)) return 'issuer';
  if ((requirement.aliases ?? []).some((name) => normalizeName(name) === key)) return 'alias';
  return null;
};

const ocreMatches = (requirement, coin) => {
  const id = String(coin.ocreId ?? '').trim().toLowerCase();
  if (!id) return false;
  return (requirement.ocrePrefixes ?? []).some((prefix) =>
    id.startsWith(prefix.toLowerCase()),
  );
};

const coinPreference = (coin) =>
  (String(coin.ocreId ?? '').trim() ? 2 : 0) + (isUncertain(coin) ? 0 : 1);

const metalOf = (coin) => {
  const declared = normalizeName(coin.metal ?? coin.composition);
  if (declared.includes('gold')) return 'gold';
  if (declared.includes('silver')) return 'silver';
  if (declared.includes('bronze')) return 'bronze';
  if (declared.includes('copper')) return 'bronze';
  if (declared.includes('orichalcum')) return 'bronze';

  const denomination = normalizeName(coin.denomination);
  if (/\b(aureus|solidus|gold|av)\b/.test(denomination)) return 'gold';
  if (/\b(denarius|antoninianus|quinarius|siliqua|miliarensis|argenteus|silver|ar)\b/.test(denomination)) return 'silver';
  if (/\b(sestertius|dupondius|as|quadrans|follis|nummus|bronze|aes)\b/.test(denomination)) return 'bronze';
  if (/\bae[0-9]*\b/.test(denomination)) return 'bronze';
  return '';
};

const denominationKey = (value) =>
  normalizeName(value)
    .replace(/\b(ar|av|ae|aes|billon|bronze|silver|gold)\b/g, ' ')
    .replace(/\b(denarii)\b/g, 'denarius')
    .replace(/\s+/g, ' ')
    .trim();

const phraseMatches = (text, value) => {
  const haystack = normalizeName(text);
  const needle = normalizeName(value);
  if (!haystack || !needle) return false;
  return new RegExp(`(^| )${needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}( |$)`).test(haystack);
};

const typedMatch = (requirement, coin) => {
  const kind = requirement.kind;
  const values = requirement.values ?? [];

  if (kind === 'metal') {
    const metal = metalOf(coin);
    if (metal && values.includes(metal)) {
      return {
        reason: `Denomination "${coin.denomination}" identifies a ${metal} coin.`,
        matchType: 'metal',
      };
    }
    return null;
  }

  if (kind === 'denomination') {
    const key = denominationKey(coin.denomination);
    if (key && values.some((value) => denominationKey(value) === key)) {
      return {
        reason: `Denomination "${coin.denomination}" matches the ${requirement.ruler} slot.`,
        matchType: 'denomination',
      };
    }
    return null;
  }

  if (kind === 'reverseType') {
    const text = `${coin.reverseType ?? ''} ${coin.note ?? ''}`;
    const value = values.find((item) => phraseMatches(text, item));
    if (value) {
      return {
        reason: `Reverse type "${coin.reverseType || coin.note}" names ${requirement.ruler}.`,
        matchType: 'reverseType',
        needsCertainty: true,
      };
    }
    return null;
  }

  if (kind === 'mint') {
    const text = `${coin.mint ?? ''} ${coin.mintMark ?? ''}`;
    const value = values.find((item) => phraseMatches(text, item));
    if (value) {
      return {
        reason: `Mint "${coin.mint || coin.mintMark}" matches ${requirement.ruler}.`,
        matchType: 'mint',
        needsCertainty: true,
      };
    }
    return null;
  }

  if (kind === 'moneyer') {
    const text = `${coin.moneyer ?? ''} ${coin.issuer ?? ''}`;
    const value = values.find((item) => phraseMatches(text, item));
    if (value) {
      return {
        reason: `Moneyer "${coin.moneyer || coin.issuer}" matches ${requirement.ruler}.`,
        matchType: 'moneyer',
        needsCertainty: true,
      };
    }
    return null;
  }

  return null;
};

const matchRequirement = (requirement, collection, usedCoinIds) => {
  if (requirement.kind && requirement.kind !== 'issuer') {
    const exact = [];
    const possible = [];

    for (const coin of collection) {
      if (usedCoinIds.has(coin.id)) continue;
      const hit = typedMatch(requirement, coin);
      if (!hit) continue;

      if (hit.needsCertainty && isUncertain(coin)) {
        possible.push({
          coin,
          matchType: hit.matchType,
          reason: `${hit.reason} The attribution is marked uncertain.`,
        });
      } else {
        exact.push({ coin, matchType: hit.matchType, reason: hit.reason });
      }
    }

    return chooseMatch(exact, possible, usedCoinIds);
  }

  const exact = [];
  const possible = [];

  for (const coin of collection) {
    if (usedCoinIds.has(coin.id)) continue;

    const issuerKind = issuerMatchKind(requirement, coin);
    const ocreHit = ocreMatches(requirement, coin);
    if (!issuerKind && !ocreHit) continue;

    // A bare "Faustina" claim can belong to either empress — never count it;
    // surface it for a manual attribution on every Faustina slot it touches.
    if (issuerKind === 'faustina-ambiguous') {
      possible.push({
        coin,
        matchType: 'ambiguous',
        reason: 'The label reads bare "Faustina" — the two empresses cannot be told apart from the bust name alone. Confirm this coin to attribute it.',
      });
      continue;
    }

    const uncertain = isUncertain(coin);

    if (ocreHit) {
      exact.push({
        coin,
        matchType: 'ocre',
        reason: `OCRE ID ${coin.ocreId} falls inside the catalog range accepted for ${requirement.ruler}.${issuerKind ? ' The recorded issuer also agrees.' : ''}`,
      });
    } else if (uncertain) {
      possible.push({
        coin,
        matchType: issuerKind,
        reason: issuerKind === 'alias' || issuerKind === 'bust'
          ? `"${bustNameOf(coin) || coin.issuer}" is a known name for ${requirement.ruler}, but the attribution is marked uncertain.`
          : `Issuer "${coin.issuer}" matches ${requirement.ruler}, but the attribution is marked uncertain.`,
      });
    } else {
      exact.push({
        coin,
        matchType: issuerKind,
        reason: issuerKind === 'alias'
          ? `Issuer "${coin.issuer}" is a known alias for ${requirement.ruler}.`
          : issuerKind === 'bust'
            ? `The obverse portrait ("Bust of ${bustNameOf(coin)}") depicts ${requirement.ruler}.`
            : `Issuer "${coin.issuer}" matches ${requirement.ruler}.`,
      });
    }
  }

  return chooseMatch(exact, possible, usedCoinIds);
};

function evaluateQuest(quest, collection) {
  const usedCoinIds = new Set();
  const requirements = quest.requirements.map((requirement, index) => ({
    ...requirement,
    position: index + 1,
    ...matchRequirement(requirement, collection, usedCoinIds),
  }));

  const collected = requirements.filter((requirement) => requirement.status === 'collected').length;
  const review = requirements.filter((requirement) => requirement.status === 'review').length;
  const missing = requirements.filter((requirement) => requirement.status === 'missing').length;
  const total = requirements.length;
  const complete = total > 0 && collected === total;
  const next =
    requirements.find((requirement) => requirement.status === 'review') ??
    requirements.find((requirement) => requirement.status === 'missing') ??
    null;

  return {
    requirements,
    collected,
    review,
    missing,
    total,
    percent: total ? Math.round((collected / total) * 100) : 0,
    complete,
    badgeEarned: complete,
    next,
  };
}

function evaluateAllQuests(quests, collection) {
  const results = quests.map((quest) => ({ quest, ...evaluateQuest(quest, collection) }));
  const requirementsMet = results.reduce((sum, result) => sum + result.collected, 0);
  const requirementsTotal = results.reduce((sum, result) => sum + result.total, 0);
  const questsComplete = results.filter((result) => result.complete).length;

  return {
    results,
    summary: {
      requirementsMet,
      requirementsTotal,
      percent: requirementsTotal ? Math.round((requirementsMet / requirementsTotal) * 100) : 0,
      questsComplete,
      questsTotal: results.length,
      badgesEarned: questsComplete,
      coins: collection.length,
    },
  };
}

module.exports = {
  normalizeName,
  isUncertain,
  attributionName,
  bustNameOf,
  evaluateQuest,
  evaluateAllQuests,
};
