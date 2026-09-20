const Coin = require("../models/coinModel");
const mongoose = require("mongoose");
const crypto = require("crypto");

const numista = require("./numista_scrape");

/**
 * Stable cache key for a stored photo. Distinct from the doc's updatedAt so
 * unrelated field edits don't evict the browser's cached image.
 */
const imageVersion = (value) =>
  value ? crypto.createHash('md5').update(String(value)).digest('hex').slice(0, 12) : '';

/**
 * Response view without the heavy base64 photos — clients already hold them
 * locally (or fetch via /coin/:id/image/:side), so echoing them back on every
 * save wastes bandwidth and server memory.
 */
const stripImages = (doc) => {
  const o = doc.toObject ? doc.toObject() : { ...doc };
  delete o.collectionObvImage;
  delete o.collectionRevImage;
  return o;
};

const getCoins = async (req, res) => {
  // List view: never transfer the base64 collection photos over the wire —
  // pulling every stored photo (~2MB per side) into the dyno on every list
  // load blew Heroku's 30s router limit (H12). Photos are served per-coin
  // (and cacheably) from /coin/:id/image/:side; detail pages use /coin/:id.
  const coins = await Coin.find({ userId: req.session.userId })
    .select("-collectionObvImage -collectionRevImage")
    .lean();
  res.json(coins);
};

const getCoin = async (req, res) => {
  const coin = await Coin.findOne({ _id: req.params.id, userId: req.session.userId });
  if (!coin) return res.status(404).json({ error: 'Not found' });
  res.json(coin);
};

const getNumistaDetails = async (req, res) => {
  const numistaNumber = req.params.numistaNumber;
  const details = await numista.getNumistaDetailsJSON(numistaNumber);

  console.log("Numista Number: ", numistaNumber);

  if (details.error) {
    const status = details.status || (details.category === 'banknote' ? 422 : 400);
    return res.status(status).json({ error: details.error });
  }

  res.json(details);
}

const createCoin = async (req, res) => {
  const body = { ...req.body, userId: req.session.userId };
  if ('collectionObvImage' in body) body.obvImageVersion = imageVersion(body.collectionObvImage);
  if ('collectionRevImage' in body) body.revImageVersion = imageVersion(body.collectionRevImage);
  const coin = new Coin(body);
  await coin.save();
  res.json(stripImages(coin));
};

const updateCoin = async (req, res) => {
  const update = { ...req.body };
  if ('collectionObvImage' in update) update.obvImageVersion = imageVersion(update.collectionObvImage);
  if ('collectionRevImage' in update) update.revImageVersion = imageVersion(update.collectionRevImage);
  const coin = await Coin.findOneAndUpdate(
    { _id: req.params.id, userId: req.session.userId },
    update,
    { new: true }
  );
  if (!coin) return res.status(404).json({ error: 'Not found' });
  res.json(stripImages(coin));
}

const deleteCoin = async (req, res) => {
  const coin = await Coin.findOneAndDelete({ _id: req.params.id, userId: req.session.userId });
  res.json(stripImages(coin));
}

// Detach the label from a collection item — clears label-specific fields
// and sets hasLabel=false, but preserves the collection item.
const detachLabel = async (req, res) => {
  const LABEL_FIELDS = {
    hasLabel: false,
    visualTarget: 'QR',
    visualMethod: 'SCRIPT',
    sketchId: '',
    marks: [],
    marksPicture: null,
    cached: false,
  };
  const coin = await Coin.findOneAndUpdate(
    { _id: req.params.id, userId: req.session.userId },
    { $set: LABEL_FIELDS },
    { new: true }
  );
  if (!coin) return res.status(404).json({ error: 'Not found' });
  res.json(stripImages(coin));
};

const bulkSetCached = async (req, res) => {
  const { ids, cached } = req.body;
  if (!Array.isArray(ids) || typeof cached !== 'boolean') {
    return res.status(400).json({ error: 'ids (array) and cached (boolean) are required' });
  }
  await Coin.updateMany({ _id: { $in: ids }, userId: req.session.userId }, { $set: { cached } });
  res.json({ updated: ids.length });
};

exports.getCoins = getCoins;
exports.getCoin = getCoin;
exports.createCoin = createCoin;
exports.updateCoin = updateCoin;
exports.deleteCoin = deleteCoin;
exports.detachLabel = detachLabel;
exports.bulkSetCached = bulkSetCached;
exports.getNumistaDetails = getNumistaDetails;

const getCollectionItems = async (req, res) => {
  // Compute photo presence server-side and exclude the base64 payloads from
  // the response — same H12 protection as getCoins. $strLenCP evaluates
  // inside MongoDB, so the multi-megabyte strings never reach the dyno.
  // (Raw aggregation needs an explicit ObjectId cast — no mongoose coercion.)
  const userId = mongoose.isValidObjectId(req.session.userId)
    ? new mongoose.Types.ObjectId(req.session.userId)
    : req.session.userId;
  const coins = await Coin.aggregate([
    { $match: { userId, isCollectionItem: true } },
    {
      $addFields: {
        hasObvImage: { $gt: [{ $strLenCP: { $ifNull: ["$collectionObvImage", ""] } }, 0] },
        hasRevImage: { $gt: [{ $strLenCP: { $ifNull: ["$collectionRevImage", ""] } }, 0] },
      },
    },
    { $project: { collectionObvImage: 0, collectionRevImage: 0 } },
  ]);
  res.json(coins);
};

exports.getCollectionItems = getCollectionItems;

// Serve a single collection photo as binary with long-lived caching.
// `updatedAt` is used as a cache-bust query param by the frontend, so
// re-uploading a photo gets a fresh URL while unchanged photos stay cached.
const getCoinImage = async (req, res) => {
  const isObv = req.params.side === 'obv';
  const field = isObv ? 'collectionObvImage' : req.params.side === 'rev' ? 'collectionRevImage' : null;
  const versionField = isObv ? 'obvImageVersion' : 'revImageVersion';
  if (!field) return res.status(400).json({ error: 'side must be obv or rev' });
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).end();
  const coin = await Coin.findOne({ _id: req.params.id, userId: req.session.userId }).select(`${field} ${versionField}`).lean();
  const value = coin && coin[field];
  if (!value) return res.status(404).end();
  // Legacy docs have no image version yet — backfill it once so list views
  // can build stable cache-bust URLs (fire-and-forget, never blocks the send).
  if (coin && !coin[versionField]) {
    Coin.updateOne(
      { _id: coin._id, [versionField]: { $in: ['', null] } },
      { $set: { [versionField]: imageVersion(value) } }
    ).catch(() => {});
  }
  let contentType = 'image/jpeg';
  let b64 = value;
  const dataUrl = /^data:(image\/[a-z0-9.+-]+);base64,(.+)$/is.exec(value);
  if (dataUrl) {
    contentType = dataUrl[1];
    b64 = dataUrl[2];
  }
  const buffer = Buffer.from(b64, 'base64');
  if (buffer.length === 0) return res.status(404).end();
  res.set('Content-Type', contentType);
  res.set('Cache-Control', 'private, max-age=31536000, immutable');
  res.send(buffer);
};

exports.getCoinImage = getCoinImage;
