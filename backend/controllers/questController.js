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

    // Coin dialogue mode (?coin=:id): evaluate just one coin and reply only
    // with the quest slots the coin touches — collected, or surfaced for
    // review — so the popup can say what it counts toward.
    if (req.query.coin) {
      const single = coins.filter((c) => String(c._id) === String(req.query.coin));
      if (single.length === 0) return res.status(404).json({ error: 'Coin not found' });
      const results = matchQuests(single).flatMap((q) => {
        const items = [];
        for (const req2 of q.requirements) {
          if (req2.status === 'collected' && req2.coin) {
            items.push({ questId: q.id, questTitle: q.title, badge: q.badge, name: req2.name, status: 'collected', matchReason: req2.matchReason });
          } else if (req2.status === 'review' && req2.coin) {
            const isSame = req2.coin._id && String(req2.coin._id) === String(single[0]._id);
            if (isSame) {
              items.push({ questId: q.id, questTitle: q.title, badge: q.badge, name: req2.name, status: 'review', matchReason: req2.matchReason });
            }
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

exports.getQuests = getQuests;
