require('dotenv').config();
const mongoose = require('mongoose');
const Category = require('../models/Category');

const seedCategories = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    // Delete existing categories if you want to start fresh
    // Uncomment the next line if you want to clear existing categories
    // await Category.deleteMany({});
    
    // Service categories
    const serviceCategories = [
      { name: 'Plumbing', type: 'Service' },
      { name: 'Electrical', type: 'Service' },
      { name: 'AC Repair', type: 'Service' },
      { name: 'Web Development', type: 'Service' },
      { name: 'Mobile App Development', type: 'Service' },
      { name: 'House Cleaning', type: 'Service' },
      { name: 'Gardening', type: 'Service' },
      { name: 'Interior Design', type: 'Service' },
      { name: 'Painting', type: 'Service' },
      { name: 'Tutoring', type: 'Service' }
    ];
    
    // Job categories
    const jobCategories = [
      { name: 'Plumber', type: 'Job' },
      { name: 'Electrician', type: 'Job' },
      { name: 'Carpenter', type: 'Job' },
      { name: 'Web Developer', type: 'Job' },
      { name: 'Mobile App Developer', type: 'Job' },
      { name: 'House Cleaner', type: 'Job' },
      { name: 'Gardener', type: 'Job' },
      { name: 'Interior Designer', type: 'Job' },
      { name: 'Painter', type: 'Job' },
      { name: 'Tutor', type: 'Job' }
    ];
    
    // Insert all categories
    const allCategories = [...serviceCategories, ...jobCategories];
    const insertedCategories = await Category.insertMany(allCategories, { ordered: false });
    
    console.log(`${insertedCategories.length} categories seeded successfully!`);
    console.log(`Service categories: ${serviceCategories.length}`);
    console.log(`Job categories: ${jobCategories.length}`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding categories:', error.message);
    // If some categories were inserted before the error
    if (error.insertedDocs && error.insertedDocs.length > 0) {
      console.log(`Partially successful: ${error.insertedDocs.length} categories were inserted.`);
    }
    process.exit(1);
  }
};

seedCategories();