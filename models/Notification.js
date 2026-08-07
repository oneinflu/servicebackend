const mongoose = require('mongoose');

// One row per admin "send" action. The actual per-user inbox entries live
// in UserNotification — this is the broadcast record + delivery summary.
const notificationSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true
  },
  body: {
    type: String,
    required: [true, 'Body is required'],
    trim: true
  },
  audience: {
    type: String,
    enum: ['all', 'individual', 'business'],
    required: true
  },
  sentBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recipientCount: {
    type: Number,
    default: 0
  },
  pushSuccessCount: {
    type: Number,
    default: 0
  },
  pushFailureCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Notification', notificationSchema);
