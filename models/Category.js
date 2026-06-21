const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Category name is required'],
    trim: true,
    unique: true
  },
  type: {
    type: String,
    required: [true, 'Category type is required'],
    enum: ['Service', 'Job'],
    trim: true
  },
  status: {
    type: String,
    enum: ['approved', 'pending'],
    default: 'approved'
  },
  requestedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

const Category = mongoose.model('Category', categorySchema);
module.exports = Category;