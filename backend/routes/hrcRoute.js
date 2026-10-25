const express = require('express');
const router = express.Router();
const { getOcreDetailsJSON } = require('../controllers/ocreController');

const HRC_DATASETS = ['sco', 'pella', 'pco', 'agco'];

router.get('/hrc/:dataset/:id', async (req, res) => {
    const { dataset, id } = req.params;
    if (!HRC_DATASETS.includes(dataset)) {
        return res.status(400).json({ error: `Unknown HRC dataset "${dataset}".` });
    }
    const details = await getOcreDetailsJSON(id, dataset);
    if (details.error) {
        const status = details.status || 400;
        return res.status(status).json({ error: details.error });
    }
    res.json(details);
});

module.exports = router;
