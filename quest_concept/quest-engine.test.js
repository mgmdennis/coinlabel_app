import test from 'node:test';
import assert from 'node:assert/strict';

import {
  QUEST_CATALOG,
  SEED_COLLECTION,
  evaluateAllQuests,
  evaluateQuest,
  findQuest,
  normalizeName,
} from './quest-engine.js';

const freshCollection = () => structuredClone(SEED_COLLECTION);
const questById = (id) => findQuest(id);

const resultFor = (snapshot, id) =>
  snapshot.results.find((result) => result.quest.id === id);

test('the catalog exposes the three MVP quests and the extended set', () => {
  const ids = QUEST_CATALOG.map((quest) => quest.id);
  // The MVP trio from the original plan leads the catalog; dynasty and era
  // quests follow. Counts assert each quest's ruler list individually.
  assert.deepEqual(
    ids.slice(0, 3),
    ['five-good', 'twelve-caesars', 'year-of-four'],
  );
  const expectedCounts = {
    'five-good': 5,
    'twelve-caesars': 12,
    'year-of-four': 4,
    'julio-claudians': 6,
    'flavians': 3,
    'severans': 5,
    'soldier-emperors': 5,
    'constantinians': 4,
    'every-emperor': 79,
    'four-metals': 3,
    'the-denominations': 14,
    'moneyers': 4,
    'the-deities': 12,
    'mints-of-the-empire': 9,
    'imperial-women': 12,
  };
  assert.deepEqual(QUEST_CATALOG.map((quest) => quest.id), Object.keys(expectedCounts));
  for (const quest of QUEST_CATALOG) {
    assert.equal(quest.requirements.length, expectedCounts[quest.id], `${quest.id} requirement count`);
  }
});

test('seed progress is computed from the collection', () => {
  // NOTE: the numbers below differ from the first draft (14 met, 12-caesars 7)
  // because the two assertions were mutually exclusive: completing
  // year-of-four requires Otho and Vitellius coins, and under the engine's own
  // cross-quest rule (test below) those same coins count in twelve-caesars —
  // so 9 of 12 with Nero/Domitian missing is the consistent story.
  const snapshot = evaluateAllQuests(QUEST_CATALOG, freshCollection());
  assert.equal(snapshot.summary.requirementsMet, 41);
  assert.equal(snapshot.summary.requirementsTotal, 177);
  assert.equal(snapshot.summary.questsComplete, 1);
  assert.equal(snapshot.summary.coins, 16);

  const fiveGood = resultFor(snapshot, 'five-good');
  assert.equal(fiveGood.collected, 3);
  assert.equal(fiveGood.review, 1);
  assert.equal(fiveGood.missing, 1);
  assert.equal(fiveGood.percent, 60);
  assert.equal(fiveGood.next.ruler, 'Antoninus Pius');
  assert.equal(fiveGood.next.status, 'review');

  const twelve = resultFor(snapshot, 'twelve-caesars');
  assert.equal(twelve.collected, 9);
  assert.equal(twelve.review, 1);
  assert.equal(twelve.missing, 2);
  assert.equal(twelve.next.ruler, 'Nero');

  const four = resultFor(snapshot, 'year-of-four');
  assert.equal(four.collected, 4);
  assert.equal(four.complete, true);
  assert.equal(four.badgeEarned, true);
});

test('exact issuer matching avoids the Trajan Decius false positive', () => {
  const snapshot = evaluateAllQuests(QUEST_CATALOG, freshCollection());
  const fiveGood = resultFor(snapshot, 'five-good');
  const trajan = fiveGood.requirements.find((requirement) => requirement.id === 'trajan');

  assert.equal(trajan.status, 'collected');
  assert.equal(trajan.coin.id, 'c-trajan');
  assert.equal(
    fiveGood.requirements.some((requirement) => requirement.coin?.id === 'c-trajan-decius'),
    false,
  );
});

test('a curated alias satisfies a requirement', () => {
  const collection = [
    {
      id: 'alias-coin',
      issuer: 'Octavian',
      issuerConfidence: 'certain',
      denomination: 'AR Denarius',
      year: '30 BC',
      reference: 'RIC I 251',
      ocreId: '',
      grade: 'VF',
      acquired: '2025-02-01',
      note: '',
    },
  ];
  const result = evaluateQuest(questById('twelve-caesars'), collection);
  const augustus = result.requirements.find((requirement) => requirement.id === 'augustus');

  assert.equal(augustus.status, 'collected');
  assert.equal(augustus.matchType, 'alias');
  assert.match(augustus.reason, /known alias/i);
});

test('an OCRE identifier can qualify a coin even when the issuer is vague', () => {
  const collection = [
    {
      id: 'ocre-coin',
      issuer: 'Uncertain',
      issuerConfidence: 'uncertain',
      denomination: 'AR Denarius',
      year: 'AD 103',
      reference: 'RIC II 128',
      ocreId: 'ric.2.trajan.128',
      grade: 'VF',
      acquired: '2025-02-01',
      note: '',
    },
  ];
  const result = evaluateQuest(questById('five-good'), collection);
  const trajan = result.requirements.find((requirement) => requirement.id === 'trajan');

  assert.equal(trajan.status, 'collected');
  assert.equal(trajan.matchType, 'ocre');
  assert.match(trajan.reason, /OCRE ID ric\.2\.trajan\.128/);
});

test('an uncertain attribution is a possible match, never automatic progress', () => {
  const snapshot = evaluateAllQuests(QUEST_CATALOG, freshCollection());
  const fiveGood = resultFor(snapshot, 'five-good');
  const antoninus = fiveGood.requirements.find(
    (requirement) => requirement.id === 'antoninus-pius',
  );

  assert.equal(antoninus.status, 'review');
  assert.equal(antoninus.coin, null);
  assert.equal(antoninus.possibleMatches.length, 1);
  assert.equal(antoninus.possibleMatches[0].coin.id, 'c-antoninus');
  assert.match(antoninus.possibleMatches[0].reason, /attribution is marked uncertain/i);
  assert.equal(fiveGood.collected, 3);
  assert.equal(fiveGood.complete, false);
});

test('duplicate coins satisfy a requirement once and report alternates', () => {
  const snapshot = evaluateAllQuests(QUEST_CATALOG, freshCollection());
  const nerva = resultFor(snapshot, 'five-good').requirements.find(
    (requirement) => requirement.id === 'nerva',
  );

  assert.equal(nerva.status, 'collected');
  assert.equal(nerva.alternates, 1);
});

test('one coin cannot satisfy two requirements in the same quest', () => {
  const syntheticQuest = {
    id: 'synthetic',
    title: 'Synthetic',
    dates: 'AD 69',
    badge: { name: 'Test', mark: 'T' },
    requirements: [
      {
        id: 'first',
        ruler: 'Vespasian',
        reign: 'AD 69–79',
        qualifies: 'Test',
        issuers: ['Vespasian'],
        aliases: [],
      },
      {
        id: 'second',
        ruler: 'Vespasian',
        reign: 'AD 69–79',
        qualifies: 'Test',
        issuers: ['Vespasian'],
        aliases: [],
      },
    ],
  };
  const collection = freshCollection().filter((coin) => coin.id === 'c-vespasian');
  const result = evaluateQuest(syntheticQuest, collection);

  assert.equal(result.collected, 1);
  assert.equal(result.requirements[0].status, 'collected');
  assert.equal(result.requirements[1].status, 'missing');
});

test('a coin can count in more than one quest', () => {
  const snapshot = evaluateAllQuests(QUEST_CATALOG, freshCollection());
  const twelveVespasian = resultFor(snapshot, 'twelve-caesars').requirements.find(
    (requirement) => requirement.id === 'vespasian',
  );
  const fourVespasian = resultFor(snapshot, 'year-of-four').requirements.find(
    (requirement) => requirement.id === 'vespasian',
  );

  assert.equal(twelveVespasian.status, 'collected');
  assert.equal(fourVespasian.status, 'collected');
  assert.equal(twelveVespasian.coin.id, 'c-vespasian');
  assert.equal(fourVespasian.coin.id, 'c-vespasian');
});

test('adding and confirming coins recalculates progress and completes a quest', () => {
  const collection = freshCollection();
  const antoninus = collection.find((coin) => coin.id === 'c-antoninus');
  antoninus.issuer = 'Antoninus Pius';
  antoninus.issuerConfidence = 'certain';
  collection.push({
    id: 'new-marcus',
    issuer: 'Marcus Aurelius',
    issuerConfidence: 'certain',
    denomination: 'AR Denarius',
    year: 'AD 170',
    reference: 'RIC III 248',
    ocreId: '',
    grade: 'VF',
    acquired: '2026-01-10',
    note: '',
  });

  const snapshot = evaluateAllQuests(QUEST_CATALOG, collection);
  const fiveGood = resultFor(snapshot, 'five-good');

  assert.equal(fiveGood.collected, 5);
  assert.equal(fiveGood.complete, true);
  assert.equal(fiveGood.badgeEarned, true);
  assert.equal(snapshot.summary.questsComplete, 2);
  assert.equal(snapshot.summary.requirementsMet, 45);
});

test('confirming an uncertain attribution moves review into collected', () => {
  const collection = freshCollection();
  const coin = collection.find((item) => item.id === 'c-antoninus');
  coin.issuer = 'Antoninus Pius';
  coin.issuerConfidence = 'certain';

  const snapshot = evaluateAllQuests(QUEST_CATALOG, collection);
  const fiveGood = resultFor(snapshot, 'five-good');
  const antoninus = fiveGood.requirements.find(
    (requirement) => requirement.id === 'antoninus-pius',
  );

  assert.equal(antoninus.status, 'collected');
  assert.equal(fiveGood.collected, 4);
  assert.equal(fiveGood.review, 0);
  assert.equal(fiveGood.next.ruler, 'Marcus Aurelius');
});

test('editing an issuer away from a match removes progress', () => {
  const collection = freshCollection();
  const coin = collection.find((item) => item.id === 'c-trajan');
  coin.issuer = 'Trajan Decius';
  coin.ocreId = '';

  const snapshot = evaluateAllQuests(QUEST_CATALOG, collection);
  const fiveGood = resultFor(snapshot, 'five-good');
  const trajan = fiveGood.requirements.find((requirement) => requirement.id === 'trajan');

  assert.equal(trajan.status, 'missing');
  assert.equal(fiveGood.collected, 2);
});

test('deleting a coin regresses a completed quest and removes its badge', () => {
  const collection = freshCollection().filter((coin) => coin.id !== 'c-vespasian');
  const snapshot = evaluateAllQuests(QUEST_CATALOG, collection);
  const four = resultFor(snapshot, 'year-of-four');
  const twelve = resultFor(snapshot, 'twelve-caesars');

  assert.equal(four.collected, 3);
  assert.equal(four.complete, false);
  assert.equal(four.badgeEarned, false);
  assert.equal(twelve.collected, 8);
  assert.equal(snapshot.summary.questsComplete, 0);
  assert.equal(snapshot.summary.requirementsMet, 37);
});

test('an explicit pick decides which coin fills the slot', () => {
  // Default: the first qualifying coin (c-nerva-1), alternate c-nerva-2.
  const defaulted = evaluateQuest(questById('five-good'), freshCollection());
  const nervaDefault = defaulted.requirements.find((requirement) => requirement.id === 'nerva');
  assert.equal(nervaDefault.coin.id, 'c-nerva-1');
  assert.equal(nervaDefault.claimed, false);

  // Pick the other coin: it counts, and the default one becomes the alternate.
  const picked = evaluateQuest(questById('five-good'), freshCollection(), {
    nerva: 'c-nerva-2',
  });
  const nervaPicked = picked.requirements.find((requirement) => requirement.id === 'nerva');
  assert.equal(nervaPicked.status, 'collected');
  assert.equal(nervaPicked.coin.id, 'c-nerva-2');
  assert.equal(nervaPicked.claimed, true);
  assert.equal(nervaPicked.alternates, 1);
  assert.equal(nervaPicked.alternateCoins[0].id, 'c-nerva-1');

  // A pick that does not qualify falls back to the default silently.
  const invalid = evaluateQuest(questById('five-good'), freshCollection(), {
    nerva: 'c-antoninus',
  });
  assert.equal(invalid.requirements.find((r) => r.id === 'nerva').coin.id, 'c-nerva-1');
});

test('normalization is case- and punctuation-insensitive for display names', () => {
  assert.equal(normalizeName('Antoninus Pius?'), 'antoninus pius');
  assert.equal(normalizeName('  MARCUS   AURELIUS  '), 'marcus aurelius');
  assert.equal(normalizeName('Nero Claudius Caesar'), 'nero claudius caesar');
});

// Imperial Women — the obverse portrait is evidence: empress issues carry
// their emperor's "Ruler:" line, so the woman is claimed by the bust name.
const empressCoin = (overrides = {}) => ({
  id: 'c-julia-domna',
  issuer: 'Septimius Severus',
  issuerConfidence: 'certain',
  denomination: 'AR Denarius',
  year: 'AD 196',
  reference: 'RIC IV 550A',
  ocreId: 'ric.4.ss.550',
  grade: 'VF',
  acquired: '2025-06-01',
  note: '',
  details:
    'Ruler: Septimius Severus\nObv: Bust of Julia Domna, hair waved and coiled at back, draped, right.\nRev: Juno, veiled, draped, standing left.\nMint: Rome',
  ...overrides,
});

test('an empress coin attributed to the issuing emperor matches via the obverse bust', () => {
  // Id inside a woman's own prevented pattern would show type 'ocre'; here
  // the id belongs to the emperor's shared series, and the entry still fills
  // because the portrait claim keeps the bust-claims-elsewhere block away.
  const result = evaluateQuest(questById('imperial-women'), [empressCoin()]);
  const domna = result.requirements.find((r) => r.id === 'julia-domna');
  assert.equal(domna.status, 'collected');
});

test('the obverse bust names the actual subject, whoever the ruler line says', () => {
  // Attributed to Elagabalus but depicting Julia Soaemias — her slot fills.
  const result = evaluateQuest(questById('imperial-women'), [
    empressCoin({
      id: 'c-soaemias',
      issuer: 'Elagabalus',
      ocreId: 'ric.4.el.310',
      details:
        'Ruler: Elagabalus\nObv: Bust of Julia Soaemias, hair waved, turned up low at the back, draped, right.\nRev: Venus, seated left.\nMint: Rome',
    }),
  ]);
  const soaemias = result.requirements.find((r) => r.id === 'julia-soaemias');
  assert.equal(soaemias.status, 'collected');
  // …and it does not leak into Julia Domna's slot.
  assert.equal(
    result.requirements.find((r) => r.id === 'julia-domna').status,
    'missing',
  );
});

test('a bare bust description names nobody and cannot fill an empress slot', () => {
  const result = evaluateQuest(questById('imperial-women'), [
    empressCoin({
      id: 'c-plain-bust',
      ocreId: '',
      details:
        'Ruler: Septimius Severus\nObv: Laureate, draped bust right.\nRev: Victory standing left.\nMint: Rome',
    }),
  ]);
  const domna = result.requirements.find((r) => r.id === 'julia-domna');
  assert.equal(domna.status, 'missing');
});

test('direction words after the bust name are stripped before matching', () => {
  const result = evaluateQuest(questById('imperial-women'), [
    empressCoin({
      id: 'c-lucilla',
      issuer: 'Marcus Aurelius',
      ocreId: '',
      details:
        'Ruler: Marcus Aurelius\nObv: Draped bust of Lucilla right\nRev: Venus standing left.\nMint: Rome',
    }),
  ]);
  const lucilla = result.requirements.find((r) => r.id === 'lucilla');
  assert.equal(lucilla.status, 'collected');
  assert.equal(lucilla.matchType, 'bust');
  assert.match(lucilla.reason, /Bust of Lucilla/);
});
