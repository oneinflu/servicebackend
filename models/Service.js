const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  
  categoryPrices: [{
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Category is required']
    },
    price: {
      type: Number,
      required: [true, 'Price is required']
    }
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
    taluk: {
      type: String,
      default: ''
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
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Service', serviceSchema);