const express = require('express');
const {
  registerDeviceToken,
  removeDeviceToken,
  getMyNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  sendNotification,
  getSentNotifications
} = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Matches the app's existing NotificationScreen contract.
router.get('/', protect, getMyNotifications);
router.get('/unread-count', protect, getUnreadCount);
router.patch('/read-all', protect, markAllAsRead);
router.patch('/:id/read', protect, markAsRead);

router.post('/device-token', protect, registerDeviceToken);
router.delete('/device-token', protect, removeDeviceToken);

// Admin
router.post('/send', protect, sendNotification);
router.get('/sent', protect, getSentNotifications);

module.exports = router;
