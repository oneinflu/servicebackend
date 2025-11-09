require('dotenv').config();
const mongoose = require('mongoose');
const ReferralSettings = require('../models/ReferralSettings');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/serviceinfotek';

// Generate 10 levels starting at 10% and each next is 10% of previous
function generateLevelRates() {
  const rates = [];
  let value = 0.10; // 10% as decimal
  for (let i = 0; i < 10; i++) {
    rates.push(Number(value.toFixed(10))); // limit precision
    value = value / 10; // next is 10% of previous
  }
  return rates;
}

async function seedReferralSettings() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB for seeding referral settings');

    const levelRates = generateLevelRates();

    const settings = await ReferralSettings.findOneAndUpdate(
      {},
      { levelRates, minWithdrawal: 200 },
      { new: true, upsert: true, runValidators: true }
    );

    console.log('Referral settings upserted:', settings.levelRates);
    process.exit(0);
  } catch (err) {
    console.error('Error seeding referral settings:', err.message);
    process.exit(1);
  }
}

seedReferralSettings();