const express = require('express');
const { createSubscription, getUserSubscriptions, getSubscriptionsByUserId, getAllSubscriptionsAdmin } = require('../controllers/subscriptionController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect); // All subscription routes need authentication

// Middleware to check if user is admin
const isAdmin = (req, res, next) => {
  if (!req.user.isAdmin) {
    return res.status(403).json({
      status: 'error',
      message: 'Access denied. Admins only.'
    });
  }
  next();
};

router.post('/', createSubscription);
router.get('/my-subscriptions', getUserSubscriptions);
// Admin route to view another user's subscriptions
router.get('/user/:id', isAdmin, getSubscriptionsByUserId);
// Admin route: list all subscriptions with summary
router.get('/all', isAdmin, getAllSubscriptionsAdmin);

module.exports = router;