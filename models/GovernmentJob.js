const mongoose = require('mongoose');

const governmentJobSchema = new mongoose.Schema({
  jobTitle: {
    type: String,
    required: [true, 'Job title is required']
  },
  organizationName: {
    type: String,
    required: [true, 'Department/Organization name is required']
  },
  lastDateToApply: {
    type: Date,
    required: [true, 'Last date to apply is required']
  },
  applyLink: {
    type: String,
    required: [true, 'Application link is required']
  },
  jobType: {
    type: String,
    enum: ['Govt Jobs', 'PSU Jobs', 'Semi Govt Jobs', 'MSME Jobs'],
    required: [true, 'Job type is required']
  },
  // Central jobs are visible to everyone; State jobs are filtered to users in that state.
  level: {
    type: String,
    enum: ['Central', 'State'],
    default: 'Central'
  },
  state: {
    type: String,
    trim: true,
    default: ''
  },
  // Present for admin-authored postings; absent for jobs the auto-fetcher inserted.
  postedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  isAdmin: {
    type: Boolean,
    default: true
  },
  source: {
    type: String,
    enum: ['admin', 'auto'],
    default: 'admin'
  }
}, {
  timestamps: true
});

governmentJobSchema.index({ jobTitle: 1, organizationName: 1, applyLink: 1 }, { unique: true });

// Only enforce the admin check for manually-authored postings; the
// auto-fetcher inserts jobs with source: 'auto' and no postedBy.
governmentJobSchema.pre('save', async function(next) {
  if (this.source !== 'admin') return next();

  const User = mongoose.model('User');
  const user = await User.findById(this.postedBy);

  if (!user || !user.isAdmin) {
    throw new Error('Only administrators can post government jobs');
  }
  next();
});

const GovernmentJob = mongoose.model('GovernmentJob', governmentJobSchema);
module.exports = GovernmentJob;