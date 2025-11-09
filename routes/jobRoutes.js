const express = require('express');
const { createJob, getAllJobs, getJobById, getMyJobs, searchJobsByKeyword, getMyJobInterests, updateMyJobInterests, updateJob, deleteJob, searchCandidatesByInterests } = require('../controllers/jobController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Protected routes
router.post('/', protect, createJob);
router.get('/my-jobs', protect, getMyJobs);
// Job interests for subscribed users
router.get('/interests/my', protect, getMyJobInterests);
router.put('/interests/my', protect, updateMyJobInterests);
router.get('/', protect, getAllJobs);
// Important: define specific routes BEFORE parameterized ':id' to avoid clashes
router.get('/search', protect, searchJobsByKeyword);
router.get('/candidates/search', protect, searchCandidatesByInterests);
router.get('/:id', protect, getJobById);
router.put('/:id', protect, updateJob);
router.delete('/:id', protect, deleteJob);

module.exports = router;