const express = require('express');
const {
  getSuggestions,
  getTrending,
  getProfessionalsNearYou,
  getRecommendedJobs,
  getRecommendedServices,
  getRecentActivity,
} = require('../controllers/homeController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Read-only aggregation endpoints for the redesigned home screen.
// Kept separate from serviceRoutes/jobRoutes so the existing API is untouched.
router.get('/suggestions', protect, getSuggestions);
router.get('/trending', protect, getTrending);
router.get('/professionals-near-you', protect, getProfessionalsNearYou);
router.get('/recommended-jobs', protect, getRecommendedJobs);
router.get('/recommended-services', protect, getRecommendedServices);
router.get('/recent-activity', protect, getRecentActivity);

module.exports = router;
