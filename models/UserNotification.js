const mongoose = require('mongoose');

// A per-recipient inbox row, created once for every user a Notification
// was sent to. Keeps "my notifications" and read/unread state trivial to
// query without scanning audience membership on every read.
const userNotificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  notification: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Notification',
    required: true
  },
  read: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

userNotificationSchema.index({ user: 1, createdAt: -1 });
userNotificationSchema.index({ user: 1, read: 1 });

module.exports = mongoose.model('UserNotification', userNotificationSchema);
