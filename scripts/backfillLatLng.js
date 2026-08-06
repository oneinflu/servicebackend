// One-time backfill: resolves lat/lng for existing Job and Service posts
// that don't have coordinates yet, using the exact address they were
// already posted with (Google Geocoding API) — never guesses or fabricates
// a location, only geocodes what the user actually entered.
require('dotenv').config();
const mongoose = require('mongoose');
const Job = require('../models/Job');
const Service = require('../models/Service');
const Company = require('../models/Company');

const MONGO_URI = process.env.MONGODB_URI;
// Same Google Places/Geocoding project key used client-side by the app.
const GOOGLE_API_KEY = 'AIzaSyD7DInkaxqCQM8wXaavGXv0MQRUYbC5qr0';

function addressString(location) {
  return [location.address, location.city, location.district, location.state, location.pincode, location.country || 'India']
    .filter((part) => part && String(part).trim())
    .join(', ');
}

async function geocode(address) {
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${GOOGLE_API_KEY}`;
  const response = await fetch(url);
  const data = await response.json();
  if (data.status !== 'OK' || !data.results?.length) {
    return null;
  }
  const { lat, lng } = data.results[0].geometry.location;
  return { lat, lng };
}

async function backfill(Model, label) {
  const docs = await Model.find({
    $or: [{ 'location.lat': { $exists: false } }, { 'location.lat': null }],
  });

  console.log(`${label}: ${docs.length} document(s) missing coordinates`);

  let updated = 0;
  let failed = 0;
  for (const doc of docs) {
    const address = addressString(doc.location || {});
    if (!address) {
      failed++;
      continue;
    }
    try {
      const coords = await geocode(address);
      if (coords) {
        doc.location.lat = coords.lat;
        doc.location.lng = coords.lng;
        await doc.save();
        updated++;
        console.log(`  ✓ ${doc._id} -> ${coords.lat}, ${coords.lng} (${address})`);
      } else {
        failed++;
        console.log(`  ✗ ${doc._id} -> no geocode match for "${address}"`);
      }
    } catch (err) {
      failed++;
      console.log(`  ✗ ${doc._id} -> error: ${err.message}`);
    }
    // Stay well under Google's rate limits.
    await new Promise((resolve) => setTimeout(resolve, 150));
  }

  console.log(`${label}: updated ${updated}, failed ${failed}, skipped ${docs.length - updated - failed}`);
}

async function main() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  await backfill(Job, 'Jobs');
  await backfill(Service, 'Services');
  await backfill(Company, 'Companies');

  await mongoose.disconnect();
  console.log('Done.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
