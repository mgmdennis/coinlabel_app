const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/requireAuth');
const { getQuests } = require('../controllers/questController');

router.get('/quests', requireAuth, getQuests);

module.exports = router;
