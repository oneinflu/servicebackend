const mongoose = require('mongoose');

const appVersionSchema = new mongoose.Schema({
  latestVersion: {
    type: String,
    required: true,
    default: '1.0.5'
  },
  minVersion: {
    type: String,
    required: true,
    default: '1.0.0'
  },
  updateUrl: {
    type: String,
    required: true,
    default: 'https://play.google.com/store/apps/details?id=com.jirehservice.app'
  },
  forceUpdate: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

module.exports = mongoose.model('AppVersion', appVersionSchema);
