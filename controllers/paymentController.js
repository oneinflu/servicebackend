const Razorpay = require('razorpay');
const crypto = require('crypto');
const Transaction = require('../models/Transaction');
const Subscription = require('../models/Subscription');
const User = require('../models/User');
const Commission = require('../models/Commission');
const ReferralSettings = require('../models/ReferralSettings');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

exports.createOrder = async (req, res) => {
  try {
    const { subscriptionType } = req.body;

    if (!subscriptionType) {
      return res.status(400).json({
        status: 'error',
        message: 'Subscription type is required'
      });
    }

    const subscriptionPrices = {
      SERVICE_SEARCH: 100,
      JOB_SEARCH: 100,
      SERVICE_POST: 500
    };

    if (!subscriptionPrices[subscriptionType]) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid subscription type'
      });
    }

    const amount = subscriptionPrices[subscriptionType];
    
    // Generate a shorter receipt ID (max 40 chars)
    const timestamp = Date.now().toString().slice(-8);
    const userId = req.user._id.toString().slice(-6);
    const receipt = `sub_${userId}_${timestamp}`;
    
    const options = {
      amount: amount * 100, // amount in smallest currency unit (paise)
      currency: 'INR',
      receipt: receipt,
      notes: {
        subscriptionType: subscriptionType,
        userId: req.user._id.toString()
      }
    };

    console.log('Creating order with options:', options);

    const order = await razorpay.orders.create(options);
    
    console.log('Order created:', order);

    res.status(200).json({
      status: 'success',
      data: {
        order,
        key: process.env.RAZORPAY_KEY_ID,
        amount: amount * 100,
        currency: 'INR',
        name: 'Service Infotek',
        description: `Subscription for ${subscriptionType}`,
        prefill: {
          name: req.user.name,
          email: req.user.email,
          contact: req.user.phone
        }
      }
    });
  } catch (error) {
    console.error('Razorpay order creation error:', error);
    res.status(400).json({
      status: 'error',
      message: error.message || 'Error creating order',
      details: error.error?.description || error.error
    });
  }
};

exports.verifyPayment = async (req, res) => {
  try {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature, subscriptionType } = req.body;
    
    console.log('Verification payload:', {
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
      subscriptionType
    });

    // Define subscription prices
    const subscriptionPrices = {
      SERVICE_SEARCH: 100,
      JOB_SEARCH: 100,
      SERVICE_POST: 500
    };

    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature || !subscriptionType) {
      console.error('Missing required fields:', { razorpay_payment_id, razorpay_order_id, razorpay_signature, subscriptionType });
      return res.status(400).json({
        status: 'error',
        message: 'Missing required payment information'
      });
    }

    // Verify the payment signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    console.log('Signature verification:', {
      expected: expectedSignature,
      received: razorpay_signature
    });

    const isAuthentic = expectedSignature === razorpay_signature;

    if (!isAuthentic) {
      console.error('Signature verification failed');
      return res.status(400).json({
        status: 'error',
        message: 'Payment verification failed: Invalid signature'
      });
    }

    // Verify payment status with Razorpay
const payment = await razorpay.payments.fetch(razorpay_payment_id);
    
    if (payment.status !== 'captured') {
      console.error('Payment not captured:', payment.status);
      return res.status(400).json({
        status: 'error',
        message: `Payment verification failed: Payment status is ${payment.status}`
      });
    }

    // Create transaction record
    const transaction = await Transaction.create({
      user: req.user._id,
      subscriptionType,
      amount: subscriptionPrices[subscriptionType],
      razorpayPaymentId: razorpay_payment_id,
      razorpayOrderId: razorpay_order_id,
      status: 'completed'
    });

    // Calculate subscription end date (365 days from now)
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 365);

    // Create subscription
    const subscription = await Subscription.create({
      user: req.user._id,
      type: subscriptionType,
      startDate: new Date(),
      endDate
    });

    // Credit referral commissions up to 10 levels
    await creditReferralCommissions(req.user._id, subscriptionType, subscriptionPrices[subscriptionType], transaction._id);

    console.log('Payment verification successful:', {
      transactionId: transaction._id,
      subscriptionId: subscription._id
    });

    res.status(200).json({
      status: 'success',
      data: {
        transaction,
        subscription
      }
    });
  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(400).json({
      status: 'error',
      message: 'Payment verification failed',
      details: error.message
    });
  }
};

exports.getMyTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .populate('user', 'name email');

    res.status(200).json({
      status: 'success',
      results: transactions.length,
      data: {
        transactions
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

// Admin: list all payment transactions
exports.getAllTransactionsAdmin = async (req, res) => {
  try {
    if (!req.user || !req.user.isAdmin) {
      return res.status(403).json({ status: 'error', message: 'Admins only' });
    }

    const transactions = await Transaction.find()
      .sort({ createdAt: -1 })
      .populate('user', 'name email phone');

    // Summary totals by subscription type and overall
    const summary = transactions.reduce((acc, t) => {
      const type = t.subscriptionType;
      const status = t.status;
      acc.totalAmount += (status === 'completed' ? (t.amount || 0) : 0);
      acc.counts.total += 1;
      acc.counts[status] = (acc.counts[status] || 0) + 1;
      acc.byType[type] = acc.byType[type] || { amount: 0, count: 0 };
      if (status === 'completed') acc.byType[type].amount += (t.amount || 0);
      acc.byType[type].count += 1;
      return acc;
    }, { totalAmount: 0, counts: { total: 0, completed: 0, pending: 0, failed: 0 }, byType: {} });

    res.status(200).json({
      status: 'success',
      results: transactions.length,
      data: { transactions, summary }
    });
  } catch (error) {
    res.status(400).json({ status: 'error', message: error.message });
  }
};

// Helper: credit commissions to ancestors up to 10 levels
async function creditReferralCommissions(payerUserId, subscriptionType, amount, transactionId) {
  try {
    // Use admin-defined rates if available
    const settings = await ReferralSettings.findOne().lean();
    const defaultRates = Array.from({ length: 10 }, (_, i) => Math.pow(0.1, i + 1));
    const rates = (settings?.levelRates && settings.levelRates.length > 0) ? settings.levelRates : defaultRates;

    let currentUser = await User.findById(payerUserId).select('referredBy').lean();
    for (let level = 1; level <= Math.min(10, rates.length); level++) {
      if (!currentUser || !currentUser.referredBy) break;
      const ancestor = await User.findById(currentUser.referredBy).select('walletBalance').lean();
      if (!ancestor) break;
      const commissionAmount = parseFloat((amount * rates[level - 1]).toFixed(2));

      // Create commission record
      await Commission.create({
        receiver: ancestor._id,
        sourceUser: payerUserId,
        transaction: transactionId,
        subscriptionType,
        level,
        amount: commissionAmount,
        status: 'earned'
      });

      // Increment receiver wallet balance
      await User.updateOne({ _id: ancestor._id }, { $inc: { walletBalance: commissionAmount } });

      // Move up the tree
      currentUser = await User.findById(ancestor._id).select('referredBy').lean();
    }
  } catch (err) {
    console.error('Referral commission credit error:', err);
  }
}