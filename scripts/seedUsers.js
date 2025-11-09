require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/serviceinfotek';

const users = [
  {
    name: 'Test User One',
    email: 'user1@example.com',
    phone: '5550000001',
    password: 'User@123',
    referralId: 'TESTU1'
  },
  {
    name: 'Test User Two',
    email: 'user2@example.com',
    phone: '5550000002',
    password: 'User@123',
    referralId: 'TESTU2'
  }
];

async function upsertUser(u) {
  const existing = await User.findOne({ email: u.email });
  if (existing) {
    existing.name = u.name;
    existing.phone = u.phone;
    // Reset password to known test value; pre-save hook will hash it
    existing.password = u.password;
    await existing.save();
    console.log(`Updated existing user: ${u.email}`);
    return existing;
  } else {
    const created = await User.create(u);
    console.log(`Created new user: ${u.email}`);
    return created;
  }
}

async function seedUsers() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB for seeding users');

    for (const u of users) {
      await upsertUser(u);
    }

    console.log('User seeding completed');
    process.exit(0);
  } catch (err) {
    console.error('Error seeding users:', err.message);
    process.exit(1);
  }
}

seedUsers();