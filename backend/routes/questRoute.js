const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/requireAuth');
const { getQuests, setQuestPick } = require('../controllers/questController');

router.get('/quests', requireAuth, getQuests);
router.post('/quests/pick', requireAuth, setQuestPick);

module.exports = router;
