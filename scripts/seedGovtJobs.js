require('dotenv').config();
const mongoose = require('mongoose');
const GovernmentJob = require('../models/GovernmentJob');
const User = require('../models/User');

const MONGO_URI = process.env.MONGODB_URI;

const jobs = [
  {
    jobTitle: 'Civil Services Examination 2026',
    organizationName: 'Union Public Service Commission (UPSC)',
    lastDateToApply: new Date('2026-06-30'),
    applyLink: 'https://upsc.gov.in/apply',
    jobType: 'Govt Jobs'
  },
  {
    jobTitle: 'Management Trainee (Technical)',
    organizationName: 'Steel Authority of India (SAIL)',
    lastDateToApply: new Date('2026-05-15'),
    applyLink: 'https://sail.co.in/careers',
    jobType: 'PSU Jobs'
  },
  {
    jobTitle: 'Junior Engineer (Civil)',
    organizationName: 'Delhi Metro Rail Corporation (DMRC)',
    lastDateToApply: new Date('2026-05-20'),
    applyLink: 'https://delhimetrorail.com/careers',
    jobType: 'Semi Govt Jobs'
  }
];

async function seedGovtJobs() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    const admin = await User.findOne({ isAdmin: true });
    if (!admin) {
      console.error('No admin user found to post jobs. Run seedAdmin.js first.');
      process.exit(1);
    }

    // Add postedBy to all jobs
    const jobsToSeed = jobs.map(j => ({ ...j, postedBy: admin._id }));

    await GovernmentJob.insertMany(jobsToSeed);
    console.log('Government jobs seeded successfully');
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  }
}

seedGovtJobs();
