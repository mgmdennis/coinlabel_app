const express = require("express");

const router = express.Router();

const { getCoins, getCoin, getNumistaDetails, createCoin, updateCoin, deleteCoin } = require("../controllers/coinController");

router.get("/coins", getCoins);

router.get("/numista/:numistaNumber", getNumistaDetails);

router.get("/coin/:id", getCoin);

router.post("/coin/new", createCoin);

router.put("/coin/update/:id", updateCoin);

router.delete("/coin/delete/:id", deleteCoin);

module.exports = router;
