const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  categories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'At least one category is required']
  }],
  location: {
    address: {
      type: String,
      required: [true, 'Address is required']
    },
    district: {
      type: String,
      required: [true, 'District is required']
    },
    state: {
      type: String,
      required: [true, 'State is required']
    },
    city: {
      type: String,
      required: [true, 'City is required']
    },
    pincode: {
      type: String,
      required: [true, 'Pincode is required']
    },
    country: {
      type: String,
      required: [true, 'Country is required']
    }
  },
  isCompanyPost: {
    type: Boolean,
    default: false
  },
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    default: null
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required']
  },
  status: {
    type: String,
    enum: ['active', 'expired'],
    default: 'active'
  },
  expiresAt: {
    type: Date,
    default: () => new Date(+new Date() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
  }
}, {
  timestamps: true
});

const Job = mongoose.model('Job', jobSchema);
module.exports = Job;