const express = require("express");

const router = express.Router();

const { getCoins, getCoin, getNumistaDetails, createCoin, updateCoin, deleteCoin, bulkSetCached } = require("../controllers/coinController");

router.get("/coins", getCoins);

router.get("/numista/:numistaNumber", getNumistaDetails);

router.get("/coin/:id", getCoin);

router.post("/coin/new", createCoin);

router.put("/coin/update/:id", updateCoin);

router.delete("/coin/delete/:id", deleteCoin);

router.patch("/coins/cache", bulkSetCached);

module.exports = router;
