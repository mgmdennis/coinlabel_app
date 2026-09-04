const Coin = require("../models/coinModel");
const mongoose = require("mongoose");

const numista = require("./numista_scrape");

const getCoins = async (req, res) => {
  const coins = await Coin.find({ userId: req.session.userId }).lean();
  // Strip base64 collection photos by default to keep the response small.
  // Frontend passes ?includeCollectionImages=1 for the My Collection view.
  if (req.query.includeCollectionImages !== '1') {
    for (const c of coins) {
      delete c.collectionObvImage;
      delete c.collectionRevImage;
    }
  }
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
  const coin = new Coin({
    ...req.body,
    userId: req.session.userId
  });
  await coin.save();
  res.json(coin);
};

const updateCoin = async (req, res) => {
  const coin = await Coin.findOneAndUpdate(
    { _id: req.params.id, userId: req.session.userId },
    req.body,
    { new: true }
  );
  if (!coin) return res.status(404).json({ error: 'Not found' });
  res.json(coin);
}

const deleteCoin = async (req, res) => {
  const coin = await Coin.findOneAndDelete({ _id: req.params.id, userId: req.session.userId });
  res.json(coin);
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
  res.json(coin);
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
  const coins = await Coin.find({ userId: req.session.userId, isCollectionItem: true }).lean();
  // Serve image presence as booleans — the photos themselves come from
  // /coin/:id/image/:side so the browser can cache them individually.
  const stripped = coins.map(c => {
    const { collectionObvImage, collectionRevImage, ...rest } = c;
    return { ...rest, hasObvImage: !!collectionObvImage, hasRevImage: !!collectionRevImage };
  });
  res.json(stripped);
};

exports.getCollectionItems = getCollectionItems;

// Serve a single collection photo as binary with long-lived caching.
// `updatedAt` is used as a cache-bust query param by the frontend, so
// re-uploading a photo gets a fresh URL while unchanged photos stay cached.
const getCoinImage = async (req, res) => {
  const field = req.params.side === 'obv' ? 'collectionObvImage'
    : req.params.side === 'rev' ? 'collectionRevImage'
    : null;
  if (!field) return res.status(400).json({ error: 'side must be obv or rev' });
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).end();
  const coin = await Coin.findOne({ _id: req.params.id, userId: req.session.userId }).select(field).lean();
  const value = coin && coin[field];
  if (!value) return res.status(404).end();
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
