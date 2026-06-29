const express = require('express');
const router = express.Router();
const utilsController = require('../controllers/utilsController');

// Support both JSON parsing and plain text parsing for error logging
router.post('/log-error', express.json(), express.text({ type: '*/*' }), (req, res, next) => {
    if (typeof req.body === 'string') {
        try {
            req.body = JSON.parse(req.body);
        } catch (e) {
            // Keep as string if it cannot be parsed as JSON
        }
    }
    next();
}, utilsController.logError);

router.post('/export/excel', express.json({ limit: '50mb' }), utilsController.exportExcel);

module.exports = router;
