require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/serviceinfotek';

const admin = {
  name: 'Admin User',
  email: 'admin@example.com',
  phone: '5550000000',
  password: 'Admin@123',
  isAdmin: true
};

async function ensureAdmin() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    const existing = await User.findOne({ email: admin.email });
    if (existing) {
      existing.name = admin.name;
      existing.phone = admin.phone;
      existing.isAdmin = true;
      existing.password = admin.password; // will be hashed by pre-save
      await existing.save();
      console.log(`Updated admin: ${admin.email}`);
    } else {
      await User.create(admin);
      console.log(`Created admin: ${admin.email}`);
    }

    process.exit(0);
  } catch (err) {
    console.error('Error ensuring admin:', err.message);
    process.exit(1);
  }
}

ensureAdmin();