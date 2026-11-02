// Export a slice of the live collection (with photos) as a prototype demo
// cabinet for quest_concept/. Read-only against Mongo — this script never
// writes to the database. It produces:
//   quest_concept/real-coins.json
//   quest_concept/coins/<base>.obv.jpg / .rev.jpg  (≤512px JPEGs)
//
// Run: MONGODB_URI="$(heroku config:get MONGODB_URI -a coinlabelapp)" \
//        node backend/scripts/exportQuestDemoCoins.js
// (without the env var it falls back to the repo .env, i.e. the test db)
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '..', '.env') });
const fs = require('fs');
const mongoose = require('mongoose');
const { execSync } = require('child_process');

const OUT_DIR = path.resolve(__dirname, '..', '..', 'quest_concept');
const IMG_DIR = path.join(OUT_DIR, 'coins');
const LIMIT = 16;

// "Ruler: X" / "Issuer: X" / legacy "(X)" attribution line — same extraction
// the production matcher uses; the quest engine matches coin.issuer, so the
// export promotes the ruler/moneyer into it.
const rulerNameOf = (coin) => {
  const details = String(coin.details || '');
  for (const re of [/^Ruler:\s*([^\n]+)/m, /^Issuer:\s*([^\n]+)/m, /^\(([^)\n]+)\)/m]) {
    const m = re.exec(details);
    if (m) {
      const name = m[1].trim().replace(/\s*—.*$/, '');
      if (name) return name;
    }
  }
  return '';
};

const pretty = (value) => String(value ?? '').trim();
const isUncertain = (coin) => /\?\s*$/.test(pretty(coin.reference)) || /probably|uncertain/i.test(String(coin.details || ''));

(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  const col = mongoose.connection.collection('coins');
  const docs = await col
    .find({ isCollectionItem: true })
    .sort({ updatedAt: -1, _id: -1 })
    .limit(40)
    .toArray();
  if (!fs.existsSync(IMG_DIR)) fs.mkdirSync(IMG_DIR, { recursive: true });

  // Clean slate each export — stale image files never linger.
  for (const old of fs.readdirSync(IMG_DIR)) fs.unlinkSync(path.join(IMG_DIR, old));

  const { createHash } = require('crypto');
  const coins = [];
  for (const doc of docs) {
    if (coins.length >= LIMIT) break;
    const fileBase = 'coin-' + createHash('md5').update(doc._id.toString()).digest('hex').slice(0, 10);
    let hasImage = false;
    const entry = {
      id: doc._id.toString(),
      issuer: rulerNameOf(doc) || doc.issuer || 'Uncertain',
      issuerConfidence: isUncertain(doc) ? 'uncertain' : 'certain',
      denomination: doc.denomination || '',
      year: doc.year || '',
      grade: doc.grade || '',
      reference: (doc.reference || '').replace(/\n+/g, ' '),
      ocreId: doc.ocreId || '',
      acquired: (doc.updatedAt || new Date()).toISOString().slice(0, 10),
      note: String(doc.details || '').split('\n').slice(0, 3).join(' — ').replace(/\s+/g, ' ').slice(0, 140),
      details: String(doc.details || '').slice(0, 800),
      legendObv: doc.legendObv || '',
      legendRev: doc.legendRev || '',
      imageObv: '',
      imageRev: '',
    };
    for (const [side, field] of [['obv', 'collectionObvImage'], ['rev', 'collectionRevImage']]) {
      const payload = String(doc[field] || '').replace(/^data:image\/\w+;base64,/, '');
      if (payload.length < 200) continue; // placeholder stubs in old records
      const tmpAbs = path.join(IMG_DIR, fileBase + '.tmp');
      const jpgAbs = path.join(IMG_DIR, `${fileBase}.${side}.jpg`);
      try {
        fs.writeFileSync(tmpAbs, Buffer.from(payload, 'base64'));
        execSync(`sips -s format jpeg -Z 512 "${tmpAbs}" --out "${jpgAbs}"`);
        if (!fs.existsSync(jpgAbs) || fs.statSync(jpgAbs).size === 0) {
          throw new Error('sips produced no output');
        }
        fs.unlinkSync(tmpAbs);
        entry[`image${side === 'obv' ? 'Obv' : 'Rev'}`] = `coins/${fileBase}.${side}.jpg`;
        hasImage = true;
      } catch (err) {
        console.error(`  ! image failed for ${fileBase}.${side}:`, err.message);
        if (fs.existsSync(tmpAbs)) fs.unlinkSync(tmpAbs);
        if (fs.existsSync(jpgAbs) && fs.statSync(jpgAbs).size === 0) fs.unlinkSync(jpgAbs);
      }
    }
    if (hasImage) coins.push(entry);
  }

  fs.writeFileSync(
    path.join(OUT_DIR, 'real-coins.json'),
    JSON.stringify({ exported: new Date().toISOString().slice(0, 10), coins }, null, 2)
  );
  console.log(`Exported ${coins.length} real coins to quest_concept/real-coins.json`);
  await mongoose.disconnect();
})().catch((err) => { console.error(err); process.exit(1); });
