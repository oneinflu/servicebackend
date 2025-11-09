require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Subscription = require('../models/Subscription');
const Transaction = require('../models/Transaction');
const Commission = require('../models/Commission');
const ReferralSettings = require('../models/ReferralSettings');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/serviceinfotek';

const subscriptionPrices = {
  SERVICE_SEARCH: 100,
  JOB_SEARCH: 100,
  SERVICE_POST: 500,
};

async function ensureBaseUser() {
  let base = await User.findOne({ referralId: 'TESTU1' });
  if (base) {
    console.log('Found base user with referralId TESTU1:', base.email);
    return base;
  }
  // Create base user
  base = await User.create({
    name: 'Test User One',
    email: 'user1@example.com',
    phone: '5550000001',
    password: 'User@123',
    referralId: 'TESTU1',
  });
  console.log('Created base user TESTU1:', base.email);
  return base;
}

function genReferralId(prefix, i) {
  return `${prefix}${String(i).padStart(2, '0')}`;
}

async function createUser({ name, email, phone, referralId, referredBy }) {
  const existing = await User.findOne({ email });
  if (existing) {
    // Ensure referral linkage
    if (referredBy && (!existing.referredBy || existing.referredBy.toString() !== referredBy.toString())) {
      existing.referredBy = referredBy;
    }
    if (!existing.referralId) existing.referralId = referralId;
    existing.password = 'User@123';
    await existing.save();
    return existing;
  }
  return await User.create({ name, email, phone, password: 'User@123', referralId, referredBy });
}

async function creditReferralCommissions(payerUserId, subscriptionType, amount, transactionId) {
  const settings = await ReferralSettings.findOne().lean();
  const defaultRates = Array.from({ length: 10 }, (_, i) => Math.pow(0.1, i + 1));
  const rates = (settings?.levelRates && settings.levelRates.length > 0) ? settings.levelRates : defaultRates;

  let currentUser = await User.findById(payerUserId).select('referredBy').lean();
  for (let level = 1; level <= Math.min(10, rates.length); level++) {
    if (!currentUser || !currentUser.referredBy) break;
    const ancestor = await User.findById(currentUser.referredBy).select('walletBalance').lean();
    if (!ancestor) break;
    const commissionAmount = parseFloat((amount * rates[level - 1]).toFixed(2));
    await Commission.create({
      receiver: ancestor._id,
      sourceUser: payerUserId,
      transaction: transactionId,
      subscriptionType,
      level,
      amount: commissionAmount,
      status: 'earned',
    });
    await User.updateOne({ _id: ancestor._id }, { $inc: { walletBalance: commissionAmount } });
    currentUser = await User.findById(ancestor._id).select('referredBy').lean();
  }
}

async function createSubscriptionWithTransaction(userId, type) {
  const amount = subscriptionPrices[type];
  if (!amount) return null;
  const tx = await Transaction.create({
    user: userId,
    subscriptionType: type,
    amount,
    razorpayPaymentId: `seed_pay_${Math.random().toString(36).slice(2, 10)}`,
    razorpayOrderId: `seed_ord_${Math.random().toString(36).slice(2, 10)}`,
    status: 'completed',
  });
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + 365);
  const sub = await Subscription.create({ user: userId, type, startDate: new Date(), endDate });
  await creditReferralCommissions(userId, type, amount, tx._id);
  return { tx, sub };
}

async function seedReferralTree(baseUser) {
  // Create Level 1 direct referrals
  const level1 = [];
  for (let i = 1; i <= 5; i++) {
    const u = await createUser({
      name: `L1 User ${i}`,
      email: `l1user${i}@example.com`,
      phone: `55510000${i}`,
      referralId: genReferralId('U1L1-', i),
      referredBy: baseUser._id,
    });
    level1.push(u);
  }
  // Update base user's referral stats
  await User.updateOne({ _id: baseUser._id }, { $set: { referralCount: level1.length }, $addToSet: { referredUsers: { $each: level1.map(u => u._id) } } });

  // Level 2 & 3
  const level2 = [];
  const level3 = [];
  for (const l1 of level1) {
    for (let j = 1; j <= 3; j++) {
      const u2 = await createUser({
        name: `L2 User ${l1.referralId}-${j}`,
        email: `l2_${l1.referralId}_${j}@example.com`,
        phone: `555200${j}${String(Math.random()).slice(2,4)}`,
        referralId: genReferralId(`${l1.referralId}-L2-`, j),
        referredBy: l1._id,
      });
      level2.push(u2);
      // Update l1 referral stats
      await User.updateOne({ _id: l1._id }, { $inc: { referralCount: 1 }, $addToSet: { referredUsers: u2._id } });

      for (let k = 1; k <= 2; k++) {
        const u3 = await createUser({
          name: `L3 User ${u2.referralId}-${k}`,
          email: `l3_${u2.referralId}_${k}@example.com`,
          phone: `555300${k}${String(Math.random()).slice(2,4)}`,
          referralId: genReferralId(`${u2.referralId}-L3-`, k),
          referredBy: u2._id,
        });
        level3.push(u3);
        await User.updateOne({ _id: u2._id }, { $inc: { referralCount: 1 }, $addToSet: { referredUsers: u3._id } });
      }
    }
  }

  // Create subscriptions for a mix of users across levels
  const targetUsers = [baseUser, ...level1.slice(0, 3), ...level2.slice(0, 4), ...level3.slice(0, 6)];
  for (const u of targetUsers) {
    await createSubscriptionWithTransaction(u._id, 'SERVICE_SEARCH');
    await createSubscriptionWithTransaction(u._id, 'JOB_SEARCH');
    await createSubscriptionWithTransaction(u._id, 'SERVICE_POST');
  }

  console.log(`Seeded: L1=${level1.length}, L2=${level2.length}, L3=${level3.length}`);
}

async function attachExistingUsersToBase(baseUser) {
  // Attach up to 10 existing users without referral to base as direct referrals
  const existing = await User.find({ referredBy: { $exists: false }, isAdmin: { $ne: true }, _id: { $ne: baseUser._id } }).limit(10);
  let updated = 0;
  for (const u of existing) {
    await User.updateOne({ _id: u._id }, { $set: { referredBy: baseUser._id }, $inc: { referralCount: 1 }, $addToSet: { referredUsers: u._id } });
    updated++;
  }
  if (updated > 0) console.log(`Attached ${updated} existing users under TESTU1`);
}

async function main() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');
    const baseUser = await ensureBaseUser();
    await attachExistingUsersToBase(baseUser);
    await seedReferralTree(baseUser);
    console.log('Referral demo users and subscriptions seeding completed');
    process.exit(0);
  } catch (err) {
    console.error('Seeding error:', err);
    process.exit(1);
  }
}

main();