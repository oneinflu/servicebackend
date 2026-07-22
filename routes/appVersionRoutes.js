const express = require('express');
const router = express.Router();
const { getAppVersion, updateAppVersion } = require('../controllers/appVersionController');
const { protect, isAdmin } = require('../middleware/authMiddleware');

router.get('/', getAppVersion);
router.put('/', protect, isAdmin, updateAppVersion);

module.exports = router;
