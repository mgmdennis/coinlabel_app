const mongoose = require('mongoose');
const Coin = require('../models/coinModel');
const { matchQuests } = require('../quests/questMatcher');

// Quest progress is computed live from the collection on every request —
// there are no stored progress records to drift out of sync when coins
// are added, edited, or deleted. Photo presence is computed server-side
// with $strLenCP and the base64 payloads are excluded from the projection —
// same H12 discipline as getCoins/getCollectionItems. (Raw aggregation
// needs an explicit ObjectId cast — no mongoose coercion.)
const getQuests = async (req, res) => {
  try {
    const userId = mongoose.isValidObjectId(req.session.userId)
      ? new mongoose.Types.ObjectId(req.session.userId)
      : req.session.userId;
    const coins = await Coin.aggregate([
      { $match: { userId } },
      {
        $addFields: {
          hasObvImage: { $gt: [{ $strLenCP: { $ifNull: ['$collectionObvImage', ''] } }, 0] },
          hasRevImage: { $gt: [{ $strLenCP: { $ifNull: ['$collectionRevImage', ''] } }, 0] },
        },
      },
      { $project: { collectionObvImage: 0, collectionRevImage: 0 } },
    ]);

    // Coin dialogue mode (?coin=:id): evaluate against the FULL collection
    // allocation so the popup knows whether this coin is the counting coin
    // for a slot, an unpicked alternate (→ offer "make this the counting
    // coin"), or parked for review.
    if (req.query.coin) {
      const coinId = String(req.query.coin);
      const single = coins.filter((c) => String(c._id) === coinId);
      if (single.length === 0) return res.status(404).json({ error: 'Coin not found' });
      const results = matchQuests(coins).flatMap((q) => {
        const items = [];
        for (const req2 of q.requirements) {
          if (req2.status === 'collected' && req2.coin) {
            const isCounted = String(req2.coin._id ?? req2.coin.id) === coinId;
            const isCandidate = (req2.candidates || []).some((c) => String(c.id) === coinId);
            if (!isCounted && !isCandidate) continue;
            items.push({
              questId: q.id,
              questTitle: q.title,
              badge: q.badge,
              requirementId: req2.id,
              name: req2.name,
              status: 'collected',
              counted: isCounted,
              picked: !!req2.picked,
              matchReason: req2.matchReason,
            });
          } else if (req2.status === 'review' && req2.coin && String(req2.coin._id) === coinId) {
            items.push({
              questId: q.id,
              questTitle: q.title,
              badge: q.badge,
              requirementId: req2.id,
              name: req2.name,
              status: 'review',
              counted: false,
              picked: false,
              matchReason: req2.matchReason,
            });
          }
        }
        return items;
      });
      return res.json(results);
    }

    res.json(matchQuests(coins));
  } catch (err) {
    console.error('Error computing quests:', err);
    res.status(500).json({ error: 'Failed to compute quests' });
  }
};

// "Pick the piece for this collection" (Mark 2026-11-04): when several
// coins qualify for a slot, the user may choose which one counts. The pick
// rides on the COIN (coin.questPicks['<questId>:<requirementId>']) —
// replaced wherever it lives, never duplicated across coins; null coinId
// clears the pick so the engine's auto-pick resumes.
const setQuestPick = async (req, res) => {
  try {
    const userId = mongoose.isValidObjectId(req.session.userId)
      ? new mongoose.Types.ObjectId(req.session.userId)
      : req.session.userId;
    const { coinId, questId, requirementId, remove } = req.body || {};
    if (!questId || !requirementId) {
      return res.status(400).json({ error: 'questId and requirementId are required' });
    }
    // Keys join by ':' — validate against the catalog so arbitrary content
    // (dots would break mongo dot-paths) can never reach the field.
    const QUEST_CATALOG = require('../quests/conceptData').QUEST_CATALOG;
    const quest = QUEST_CATALOG.find((q) => q.id === questId);
    const requirement = quest?.requirements.find((r) => r.id === requirementId);
    if (!quest || !requirement) {
      return res.status(404).json({ error: 'Unknown quest or requirement' });
    }
    if (/[.$]/.test(`${questId}:${requirementId}`)) {
      return res.status(400).json({ error: 'Invalid pick key' });
    }
    const key = `${questId}:${requirementId}`;
    const unsetKey = { [`questPicks.${key}`]: '' };

    if (remove) {
      await Coin.updateMany(
        { userId, [`questPicks.${key}`]: { $exists: true } },
        { $unset: unsetKey },
      );
      return res.json({ ok: true, picked: null });
    }

    if (!coinId) {
      return res.status(400).json({ error: 'coinId is required unless removing a pick' });
    }
    const coin = await Coin.findOne({ _id: coinId, userId });
    if (!coin) return res.status(404).json({ error: 'Coin not found' });

    await Coin.updateMany(
      { userId, [`questPicks.${key}`]: { $exists: true }, _id: { $ne: coin._id } },
      { $unset: unsetKey },
    );
    await Coin.updateOne({ _id: coin._id }, { $set: { [`questPicks.${key}`]: true } });
    return res.json({ ok: true, picked: String(coin._id) });
  } catch (err) {
    console.error('Error setting quest pick:', err);
    res.status(500).json({ error: 'Failed to set quest pick' });
  }
};

exports.getQuests = getQuests;
exports.setQuestPick = setQuestPick;
