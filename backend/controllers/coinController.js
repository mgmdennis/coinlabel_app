const Coin = require("../models/coinModel");

const numista = require("./numista_scrape");

const getCoins = async (req, res) => {
  const coins = await Coin.find();

  console.log("get Coins called");
  res.json(coins);
};

const getCoin = async (req, res) => {
  const coin = await Coin.findById(req.params.id)
  res.json(coin)
};

const getNumistaDetails = async (req, res) => {
  const numistaNumber = req.params.numistaNumber;
  const details = await numista.getNumistaDetailsJSON(numistaNumber);

  console.log("Numista Number: ", numistaNumber);

  res.json(details);
}

const createCoin = (req, res) => {
  const coin = new Coin({
    numistaNumber: req.body.numistaNumber,
    year: req.body.year,
    issuer: req.body.issuer,
    denomination: req.body.denomination,
    grade: req.body.grade,
    gradeDetails: req.body.gradeDetails,
    details: req.body.details,
    reference: req.body.reference,
    composition: req.body.composition,
    mass: req.body.mass,
    diameter: req.body.diameter,
    orientation: req.body.orientation,
    mintage: req.body.mintage,
    dateAdded: req.body.dateAdded,
    marksPicture: req.body.marksPicture,
  });

  coin.save();
  res.json(coin);
};

const updateCoin = async (req, res) => {
  const coin = await Coin.findByIdAndUpdate(req.params.id, req.body, { new: true })
  res.json(coin)
}

const deleteCoin = async (req, res) => {
  const deletedCoin = await Coin.findByIdAndDelete(req.params.id)
  res.json(deletedCoin)
}

exports.getCoins = getCoins;
exports.getCoin = getCoin;
exports.createCoin = createCoin;
exports.updateCoin = updateCoin;
exports.deleteCoin = deleteCoin;
exports.getNumistaDetails = getNumistaDetails;
