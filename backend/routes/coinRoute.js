const express = require("express");

const router = express.Router();


const requireAuth = require('../middleware/requireAuth');
const { getCoins, getCoin, getNumistaDetails, createCoin, updateCoin, deleteCoin, bulkSetCached, updateCoinTheme, getCoinTheme } = require("../controllers/coinController");
// Get or update just the labelTheme for a coin
router.get("/coin/:id/theme", requireAuth, getCoinTheme);
router.patch("/coin/:id/theme", requireAuth, updateCoinTheme);

router.get("/coins", requireAuth, getCoins);

router.get("/numista/:numistaNumber", getNumistaDetails);

router.get("/coin/:id", requireAuth, getCoin);

router.post("/coin/new", requireAuth, createCoin);

router.put("/coin/update/:id", requireAuth, updateCoin);

router.delete("/coin/delete/:id", requireAuth, deleteCoin);

router.patch("/coins/cache", requireAuth, bulkSetCached);

module.exports = router;
