const mongoose = require('mongoose');

// Logged when a user taps "Apply"/"Call Now" on a job listing — the app
// doesn't have an in-app application form, so this records intent-to-apply.
const jobApplicationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true }
}, { timestamps: true });

jobApplicationSchema.index({ user: 1, job: 1 }, { unique: true });

module.exports = mongoose.model('JobApplication', jobApplicationSchema);
