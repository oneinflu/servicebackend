const mongoose = require('mongoose');

const appSettingsSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  value: { type: mongoose.Schema.Types.Mixed, required: true },
  description: { type: String, default: '' }
}, { timestamps: true });

const AppSettings = mongoose.model('AppSettings', appSettingsSchema);
module.exports = AppSettings;
