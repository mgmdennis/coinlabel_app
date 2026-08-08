const express = require("express");

const router = express.Router();


const requireAuth = require('../middleware/requireAuth');
const { getCoins, getCoin, getNumistaDetails, createCoin, updateCoin, deleteCoin, bulkSetCached, getCollectionItems } = require("../controllers/coinController");

router.get("/coins", requireAuth, getCoins);

router.get("/coins/collection", requireAuth, getCollectionItems);

router.get("/numista/:numistaNumber", getNumistaDetails);

router.get("/coin/:id", requireAuth, getCoin);

router.post("/coin/new", requireAuth, createCoin);

router.put("/coin/update/:id", requireAuth, updateCoin);

router.delete("/coin/delete/:id", requireAuth, deleteCoin);

router.patch("/coins/cache", requireAuth, bulkSetCached);

module.exports = router;
