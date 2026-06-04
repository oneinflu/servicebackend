require('dotenv').config();
const mongoose = require('mongoose');
const AppVersion = require('../models/AppVersion');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/serviceinfotek';

async function seedAppVersion() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB for seeding app version data');

    const versionData = {
      latestVersion: '1.0.5',
      minVersion: '1.0.4',
      updateUrl: 'https://play.google.com/store/apps/details?id=com.jirehservice.app',
      forceUpdate: false
    };

    const version = await AppVersion.findOneAndUpdate(
      {},
      versionData,
      { new: true, upsert: true, runValidators: true }
    );

    console.log('App version configuration seeded/updated in database successfully:');
    console.log(JSON.stringify(version, null, 2));
    process.exit(0);
  } catch (err) {
    console.error('Error seeding app version settings:', err.message);
    process.exit(1);
  }
}

seedAppVersion();
