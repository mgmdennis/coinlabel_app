const express = require('express');
const router = express.Router();
const { getOcreDetailsJSON } = require('../controllers/ocreController');

router.get('/crro/:id', async (req, res) => {
    const details = await getOcreDetailsJSON(req.params.id, 'crro');
    if (details.error) {
        const status = details.status || 400;
        return res.status(status).json({ error: details.error });
    }
    res.json(details);
});

module.exports = router;
