// Quest matcher unit tests — pure logic, no DB needed.
// Run: node --test backend/tests/questMatcher.test.js
// Contract: the Open Design engine rewrite (2026-10-31) — 15 quests, 177
// requirements, families + sections + bad art keys. Ruler quests match the
// effective issuer claim ("Ruler:/Issuer:/(X)" line or issuer field), OCRE
// ranges, or the obverse portrait; theme quests match typed fields derived
// from the composed details label.
const test = require('node:test');
const assert = require('node:assert');
const { matchQuests } = require('../quests/questMatcher');

const QUEST_IDS = [
  'five-good', 'twelve-caesars', 'year-of-four', 'julio-claudians', 'flavians',
  'severans', 'soldier-emperors', 'constantinians', 'every-emperor',
  'four-metals', 'big-denominations', 'moneyers-republic', 'twelve-powers',
  'mints-empire', 'imperial-women',
];

const baseCoin = (id, extra = {}) => ({
  _id: id,
  issuer: 'Roman Empire',
  ocreId: '',
  details: '',
  ...extra,
});

const statusOf = (quests, questId, name) => {
  const q = quests.find(x => x.id === questId);
  const req = q.requirements.find(r => r.name === name);
  return req.status;
};

test('the catalog exposes fifteen quests in order with families', () => {
  const quests = matchQuests([]);
  assert.deepEqual(quests.map(q => q.id), QUEST_IDS);
  const families = new Set(quests.map(q => q.family));
  assert.deepEqual([...families], ['Imperial runs', 'Long runs', 'Collecting themes']);
  // The every-emperor quest carries its eight dynastic sections.
  const long = quests.find(q => q.id === 'every-emperor');
  assert.equal(long.requirements.length, 79);
  assert.ok(long.sections.length === 8);
});

test('exact issuer matching avoids the Trajan Decius false positive', () => {
  const quests = matchQuests([
    baseCoin('c1', { ocreId: '', details: 'Ruler: Trajan\nRev: Pax standing left.' }),
    baseCoin('c2', { ocreId: '', details: 'Ruler: Trajan Decius\nRev: genius standing left.' }),
  ]);
  const fiveGood = quests.find(q => q.id === 'five-good');
  const trajan = fiveGood.requirements.find((requirement) => requirement.name === 'Trajan');

  assert.equal(trajan.status, 'collected');
  assert.equal(
    fiveGood.requirements.some((requirement) => requirement.coin?._id === 'c2'),
    false,
  );
  // Decius fills his own Soldier Emperors slot.
  assert.equal(statusOf(quests, 'soldier-emperors', 'Trajan Decius'), 'collected');
});

test('a curated alias satisfies a requirement', () => {
  const quests = matchQuests([baseCoin('c1', { details: 'Ruler: Octavian\nRev: Gaius and Lucius Caesars.' })]);
  const augustus = quests.find(q => q.id === 'twelve-caesars').requirements.find(r => r.name === 'Augustus');

  assert.equal(augustus.status, 'collected');
  assert.equal(augustus.matchType, 'alias');
  assert.match(augustus.matchReason, /known alias/i);
});

test('an OCRE identifier can qualify a coin even when the issuer is vague', () => {
  const quests = matchQuests([
    baseCoin('c1', { issuer: 'Uncertain?', ocreId: 'ric.2.trajan.128', details: '' }),
  ]);
  const trajan = quests.find(q => q.id === 'five-good').requirements.find(r => r.name === 'Trajan');

  assert.equal(trajan.status, 'collected');
  assert.equal(trajan.matchType, 'ocre');
});

test('canonical OCRE slugs count for the Five Good Emperors', () => {
  const quests = matchQuests([
    baseCoin('c1', { ocreId: 'ric.2.tr.371', details: '' }),
    baseCoin('c2', { ocreId: 'ric.2_3(2).hdn.405', details: '' }),
    baseCoin('c3', { ocreId: 'ric.3.ant.700', details: '' }),
    baseCoin('c4', { ocreId: 'ric.3.m_aur.100', details: '' }),
    baseCoin('c5', { ocreId: 'ric.2.ner.21', details: '' }),
  ]);
  const fiveGood = quests.find(q => q.id === 'five-good');
  assert.equal(statusOf(quests, 'five-good', 'Trajan'), 'collected');
  assert.equal(statusOf(quests, 'five-good', 'Hadrian'), 'collected');
  assert.equal(statusOf(quests, 'five-good', 'Antoninus Pius'), 'collected');
  assert.equal(statusOf(quests, 'five-good', 'Marcus Aurelius'), 'collected');
  assert.equal(statusOf(quests, 'five-good', 'Nerva'), 'collected');
});

test('bare OCRE ids count only where the catalog carries accepted ranges', () => {
  // Tradition: Nero vs Nerva edition pinning. Their roster: five-good is the
  // only quest whose requirements carry ocrePrefixes — a bare id fills those
  // slots, but emperor quests rely on the name claim.
  const quests = matchQuests([
    baseCoin('c1', { ocreId: 'ric.1(2).ner.1', details: '' }),
    baseCoin('c2', { ocreId: 'ric.2.ner.1', details: '' }),
  ]);
  assert.equal(statusOf(quests, 'every-emperor', 'Nero'), 'needed');
  assert.equal(statusOf(quests, 'every-emperor', 'Nerva'), 'needed');
  const fge = quests.find(q => q.id === 'five-good');
  const nervaSlot = fge.requirements.find(r => r.name === 'Nerva');
  assert.equal(nervaSlot.status, 'collected');
  const otherSlots = fge.requirements.filter(r => r.name !== 'Nerva');
  assert.ok(otherSlots.every(r => r.status === 'needed'));
});

test('an uncertain attribution is a possible match, never automatic progress', () => {
  const quests = matchQuests([baseCoin('c1', { details: 'Ruler: Trajan?', ocreId: '' })]);
  const trajan = quests.find(q => q.id === 'five-good').requirements.find(r => r.name === 'Trajan');

  assert.equal(trajan.status, 'review');
  // The adapter hands the possible-match coin to the UI's review row.
  assert.equal(trajan.coin._id, 'c1');
  const match = trajan.matchReason || '';
  assert.match(match, /uncertain/i);
});

test('duplicate coins satisfy a requirement once and report alternates', () => {
  const quests = matchQuests([
    baseCoin('c1', { details: 'Ruler: Trajan', ocreId: 'ric.2.tr.371' }),
    baseCoin('c2', { details: 'Ruler: Trajan', ocreId: 'ric.2.tr.372' }),
  ]);
  const trajan = quests.find(q => q.id === 'five-good').requirements.find(r => r.name === 'Trajan');
  assert.equal(trajan.status, 'collected');
  assert.equal(trajan.alternates, 1);
});

test('moneyer quests match the CRRO Issuer line', () => {
  const quests = matchQuests([baseCoin('c1', { issuer: 'Roman Republic', ocreId: 'rrc-502.1', details: 'Issuer: M. Junius Brutus\nRev: ✶' })]);
  const moneyers = quests.find(q => q.id === 'moneyers-republic');
  const brutus = moneyers.requirements.find(r => r.id === 'brutus');
  assert.equal(brutus.status, 'collected');
});

test('progress derives from live data — name claims flow into each quest', () => {
  // Real coins carry "Ruler: X" in the details; the derived issuer claim
  // flows into each emperor's own quest.
  const quests = matchQuests([baseCoin('c1', { ocreId: 'ric.3.m_aur.100', details: 'Ruler: Marcus Aurelius' })]);
  assert.equal(statusOf(quests, 'five-good', 'Marcus Aurelius'), 'collected');
  assert.equal(statusOf(quests, 'every-emperor', 'Marcus Aurelius'), 'collected');
  assert.equal(statusOf(quests, 'julio-claudians', 'Nero'), 'needed');
});

test('year-of-four completes with the four claims by name', () => {
  const quests = matchQuests([
    baseCoin('c1', { details: 'Ruler: Galba' }),
    baseCoin('c2', { details: 'Ruler: Otho' }),
    baseCoin('c3', { details: 'Ruler: Vitellius' }),
    baseCoin('c4', { details: 'Ruler: Vespasian' }),
  ]);
  const q = quests.find(x => x.id === 'year-of-four');
  assert.equal(q.progress.collected, 4);
  assert.equal(q.progress.complete, true);
  assert.ok(q.requirements.every(r => r.status === 'collected'));
  // Cross-quest: the same year-of-four claims fill the Twelve Caesars too.
  assert.equal(statusOf(quests, 'twelve-caesars', 'Vespasian'), 'collected');
});

test('Four Metals is matched by denomination, names carry metal hints', () => {
  const quests = matchQuests([
    baseCoin('c1', { denomination: 'AV Aureus', details: 'Ruler: Augustus' }),
    baseCoin('c2', { denomination: 'AR Denarius', details: 'Ruler: Tiberius' }),
    baseCoin('c3', { denomination: 'Æ Sestertius', details: 'Ruler: Claudius' }),
    baseCoin('c4', { issuer: 'Great Britain', denomination: 'Gold', details: '' }),
  ]);
  const metals = quests.find(q => q.id === 'four-metals');
  assert.equal(statusOf(quests, 'four-metals', 'Gold (AV)'), 'collected');
  assert.equal(statusOf(quests, 'four-metals', 'Silver (AR)'), 'collected');
  assert.equal(statusOf(quests, 'four-metals', 'Bronze (Æ)'), 'collected');
});

test('The Twelve Powers reads the reverse-type claim', () => {
  const quests = matchQuests([
    baseCoin('c1', { ocreId: 'ric.1(2).tib.26', details: 'Ruler: Tiberius\nRev: Jupiter, seated left.\nMint: Rome' }),
    baseCoin('c5', { ocreId: 'ric.3.ss.700', details: 'Ruler: Septimius Severus\nObv: Bust of Julia Domna, hair waved.\nRev: Concordia, seated left.' }),
    baseCoin('c2', { details: 'Ruler: Nero\nRev: Mars, walking right' }),
  ]);
  const powers = quests.find(q => q.id === 'twelve-powers');
  assert.equal(statusOf(quests, 'twelve-powers', 'Jupiter'), 'collected');
  assert.equal(statusOf(quests, 'twelve-powers', 'Mars'), 'collected');
  assert.equal(statusOf(quests, 'twelve-powers', 'Concordia'), 'collected');
  assert.equal(statusOf(quests, 'twelve-powers', 'Roma'), 'needed');
  // Meanwhile the emperor slots keep flowing as usual.
  assert.equal(statusOf(quests, 'twelve-caesars', 'Tiberius'), 'collected');
});

test('Mints of the Empire reads the Mint line, not the rulers', () => {
  const coins = [
    baseCoin('c1', { ocreId: 'ric.6.lug.67', details: 'Ruler: Constantine I\nRev: Sol standing left.\nMint: Lugdunum' }),
    baseCoin('c2', { ocreId: 'ric.6.rom.1', details: 'Ruler: Constantine I\nRev: CRAP.\nMint: Rome' }),
  ];
  const quests = matchQuests(coins);
  const mints = quests.find(q => q.id === 'mints-empire');
  assert.equal(statusOf(quests, 'mints-empire', 'Lugdunum'), 'collected');
  assert.equal(statusOf(quests, 'mints-empire', 'Rome'), 'collected');
  assert.equal(statusOf(quests, 'constantinians', 'Constantine I'), 'collected');
});

test('non-Roman coins are ignored entirely', () => {
  const quests = matchQuests([
    baseCoin('c1', { issuer: 'Canada', ocreId: '', details: '(Hadrian)' }),
  ]);
  assert.equal(statusOf(quests, 'five-good', 'Hadrian'), 'needed');
});

// Imperial Women — the obverse portrait claim: empress issues carry the
// issuing emperor's "Ruler:" line, so the woman is claimed by the bust name.
test('Julia Domna counts via the obverse bust, attributed to Septimius', () => {
  const quests = matchQuests([
    baseCoin('c1', {
      ocreId: 'ric.4.ss.550',
      details: 'Ruler: Septimius Severus\nObv: Bust of Julia Domna, hair waved and coiled at back, draped, right.\nRev: Juno, veiled, draped, standing left.\nMint: Rome',
    }),
  ]);
  const q = quests.find(x => x.id === 'imperial-women');
  const domna = q.requirements.find(r => r.name === 'Julia Domna');
  assert.equal(domna.status, 'collected');
  assert.match(domna.matchReason, /Bust of Julia Domna/);
  assert.equal(q.progress.collected, 1);
  // The issuing emperor's slots stay clear — the portrait owns the coin.
  assert.equal(statusOf(quests, 'severans', 'Septimius Severus'), 'needed');
  assert.equal(statusOf(quests, 'every-emperor', 'Septimius Severus'), 'needed');
});

test('the bust does not leak into other women’s slots', () => {
  const quests = matchQuests([
    baseCoin('c1', {
      ocreId: 'ric.4.ss.550',
      details: 'Ruler: Septimius Severus\nObv: Bust of Julia Domna, hair waved, draped, right.\nRev: Juno standing left.\nMint: Rome',
    }),
  ]);
  const q = quests.find(x => x.id === 'imperial-women');
  assert.equal(q.requirements.find(r => r.name === 'Julia Maesa').status, 'needed');
  assert.equal(q.requirements.find(r => r.name === 'Julia Mamaea').status, 'needed');
});

test('a bare bust description names nobody and fills no woman slot', () => {
  const quests = matchQuests([
    baseCoin('c1', {
      ocreId: 'ric.4.ss.1',
      details: 'Ruler: Septimius Severus\nObv: Laureate, draped and cuirassed bust right.\nRev: Victory standing left.\nMint: Rome',
    }),
  ]);
  const q = quests.find(x => x.id === 'imperial-women');
  assert.ok(q.requirements.every(r => r.status === 'needed'));
});

test('empower coins named by their own label count directly', () => {
  // Some of Julia Domna's issues are labeled under her own name.
  const quests = matchQuests([
    baseCoin('c1', { details: 'Ruler: Julia Domna\nRev: Venus, seated left.' }),
    baseCoin('c2', { details: 'Ruler: Helena\nRev: Spes in campo' }),
  ]);
  const q = quests.find(x => x.id === 'imperial-women');
  assert.equal(q.requirements.find(r => r.name === 'Julia Domna').status, 'collected');
  assert.equal(q.requirements.find(r => r.name === 'Helena').status, 'collected');
});

test('Faustina Senior/Junior spellings count; a bare bust goes to review', () => {
  const quests = matchQuests([
    baseCoin('c1', { details: 'Ruler: Antoninus Pius\nObv: Bust of Faustina Senior, hair waved.\nRev: ET' }),
    baseCoin('c2', { details: 'Ruler: Marcus Aurelius\nObv: Bust of Faustina Junior, draped.\nRev: Hilaritas.' }),
    baseCoin('c3', { details: 'Ruler: Antoninus Pius\nObv: Bust of Faustina, draped.\nRev: Aeternitas.' }),
  ]);
  const q = quests.find(x => x.id === 'imperial-women');
  assert.equal(q.requirements.find(r => r.name === 'Faustina the Elder').status, 'collected');
  assert.equal(q.requirements.find(r => r.name === 'Faustina the Younger').status, 'collected');
  // c3 (bare Faustina) can be neither: the strong hits win both slots and
  // the ambiguity only surfaces when no certain hit fills a slot.
  assert.equal(q.requirements.some(r => r.coin?._id === 'c3'), false);
});


// Portrait doctrine (2026-10-31): who is ON the coin owns it. An empress or
// a depicted ruler fills their own slot; the issuing emperor's claim loses.
test('a Faustina bust under Antoninus counts as Faustina, never Antoninus', () => {
  const quests = matchQuests([
    baseCoin('c1', {
      ocreId: 'ric.3.ant.1',
      details: 'Ruler: Antoninus Pius\nObv: Bust of Faustina Senior, hair waved, right.\nRev: Juno standing left.\nMint: Rome',
    }),
  ]);
  assert.equal(statusOf(quests, 'imperial-women', 'Faustina the Elder'), 'collected');
  // The issuing emperor does not get the coin just because he struck it.
  assert.equal(statusOf(quests, 'five-good', 'Antoninus Pius'), 'needed');
  assert.equal(statusOf(quests, 'every-emperor', 'Antoninus Pius'), 'needed');
  // …and no other Imperial-Women slot misfires.
  assert.equal(statusOf(quests, 'imperial-women', 'Faustina the Younger'), 'needed');
});

test('a depicted Licinius counts as Licinius even under another claim', () => {
  const quests = matchQuests([
    baseCoin('c1', {
      ocreId: 'ric.6.sis.10',
      details: 'Ruler: Constantine I\nObv: Bust of Licinius, cuirassed, right.\nRev: Jupiter standing left.',
    }),
  ]);
  assert.equal(statusOf(quests, 'every-emperor', 'Licinius'), 'collected');
  assert.equal(statusOf(quests, 'every-emperor', 'Constantine I'), 'needed');
  assert.equal(statusOf(quests, 'constantinians', 'Constantine I'), 'needed');
});
test('a bare-Faustina coin reviews on the wife slots only, nowhere else', () => {
  const quests = matchQuests([
    baseCoin('c1', {
      details: 'Ruler: Antoninus Pius\nObv: Bust of Faustina, draped, right.\nRev: Juno standing left.\nMint: Rome',
    }),
  ]);
  const w = quests.find(x => x.id === 'imperial-women');
  const elder = w.requirements.find(r => r.name === 'Faustina the Elder');
  const younger = w.requirements.find(r => r.name === 'Faustina the Younger');
  assert.equal(elder.status, 'review');
  assert.equal(younger.status, 'review');
  // The emperor slots stay clean — the coin never parks there.
  assert.equal(statusOf(quests, 'five-good', 'Antoninus Pius'), 'needed');
  assert.equal(statusOf(quests, 'every-emperor', 'Antoninus Pius'), 'needed');
  const otherReviews = quests.filter(q => q.id !== 'imperial-women')
    .flatMap(q => q.requirements)
    .filter(r => r.status === 'review');
  assert.equal(otherReviews.length, 0);
});

test('a confirmed attribution survives the ambiguous bust — no review loop', () => {
  // The popup's "Confirm as <name>" writes a roster-named claim onto the
  // coin (the Ruler: line carries it). The recount must trust that claim
  // even though the bust still reads bare "Faustina" — otherwise every
  // confirm would bounce straight back to review. A claim naming the
  // issuing husband does NOT resolve the ambiguity (2026-10-31).
  const asCoin = (ruler) => [baseCoin('c1', {
    ocreId: 'ric.3.ant.400',
    details: `Ruler: ${ruler}\nObv: Bust of Faustina, draped, right.\nRev: Juno standing left.\nMint: Rome`,
  })];

  // Unconfirmed: ambiguous claim (the husband) — both wife slots review.
  const unconfirmed = matchQuests(asCoin('Antoninus Pius'));
  const iw = unconfirmed.find((x) => x.id === 'imperial-women');
  assert.equal(iw.requirements.find((r) => r.id === 'faustina-elder').status, 'review');
  assert.equal(iw.requirements.find((r) => r.id === 'faustina-younger').status, 'review');
  assert.equal(statusOf(unconfirmed, 'five-good', 'Antoninus Pius'), 'needed');

  // Confirmed to a Faustina: that slot collects, the sister stays needed.
  const elder = matchQuests(asCoin('Faustina the Elder'));
  const iwE = elder.find((x) => x.id === 'imperial-women');
  assert.equal(iwE.requirements.find((r) => r.id === 'faustina-elder').status, 'collected');
  assert.equal(iwE.requirements.find((r) => r.id === 'faustina-younger').status, 'needed');
  assert.equal(statusOf(elder, 'five-good', 'Antoninus Pius'), 'needed');

  const younger = matchQuests(asCoin('Faustina the Younger'));
  const iwY = younger.find((x) => x.id === 'imperial-women');
  assert.equal(iwY.requirements.find((r) => r.id === 'faustina-younger').status, 'collected');
  assert.equal(iwY.requirements.find((r) => r.id === 'faustina-elder').status, 'needed');
});

test('direction words after the bust name are stripped before matching', () => {
  const quests = matchQuests([
    baseCoin('c1', {
      issuer: 'Roman Empire',
      ocreId: '',
      details: 'Ruler: Marcus Aurelius\nObv: Draped bust of Lucilla right\nRev: Venus standing left.',
    }),
  ]);
  const lucilla = quests.find(x => x.id === 'imperial-women')
    .requirements.find(r => r.id === 'lucilla');
  assert.equal(lucilla.status, 'collected');
  assert.match(lucilla.matchReason, /Bust of Lucilla/);
});
