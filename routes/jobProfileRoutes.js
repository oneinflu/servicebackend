const express = require('express');
const { createOrUpdateProfile, getMyProfile, searchJobProfiles } = require('../controllers/jobProfileController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Protected routes
router.post('/', protect, createOrUpdateProfile);
router.get('/my-profile', protect, getMyProfile);
router.get('/search', protect, searchJobProfiles);

module.exports = router;
