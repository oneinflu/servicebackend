const express = require('express');
const {
  toggleSaveJob,
  getSavedJobs,
  logJobApplication,
  logServiceLead,
  logProfileView,
  getMyStats
} = require('../controllers/activityController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/stats', protect, getMyStats);
router.get('/saved-jobs', protect, getSavedJobs);
router.post('/saved-jobs/:jobId', protect, toggleSaveJob);
router.post('/applications/:jobId', protect, logJobApplication);
router.post('/service-leads/:serviceId', protect, logServiceLead);
router.post('/profile-views/:userId', protect, logProfileView);

module.exports = router;
