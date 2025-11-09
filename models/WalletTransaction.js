const mongoose = require('mongoose');

const walletTransactionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['payout'], default: 'payout' },
  amount: { type: Number, required: true },
  status: { type: String, enum: ['requested', 'paid'], default: 'requested' },
  withdrawalRequest: { type: mongoose.Schema.Types.ObjectId, ref: 'WithdrawalRequest' },
  // Payment metadata when paid
  paymentTxnId: { type: String },
  paymentMode: { type: String, enum: ['UPI', 'NEFT', 'IMPS', 'BankTransfer', 'Cash', 'Other'], default: 'Other' },
  proofUrl: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('WalletTransaction', walletTransactionSchema);