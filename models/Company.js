const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Company name is required'],
    trim: true
  },
  location: {
    address: {
      type: String,
      required: [true, 'Address is required']
    },
    country: {
      type: String,
      required: [true, 'Country is required']
    },
    state: {
      type: String,
      required: [true, 'State is required']
    },
    city: {
      type: String,
      required: [true, 'City is required']
    },
    district: {
      type: String,
      required: [true, 'District is required']
    },
    pincode: {
      type: String,
      required: false
    }
  },
  website: {
    type: String,
    trim: true,
    required: false
  },
  about: {
    type: String,
    required: false
  },
  logo: {
    type: String,
    required: false
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required']
  }
}, {
  timestamps: true
});

const Company = mongoose.model('Company', companySchema);
module.exports = Company;