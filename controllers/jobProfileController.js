const JobProfile = require('../models/JobProfile');
const Category = require('../models/Category');
const { resolveLocality } = require('../lib/locationService');

exports.createOrUpdateProfile = async (req, res) => {
  try {
    const { categories, location, isActive, locality } = req.body;

    if (!categories || !Array.isArray(categories) || categories.length === 0) {
      return res.status(400).json({ status: 'error', message: 'At least one category is required' });
    }

    const categoryDocs = await Category.find({ _id: { $in: categories }, type: 'Job' });
    if (categoryDocs.length !== categories.length) {
      return res.status(400).json({ status: 'error', message: 'One or more categories are invalid or not of type Job' });
    }

    let profileLocation = location;
    if (locality) {
      const resolved = await resolveLocality(locality);
      profileLocation = {
        address: resolved.locality,
        city: resolved.city,
        taluk: resolved.taluk,
        district: resolved.district,
        state: resolved.state,
        country: resolved.country,
        pincode: resolved.pincode
      };
    } else if (location && location.address && !location.city) {
      const resolved = await resolveLocality(location.address);
      profileLocation = {
        address: resolved.locality,
        city: resolved.city,
        taluk: resolved.taluk,
        district: resolved.district,
        state: resolved.state,
        country: resolved.country,
        pincode: resolved.pincode
      };
    }

    if (!profileLocation || !profileLocation.city || !profileLocation.district || !profileLocation.state || !profileLocation.country || !profileLocation.pincode) {
      return res.status(400).json({ status: 'error', message: 'City, district, state, country, and pincode are required for location' });
    }

    const profileData = {
      categories,
      location: {
        address: profileLocation.address || '',
        city: profileLocation.city,
        taluk: profileLocation.taluk || '',
        district: profileLocation.district,
        state: profileLocation.state,
        country: profileLocation.country,
        pincode: profileLocation.pincode
      },
      isActive: isActive !== undefined ? isActive : true
    };

    const profile = await JobProfile.findOneAndUpdate(
      { user: req.user._id },
      profileData,
      { new: true, upsert: true, runValidators: true }
    ).populate('categories').populate('user', 'name email phone');

    res.status(200).json({ status: 'success', data: { profile } });
  } catch (error) {
    res.status(400).json({ status: 'error', message: error.message });
  }
};

exports.getMyProfile = async (req, res) => {
  try {
    const profile = await JobProfile.findOne({ user: req.user._id })
      .populate('categories')
      .populate('user', 'name email phone');

    if (!profile) {
      return res.status(404).json({ status: 'error', message: 'Job profile not found' });
    }

    res.status(200).json({ status: 'success', data: { profile } });
  } catch (error) {
    res.status(400).json({ status: 'error', message: error.message });
  }
};

exports.searchJobProfiles = async (req, res) => {
  try {
    const { keyword, city, state, district, country, pincode, categoryId } = req.query;

    const query = { isActive: true };

    if (categoryId) {
      query.categories = categoryId;
    }

    let searchRegex;
    if (keyword && keyword.trim() !== '') {
      const tokens = String(keyword).split(/[^\w]+/).filter(Boolean);
      searchRegex = new RegExp(tokens.join('|'), 'i');
      
      const matchingCategories = await Category.find({ type: 'Job', name: searchRegex }).select('_id');
      const catIds = matchingCategories.map(c => c._id);
      
      query.$or = [
        { categories: { $in: catIds } },
        { 'location.city': searchRegex },
        { 'location.state': searchRegex },
        { 'location.district': searchRegex },
        { 'location.taluk': searchRegex }
      ];
    }

    const profiles = await JobProfile.find(query)
      .populate('categories')
      .populate('user', 'name email phone');

    res.status(200).json({
      status: 'success',
      results: profiles.length,
      data: { profiles }
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};
