const express = require('express');
const router = express.Router();
const wompiController = require('../controllers/wompiController');

router.post('/create-link', wompiController.createPaymentLink);
router.post('/check-subscription', wompiController.checkSubscription);
router.post('/deactivate-link', wompiController.deactivateLink);
router.post('/test-connection', wompiController.testConnection);

module.exports = router;
