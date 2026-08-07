require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Company = require('../models/Company');
const Category = require('../models/Category');
const Service = require('../models/Service');
const Job = require('../models/Job');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/serviceinfotek';

const citiesData = {
  hyderabad: {
    state: 'TG',
    city: 'Hyderabad',
    district: 'Hyderabad',
    country: 'India',
    pincode: '500032',
    places: [
      { name: 'Gachibowli Office', lat: 17.4401, lng: 78.3489, address: 'DLF Cyber City, Gachibowli' },
      { name: 'Madhapur Center', lat: 17.4483, lng: 78.3741, address: 'Hitech City Road, Madhapur' },
      { name: 'Banjara Hills Block', lat: 17.4165, lng: 78.4437, address: 'Road No 12, Banjara Hills' },
      { name: 'Secunderabad Depot', lat: 17.4399, lng: 78.4983, address: 'Station Road, Secunderabad' },
      { name: 'Hitech City Hub', lat: 17.4435, lng: 78.3772, address: 'Phase 2, Hitech City' }
    ]
  },
  bangalore: {
    state: 'KA',
    city: 'Bengaluru',
    district: 'Bengaluru Urban',
    country: 'India',
    pincode: '560034',
    places: [
      { name: 'Indiranagar Base', lat: 12.9719, lng: 77.6412, address: '100 Feet Road, Indiranagar' },
      { name: 'Koramangala Office', lat: 12.9279, lng: 77.6271, address: '80 Feet Road, Koramangala 4th Block' },
      { name: 'Whitefield Plaza', lat: 12.9698, lng: 77.7500, address: 'ITPL Main Road, Whitefield' },
      { name: 'HSR Layout Point', lat: 12.9141, lng: 77.6411, address: '27th Main, HSR Layout' },
      { name: 'Jayanagar Sector', lat: 12.9308, lng: 77.5838, address: '4th Block, Jayanagar' }
    ]
  }
};

async function main() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    // 1. Fetch categories
    const categories = await Category.find();
    if (categories.length === 0) {
      console.log('No categories found. Please run seedCategories.js first.');
      process.exit(1);
    }

    const serviceCategories = categories.filter(c => c.type === 'Service');
    const jobCategories = categories.filter(c => c.type === 'Job');

    console.log(`Found ${serviceCategories.length} Service categories and ${jobCategories.length} Job categories`);

    // 2. Define users
    const seedUsersData = [
      {
        name: 'Hyderabad Business Owner',
        email: 'hyd_biz@example.com',
        phone: '9988776601',
        password: 'User@123',
        accountType: 'business',
        intent: 'both',
        city: 'hyderabad',
        placeIndex: 0,
        companyName: 'Hyderabad Premier Enterprises',
        referralId: 'HYDBIZ'
      },
      {
        name: 'Bangalore Business Owner',
        email: 'blr_biz@example.com',
        phone: '9988776602',
        password: 'User@123',
        accountType: 'business',
        intent: 'both',
        city: 'bangalore',
        placeIndex: 1,
        companyName: 'Bangalore Advanced Solutions',
        referralId: 'BLRBIZ'
      },
      {
        name: 'Hyderabad Pro Worker',
        email: 'hyd_ind@example.com',
        phone: '9988776603',
        password: 'User@123',
        accountType: 'individual',
        intent: 'service_provider',
        city: 'hyderabad',
        placeIndex: 2,
        referralId: 'HYDIND'
      },
      {
        name: 'Bangalore Pro Worker',
        email: 'blr_ind@example.com',
        phone: '9988776604',
        password: 'User@123',
        accountType: 'individual',
        intent: 'service_provider',
        city: 'bangalore',
        placeIndex: 3,
        referralId: 'BLRIND'
      }
    ];

    const users = [];
    for (const uData of seedUsersData) {
      // Find or create user
      let user = await User.findOne({ email: uData.email });
      const cityConfig = citiesData[uData.city];
      const place = cityConfig.places[uData.placeIndex];

      const userLocation = {
        address: place.address,
        city: cityConfig.city,
        state: cityConfig.state,
        district: cityConfig.district,
        country: cityConfig.country,
        pincode: cityConfig.pincode,
        lat: place.lat,
        lng: place.lng
      };

      if (!user) {
        user = await User.create({
          name: uData.name,
          email: uData.email,
          phone: uData.phone,
          password: uData.password,
          accountType: uData.accountType,
          intent: uData.intent,
          location: userLocation,
          referralId: uData.referralId
        });
        console.log(`Created user: ${user.name} (${user.email})`);
      } else {
        user.location = userLocation;
        user.accountType = uData.accountType;
        user.intent = uData.intent;
        await user.save();
        console.log(`Updated user: ${user.name}`);
      }

      // If business user, find or create company
      if (uData.accountType === 'business') {
        let company = await Company.findOne({ user: user._id });
        if (!company) {
          company = await Company.create({
            name: uData.companyName,
            user: user._id,
            location: userLocation,
            website: 'https://example.com',
            about: 'A premium provider operating in the hub of the city.'
          });
          console.log(`Created company: ${company.name} for ${user.name}`);
        } else {
          company.name = uData.companyName;
          company.location = userLocation;
          await company.save();
          console.log(`Updated company: ${company.name}`);
        }
        user.company = company._id;
        await user.save();
      }

      users.push(user);
    }

    // 3. Clear pre-existing services/jobs for these users to avoid duplicates
    const userIds = users.map(u => u._id);
    await Service.deleteMany({ user: { $in: userIds } });
    await Job.deleteMany({ user: { $in: userIds } });
    console.log('Cleaned old seeded Services and Jobs for our seed users.');

    // 4. Seed services (Each category has a service in Hyd and Blr)
    console.log('Seeding Services...');
    for (let i = 0; i < serviceCategories.length; i++) {
      const cat = serviceCategories[i];
      
      // Hyd provider (user 2 - individual)
      const hydUser = users[2];
      const hydConfig = citiesData.hyderabad;
      const hydPlace = hydConfig.places[i % hydConfig.places.length];
      await Service.create({
        user: hydUser._id,
        categoryPrices: [{ category: cat._id, price: 250 + (i * 50) }],
        location: {
          address: hydPlace.address,
          city: hydConfig.city,
          state: hydConfig.state,
          district: hydConfig.district,
          country: hydConfig.country,
          pincode: hydConfig.pincode,
          lat: hydPlace.lat,
          lng: hydPlace.lng
        },
        isCompanyPost: false
      });

      // Blr business provider (user 1 - business)
      const blrUser = users[1];
      const blrConfig = citiesData.bangalore;
      const blrPlace = blrConfig.places[i % blrConfig.places.length];
      await Service.create({
        user: blrUser._id,
        categoryPrices: [{ category: cat._id, price: 400 + (i * 70) }],
        location: {
          address: blrPlace.address,
          city: blrConfig.city,
          state: blrConfig.state,
          district: blrConfig.district,
          country: blrConfig.country,
          pincode: blrConfig.pincode,
          lat: blrPlace.lat,
          lng: blrPlace.lng
        },
        isCompanyPost: true,
        companyId: blrUser.company
      });
    }
    console.log('Successfully seeded Services for all categories.');

    // 5. Seed jobs (Each category has a job in Hyd and Blr)
    console.log('Seeding Jobs...');
    for (let i = 0; i < jobCategories.length; i++) {
      const cat = jobCategories[i];
      
      // Hyd business employer (user 0 - business)
      const hydUser = users[0];
      const hydConfig = citiesData.hyderabad;
      const hydPlace = hydConfig.places[i % hydConfig.places.length];
      await Job.create({
        user: hydUser._id,
        categories: [cat._id],
        location: {
          address: hydPlace.address,
          city: hydConfig.city,
          state: hydConfig.state,
          district: hydConfig.district,
          country: hydConfig.country,
          pincode: hydConfig.pincode,
          lat: hydPlace.lat,
          lng: hydPlace.lng
        },
        isCompanyPost: true,
        companyId: hydUser.company,
        status: 'active',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      });

      // Blr individual employer (user 3 - individual)
      const blrUser = users[3];
      const blrConfig = citiesData.bangalore;
      const blrPlace = blrConfig.places[i % blrConfig.places.length];
      await Job.create({
        user: blrUser._id,
        categories: [cat._id],
        location: {
          address: blrPlace.address,
          city: blrConfig.city,
          state: blrConfig.state,
          district: blrConfig.district,
          country: blrConfig.country,
          pincode: blrConfig.pincode,
          lat: blrPlace.lat,
          lng: blrPlace.lng
        },
        isCompanyPost: false,
        status: 'active',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      });
    }
    console.log('Successfully seeded Jobs for all categories.');

    console.log('Hyderabad and Bangalore data seeding completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Error seeding Hyderabad/Bangalore data:', err);
    process.exit(1);
  }
}

main();
