const express = require('express');
const router = express.Router();
const dteController = require('../controllers/dteController');

router.post('/', dteController.emitDte);
router.post('/test-connection', dteController.testConnection);
router.post('/invalidate', dteController.invalidateDte);
router.post('/retrieve', dteController.retrieveDte);
router.post('/pdf', dteController.downloadDtePdf);

module.exports = router;
