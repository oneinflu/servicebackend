require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Category = require('../models/Category');
const Subscription = require('../models/Subscription');
const Transaction = require('../models/Transaction');
const Service = require('../models/Service');
const Job = require('../models/Job');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/serviceinfotek';

function daysFromNow(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}

async function upsertUser(u) {
  const existing = await User.findOne({ email: u.email });
  if (existing) {
    existing.name = u.name;
    existing.phone = u.phone;
    existing.password = u.password; // pre-save hook will hash
    await existing.save();
    return existing;
  }
  return User.create(u);
}

async function seedSubscriptionsAndTransactions(user, types) {
  for (const type of types) {
    // Subscription: 365-day duration
    const existingSub = await Subscription.findOne({ user: user._id, type, endDate: { $gte: new Date() } });
    if (!existingSub) {
      await Subscription.create({
        user: user._id,
        type,
        startDate: new Date(),
        endDate: daysFromNow(365),
      });
    }

    // Transaction: dummy completed
    const paymentId = `pay_demo_${user._id}_${type}`;
    const existingTxn = await Transaction.findOne({ razorpayPaymentId: paymentId });
    if (!existingTxn) {
      await Transaction.create({
        user: user._id,
        subscriptionType: type,
        amount: type === 'SERVICE_POST' ? 500 : 100,
        razorpayPaymentId: paymentId,
        razorpayOrderId: `order_demo_${user._id}_${type}`,
        status: 'completed',
      });
    }
  }
}

async function pickCategories() {
  const serviceCats = await Category.find({ type: 'Service' }).limit(4);
  const jobCats = await Category.find({ type: 'Job' }).limit(4);
  if (serviceCats.length < 2 || jobCats.length < 2) {
    throw new Error('Insufficient categories. Run seedCategories.js first.');
  }
  return { serviceCats, jobCats };
}

async function seedServicesForUsers(users, serviceCats) {
  // Create a mix: single-category and multi-category services
  const loc = { country: 'India', state: 'KA', city: 'Bengaluru', district: 'Bengaluru Urban', pincode: '560001' };

  // user1: single category (free eligible)
  if (!(await Service.findOne({ user: users[0]._id }))) {
    await Service.create({
      user: users[0]._id,
      categoryPrices: [{ category: serviceCats[0]._id, price: 499 }],
      location: loc,
      isCompanyPost: false,
    });
  }

  // user2: multi-category (requires SERVICE_POST subscription)
  if (!(await Service.findOne({ user: users[1]._id }))) {
    await Service.create({
      user: users[1]._id,
      categoryPrices: [
        { category: serviceCats[0]._id, price: 799 },
        { category: serviceCats[1]._id, price: 999 },
      ],
      location: loc,
      isCompanyPost: false,
    });
  }

  // user3: single category
  if (!(await Service.findOne({ user: users[2]._id }))) {
    await Service.create({
      user: users[2]._id,
      categoryPrices: [{ category: serviceCats[2]._id, price: 299 }],
      location: loc,
      isCompanyPost: false,
    });
  }

  // user4: multi-category
  if (!(await Service.findOne({ user: users[3]._id }))) {
    await Service.create({
      user: users[3]._id,
      categoryPrices: [
        { category: serviceCats[2]._id, price: 599 },
        { category: serviceCats[3]._id, price: 699 },
      ],
      location: loc,
      isCompanyPost: false,
    });
  }

  // user5: single category
  if (!(await Service.findOne({ user: users[4]._id }))) {
    await Service.create({
      user: users[4]._id,
      categoryPrices: [{ category: serviceCats[1]._id, price: 399 }],
      location: loc,
      isCompanyPost: false,
    });
  }
}

async function seedJobsForUsers(users, jobCats) {
  const loc = { country: 'India', state: 'MH', city: 'Mumbai', district: 'Mumbai City', pincode: '400001' };

  if (!(await Job.findOne({ user: users[0]._id }))) {
    await Job.create({
      user: users[0]._id,
      categories: [jobCats[0]._id],
      location: loc,
      isCompanyPost: false,
    });
  }

  if (!(await Job.findOne({ user: users[1]._id }))) {
    await Job.create({
      user: users[1]._id,
      categories: [jobCats[0]._id, jobCats[1]._id],
      location: loc,
      isCompanyPost: false,
    });
  }

  if (!(await Job.findOne({ user: users[2]._id }))) {
    await Job.create({
      user: users[2]._id,
      categories: [jobCats[2]._id],
      location: loc,
      isCompanyPost: false,
    });
  }

  if (!(await Job.findOne({ user: users[3]._id }))) {
    await Job.create({
      user: users[3]._id,
      categories: [jobCats[2]._id, jobCats[3]._id],
      location: loc,
      isCompanyPost: false,
    });
  }

  if (!(await Job.findOne({ user: users[4]._id }))) {
    await Job.create({
      user: users[4]._id,
      categories: [jobCats[1]._id],
      location: loc,
      isCompanyPost: false,
    });
  }
}

async function main() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    // Ensure categories exist
    const { serviceCats, jobCats } = await pickCategories();

    // Create users
    const baseUsers = [
      { name: 'Demo User One', email: 'demo1@example.com', phone: '5551000001', password: 'User@123', referralId: 'DEMO1' },
      { name: 'Demo User Two', email: 'demo2@example.com', phone: '5551000002', password: 'User@123', referralId: 'DEMO2' },
      { name: 'Demo User Three', email: 'demo3@example.com', phone: '5551000003', password: 'User@123', referralId: 'DEMO3' },
      { name: 'Demo User Four', email: 'demo4@example.com', phone: '5551000004', password: 'User@123', referralId: 'DEMO4' },
      { name: 'Demo User Five', email: 'demo5@example.com', phone: '5551000005', password: 'User@123', referralId: 'DEMO5' },
    ];
    const users = [];
    for (const u of baseUsers) users.push(await upsertUser(u));

    // Subscriptions and transactions
    await seedSubscriptionsAndTransactions(users[0], ['SERVICE_SEARCH']);
    await seedSubscriptionsAndTransactions(users[1], ['SERVICE_POST']);
    await seedSubscriptionsAndTransactions(users[2], ['JOB_SEARCH']);
    await seedSubscriptionsAndTransactions(users[3], ['SERVICE_POST', 'JOB_SEARCH']);
    // users[4]: no subscriptions

    // Services and Jobs
    await seedServicesForUsers(users, serviceCats);
    await seedJobsForUsers(users, jobCats);

    console.log('Demo data seeded successfully');
    process.exit(0);
  } catch (err) {
    console.error('Error seeding demo data:', err);
    process.exit(1);
  }
}

main();