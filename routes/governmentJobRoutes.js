const express = require('express');
const {
  createGovernmentJob,
  getAllGovernmentJobs,
  searchGovernmentJobs,
  getGovernmentJobById,
  updateGovernmentJob,
  deleteGovernmentJob
} = require('../controllers/governmentJobController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Middleware to check if user is admin
const isAdmin = (req, res, next) => {
  if (!req.user.isAdmin) {
    return res.status(403).json({
      status: 'error',
      message: 'Access denied. Only administrators can perform this action.'
    });
  }
  next();
};

// Public routes
router.get('/', getAllGovernmentJobs);
router.get('/search', searchGovernmentJobs);
router.get('/:id', getGovernmentJobById);

// Protected routes (admin only)
router.post('/', protect, isAdmin, createGovernmentJob);
router.patch('/:id', protect, isAdmin, updateGovernmentJob);
router.delete('/:id', protect, isAdmin, deleteGovernmentJob);

module.exports = router;