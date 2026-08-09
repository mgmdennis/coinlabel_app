const Coin = require("../models/coinModel");

const numista = require("./numista_scrape");

const getCoins = async (req, res) => {
  const coins = await Coin.find({ userId: req.session.userId });
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
  const coins = await Coin.find({ userId: req.session.userId, isCollectionItem: true });
  res.json(coins);
};

exports.getCollectionItems = getCollectionItems;
