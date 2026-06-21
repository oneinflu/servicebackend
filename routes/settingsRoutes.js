const express = require('express');
const { getAllSettings, updateSetting } = require('../controllers/settingsController');
const { protect, isAdmin } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', protect, isAdmin, getAllSettings);
router.put('/:key', protect, isAdmin, updateSetting);

module.exports = router;
