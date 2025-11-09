const mongoose = require('mongoose');

const usageSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
  type: { type: String, required: true, enum: ['SERVICE_POST', 'JOB_POST', 'DASHBOARD'] },
  usedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Usage', usageSchema);