const mongoose = require('mongoose');

const withdrawalRequestSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  status: { type: String, enum: ['requested', 'approved', 'rejected', 'paid'], default: 'requested' },
  notes: { type: String },
  approvedAt: { type: Date },
  paidAt: { type: Date },
  processedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  // Payment details (admin filled when marking as paid)
  paymentTxnId: { type: String },
  paymentMode: { type: String, enum: ['UPI', 'NEFT', 'IMPS', 'BankTransfer', 'Cash', 'Other'], default: 'Other' },
  paymentProofUrl: { type: String },
  paidAmount: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('WithdrawalRequest', withdrawalRequestSchema);