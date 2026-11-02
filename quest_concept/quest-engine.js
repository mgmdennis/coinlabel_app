// quest-engine.js — data + evaluation for the Roman Imperial Quests prototype.
// Matches the contract in quest-engine.test.js and the render calls in index.html:
//   QUEST_CATALOG, SEED_COLLECTION, evaluateAllQuests(catalog, collection),
//   evaluateQuest(quest, collection), findQuest, isUncertain, normalizeName
//
// Semantics (per the test spec):
//  - A coin qualifies for a ruler when its issuer names the ruler exactly
//    (case/punctuation-insensitive, curated aliases) or its OCRE/CRRO id is
//    inside the ruler's accepted series.
//  - An uncertain attribution does not count via the issuer name, but an id
//    inside an accepted series counts regardless of confidence — the id is
//    independent evidence. Uncertain + name-only ⇒ review, never progress.
//  - One coin satisfies one requirement per evaluateQuest call; the same
//    coin may count in another quest.
//  - Progress derives only from the live collection — no stored quest state.

// Quest data shape — the contract a future user-facing quest editor writes:
//   quest = { id?, title, dates, summary, intro, historicalNote?, badge {name, mark},
//             requirements: [{ id?, ruler, reign, aliases[] | issuers[], ocrePrefixes[], note? }] }
// Every requirement is a uniform row (display name + acceptable names +
// accepted id prefixes), so the editor is just a form over this document —
// no evaluation special-cases. Curated quests carry source: 'builtin';
// user-authored ones will carry a userId + unique id, and pass validateQuest
// before being stored/evaluated.
const questSchemaComment = true; // eslint-disable-line no-unused-vars

export function validateQuest(quest, { takenIds = [] } = {}) {
  const errors = [];
  const push = (message) => errors.push(message);
  if (!quest || typeof quest !== 'object') return ['Quest is not an object'];
  if (!String(quest.title ?? '').trim()) push('Title is required.');
  if (!quest.badge?.name || !quest.badge?.mark) push('Badge needs a name and a mark.');
  if (!Array.isArray(quest.requirements) || quest.requirements.length === 0) {
    push('Quest needs at least one requirement.');
  }
  const seenIds = new Set(takenIds);
  (quest.requirements ?? []).forEach((requirement, index) => {
    const label = requirement.ruler ?? requirement.title ?? `#${index + 1}`;
    if (requirement.fieldMatch) {
      if (!requirement.fieldMatch.field || !Array.isArray(requirement.fieldMatch.values) || requirement.fieldMatch.values.length === 0) {
        push(`Requirement ${index + 1} (${label}): fieldMatch needs a field and at least one value.`);
      }
      return;
    }
    if (!String(label).trim()) push(`Requirement ${index + 1}: ruler name is required.`);
    const aliases = [...(requirement.aliases ?? []), ...(requirement.issuers ?? [])];
    if (aliases.length === 0) push(`Requirement ${index + 1} (${label}): no acceptable names.`);
    if (aliases.some((alias) => !normalizeName(alias))) push(`Requirement ${index + 1} (${requirement.ruler}): aliases must be non-empty.`);
    (requirement.ocrePrefixes ?? []).forEach((prefix) => {
      if (typeof prefix !== 'string' || !prefix.trim()) push(`Requirement ${index + 1} (${requirement.ruler}): id prefixes must be non-empty strings.`);
    });
  });
  if (quest.id && seenIds.has(quest.id)) push(`Quest id "${quest.id}" is already taken.`);
  return errors;
}

export const QUEST_CATALOG = [
  {
    id: 'five-good',
    source: 'builtin',
    title: 'The Five Good Emperors',
    dates: 'AD 96–180',
    summary: 'Nerva, Trajan, Hadrian, Antoninus Pius, Marcus Aurelius — the adoptive golden run.',
    intro: 'Five emperors, AD 96–180 — Machiavelli\'s golden run of adoptive rulers. It ends not with Marcus Aurelius\' death but with his break from the system, when he named his natural son Commodus.',
    historicalNote: 'The successions were adoptive every time except the last, when Marcus Aurelius named Commodus. Cassius Dio judged the five by merit rather than blood — Machiavelli named them "the five good emperors" fourteen centuries later.',
    badge: { name: 'Five Good Emperors', mark: '🏛️' },
    requirements: [
      { id: 'nerva', ruler: 'Nerva', reign: 'AD 96–98', aliases: ['Nerva'], ocrePrefixes: ['ric.2.ner.', 'ric.2.nerva.'], ocreNote: 'RIC II, Nerva series (slug "ner" is edition-pinned).' },
      { id: 'trajan', ruler: 'Trajan', reign: 'AD 98–117', aliases: ['Trajan'], ocrePrefixes: ['ric.2.tr.', 'ric.2.trajan.', 'ric.2_2(2).tr.'], ocreNote: 'RIC II, Trajan series.' },
      { id: 'hadrian', ruler: 'Hadrian', reign: 'AD 117–138', aliases: ['Hadrian'], ocrePrefixes: ['ric.2_3(2).hdn.', 'ric.2.hdn.', 'ric.2.hadrian.'], ocreNote: 'RIC II (2nd ed) part 3, Hadrian series.' },
      { id: 'antoninus-pius', ruler: 'Antoninus Pius', reign: 'AD 138–161', aliases: ['Antoninus Pius', 'Antoninus'], ocrePrefixes: ['ric.3.ant.'], ocreNote: 'RIC III, Antoninus Pius series.' },
      { id: 'marcus-aurelius', ruler: 'Marcus Aurelius', reign: 'AD 161–180', aliases: ['Marcus Aurelius'], ocrePrefixes: ['ric.3.m_aur.', 'ric.3.marcus_aurelius.'], ocreNote: 'RIC III, Marcus Aurelius series.' },
    ],
  },
  {
    id: 'twelve-caesars',
    source: 'builtin',
    title: "Suetonius' Twelve Caesars",
    dates: '44 BC – AD 96',
    summary: 'One coin for each of the twelve rulers Suetonius chronicled, from Caesar to Domitian.',
    intro: 'Twelve rulers, one coin each — any denomination, any mint. Caesar\'s inclusion makes this a historical set, not a strictly Imperial one: his Imperatorial issues fall outside OCRE and are matched by CRRO reference instead.',
    historicalNote: "Suetonius' De Vita Caesarum covers Julius Caesar and the eleven emperors who followed him. Caesar struck his coins before the Principate existed — only the other eleven were 'Imperial' in the strict sense.",
    badge: { name: 'Twelve Caesars', mark: '👑' },
    requirements: [
      { id: 'julius-caesar', ruler: 'Julius Caesar', reign: '49–44 BC', aliases: ['Julius Caesar'], ocrePrefixes: ['rrc-480.', 'rrc-481.', 'rrc-482.', 'rrc-483.', 'rrc-484.'], ocreNote: 'Caesar\'s Imperatorial issue is CRRO (RRC 480–484), not OCRE.', note: 'Not an OCRE ruler — the CRRO reference on the coin is what counts.' },
      { id: 'augustus', ruler: 'Augustus', reign: '27 BC – AD 14', aliases: ['Augustus', 'Octavian'], ocrePrefixes: ['ric.1(2).aug.', 'ric.1.aug.'], ocreNote: 'RIC I (2nd ed), Augustus series.' },
      { id: 'tiberius', ruler: 'Tiberius', reign: 'AD 14–37', aliases: ['Tiberius'], ocrePrefixes: ['ric.1(2).tib.', 'ric.1.tib.'], ocreNote: 'RIC I (2nd ed), Tiberius series.' },
      { id: 'gaius', ruler: 'Caligula', reign: 'AD 37–41', aliases: ['Caligula', 'Gaius'], ocrePrefixes: ['ric.1(2).gai.', 'ric.1.gai.'], ocreNote: 'RIC I (2nd ed), Gaius (Caligula) series.' },
      { id: 'claudius', ruler: 'Claudius', reign: 'AD 41–54', aliases: ['Claudius'], ocrePrefixes: ['ric.1(2).clau.', 'ric.1.clau.'], ocreNote: 'RIC I (2nd ed), Claudius series.' },
      { id: 'nero', ruler: 'Nero', reign: 'AD 54–68', aliases: ['Nero'], ocrePrefixes: ['ric.1(2).ner.', 'ric.1.ner.'], ocreNote: 'RIC I (2nd ed), Nero series.' },
      { id: 'galba', ruler: 'Galba', reign: 'AD 68–69', aliases: ['Galba'], ocrePrefixes: ['ric.1(2).gal.', 'ric.1.gal.'], ocreNote: 'RIC I (2nd ed), Galba series.' },
      { id: 'otho', ruler: 'Otho', reign: 'AD 69', aliases: ['Otho'], ocrePrefixes: ['ric.1(2).ot.', 'ric.1.ot.'], ocreNote: 'RIC I (2nd ed), Otho series (slug "ot").' },
      { id: 'vitellius', ruler: 'Vitellius', reign: 'AD 69', aliases: ['Vitellius'], ocrePrefixes: ['ric.1(2).vit.', 'ric.1.vit.'], ocreNote: 'RIC I (2nd ed), Vitellius series.' },
      { id: 'vespasian', ruler: 'Vespasian', reign: 'AD 69–79', aliases: ['Vespasian'], ocrePrefixes: ['ric.2_1(2).ves.', 'ric.2.ves.'], ocreNote: 'RIC II (2nd ed) part 1, Vespasian series.' },
      { id: 'titus', ruler: 'Titus', reign: 'AD 79–81', aliases: ['Titus'], ocrePrefixes: ['ric.2_1(2).tit.', 'ric.2.tit.'], ocreNote: 'RIC II (2nd ed) part 1, Titus series.' },
      { id: 'domitian', ruler: 'Domitian', reign: 'AD 81–96', aliases: ['Domitian'], ocrePrefixes: ['ric.2_1(2).dom.', 'ric.2.dom.'], ocreNote: 'RIC II (2nd ed) part 1, Domitian series.' },
    ],
  },
  {
    id: 'year-of-four',
    source: 'builtin',
    title: 'The Year of Four Emperors',
    dates: 'AD 69',
    summary: 'The chaos of AD 69 in four reigns: Galba, Otho, Vitellius, Vespasian.',
    intro: 'AD 69: two emperors murdered, one executed, and a coinage issued in four regnal names within thirteen months. All four rulers on one coin each — genuinely hard, because the first three barely had time to strike.',
    historicalNote: 'Galba was killed in the Forum in January, Otho died by his own hand in April, Vitellius was dragged from his unfinished palace eight months later — and Vespasian closed the year at the Palatine. The tiny time-windows make every coin scarce except Vespasian\'s.',
    badge: { name: 'Year of Four Emperors', mark: '⚔️' },
    requirements: [
      { id: 'galba', ruler: 'Galba', reign: 'AD 68–69', aliases: ['Galba'], ocrePrefixes: ['ric.1(2).gal.', 'ric.1.gal.'], ocreNote: 'RIC I (2nd ed), Galba series.' },
      { id: 'otho', ruler: 'Otho', reign: 'AD 69', aliases: ['Otho'], ocrePrefixes: ['ric.1(2).ot.', 'ric.1.ot.'], ocreNote: 'RIC I (2nd ed), Otho series (slug "ot").' },
      { id: 'vitellius', ruler: 'Vitellius', reign: 'AD 69', aliases: ['Vitellius'], ocrePrefixes: ['ric.1(2).vit.', 'ric.1.vit.'], ocreNote: 'RIC I (2nd ed), Vitellius series.' },
      { id: 'vespasian', ruler: 'Vespasian', reign: 'AD 69–79', aliases: ['Vespasian'], ocrePrefixes: ['ric.2_1(2).ves.', 'ric.2.ves.'], ocreNote: 'RIC II (2nd ed) part 1, Vespasian series.' },
    ],
  },
  {
    id: 'julio-claudians',
    source: 'builtin',
    title: 'The Julio-Claudians',
    dates: '44 BC – AD 68',
    summary: 'One coin per ruler of the first dynasty — Caesar\'s line through the emperors it produced.',
    intro: 'The first dynasty: from Caesar\'s murder to Nero\'s fall in one extended family — four generations of Julio-Claudian ambition, arson, poison, and extraordinary coinage.',
    historicalNote: 'Neither "Julio" nor "Claudian" is a lineage on its own — the dynasty fused Caesar\'s adoptive heirs with Livia\'s Claudian line. Every emperor here ties back to those two sides of the family.',
    badge: { name: 'The Julio-Claudians', mark: '🌿' },
    requirements: [
      { id: 'julius-caesar', ruler: 'Julius Caesar', reign: '49–44 BC', aliases: ['Julius Caesar'], ocrePrefixes: ['rrc-480.', 'rrc-481.', 'rrc-482.', 'rrc-483.', 'rrc-484.'], ocreNote: 'CRRO, not OCRE.', note: 'Not an OCRE ruler — the CRRO reference on the coin is what counts.' },
      { id: 'augustus', ruler: 'Augustus', reign: '27 BC – AD 14', aliases: ['Augustus', 'Octavian'], ocrePrefixes: ['ric.1(2).aug.', 'ric.1.aug.'], ocreNote: 'RIC I (2nd ed), Augustus series.' },
      { id: 'tiberius', ruler: 'Tiberius', reign: 'AD 14–37', aliases: ['Tiberius'], ocrePrefixes: ['ric.1(2).tib.', 'ric.1.tib.'], ocreNote: 'RIC I (2nd ed), Tiberius series.' },
      { id: 'gaius', ruler: 'Caligula', reign: 'AD 37–41', aliases: ['Caligula', 'Gaius'], ocrePrefixes: ['ric.1(2).gai.', 'ric.1.gai.'], ocreNote: 'RIC I (2nd ed), Gaius series.' },
      { id: 'claudius', ruler: 'Claudius', reign: 'AD 41–54', aliases: ['Claudius'], ocrePrefixes: ['ric.1(2).clau.', 'ric.1.clau.'], ocreNote: 'RIC I (2nd ed), Claudius series.' },
      { id: 'nero', ruler: 'Nero', reign: 'AD 54–68', aliases: ['Nero'], ocrePrefixes: ['ric.1(2).ner.', 'ric.1.ner.'], ocreNote: 'RIC I (2nd ed), Nero series.' },
    ],
  },
  {
    id: 'flavians',
    source: 'builtin',
    title: 'The Flavians',
    dates: 'AD 69–96',
    summary: 'Vespasian, Titus, and Domitian — the dynasty that rebuilt Rome after AD 69.',
    intro: 'Three coins: the father who pulled the empire out of the Year of Four Emperors, the elder son beloved enough to die as a god, and the younger son who got so tired of being waited for that he decided the fourth quarter of the amphitheatre was his.',
    historicalNote: 'The Flavian amphitheatre — the Colosseum — was begun by Vespasian and opened by Titus. Its construction was partly financed from the spoils of the Jewish War, which is why Judaea Capta reverses are common across all three rulers.',
    badge: { name: 'The Flavians', mark: '🏟️' },
    requirements: [
      { id: 'vespasian', ruler: 'Vespasian', reign: 'AD 69–79', aliases: ['Vespasian'], ocrePrefixes: ['ric.2_1(2).ves.', 'ric.2.ves.'], ocreNote: 'RIC II (2nd ed) part 1, Vespasian series.' },
      { id: 'titus', ruler: 'Titus', reign: 'AD 79–81', aliases: ['Titus'], ocrePrefixes: ['ric.2_1(2).tit.', 'ric.2.tit.'], ocreNote: 'RIC II (2nd ed) part 1, Titus series.' },
      { id: 'domitian', ruler: 'Domitian', reign: 'AD 81–96', aliases: ['Domitian'], ocrePrefixes: ['ric.2_1(2).dom.', 'ric.2.dom.'], ocreNote: 'RIC II (2nd ed) part 1, Domitian series.' },
    ],
  },
  {
    id: 'severans',
    source: 'builtin',
    title: 'The Severans',
    dates: 'AD 193–235',
    summary: 'Septimius Severus, Caracalla, Geta, Elagabalus, and Severus Alexander.',
    intro: 'Five rulers in forty-two years: the African general his soldiers adored, the brother whose face was chiselled off the coinage, a teenage priest of a Syrian sun god, and the mild cousin the army finally gave up on.',
    historicalNote: 'Portraiture got complicated under the Severans — after Caracalla had Geta killed, Geta\'s face was recut out of his surviving coins. Portrait heads are overstruck; mint engravers were busy.',
    badge: { name: 'The Severans', mark: '🗡️' },
    requirements: [
      { id: 'septimius-severus', ruler: 'Septimius Severus', reign: 'AD 193–211', aliases: ['Septimius Severus', 'Septimius'], ocrePrefixes: ['ric.4.ss.'], ocreNote: 'RIC IV, Septimius Severus series (slug "ss").' },
      { id: 'caracalla', ruler: 'Caracalla', reign: 'AD 198–217', aliases: ['Caracalla'], note: 'Matched by name — the "Antoninus" alias is reserved for Antoninus Pius.', ocrePrefixes: ['ric.4.car.', 'ric.4.caracalla.'], ocreNote: 'RIC IV, Caracalla series.' },
      { id: 'geta', ruler: 'Geta', reign: 'AD 209–212', aliases: ['Geta'], ocrePrefixes: ['ric.4.ge.', 'ric.4.geta.'], ocreNote: 'RIC IV, Geta series.' },
      { id: 'elagabalus', ruler: 'Elagabalus', reign: 'AD 218–222', aliases: ['Elagabalus', 'Heliogabalus'], ocrePrefixes: ['ric.4.el.', 'ric.4.elagabalus.'], ocreNote: 'RIC IV, Elagabalus series (slug "el").' },
      { id: 'severus-alexander', ruler: 'Severus Alexander', reign: 'AD 222–235', aliases: ['Severus Alexander', 'Alexander Severus'], ocrePrefixes: ['ric.4.sa.', 'ric.4.severus_alexander.'], ocreNote: 'RIC IV, Severus Alexander series.' },
    ],
  },
  {
    id: 'soldier-emperors',
    source: 'builtin',
    title: 'The Soldier Emperors',
    dates: 'AD 238–268',
    summary: 'Gordian III, Philip I, Trajan Decius, Valerian I, and Gallienus — rulers drawn from an army that made them.',
    intro: 'The Crisis in glimpses: a teenager rescued from the mob, an emperor who celebrated Rome\'s millennium with grand games on the coinage, and the short-reigned generals the army promoted and mourned in quick succession. Their antoniniani are ancient "livable" coins — affordable, abundant, and every one dated by reverse type.',
    historicalNote: 'The denarius had collapsed to near nothing, so the radiate-crowned antoninianus took over: bigger flan, less silver, boldly propagandist reverses. Trajan Decius struck his Secular Games doubles in 250; Gallienus spent the 260s ruling the western half alone while Rome was carving his laments.',
    badge: { name: 'The Soldier Emperors', mark: '🪖' },
    requirements: [
      { id: 'gordian-iii', ruler: 'Gordian III', reign: 'AD 238–244', aliases: ['Gordian III', 'Gordian'], ocrePrefixes: ['ric.4.gor_iii.'], ocreNote: 'RIC IV, Gordian III series.' },
      { id: 'philip-i', ruler: 'Philip I', reign: 'AD 244–249', aliases: ['Philip', 'Philip I'], ocrePrefixes: ['ric.4.ph_i.'], ocreNote: 'RIC IV, Philip I series (slug "ph_i").' },
      { id: 'trajan-decius', ruler: 'Trajan Decius', reign: 'AD 249–251', aliases: ['Trajan Decius', 'Decius'], note: 'Matched exactly — this never satisfies the Trajan requirement.', ocrePrefixes: ['ric.4.trd.'], ocreNote: 'RIC IV, Trajan Decius series.' },
      { id: 'valerian-i', ruler: 'Valerian I', reign: 'AD 253–260', aliases: ['Valerian', 'Valerian I'], note: 'Matched by ruler name — mint marks and joint issues are not evaluated.', ocrePrefixes: ['ric.5.vle.'], ocreNote: 'RIC V, Valerian series.' },
      { id: 'gallienus', ruler: 'Gallienus', reign: 'AD 253–268', aliases: ['Gallienus'], ocrePrefixes: ['ric.5.gall(2).', 'ric.5.gall.'], ocreNote: 'RIC V, Gallienus sole reign (slug gall(2)).' },
    ],
  },
  {
    id: 'constantinians',
    source: 'builtin',
    title: 'The Constantinians',
    dates: 'AD 306–361',
    summary: 'Constantine I, Constantine II, Constantius II, and Constans — the house that made Christianity official.',
    intro: 'The dynasty that made the new religion official: from the Milvian Bridge in 312 through the half-century the sons fought over the inheritance — with the coinage turning steadily Christian along the way.',
    historicalNote: 'Constantine\'s coins told both stories at once: Sol Invictus on early issues, the chariot to heaven on the memorial issues after his death. By the end of the sons\' reigns, Sol had disappeared from the coinage entirely.',
    badge: { name: 'The Constantinians', mark: '✝️' },
    requirements: [
      { id: 'constantine-i', ruler: 'Constantine I', reign: 'AD 306–337', aliases: ['Constantine', 'Constantine I'], note: 'Matched by ruler name.', ocrePrefixes: ['ric.6.con.'], ocreNote: 'RIC VI/VII, Constantine series.' },
      { id: 'constantine-ii', ruler: 'Constantine II', reign: 'AD 317–340', aliases: ['Constantine II'], note: 'Matched exactly — "Constantine I" does not count here.', ocrePrefixes: ['ric.7.con_ii.'], ocreNote: 'RIC VII, Constantine II series.' },
      { id: 'constantius-ii', ruler: 'Constantius II', reign: 'AD 337–361', aliases: ['Constantius II'], ocrePrefixes: ['ric.8.con_ii.'], ocreNote: 'RIC VIII, Constantius II series.' },
      { id: 'constans', ruler: 'Constans', reign: 'AD 337–350', aliases: ['Constans'], ocrePrefixes: ['ric.8.cons.'], ocreNote: 'RIC VIII, Constans series.' },
    ],
  },
  {
    id: 'every-emperor',
    source: 'builtin',
    title: 'Every Emperor',
    dates: '27 BC - AD 491',
    summary: 'One coin for every emperor who struck coinage inside RIC I-X - Augustus to Zeno. The long march.',
    intro: "Five hundred years of rulers, one coin each. No denomination or type filters - if the emperor's name is on your label, the slot fills. This is the quest that turns a drawer of coins into a dynasty.",
    historicalNote: "The list runs the recognised imperial succession inside OCRE (RIC I-X): co-emperors count, caesars who never became Augustus do not, and the breakaway Gallic, Palmyrene, and Britannic realms are deferred to the Breakaway Empires quest. Julius Caesar is excluded - he was dictator, never Augustus. En dash spellings in reign dates are display-only.",
    badge: { name: 'The Long March', mark: '📜' },
    ruleLine: "Issuer names and curated aliases are matched exactly. OCRE IDs inside a ruler's accepted series also satisfy a requirement; name matching alone is enough for rulers without pinned series.",
    requirements: [
      { id: 'augustus', ruler: 'Augustus', reign: '27 BC - AD 14', aliases: ['Augustus', 'Octavian'], ocrePrefixes: ['ric.1(2).aug.', 'ric.1.aug.'] },
      { id: 'tiberius', ruler: 'Tiberius', reign: 'AD 14-37', aliases: ['Tiberius'], ocrePrefixes: ['ric.1(2).tib.', 'ric.1.tib.'] },
      { id: 'caligula', ruler: 'Caligula', reign: 'AD 37-41', aliases: ['Caligula', 'Gaius'], ocrePrefixes: ['ric.1(2).gai.', 'ric.1.gai.'] },
      { id: 'claudius', ruler: 'Claudius', reign: 'AD 41-54', aliases: ['Claudius'], ocrePrefixes: ['ric.1(2).clau.', 'ric.1.clau.'] },
      { id: 'nero', ruler: 'Nero', reign: 'AD 54-68', aliases: ['Nero'], ocrePrefixes: ['ric.1(2).ner.', 'ric.1.ner.'] },
      { id: 'galba', ruler: 'Galba', reign: 'AD 68-69', aliases: ['Galba'], ocrePrefixes: ['ric.1(2).gal.', 'ric.1.gal.'] },
      { id: 'otho', ruler: 'Otho', reign: 'AD 69', aliases: ['Otho'], ocrePrefixes: ['ric.1(2).ot.', 'ric.1.ot.'] },
      { id: 'vitellius', ruler: 'Vitellius', reign: 'AD 69', aliases: ['Vitellius'], ocrePrefixes: ['ric.1(2).vit.', 'ric.1.vit.'] },
      { id: 'vespasian', ruler: 'Vespasian', reign: 'AD 69-79', aliases: ['Vespasian'], ocrePrefixes: ['ric.2_1(2).ves.', 'ric.2.ves.'] },
      { id: 'titus', ruler: 'Titus', reign: 'AD 79-81', aliases: ['Titus'], ocrePrefixes: ['ric.2_1(2).tit.', 'ric.2.tit.'] },
      { id: 'domitian', ruler: 'Domitian', reign: 'AD 81-96', aliases: ['Domitian'], ocrePrefixes: ['ric.2_1(2).dom.', 'ric.2.dom.'] },
      { id: 'nerva', ruler: 'Nerva', reign: 'AD 96-98', aliases: ['Nerva'], ocrePrefixes: ['ric.2.ner.', 'ric.2.nerva.'] },
      { id: 'trajan', ruler: 'Trajan', reign: 'AD 98-117', aliases: ['Trajan'], ocrePrefixes: ['ric.2.tr.', 'ric.2.trajan.', 'ric.2_2(2).tr.'] },
      { id: 'hadrian', ruler: 'Hadrian', reign: 'AD 117-138', aliases: ['Hadrian'], ocrePrefixes: ['ric.2_3(2).hdn.', 'ric.2.hdn.', 'ric.2.hadrian.'] },
      { id: 'antoninus-pius', ruler: 'Antoninus Pius', reign: 'AD 138-161', aliases: ['Antoninus Pius', 'Antoninus'], ocrePrefixes: ['ric.3.ant.'] },
      { id: 'marcus-aurelius', ruler: 'Marcus Aurelius', reign: 'AD 161-180', aliases: ['Marcus Aurelius'], ocrePrefixes: ['ric.3.m_aur.', 'ric.3.marcus_aurelius.'] },
      { id: 'lucius-verus', ruler: 'Lucius Verus', reign: 'AD 161-169', aliases: ['Lucius Verus', 'Verus'] },
      { id: 'commodus', ruler: 'Commodus', reign: 'AD 177-192', aliases: ['Commodus'] },
      { id: 'pertinax', ruler: 'Pertinax', reign: 'AD 193', aliases: ['Pertinax'] },
      { id: 'didius-julianus', ruler: 'Didius Julianus', reign: 'AD 193', aliases: ['Didius Julianus'] },
      { id: 'septimius-severus', ruler: 'Septimius Severus', reign: 'AD 193-211', aliases: ['Septimius Severus', 'Septimius'], ocrePrefixes: ['ric.4.ss.'] },
      { id: 'caracalla', ruler: 'Caracalla', reign: 'AD 198-217', aliases: ['Caracalla'] },
      { id: 'geta', ruler: 'Geta', reign: 'AD 209-212', aliases: ['Geta'], ocrePrefixes: ['ric.4.ge.', 'ric.4.geta.'] },
      { id: 'macrinus', ruler: 'Macrinus', reign: 'AD 217-218', aliases: ['Macrinus'] },
      { id: 'elagabalus', ruler: 'Elagabalus', reign: 'AD 218-222', aliases: ['Elagabalus', 'Heliogabalus'], ocrePrefixes: ['ric.4.el.', 'ric.4.elagabalus.'] },
      { id: 'severus-alexander', ruler: 'Severus Alexander', reign: 'AD 222-235', aliases: ['Severus Alexander', 'Alexander Severus'], ocrePrefixes: ['ric.4.sa.', 'ric.4.severus_alexander.'] },
      { id: 'maximinus-i', ruler: 'Maximinus I', reign: 'AD 235-238', aliases: ['Maximinus I', 'Maximinus Thrax', 'Maximinus'] },
      { id: 'gordian-i', ruler: 'Gordian I', reign: 'AD 238', aliases: ['Gordian I', 'Gordian Africanus'] },
      { id: 'gordian-ii', ruler: 'Gordian II', reign: 'AD 238', aliases: ['Gordian II'] },
      { id: 'balbinus', ruler: 'Balbinus', reign: 'AD 238', aliases: ['Balbinus'] },
      { id: 'pupienus', ruler: 'Pupienus', reign: 'AD 238', aliases: ['Pupienus'] },
      { id: 'gordian-iii', ruler: 'Gordian III', reign: 'AD 238-244', aliases: ['Gordian III', 'Gordian'], ocrePrefixes: ['ric.4.gor_iii.'] },
      { id: 'philip-i', ruler: 'Philip I', reign: 'AD 244-249', aliases: ['Philip I', 'Philip the Arab', 'Philip'], ocrePrefixes: ['ric.4.ph_i.'] },
      { id: 'trajan-decius', ruler: 'Trajan Decius', reign: 'AD 249-251', aliases: ['Trajan Decius', 'Decius'], ocrePrefixes: ['ric.4.trd.'] },
      { id: 'herennius-etruscus', ruler: 'Herennius Etruscus', reign: 'AD 251', aliases: ['Herennius Etruscus', 'Herennius'] },
      { id: 'hostilian', ruler: 'Hostilian', reign: 'AD 251', aliases: ['Hostilian'] },
      { id: 'trebonianus-gallus', ruler: 'Trebonianus Gallus', reign: 'AD 251-253', aliases: ['Trebonianus Gallus', 'Gallus'] },
      { id: 'volusian', ruler: 'Volusian', reign: 'AD 251-253', aliases: ['Volusian'] },
      { id: 'aemilian', ruler: 'Aemilian', reign: 'AD 253', aliases: ['Aemilian'] },
      { id: 'valerian-i', ruler: 'Valerian I', reign: 'AD 253-260', aliases: ['Valerian I', 'Valerian'] },
      { id: 'gallienus', ruler: 'Gallienus', reign: 'AD 253-268', aliases: ['Gallienus'], ocrePrefixes: ['ric.5.gall(2).', 'ric.5.gall.'] },
      { id: 'saloninus', ruler: 'Saloninus', reign: 'AD 260', aliases: ['Saloninus'], ocrePrefixes: ['ric.5.sals.'] },
      { id: 'claudius-ii-gothicus', ruler: 'Claudius II Gothicus', reign: 'AD 268-270', aliases: ['Claudius II Gothicus', 'Claudius Gothicus', 'Claudius II'] },
      { id: 'quintillus', ruler: 'Quintillus', reign: 'AD 270', aliases: ['Quintillus'] },
      { id: 'aurelian', ruler: 'Aurelian', reign: 'AD 270-275', aliases: ['Aurelian'] },
      { id: 'tacitus', ruler: 'Tacitus', reign: 'AD 275-276', aliases: ['Tacitus'] },
      { id: 'florian', ruler: 'Florian', reign: 'AD 276', aliases: ['Florian', 'Florianus'] },
      { id: 'probus', ruler: 'Probus', reign: 'AD 276-282', aliases: ['Probus'] },
      { id: 'carus', ruler: 'Carus', reign: 'AD 282-283', aliases: ['Carus'] },
      { id: 'carinus', ruler: 'Carinus', reign: 'AD 283-285', aliases: ['Carinus'] },
      { id: 'numerian', ruler: 'Numerian', reign: 'AD 283-284', aliases: ['Numerian'] },
      { id: 'diocletian', ruler: 'Diocletian', reign: 'AD 284-305', aliases: ['Diocletian'] },
      { id: 'maximian', ruler: 'Maximian', reign: 'AD 286-305', aliases: ['Maximian', 'Maximian Herculius'] },
      { id: 'constantius-i', ruler: 'Constantius I', reign: 'AD 305-306', aliases: ['Constantius I', 'Constantius Chlorus'] },
      { id: 'galerius', ruler: 'Galerius', reign: 'AD 305-311', aliases: ['Galerius'] },
      { id: 'severus-ii', ruler: 'Severus II', reign: 'AD 306-307', aliases: ['Severus II'] },
      { id: 'maxentius', ruler: 'Maxentius', reign: 'AD 306-312', aliases: ['Maxentius'] },
      { id: 'maximinus-ii-daia', ruler: 'Maximinus II Daia', reign: 'AD 310-313', aliases: ['Maximinus II Daia', 'Maximinus Daia'] },
      { id: 'licinius-i', ruler: 'Licinius I', reign: 'AD 308-324', aliases: ['Licinius I', 'Licinius'] },
      { id: 'constantine-i', ruler: 'Constantine I', reign: 'AD 306-337', aliases: ['Constantine I', 'Constantine'] },
      { id: 'constantine-ii', ruler: 'Constantine II', reign: 'AD 337-340', aliases: ['Constantine II'] },
      { id: 'constantius-ii', ruler: 'Constantius II', reign: 'AD 337-361', aliases: ['Constantius II'] },
      { id: 'constans', ruler: 'Constans', reign: 'AD 337-350', aliases: ['Constans'] },
      { id: 'magnentius', ruler: 'Magnentius', reign: 'AD 350-353', aliases: ['Magnentius'] },
      { id: 'julian-ii', ruler: 'Julian II', reign: 'AD 360-363', aliases: ['Julian II', 'Julian the Apostate'] },
      { id: 'jovian', ruler: 'Jovian', reign: 'AD 363-364', aliases: ['Jovian'] },
      { id: 'valentinian-i', ruler: 'Valentinian I', reign: 'AD 364-375', aliases: ['Valentinian I', 'Valentinian'] },
      { id: 'valens', ruler: 'Valens', reign: 'AD 364-378', aliases: ['Valens'] },
      { id: 'gratian', ruler: 'Gratian', reign: 'AD 367-383', aliases: ['Gratian'] },
      { id: 'valentinian-ii', ruler: 'Valentinian II', reign: 'AD 375-392', aliases: ['Valentinian II'] },
      { id: 'theodosius-i', ruler: 'Theodosius I', reign: 'AD 379-395', aliases: ['Theodosius I', 'Theodosius'] },
      { id: 'magnus-maximus', ruler: 'Magnus Maximus', reign: 'AD 383-388', aliases: ['Magnus Maximus'] },
      { id: 'eugenius', ruler: 'Eugenius', reign: 'AD 392-394', aliases: ['Eugenius'] },
      { id: 'arcadius', ruler: 'Arcadius', reign: 'AD 383-408', aliases: ['Arcadius'] },
      { id: 'honorius', ruler: 'Honorius', reign: 'AD 393-423', aliases: ['Honorius'] },
      { id: 'marcian', ruler: 'Marcian', reign: 'AD 450-457', aliases: ['Marcian'] },
      { id: 'leo-i', ruler: 'Leo I', reign: 'AD 457-474', aliases: ['Leo I'] },
      { id: 'leo-ii', ruler: 'Leo II', reign: 'AD 474', aliases: ['Leo II'] },
      { id: 'zeno', ruler: 'Zeno', reign: 'AD 474-491', aliases: ['Zeno', 'Zeno I'] },
    ],
  },
  {
    id: 'four-metals',
    source: 'builtin',
    title: 'Three Metals',
    dates: 'Any era',
    summary: 'Gold, silver, and bronze - one coin struck in each metal.',
    intro: 'Hold the three metals the empire ran on: gold to move, silver to trade, bronze to count. Ruler does not matter - the metal does.',
    historicalNote: "Metal content is exactly what the debasement crises gutted: the denarius went from about 95 perc silver under Augustus to under 5 perc by the Crisis - one reason the antoninianus exists at all.",
    badge: { name: 'Gold, Silver, Bronze', mark: '🥇' },
    ruleLine: 'Matched by the denomination recorded on the coin - OCRE IDs are shown but not used here.',
    requirements: [
      { id: 'gold', ruler: 'Gold', reign: 'Au', aliases: [], fieldMatch: { field: 'denomination', values: ['AV Aureus', 'AV Solidus', 'AV Tremissis', 'Gold'] }, note: 'Aurei, solidi, tremisses - or any coin whose label says gold.' },
      { id: 'silver', ruler: 'Silver', reign: 'Ag', aliases: [], fieldMatch: { field: 'denomination', values: ['AR Denarius', 'AR Antoninianus', 'AR Sestertius', 'AR Quinarius', 'AR Siliqua', 'AR Cistophorus', 'Silver'] }, note: 'Denarii and their descendants.' },
      { id: 'bronze', ruler: 'Bronze', reign: 'Æ', aliases: [], fieldMatch: { field: 'denomination', values: ['Æ Sestertius', 'Æ Dupondius', 'Æ As', 'Æ Semis', 'Æ Quadrans', 'Æ Follis', 'Æ Nummus', 'Æ Centenionalis', 'Æ'], note: '' }, note: 'Sestertii, asses, folles - the change in any pocket.' },
    ],
  },
  {
    id: 'the-denominations',
    source: 'builtin',
    title: 'The Big Denominations',
    dates: 'Any era',
    summary: 'Denarius through follis - fourteen denominations, one coin each.',
    intro: 'Fourteen denominations, one coin each: the vocabulary of imperial money, collected literally. Aspirational but achievable - the aureus will test your wallet.',
    historicalNote: "The bronze sestertius was the unit of account, the denarius the working silver, the aureus the store of wealth; the antoninianus and follis are children of the money crises, struck decades apart.",
    badge: { name: 'Vocabulary of Money', mark: '🔤' },
    ruleLine: 'Matched by the denomination recorded on the coin - OCRE IDs are shown but not used here.',
    requirements: [
      { id: 'denarius', ruler: 'Denarius', reign: '', aliases: [], fieldMatch: { field: 'denomination', values: ['AR Denarius'] } },
      { id: 'aureus', ruler: 'Aureus', reign: '', aliases: [], fieldMatch: { field: 'denomination', values: ['AV Aureus'] } },
      { id: 'sestertius', ruler: 'Sestertius', reign: '', aliases: [], fieldMatch: { field: 'denomination', values: ['Æ Sestertius'] } },
      { id: 'dupondius', ruler: 'Dupondius', reign: '', aliases: [], fieldMatch: { field: 'denomination', values: ['Æ Dupondius'] } },
      { id: 'as', ruler: 'As', reign: '', aliases: [], fieldMatch: { field: 'denomination', values: ['Æ As'] } },
      { id: 'antoninianus', ruler: 'Antoninianus', reign: '', aliases: [], fieldMatch: { field: 'denomination', values: ['AR Antoninianus'] } },
      { id: 'follis', ruler: 'Follis', reign: '', aliases: [], fieldMatch: { field: 'denomination', values: ['Æ Follis'] } },
      { id: 'quinarius', ruler: 'Quinarius', reign: '', aliases: [], fieldMatch: { field: 'denomination', values: ['AR Quinarius'] } },
      { id: 'solidus', ruler: 'Solidus', reign: '', aliases: [], fieldMatch: { field: 'denomination', values: ['AV Solidus'] } },
      { id: 'siliqua', ruler: 'Siliqua', reign: '', aliases: [], fieldMatch: { field: 'denomination', values: ['AR Siliqua'] } },
      { id: 'argenteus', ruler: 'Argenteus', reign: '', aliases: [], fieldMatch: { field: 'denomination', values: ['AR Argenteus'] } },
      { id: 'semis', ruler: 'Semis', reign: '', aliases: [], fieldMatch: { field: 'denomination', values: ['Æ Semis'] } },
      { id: 'quadrans', ruler: 'Quadrans', reign: '', aliases: [], fieldMatch: { field: 'denomination', values: ['Æ Quadrans'] } },
      { id: 'nummus', ruler: 'Nummus', reign: '', aliases: [], fieldMatch: { field: 'denomination', values: ['Æ Nummus'] } },
    ],
  },
  {
    id: 'moneyers',
    source: 'builtin',
    title: 'Moneyers of the Republic',
    dates: '80s-20s BC',
    summary: 'Sulla, Brutus, Marc Antony, Octavian - one CRRO coin from each famous moneyer.',
    intro: "Before emperors, the Roman Republic put history onto coins through moneyers - aristocrats advertising family lineages. Collect the famous four whose reference numbers everyone quotes.",
    historicalNote: "Brutus's EID MAR denarius (RRC 502) is the infamously rare prize of this set; Antony's legionary denarii (RRC 544) are the attainable honor. Moneyers are matched by the name the coin's label records (the CRRO Issuer line).",
    badge: { name: 'Moneyers of the Republic', mark: '🏺' },
    ruleLine: 'Matched by the moneyer name recorded on the coin (the CRRO Issuer line) - OCRE IDs are not used here.',
    requirements: [
      { id: 'sulla', ruler: 'Sulla', reign: 'moneyer c. 81 BC', aliases: ['Sulla', 'Sulla Felix'] },
      { id: 'brutus', ruler: 'Brutus', reign: 'moneyer c. 54-44 BC', aliases: ['Brutus', 'Junius Brutus'] },
      { id: 'marc-antony', ruler: 'Marc Antony', reign: 'moneyer c. 44-32 BC', aliases: ['Marc Antony', 'Marcus Antonius', 'Antony'] },
      { id: 'octavian', ruler: 'Octavian', reign: 'moneyer c. 42-30 BC', aliases: ['Octavian', 'Imperator Caesar'] },
    ],
  },
  {
    id: 'the-deities',
    source: 'builtin',
    title: 'The Twelve Powers',
    dates: 'Any era',
    summary: 'Jupiter, Juno, Minerva, Mars, Neptune, Apollo, Diana, Venus, Mercury, Vesta, Victory, Pax - one reverse each.',
    intro: "The pantheon on the coinage: gather one reverse for each of the twelve powers the mint engravers called on most - the gods that carried the empire's promises, plus the two personifications it leaned on hardest.",
    historicalNote: 'Personifications (Victory, Pax) and true gods (Jupiter, Apollo) live side by side on the coinage precisely because both were exchangeable propaganda: a god promised divine favor, a personification promised policy outcomes.',
    badge: { name: 'The Twelve Powers', mark: '⚡' },
    ruleLine: "Matched by the leading word of the coin's recorded reverse description (e.g. 'Rev: Pax, ...'). Coins without a composed Rev: line cannot count yet.",
    requirements: [
      { id: 'jupiter', ruler: 'Jupiter', reign: '', aliases: [], fieldMatch: { field: 'revDeity', values: ['Jupiter'] } },
      { id: 'juno', ruler: 'Juno', reign: '', aliases: [], fieldMatch: { field: 'revDeity', values: ['Juno'] } },
      { id: 'minerva', ruler: 'Minerva', reign: '', aliases: [], fieldMatch: { field: 'revDeity', values: ['Minerva'] } },
      { id: 'mars', ruler: 'Mars', reign: '', aliases: [], fieldMatch: { field: 'revDeity', values: ['Mars'] } },
      { id: 'apollo', ruler: 'Apollo', reign: '', aliases: [], fieldMatch: { field: 'revDeity', values: ['Apollo'] } },
      { id: 'venus', ruler: 'Venus', reign: '', aliases: [], fieldMatch: { field: 'revDeity', values: ['Venus'] } },
      { id: 'roma', ruler: 'Roma', reign: '', aliases: [], fieldMatch: { field: 'revDeity', values: ['Roma'] } },
      { id: 'sol', ruler: 'Sol', reign: '', aliases: [], fieldMatch: { field: 'revDeity', values: ['Sol'] } },
      { id: 'spes', ruler: 'Spes', reign: '', aliases: [], fieldMatch: { field: 'revDeity', values: ['Spes'] } },
      { id: 'fides', ruler: 'Fides', reign: '', aliases: [], fieldMatch: { field: 'revDeity', values: ['Fides'] } },
      { id: 'victory', ruler: 'Victory', reign: '', aliases: [], fieldMatch: { field: 'revDeity', values: ['Victory'] } },
      { id: 'pax', ruler: 'Pax', reign: '', aliases: [], fieldMatch: { field: 'revDeity', values: ['Pax'] } },
    ],
  },
  {
    id: 'mints-of-the-empire',
    source: 'builtin',
    title: 'Mints of the Empire',
    dates: 'Any era',
    summary: 'Antioch, Lugdunum, Siscia, Ticinum, Thessalonica, Constantinople, Nicomedia, Aquileia - one strike from each mint.',
    intro: "The empire's coin factories from west to east: eight mints, one coin each. Collect the legendary strike locations, identified from the marks the moneyers left in the legends.",
    historicalNote: 'Mint marks are the industrial signatures of imperial struck coinage - short punches like LVD (Lugdunum), SIS (Siscia) or ANT (Antioch) tell you which branch of the state supplied the silver you hold.',
    badge: { name: 'Mints of the Empire', mark: '🏭' },
    ruleLine: "Matched by the mint name or mark recorded on the coin ('Mint: Rome', or legend marks like LVD/ANT). Coins with 'Mint: Unknown' cannot count yet.",
    requirements: [
      { id: 'rome', ruler: 'Rome', reign: 'the seat of the West — mark R', aliases: [], fieldMatch: { field: 'mint', values: ['Rome'] } },
      { id: 'antioch', ruler: 'Antioch', reign: 'mark ANT', aliases: [], fieldMatch: { field: 'mint', values: ['Antioch', 'ANT'] } },
      { id: 'lugdunum', ruler: 'Lugdunum', reign: 'Lyon — marks LVD / LVG', aliases: [], fieldMatch: { field: 'mint', values: ['Lugdunum', 'Lyon', 'LVD', 'LVG'] } },
      { id: 'siscia', ruler: 'Siscia', reign: 'mark SIS', aliases: [], fieldMatch: { field: 'mint', values: ['Siscia', 'SIS'] } },
      { id: 'ticinum', ruler: 'Ticinum', reign: 'marks TI / TIC', aliases: [], fieldMatch: { field: 'mint', values: ['Ticinum', 'TIC'] } },
      { id: 'thessalonica', ruler: 'Thessalonica', reign: 'mark SMT', aliases: [], fieldMatch: { field: 'mint', values: ['Thessalonica', 'SMT'] } },
      { id: 'constantinople', ruler: 'Constantinople', reign: 'mark CONS', aliases: [], fieldMatch: { field: 'mint', values: ['Constantinople', 'CONS'] } },
      { id: 'nicomedia', ruler: 'Nicomedia', reign: 'mark SMN', aliases: [], fieldMatch: { field: 'mint', values: ['Nicomedia', 'SMN'] } },
      { id: 'aquileia', ruler: 'Aquileia', reign: 'mark AQ', aliases: [], fieldMatch: { field: 'mint', values: ['Aquileia', 'AQ'] } },
    ],
  },
  {
    id: 'imperial-women',
    source: 'builtin',
    title: 'The Imperial Women',
    dates: 'AD 98 – AD 491',
    summary: 'Sabina, Faustina Senior and Junior, Lucilla, Julia Domna, Julia Maesa, Julia Mamaea, Otacilia Severa, Salonina, Herennia Etruscilla, Severina - one coin each.',
    intro: "Every dynasty had its power behind the throne - and often ON the throne: the empresses held their own coinage programs for five centuries. Twelve women, one coin each.",
    historicalNote: "Imperial women's issues are formally their own series inside RIC — Faustina Sr. and Jr. both carry long dedicated sequences; Julia Domna's portrait spans her husband's and sons' reigns. Several were deified and struck consecration issues, often the most available denomination for a collector.",
    badge: { name: 'The Imperial Women', mark: '💐' },
    ruleLine: "Matched by the name the coin records — the Ruler/Issuer line, or the obverse portrait ('Obv: Bust of Julia Domna…') — since empress issues carry their emperor's Ruler: line. OCRE IDs inside a woman's own dedicated series also satisfy a requirement.",
    requirements: [
      { id: 'sabina', ruler: 'Sabina', reign: 'AD 128–137', aliases: ['Sabina', 'Vibia Sabina'], ocrePrefixes: ['ric.2.sab.', 'ric.2_3(2).sab.'] },
      { id: 'faustina-senior', ruler: 'Faustina Senior', reign: 'AD 138–141', aliases: ['Faustina Senior', 'Faustina Major', 'Annia Faustina'], ocrePrefixes: ['ric.3.faustina_sen.', 'ric.3.ant.'] },
      { id: 'faustina-junior', ruler: 'Faustina Junior', reign: 'AD 161–175 (as wife from c. 154)', aliases: ['Faustina Junior', 'Faustina Minor', 'Faustina'], ocrePrefixes: ['ric.3.faustina_jr.', 'ric.3.m_aur.'] },
      { id: 'lucilla', ruler: 'Lucilla', reign: 'AD 164–182 (Augusta from 164; struck as wife earlier)', aliases: ['Lucilla'], ocrePrefixes: ['ric.3.lucilla.', 'ric.3.m_aur.'] },
      { id: 'crispina', ruler: 'Crispina', reign: 'AD 178–192', aliases: ['Crispina'] },
      { id: 'julia-domna', ruler: 'Julia Domna', reign: 'AD 193–217', aliases: ['Julia Domna', 'Julia'], ocrePrefixes: ['ric.4.car.', 'ric.4.ss.'] },
      { id: 'julia-maesa', ruler: 'Julia Maesa', reign: 'AD 218–224', aliases: ['Julia Maesa'], ocrePrefixes: ['ric.4.el.', 'ric.4.sa.'] },
      { id: 'julia-soaemias', ruler: 'Julia Soaemias', reign: 'AD 218–222', aliases: ['Julia Soaemias'], ocrePrefixes: ['ric.4.el.'] },
      { id: 'julia-mamaea', ruler: 'Julia Mamaea', reign: 'AD 222–235', aliases: ['Julia Mamaea'], ocrePrefixes: ['ric.4.sa.', 'ric.4.sas.'] },
      { id: 'otacilia-severa', ruler: 'Otacilia Severa', reign: 'AD 244–249', aliases: ['Otacilia Severa'], ocrePrefixes: ['ric.4.oc_s.'], ocreNote: 'RIC IV, Otacilia series (slug "oc_s").' },
      { id: 'salonina', ruler: 'Salonina', reign: 'AD 253–268', aliases: ['Salonina'], ocrePrefixes: ['ric.5.sal.'], ocreNote: 'RIC V, Salonina series.' },
      { id: 'severina', ruler: 'Severina', reign: 'AD 270–275', aliases: ['Severina'] },
    ],
  },
];

export function findQuest(questId) {
  return QUEST_CATALOG.find((quest) => quest.id === questId) ?? null;
}

export function isUncertain(coin) {
  return coin.issuerConfidence === 'uncertain';
}

export function normalizeName(value) {
  return String(value ?? '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

// Who a requirement accepts: the attribution line ("Ruler: Julia Domna")
// or plain issuer field — and the person named on the obverse portrait
// ("Obv: Bust of Julia Domna"). The bust is checked first because it is the
// explicit human subject of the record: empress issues are catalogued under
// their emperor's RIC series, so the card's Ruler: line names the husband
// while the obverse names the woman the coin actually depicts. User-authored
// requirements may use `issuers`; the curated catalog uses `aliases` — both
// count as acceptable names.
function issuerMatchKind(coin, ruler) {
  const names = [...(ruler.aliases ?? []), ...(ruler.issuers ?? [])];
  const bust = normalizeName(bustNameOf(coin));
  if (bust && names.some((alias) => normalizeName(alias) === bust)) return 'bust';
  const name = normalizeName(attributionName(coin) || coin.issuer);
  return names.some((alias) => normalizeName(alias) === name) ? 'alias' : null;
}

function matchesIssuer(coin, ruler) {
  return issuerMatchKind(coin, ruler) !== null;
}

function matchesOcre(coin, ruler) {
  const id = String(coin.ocreId ?? '').trim();
  return id !== '' && (ruler.ocrePrefixes ?? []).some((prefix) => id.startsWith(prefix));
}

// Attribution line — "Ruler: X" (OCRE compose), "Issuer: X" (CRRO/legacy),
// or a leading "(X)" parenthetical on old manual coins. The recorded bust
// name is the authoritative evidence: it wins over id-series guesses.
function attributionName(coin) {
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
}

// Subject named on the obverse portrait — "Obv: Bust of Julia Domna, …".
// Empress issues are catalogued under their emperor's RIC series, so the
// Ruler: line names the husband/son while the obverse names the woman the
// coin actually depicts. The bust name is that woman. Only "Bust of <name>"
// carries a person; bare bust descriptions ("Draped bust right") name
// nobody, and direction words after the name are stripped.
function bustNameOf(coin) {
  const obv = /^Obv:\s*([^\n]+)/m.exec(String(coin.details ?? ''))?.[1];
  if (!obv) return '';
  const m = /bust\s+of\s+([^,.]+)/i.exec(obv);
  if (!m) return '';
  return m[1]
    .replace(/\s+(right|left|facing|bareheaded|laureate|diademed|draped|cuirassed|veiled|helmeted)\b.*$/i, '')
    .trim();
}

// Resolve a name to a ruler id across the whole catalog. Handles every
// curated alias so both coin.issuer and details attribution lines resolve.
function rulerIdForName(value) {
  if (!value) return null;
  const n = normalizeName(value);
  for (const quest of QUEST_CATALOG) {
    for (const ruler of quest.requirements) {
      const names = [...(ruler.aliases ?? []), ...(ruler.issuers ?? []), ruler.ruler];
      if (names.some((alias) => normalizeName(alias) === n)) return ruler.id;
    }
  }
  return null;
}

// The ruler this coin claims to be — attribution line first, issuer
// fallback. Id-series guesses must agree with this or lose.
function bustRulerId(coin) {
  return rulerIdForName(attributionName(coin) || coin.issuer);
}

// Deity signal for reverse-type quests: the reverse description line that
// OCRE compositions record ("Rev: Pax, draped, seated left...") leads with
// the deity/personification's name. Extract the leading word — whitelisted
// requirement values keep nonsense like "Rev: Circular shield" out.
// Honest limits: manual coins often have no Rev: line at all.
function revDeityOf(coin) {
  const m = /^Rev:\s*([A-Za-z]+)/m.exec(String(coin.details ?? ''));
  return m ? m[1] : '';
}

// Mint signal — Numista/OCRE labels record an explicit "Mint: Rome" line;
// legend marks (LVD, SIS...) are the fallback evidence. 'Unknown' lines
// count as no signal at all.
const MINT_NONAMES = new Set(['unknown', 'uncertain', '']);
function mintOf(coin) {
  const m = /^Mint:\s*(.+)$/mi.exec(String(coin.details ?? ''));
  const name = m ? m[1].trim() : '';
  return MINT_NONAMES.has(name.toLowerCase()) ? '' : name;
}
function isMintMark(value) {
  return /^[A-Z]{2,4}$/.test(value) && value === value.toUpperCase();
}

function qualifies(coin, ruler) {
  if (matchesOcre(coin, ruler)) return { type: 'ocre' };
  if (!isUncertain(coin) && matchesIssuer(coin, ruler)) return { type: 'alias' };
  return null;
}

function reasonFor(coin, ruler, type) {
  if (type === 'field') {
    return `${ruler.fieldMatch.field === 'denomination' ? 'Denomination' : ruler.fieldMatch.field} "${coin[ruler.fieldMatch.field]}" satisfies this requirement.`;
  }
  if (type === 'bust') {
    return `The obverse portrait ("Bust of ${bustNameOf(coin)}") depicts ${ruler.ruler}.`;
  }
  if (type === 'ocre') {
    return `OCRE ID ${coin.ocreId} is inside ${ruler.ruler}'s accepted RIC range.`;
  }
  return `Issuer "${coin.issuer}" matches ${ruler.ruler} exactly via a known alias.`;
}

// Evaluate one quest against a collection. Never mutates either input.
// Evaluate one quest against a collection. `claims` maps requirement id →
// coin id: the user's explicit "which of my matches fills this slot"
// decision. Never mutates either input. Claims are honored greedily-first
// so an explicit claim can't be starved by another requirement's default
// pick; a claim whose coin no longer qualifies falls back silently.
export function evaluateQuest(quest, collection, claims = {}) {
  const coinId = (coin) => coin.id;
  const usedCoins = new Set(); // one coin per requirement within the quest
  const fieldMatchFor = (coin, ruler) => {
    if (!ruler.fieldMatch) return null;
    let value;
    if (ruler.fieldMatch.field === 'revDeity') {
      value = revDeityOf(coin);
    } else if (ruler.fieldMatch.field === 'mint') {
      const mintName = normalizeName(mintOf(coin));
      const wanted = ruler.fieldMatch.values ?? [];
      const nameHit = mintName && wanted.some((zone) => normalizeName(zone) === mintName);
      if (nameHit) return 'field';
      // Marks: uppercase short codes (ANT, SIS...) — tested against the
      // legend tokens.
      const text = [coin.legendObv, coin.legendRev, coin.details].filter(Boolean).join(' ').toUpperCase();
      const tokens = new Set(text.match(/\b[A-Z]{2,4}\b/g) ?? []);
      const markHit = wanted.some((zone) => isMintMark(zone) && tokens.has(zone));
      return markHit ? 'field' : null;
    } else {
      value = coin[ruler.fieldMatch.field];
    }
    const values = (ruler.fieldMatch.values ?? []).map((value2) => normalizeName(value2));
    return values.includes(normalizeName(value)) ? 'field' : null;
  };

  // Pass 1 — collect candidates per requirement.
  const perReq = quest.requirements.map((ruler, index) => {
    const candidates = [];
    const uncertain = [];
    for (const coin of collection) {
      const fieldMatch = fieldMatchFor(coin, ruler);
      const nameMatch = matchesIssuer(coin, ruler);
      const ocreMatch = matchesOcre(coin, ruler);
      // Doctrine (2026-10-25): a clear bust/authority claim wins. If the coin
      // claims to be a recognised catalog person, but that person's names are
      // NOT in this slot's alias list, an id-series guess cannot override the
      // bust — the coin simply does not qualify here (nothing miscounts).
      // The obverse portrait is evidence too (2026-10-26): empress issues
      // carry their emperor's "Ruler:" line, so the woman is claimed by the
      // "Bust of <X>" description — that claim satisfies her slot directly.
      const claim = attributionName(coin) || coin.issuer;
      const clearlyClaimsAPerson = rulerIdForName(claim) != null;
      const bustClaimsElsewhere = clearlyClaimsAPerson && !nameMatch;
      if (isUncertain(coin)) {
        // An id inside the accepted series is independent evidence — it
        // counts even when the attribution is marked uncertain (unless the
        // bust claims elsewhere). A name match alone on an uncertain coin is
        // a possible match, never counted until confirmed. A physical
        // attribute (metal, size) is not an attribution — it counts
        // regardless of confidence.
        if (fieldMatch) {
          candidates.push({ coin, type: 'field' });
        } else if (ocreMatch && !bustClaimsElsewhere) {
          candidates.push({ coin, type: 'ocre' });
        } else if (nameMatch) {
          uncertain.push({
            coin,
            reason: `Attribution is marked uncertain — taken as "${ruler.ruler}", not counted yet.`,
          });
        }
        continue;
      }
      if (bustClaimsElsewhere && !ruler.fieldMatch) continue; // the bust wins — someone else's coin (ruler slots only)
      if (fieldMatch) {
        candidates.push({ coin, type: 'field' });
      } else if (nameMatch || ocreMatch) {
        candidates.push({ coin, type: ocreMatch ? 'ocre' : issuerMatchKind(coin, ruler) });
      }
    }
    return { ruler, index, candidates, uncertain };
  });

  // Pass 2 — assign coins. Claimed requirements first, then greedy order.
  const slot = (id) => (claims[id] && collection.find((coin) => coin.id === claims[id])) || null;
  const assigned = new Map();
  for (const pass of ['claimed', 'default']) {
    for (const item of perReq) {
      const { ruler, index, candidates, uncertain } = item;
      const entry = {
        id: ruler.id,
        ruler: ruler.ruler,
        reign: ruler.reign,
        note: ruler.note ?? '',
        position: index + 1,
        status: 'missing',
        coin: null,
        reason: null,
        matchType: null,
        claimed: claims[ruler.id] != null,
        alternates: 0,
        alternateCoins: [],
        possibleMatches: [],
      };
      if (pass === 'claimed') {
        const claimedCoin = assigned.has(item.ruler.id) ? null : slot(item.ruler.id);
        const valid =
          claimedCoin &&
          !usedCoins.has(coinId(claimedCoin)) &&
          candidates.some(({ coin }) => coinId(coin) === coinId(claimedCoin));
        if (!valid) continue; // claim absent/invalid — leave for the default pass
        const chosen = candidates.find(({ coin }) => coinId(coin) === coinId(claimedCoin));
        assigned.set(item.ruler.id, chosen.coin);
        usedCoins.add(coinId(chosen.coin));
        item.entry = { ...entry, status: 'collected' };
        item.chosen = chosen;
        item.claimed = true;
        continue;
      }
      if (item.claimed) {
        // Claimed slot already decided in pass 1 — finish it here with
        // its alternates.
        const chosen = item.chosen;
        item.entry.coin = chosen.coin;
        item.entry.reason = reasonFor(chosen.coin, ruler, chosen.type);
        item.entry.matchType = chosen.type;
        item.entry.alternateCoins = candidates
          .filter(({ coin }) => coinId(coin) !== coinId(chosen.coin))
          .map(({ coin }) => coin);
        item.entry.alternates = item.entry.alternateCoins.length;
        continue;
      }
      item.entry = entry;
      const available = candidates.filter(({ coin }) => !usedCoins.has(coinId(coin)));
      if (available.length > 0) {
        const chosen = available[0];
        assigned.set(item.ruler.id, chosen.coin);
        usedCoins.add(coinId(chosen.coin));
        item.entry.status = 'collected';
        item.entry.coin = chosen.coin;
        item.entry.reason = reasonFor(chosen.coin, ruler, chosen.type);
        item.entry.matchType = chosen.type;
        item.entry.alternateCoins = available.slice(1).map(({ coin }) => coin);
        item.entry.alternates = item.entry.alternateCoins.length;
      } else if (uncertain.length > 0) {
        item.entry.status = 'review';
        item.entry.possibleMatches = uncertain;
      }
    }
  }
  const requirements = perReq.map((item) => item.entry);

  const collected = requirements.filter((r) => r.status === 'collected').length;
  const review = requirements.filter((r) => r.status === 'review').length;
  const total = requirements.length;
  const complete = collected === total;
  const firstOpen = complete ? null : requirements.find((r) => r.status !== 'collected');
  return {
    quest,
    requirements,
    collected,
    review,
    missing: total - collected - review,
    total,
    complete,
    badgeEarned: complete,
    percent: total ? Math.round((collected / total) * 100) : 0,
    next: firstOpen
      ? { id: firstOpen.id, ruler: firstOpen.ruler, status: firstOpen.status }
      : null,
  };
}

export function evaluateAllQuests(catalog, collection, claims = {}) {
  // claims: { [questId]: { [requirementId]: coinId } } — the user's pick of
  // which matching coin fills each slot.
  const results = catalog.map((quest) => evaluateQuest(quest, collection, claims[quest.id] ?? {}));
  const requirementsTotal = results.reduce((sum, r) => sum + r.total, 0);
  const requirementsMet = results.reduce((sum, r) => sum + r.collected, 0);
  const questsComplete = results.filter((r) => r.complete).length;
  return {
    results,
    summary: {
      coins: collection.length,
      questsTotal: results.length,
      questsComplete,
      requirementsTotal,
      requirementsMet,
      percent: requirementsTotal ? Math.round((requirementsMet / requirementsTotal) * 100) : 0,
      badgesEarned: questsComplete,
    },
  };
}

// Sixteen coins telling a fixed progress story:
//  - five-good: 3 collected (Nerva ×2 — one alternate, Trajan — with a
//    Trajan Decius distractor that must NOT count — Hadrian), Antoninus
//    marked uncertain ⇒ review, Marcus missing.
//  - twelve-caesars: 9 collected (Caesar via CRRO reference, Augustus,
//    Tiberius, Gaius, Claudius, plus the four shared Year-of-Four coins),
//    Titus uncertain ⇒ review, Nero and Domitian missing, Nero is next.
//  - year-of-four: all four collected ⇒ complete, badge earned.
export const SEED_COLLECTION = [
  { id: 'c-caesar', issuer: 'Julius Caesar', issuerConfidence: 'certain', denomination: 'AR Denarius', year: '44 BC', grade: 'VF', reference: 'RRC 480/4', ocreId: 'rrc-480.1a', acquired: '2023-11-20', note: 'Priestly implements reverse — P. Sepullius Macer moneyer.' },
  { id: 'c-augustus', issuer: 'Augustus', issuerConfidence: 'certain', denomination: 'AR Denarius', year: '17 BC', grade: 'VF', reference: 'RIC I 36', ocreId: 'ric.1(2).aug.36', acquired: '2024-09-12', note: 'Gaius and Lucius Caesars reverse, shields and spears.' },
  { id: 'c-tiberius', issuer: 'Tiberius', issuerConfidence: 'certain', denomination: 'AR Denarius', year: 'AD 34', grade: 'VF', reference: 'RIC I 26', ocreId: 'ric.1(2).tib.26', acquired: '2022-05-30', note: 'Tribute penny — Livia as Pax seated.' },
  { id: 'c-gaius', issuer: 'Gaius', issuerConfidence: 'certain', denomination: 'Æ As', year: 'AD 37', grade: 'F', reference: 'RIC I 39', ocreId: 'ric.1(2).gai.39', acquired: '2024-10-04', note: 'Vesta reverse with SC.' },
  { id: 'c-claudius', issuer: 'Claudius', issuerConfidence: 'certain', denomination: 'Æ Sestertius', year: 'AD 50', grade: 'VF', reference: 'RIC I 92', ocreId: 'ric.1(2).clau.92', acquired: '2023-08-15', note: 'SPQR within wreath reverse; dark patina.' },
  { id: 'c-galba', issuer: 'Galba', issuerConfidence: 'certain', denomination: 'AR Denarius', year: 'AD 68', grade: 'F', reference: 'RIC I 75', ocreId: 'ric.1(2).gal.75', acquired: '2024-06-08', note: 'Legio VII gemina issue.' },
  { id: 'c-otho', issuer: 'Otho', issuerConfidence: 'certain', denomination: 'AR Denarius', year: 'AD 69', grade: 'F', reference: 'RIC I 8', ocreId: 'ric.1(2).ot.8', acquired: '2025-04-02', note: 'Securitas reverse — three months of strikes.' },
  { id: 'c-vitellius', issuer: 'Vitellius', issuerConfidence: 'certain', denomination: 'AR Denarius', year: 'AD 69', grade: 'AG', reference: 'RIC I 48', ocreId: 'ric.1(2).vit.48', acquired: '2026-02-14', note: 'Victory seated left; the hard one — Germania mint.' },
  { id: 'c-vespasian', issuer: 'Vespasian', issuerConfidence: 'certain', denomination: 'AR Denarius', year: 'AD 74', grade: 'VF', reference: 'RIC II 532', ocreId: 'ric.2_1(2).ves.532', acquired: '2024-02-11', note: 'Judaea capta series.' },
  { id: 'c-titus', issuer: 'Titus', issuerConfidence: 'uncertain', denomination: 'AR Denarius', year: 'AD 80', grade: 'aVF', reference: 'RIC II 115?', ocreId: '', acquired: '2025-09-18', note: 'Purchased as Titus dove reverse, but the seller record is thin — leaving uncounted until verified.' },
  { id: 'c-nerva-1', issuer: 'Nerva', issuerConfidence: 'certain', denomination: 'AR Denarius', year: 'AD 97', grade: 'VF', reference: 'RIC II 21', ocreId: 'ric.2.ner.21', acquired: '2023-03-22', note: 'Fortuna reverse.' },
  { id: 'c-nerva-2', issuer: 'Nerva', issuerConfidence: 'certain', denomination: 'Æ Sestertius', year: 'AD 97', grade: 'F', reference: 'RIC II 76', ocreId: 'ric.2.ner.76', acquired: '2025-05-09', note: 'Second Nerva — only one coin can count.' },
  { id: 'c-trajan', issuer: 'Trajan', issuerConfidence: 'certain', denomination: 'AR Denarius', year: 'AD 112', grade: 'VF', reference: 'RIC II 371', ocreId: 'ric.2.tr.371', acquired: '2024-02-27', note: 'Pax standing left; ex Collection.' },
  { id: 'c-trajan-decius', issuer: 'Trajan Decius', issuerConfidence: 'certain', denomination: 'AR Antoninianus', year: 'AD 250', grade: 'F', reference: 'RIC IV 24', ocreId: 'ric.4.trd.24', acquired: '2025-11-02', note: 'No relation — exact matching keeps the Decius out.' },
  { id: 'c-hadrian', issuer: 'Hadrian', issuerConfidence: 'certain', denomination: 'AR Denarius', year: 'AD 125', grade: 'VF', reference: 'RIC II 405', ocreId: 'ric.2_3(2).hdn.405', acquired: '2024-12-13', note: 'Aeternitas reverse.' },
  { id: 'c-antoninus', issuer: 'Antoninus Pius', issuerConfidence: 'uncertain', denomination: 'Æ Sestertius', year: 'AD 148', grade: 'VF', reference: 'RIC III 658?', ocreId: '', acquired: '2026-01-19', note: 'Beautiful TR POT COS III, but I want to double-check the attribution before it counts.' },
];

export default {
  QUEST_CATALOG,
  SEED_COLLECTION,
  evaluateAllQuests,
  evaluateQuest,
  findQuest,
  isUncertain,
  normalizeName,
};
