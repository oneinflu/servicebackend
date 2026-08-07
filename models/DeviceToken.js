const mongoose = require('mongoose');

// One row per device. A user can have several (phone + tablet, reinstall,
// etc.) — token is the unique key so re-registering the same device just
// updates its owner/platform instead of duplicating.
const deviceTokenSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  token: {
    type: String,
    required: true,
    unique: true
  },
  platform: {
    type: String,
    enum: ['android', 'ios', 'web'],
    default: 'android'
  }
}, {
  timestamps: true
});

deviceTokenSchema.index({ user: 1 });

module.exports = mongoose.model('DeviceToken', deviceTokenSchema);
