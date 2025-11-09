const mongoose = require('mongoose');

const commissionSchema = new mongoose.Schema({
  receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  sourceUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  transaction: { type: mongoose.Schema.Types.ObjectId, ref: 'Transaction', required: true },
  subscriptionType: { type: String, enum: ['SERVICE_SEARCH', 'JOB_SEARCH', 'SERVICE_POST'], required: true },
  level: { type: Number, min: 1, max: 10, required: true },
  amount: { type: Number, required: true },
  status: { type: String, enum: ['earned', 'reversed'], default: 'earned' }
}, {
  timestamps: true
});

module.exports = mongoose.model('Commission', commissionSchema);