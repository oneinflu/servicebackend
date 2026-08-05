const mongoose = require('mongoose');

// One entry per (viewer, profile owner) — repeat views by the same person
// don't inflate the count.
const profileViewSchema = new mongoose.Schema({
  profileOwner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  viewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

profileViewSchema.index({ profileOwner: 1, viewedBy: 1 }, { unique: true });

module.exports = mongoose.model('ProfileView', profileViewSchema);
