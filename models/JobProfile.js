const mongoose = require('mongoose');

const jobProfileSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required'],
    unique: true
  },
  categories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'At least one category is required']
  }],
  location: {
    address: { type: String },
    city: { type: String, required: true },
    district: { type: String, required: true },
    state: { type: String, required: true },
    country: { type: String, required: true },
    pincode: { type: String, required: true }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

const JobProfile = mongoose.model('JobProfile', jobProfileSchema);
module.exports = JobProfile;
