const mongoose = require('mongoose');

const referralSettingsSchema = new mongoose.Schema({
  levelRates: {
    type: [Number],
    validate: {
      validator: function (arr) {
        return Array.isArray(arr) && arr.length <= 10 && arr.every(n => typeof n === 'number' && n >= 0);
      },
      message: 'levelRates must be an array of up to 10 non-negative numbers'
    },
    default: [0.10, 0.01, 0.001, 0.0001, 0.00001, 0.000001, 0.0000001, 0.00000001, 0.000000001, 0.0000000001]
  },
  minWithdrawal: {
    type: Number,
    default: 200
  },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('ReferralSettings', referralSettingsSchema);