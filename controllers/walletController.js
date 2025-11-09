const User = require('../models/User');
const ReferralSettings = require('../models/ReferralSettings');
const WithdrawalRequest = require('../models/WithdrawalRequest');
const WalletTransaction = require('../models/WalletTransaction');

exports.requestWithdrawal = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('walletBalance');
    if (!user) return res.status(404).json({ status: 'error', message: 'User not found' });

    const settings = await ReferralSettings.findOne().lean();
    const minWithdrawal = settings?.minWithdrawal ?? 200;

    if (user.walletBalance < minWithdrawal) {
      return res.status(400).json({ status: 'error', message: `Minimum withdrawal is ₹${minWithdrawal}` });
    }

    // Prevent multiple pending requests
    const pending = await WithdrawalRequest.findOne({ user: req.user._id, status: { $in: ['requested', 'approved'] } });
    if (pending) {
      return res.status(400).json({ status: 'error', message: 'Existing withdrawal request pending' });
    }

    const amount = user.walletBalance;
    const request = await WithdrawalRequest.create({ user: req.user._id, amount, status: 'requested' });
    await WalletTransaction.create({ user: req.user._id, amount, status: 'requested', withdrawalRequest: request._id });

    res.status(201).json({ status: 'success', data: { request } });
  } catch (error) {
    res.status(400).json({ status: 'error', message: error.message });
  }
};

exports.getMyWalletTransactions = async (req, res) => {
  try {
    const txns = await WalletTransaction.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json({ status: 'success', results: txns.length, data: { transactions: txns } });
  } catch (error) {
    res.status(400).json({ status: 'error', message: error.message });
  }
};

// Admin: list withdrawal requests
exports.listWithdrawals = async (req, res) => {
  try {
    if (!req.user.isAdmin) return res.status(403).json({ status: 'error', message: 'Admins only' });
    const { status } = req.query;
    const filter = status ? { status } : {};
    const requests = await WithdrawalRequest.find(filter).populate('user', 'name email referralId').sort({ createdAt: -1 });
    res.status(200).json({ status: 'success', results: requests.length, data: { requests } });
  } catch (error) {
    res.status(400).json({ status: 'error', message: error.message });
  }
};

// Admin: approve a withdrawal
exports.approveWithdrawal = async (req, res) => {
  try {
    if (!req.user.isAdmin) return res.status(403).json({ status: 'error', message: 'Admins only' });
    const request = await WithdrawalRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ status: 'error', message: 'Request not found' });
    if (request.status !== 'requested') return res.status(400).json({ status: 'error', message: 'Request not in requested state' });
    request.status = 'approved';
    request.approvedAt = new Date();
    request.processedBy = req.user._id;
    await request.save();
    await WalletTransaction.updateOne({ withdrawalRequest: request._id }, { $set: { status: 'requested' } });
    res.status(200).json({ status: 'success', data: { request } });
  } catch (error) {
    res.status(400).json({ status: 'error', message: error.message });
  }
};

// Admin: mark withdrawal as paid and deduct from wallet
exports.payWithdrawal = async (req, res) => {
  try {
    if (!req.user.isAdmin) return res.status(403).json({ status: 'error', message: 'Admins only' });
    const request = await WithdrawalRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ status: 'error', message: 'Request not found' });
    if (!['approved', 'requested'].includes(request.status)) return res.status(400).json({ status: 'error', message: 'Request not approved' });
    const { paymentTxnId, paymentMode, proofUrl, paidAmount: paidAmountRaw } = req.body || {};
    const paidAmount = Number(paidAmountRaw) > 0 ? Number(paidAmountRaw) : request.amount; // default to full amount if not provided
    if (paidAmount <= 0 || paidAmount > request.amount) {
      return res.status(400).json({ status: 'error', message: 'Invalid paid amount' });
    }

    // Deduct wallet by the paid amount
    await User.updateOne({ _id: request.user }, { $inc: { walletBalance: -paidAmount } });
    request.paidAmount = (request.paidAmount || 0) + paidAmount;
    if (request.paidAmount >= request.amount) {
      request.status = 'paid';
      request.paidAt = new Date();
    } else {
      // keep approved until fully paid
      request.status = 'approved';
    }
    request.processedBy = req.user._id;
    request.paymentTxnId = paymentTxnId || undefined;
    request.paymentMode = paymentMode || (request.paymentMode || undefined);
    request.paymentProofUrl = proofUrl || undefined;
    await request.save();

    // Adjust outstanding requested transaction amount
    const reqTxn = await WalletTransaction.findOne({ withdrawalRequest: request._id, status: 'requested' });
    if (reqTxn) {
      const remaining = Math.max(0, (reqTxn.amount || 0) - paidAmount);
      reqTxn.amount = remaining;
      if (remaining === 0 && request.status === 'paid') {
        reqTxn.status = 'paid';
      }
      await reqTxn.save();
    }

    // Create payout transaction entry
    await WalletTransaction.create({
      user: request.user,
      type: 'payout',
      amount: paidAmount,
      status: 'paid',
      withdrawalRequest: request._id,
      paymentTxnId,
      paymentMode,
      proofUrl
    });

    res.status(200).json({ status: 'success', data: { request } });
  } catch (error) {
    res.status(400).json({ status: 'error', message: error.message });
  }
};

// Admin: list all wallet transactions (payouts)
exports.getAllWalletTransactionsAdmin = async (req, res) => {
  try {
    if (!req.user || !req.user.isAdmin) {
      return res.status(403).json({ status: 'error', message: 'Admins only' });
    }
    const txns = await WalletTransaction.find()
      .sort({ createdAt: -1 })
      .populate('user', 'name email phone')
      .populate('withdrawalRequest', 'amount status createdAt approvedAt paidAt');

    const summary = txns.reduce((acc, t) => {
      acc.counts.total += 1;
      acc.counts[t.status] = (acc.counts[t.status] || 0) + 1;
      if (t.status === 'paid') acc.totalPaid += (t.amount || 0);
      if (t.status === 'requested') acc.totalRequested += (t.amount || 0);
      return acc;
    }, { totalPaid: 0, totalRequested: 0, counts: { total: 0, requested: 0, paid: 0 } });

    res.status(200).json({ status: 'success', results: txns.length, data: { transactions: txns, summary } });
  } catch (error) {
    res.status(400).json({ status: 'error', message: error.message });
  }
};