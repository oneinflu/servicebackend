const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { getMyReferralTree, getMyCommissions, getMyReferralSummary } = require('../controllers/referralController');
const { getSettings, updateSettings } = require('../controllers/referralSettingsController');

const router = express.Router();

router.use(protect);

router.get('/my-tree', getMyReferralTree);
router.get('/my-commissions', getMyCommissions);
router.get('/my-summary', getMyReferralSummary);

// Admin settings
router.get('/settings', getSettings);
router.put('/settings', updateSettings);

module.exports = router;