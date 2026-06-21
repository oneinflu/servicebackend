const Job = require('../models/Job');
const Category = require('../models/Category');
const Subscription = require('../models/Subscription');
const User = require('../models/User');
const { resolveLocality } = require('../lib/locationService');
const { getSettingValue } = require('./settingsController');

exports.createJob = async (req, res) => {
  try {
    const { categoriesIds, location, isCompanyPost, companyId, locality } = req.body;

    // Verify categories exist and are of type 'Job'
    if (!categoriesIds || !Array.isArray(categoriesIds) || categoriesIds.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'At least one category is required'
      });
    }

    // Verify all categories exist and are of type 'Job'
    const categories = await Category.find({
      _id: { $in: categoriesIds },
      type: 'Job'
    });

    if (categories.length !== categoriesIds.length) {
      return res.status(400).json({
        status: 'error',
        message: 'One or more categories are invalid or not of type Job'
      });
    }

    let jobLocation = location;
    if (locality) {
      const resolved = await resolveLocality(locality);
      jobLocation = {
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
      jobLocation = {
        address: resolved.locality,
        city: resolved.city,
        taluk: resolved.taluk,
        district: resolved.district,
        state: resolved.state,
        country: resolved.country,
        pincode: resolved.pincode
      };
    }

    // Validate full location including address
    if (!jobLocation || !jobLocation.address || !jobLocation.district || !jobLocation.state || !jobLocation.city || !jobLocation.country || !jobLocation.pincode) {
      return res.status(400).json({
        status: 'error',
        message: 'Full location is required (address, district, state, city, country, pincode)'
      });
    }

    const jobExpiryDays = await getSettingValue('jobExpiryDays') || 7;
    const expiresAt = new Date(Date.now() + jobExpiryDays * 24 * 60 * 60 * 1000);

    const job = await Job.create({
      categories: categoriesIds,
      location: {
        address: jobLocation.address,
        district: jobLocation.district,
        state: jobLocation.state,
        city: jobLocation.city,
        taluk: jobLocation.taluk || '',
        country: jobLocation.country,
        pincode: jobLocation.pincode,
      },
      isCompanyPost: isCompanyPost || false,
      companyId: companyId || null,
      user: req.user._id,
      expiresAt,
    });

    res.status(201).json({
      status: 'success',
      data: {
        job
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};
exports.getMyJobs = async (req, res) => {
  try {
    const jobs = await Job.find({ user: req.user._id })
      .populate('categories')
      .populate('user', 'name email phone');

    res.status(200).json({
      status: 'success',
      results: jobs.length,
      data: {
        jobs
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};
exports.getAllJobs = async (req, res) => {
  try {
    // Admins can access all jobs without subscription checks
    if (!req.user.isAdmin) {
      const userSubscriptions = await Subscription.find({
        user: req.user._id,
        endDate: { $gte: new Date() }
      });
      // 7-day trial window from user signup for JOB_SEARCH access
      const createdAt = req.user?.createdAt ? new Date(req.user.createdAt).getTime() : null;
      const now = Date.now();
      const trialMillis = 7 * 24 * 60 * 60 * 1000; // 7 days
      const isWithinJobSearchTrial = createdAt ? (now - createdAt) < trialMillis : false;

      const canSearchJobs = isWithinJobSearchTrial || userSubscriptions.some(sub => 
        ['JOB_SEARCH', 'SERVICE_POST'].includes(sub.type)
      );

      if (!canSearchJobs) {
        return res.status(403).json({
          status: 'error',
          message: 'Please subscribe to search jobs',
          subscriptionRequired: true
        });
      }
    }

    const jobs = await Job.find({ expiresAt: { $gte: new Date() }, status: 'active' })
      .populate('categories')
      .populate('user', 'name email phone');

    res.status(200).json({
      status: 'success',
      results: jobs.length,
      data: {
        jobs
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

exports.getJobById = async (req, res) => {
  try {
    // Admins can access without subscription checks
    if (!req.user.isAdmin) {
      const userSubscriptions = await Subscription.find({
        user: req.user._id,
        endDate: { $gte: new Date() }
      });
      // 7-day trial window from user signup for JOB_SEARCH access
      const createdAt = req.user?.createdAt ? new Date(req.user.createdAt).getTime() : null;
      const now = Date.now();
      const trialMillis = 7 * 24 * 60 * 60 * 1000; // 7 days
      const isWithinJobSearchTrial = createdAt ? (now - createdAt) < trialMillis : false;

      const canSearchJobs = isWithinJobSearchTrial || userSubscriptions.some(sub => 
        ['JOB_SEARCH', 'SERVICE_POST'].includes(sub.type)
      );

      if (!canSearchJobs) {
        return res.status(403).json({
          status: 'error',
          message: 'Please subscribe to search jobs',
          subscriptionRequired: true
        });
      }
    }

    const job = await Job.findById(req.params.id)
      .populate('categories')
      .populate('companyId')
      .populate('user', 'name email phone');

    if (!job) {
      return res.status(404).json({
        status: 'error',
        message: 'Job not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        job
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};


exports.searchJobsByKeyword = async (req, res) => {
  try {
    const { keyword, city, state, district, country, pincode, taluk, locality } = req.query;

    if (
      (!keyword || keyword.trim() === '') &&
      (!city || city.trim() === '') &&
      (!state || state.trim() === '') &&
      (!district || district.trim() === '') &&
      (!country || country.trim() === '') &&
      (!pincode || pincode.trim() === '') &&
      (!taluk || taluk.trim() === '') &&
      (!locality || locality.trim() === '')
    ) {
      return res.status(400).json({
        status: 'error',
        message: 'A search keyword or location filter is required'
      });
    }

    // Admins can search without subscription checks
    if (!req.user.isAdmin) {
      const userSubscriptions = await Subscription.find({
        user: req.user._id,
        endDate: { $gte: new Date() }
      });
      // 7-day trial window from user signup for JOB_SEARCH access
      const createdAt = req.user?.createdAt ? new Date(req.user.createdAt).getTime() : null;
      const now = Date.now();
      const trialMillis = 7 * 24 * 60 * 60 * 1000; // 7 days
      const isWithinJobSearchTrial = createdAt ? (now - createdAt) < trialMillis : false;

      const canSearchJobs = isWithinJobSearchTrial || userSubscriptions.some(sub =>
        ['JOB_SEARCH', 'SERVICE_POST'].includes(sub.type)
      );

      if (!canSearchJobs) {
        return res.status(403).json({
          status: 'error',
          message: 'Please subscribe to search jobs',
          subscriptionRequired: true
        });
      }
    }

    const findQuery = {
      expiresAt: { $gte: new Date() },
      status: 'active'
    };

    let categoryIds = [];
    let combinedRegex = null;

    if (keyword && keyword.trim() !== '') {
      // Tokenize keyword and build a combined regex for matching
      const tokens = String(keyword).split(/[^\w]+/).filter(Boolean);
      combinedRegex = new RegExp(tokens.join('|'), 'i');

      // Find matching categories (type = Job)
      const matchingCategories = await Category.find({
        type: 'Job',
        name: combinedRegex
      }).select('_id');

      categoryIds = matchingCategories.map(cat => cat._id);

      // Build location OR conditions using regex
      const locationOr = [
        { 'location.address': { $regex: combinedRegex } },
        { 'location.city': { $regex: combinedRegex } },
        { 'location.taluk': { $regex: combinedRegex } },
        { 'location.district': { $regex: combinedRegex } },
        { 'location.state': { $regex: combinedRegex } },
        { 'location.country': { $regex: combinedRegex } },
      ];
      const digitTokens = tokens.filter(t => /^(\d{4,})$/.test(t));
      if (digitTokens.length > 0) {
        locationOr.push({ 'location.pincode': { $in: digitTokens } });
      }

      findQuery.$or = [
        { categories: { $in: categoryIds } },
        ...locationOr,
      ];
    }

    // Add strict location filters if explicitly provided in query parameters
    if (city && city.trim() !== '') {
      findQuery['location.city'] = new RegExp(city.trim(), 'i');
    }
    if (state && state.trim() !== '') {
      findQuery['location.state'] = new RegExp(state.trim(), 'i');
    }
    if (district && district.trim() !== '') {
      findQuery['location.district'] = new RegExp(district.trim(), 'i');
    }
    if (country && country.trim() !== '') {
      findQuery['location.country'] = new RegExp(country.trim(), 'i');
    }
    if (pincode && pincode.trim() !== '') {
      findQuery['location.pincode'] = pincode.trim();
    }
    if (taluk && taluk.trim() !== '') {
      findQuery['location.taluk'] = new RegExp(taluk.trim(), 'i');
    }
    if (locality && locality.trim() !== '') {
      findQuery['location.address'] = new RegExp(locality.trim(), 'i');
    }

    const jobs = await Job.find(findQuery)
      .populate('categories')
      .populate('user', 'name email phone');

    // Optional: rank results by proximity to user-provided location
    const userLoc = {
      city: typeof city === 'string' ? city : undefined,
      state: typeof state === 'string' ? state : undefined,
      district: typeof district === 'string' ? district : undefined,
      country: typeof country === 'string' ? country : undefined,
      pincode: typeof pincode === 'string' ? pincode : undefined,
      taluk: typeof taluk === 'string' ? taluk : undefined,
      locality: typeof locality === 'string' ? locality : undefined,
    };

    const scoreJob = (job) => {
      let score = 0;
      // Category match boost
      const jobCatIds = (job.categories || []).map(c => c?._id).filter(Boolean);
      if (categoryIds.length > 0 && jobCatIds.some(id => String(categoryIds).includes(String(id)))) score += 3;
      
      // Keyword in location boost
      if (combinedRegex) {
        const locFields = [job.location?.address, job.location?.city, job.location?.taluk, job.location?.district, job.location?.state, job.location?.country].filter(Boolean).join(' ');
        if (combinedRegex.test(locFields)) score += 2;
      }

      // User location proximity
      if (userLoc.pincode && job.location?.pincode === userLoc.pincode) score += 10;
      if (userLoc.locality && job.location?.address && job.location.address.toLowerCase().includes(userLoc.locality.toLowerCase())) score += 10;
      if (userLoc.city && job.location?.city && job.location.city.toLowerCase() === userLoc.city.toLowerCase()) score += 8;
      if (userLoc.taluk && job.location?.taluk && job.location.taluk.toLowerCase() === userLoc.taluk.toLowerCase()) score += 8;
      if (userLoc.district && job.location?.district && job.location.district.toLowerCase() === userLoc.district.toLowerCase()) score += 8;
      if (userLoc.state && job.location?.state && job.location.state.toLowerCase() === userLoc.state.toLowerCase()) score += 5;
      if (userLoc.country && job.location?.country && job.location.country.toLowerCase() === userLoc.country.toLowerCase()) score += 2;
      return score;
    };

    const ranked = jobs.sort((a, b) => scoreJob(b) - scoreJob(a));

    res.status(200).json({
      status: 'success',
      results: ranked.length,
      data: {
        jobs: ranked
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Update a job owned by the authenticated user
exports.updateJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ status: 'error', message: 'Job not found' });
    }
    if (String(job.user) !== String(req.user._id)) {
      return res.status(403).json({ status: 'error', message: 'Not authorized to update this job' });
    }

    const updates = {};

    // Allow updating categories via categoriesIds array
    const { categoriesIds, location, isCompanyPost, companyId, locality } = req.body || {};

    if (categoriesIds) {
      if (!Array.isArray(categoriesIds) || categoriesIds.length === 0) {
        return res.status(400).json({ status: 'error', message: 'At least one category is required' });
      }
      const categories = await Category.find({ _id: { $in: categoriesIds }, type: 'Job' });
      if (categories.length !== categoriesIds.length) {
        return res.status(400).json({ status: 'error', message: 'One or more categories are invalid or not of type Job' });
      }
      updates.categories = categoriesIds;
    }

    let jobLocation = location;
    if (locality) {
      const resolved = await resolveLocality(locality);
      jobLocation = {
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
      jobLocation = {
        address: resolved.locality,
        city: resolved.city,
        taluk: resolved.taluk,
        district: resolved.district,
        state: resolved.state,
        country: resolved.country,
        pincode: resolved.pincode
      };
    }

    if (jobLocation) {
      const { address, district, state, city, country, pincode, taluk } = jobLocation;
      if (!address || !district || !state || !city || !country || !pincode) {
        return res.status(400).json({ status: 'error', message: 'Full location (address, district, state, city, country, pincode) is required' });
      }
      updates.location = { address, district, state, city, country, pincode, taluk: taluk || '' };
    }

    if (typeof isCompanyPost !== 'undefined') {
      updates.isCompanyPost = Boolean(isCompanyPost);
    }
    if (typeof companyId !== 'undefined') {
      updates.companyId = companyId || null;
    }

    Object.assign(job, updates);
    await job.save();

    const populated = await Job.findById(job._id)
      .populate('categories')
      .populate('user', 'name email phone');

    return res.status(200).json({ status: 'success', data: { job: populated } });
  } catch (error) {
    return res.status(400).json({ status: 'error', message: error.message });
  }
};

// Search candidates (users) by their interested job categories
exports.searchCandidatesByInterests = async (req, res) => {
  try {
    // Admins can access without subscription checks; others need JOB_SEARCH or SERVICE_POST
    if (!req.user.isAdmin) {
      const subs = await Subscription.find({
        user: req.user._id,
        endDate: { $gte: new Date() },
      });
      // 7-day trial window from user signup for JOB_SEARCH access
      const createdAt = req.user?.createdAt ? new Date(req.user.createdAt).getTime() : null;
      const now = Date.now();
      const trialMillis = 7 * 24 * 60 * 60 * 1000; // 7 days
      const isWithinJobSearchTrial = createdAt ? (now - createdAt) < trialMillis : false;

      const allowed = isWithinJobSearchTrial || subs.some((s) => ['JOB_SEARCH', 'SERVICE_POST'].includes(s.type));
      if (!allowed) {
        return res.status(403).json({
          status: 'error',
          message: 'Please subscribe to find candidates',
          subscriptionRequired: true,
        });
      }
    }

    const { keyword, categoryIds } = req.query;

    let searchCategoryIds = [];
    if (keyword && String(keyword).trim() !== '') {
      const tokens = String(keyword).split(/[^\w]+/).filter(Boolean);
      const combinedRegex = new RegExp(tokens.join('|'), 'i');
      const cats = await Category.find({ type: 'Job', name: combinedRegex }).select('_id');
      searchCategoryIds = cats.map((c) => c._id);
    } else if (categoryIds) {
      const raw = Array.isArray(categoryIds) ? categoryIds : String(categoryIds).split(',');
      const cats = await Category.find({ _id: { $in: raw }, type: 'Job' }).select('_id');
      searchCategoryIds = cats.map((c) => c._id);
    }

    // If no filters provided, default to users who have any interests
    const userQuery = searchCategoryIds.length > 0
      ? { interestedJobCategories: { $in: searchCategoryIds } }
      : { interestedJobCategories: { $exists: true, $ne: [] } };

    const users = await User.find(userQuery)
      .select('name email phone resumeUrl interestedJobCategories')
      .populate('interestedJobCategories');

    return res.status(200).json({
      status: 'success',
      results: users.length,
      data: { candidates: users },
    });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

// Delete a job owned by the authenticated user
exports.deleteJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ status: 'error', message: 'Job not found' });
    }
    if (String(job.user) !== String(req.user._id)) {
      return res.status(403).json({ status: 'error', message: 'Not authorized to delete this job' });
    }

    await job.deleteOne();
    return res.status(200).json({ status: 'success', message: 'Job deleted successfully' });
  } catch (error) {
    return res.status(400).json({ status: 'error', message: error.message });
  }
};

// Get authenticated user's job interests (categories + optional resume URL)
exports.getMyJobInterests = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('interestedJobCategories');
    if (!user) {
      return res.status(404).json({ status: 'error', message: 'User not found' });
    }
    res.status(200).json({
      status: 'success',
      data: {
        interests: {
          categories: user.interestedJobCategories || [],
          resumeUrl: user.resumeUrl || ''
        }
      }
    });
  } catch (error) {
    return res.status(400).json({ status: 'error', message: error.message });
  }
};

// Update authenticated user's job interests (requires JOB_SEARCH or SERVICE_POST subscription)
exports.updateMyJobInterests = async (req, res) => {
  try {
    const subs = await Subscription.find({
      user: req.user._id,
      endDate: { $gte: new Date() }
    });
    const allowed = subs.some(s => ['JOB_SEARCH', 'SERVICE_POST'].includes(s.type));
    if (!allowed && !req.user.isAdmin) {
      return res.status(403).json({
        status: 'error',
        message: 'Please subscribe to update job interests',
        subscriptionRequired: true
      });
    }

    const { categoriesIds, resumeUrl } = req.body || {};

    let categoryIdsToSave = undefined;
    if (categoriesIds !== undefined) {
      if (!Array.isArray(categoriesIds)) {
        return res.status(400).json({ status: 'error', message: 'categoriesIds must be an array' });
      }
      if (categoriesIds.length > 0) {
        const cats = await Category.find({ _id: { $in: categoriesIds }, type: 'Job' });
        if (cats.length !== categoriesIds.length) {
          return res.status(400).json({ status: 'error', message: 'One or more categories are invalid or not of type Job' });
        }
        categoryIdsToSave = categoriesIds;
      } else {
        categoryIdsToSave = [];
      }
    }

    const updates = {};
    if (categoryIdsToSave !== undefined) updates.interestedJobCategories = categoryIdsToSave;
    if (resumeUrl !== undefined) updates.resumeUrl = String(resumeUrl || '');

    const updated = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true })
      .populate('interestedJobCategories');

    return res.status(200).json({
      status: 'success',
      data: {
        interests: {
          categories: updated.interestedJobCategories || [],
          resumeUrl: updated.resumeUrl || ''
        }
      }
    });
  } catch (error) {
    return res.status(400).json({ status: 'error', message: error.message });
  }
};

// Clone an expired or active job and create a new one
exports.cloneJob = async (req, res) => {
  try {
    const oldJob = await Job.findById(req.params.id);
    if (!oldJob) {
      return res.status(404).json({ status: 'error', message: 'Job not found' });
    }
    if (String(oldJob.user) !== String(req.user._id)) {
      return res.status(403).json({ status: 'error', message: 'Not authorized to clone this job' });
    }

    // Mark old job as expired if it isn't already
    oldJob.status = 'expired';
    await oldJob.save();

    const newJobData = oldJob.toObject();
    delete newJobData._id;
    delete newJobData.createdAt;
    delete newJobData.updatedAt;
    delete newJobData.__v;

    const jobExpiryDays = await getSettingValue('jobExpiryDays') || 7;
    newJobData.status = 'active';
    newJobData.expiresAt = new Date(Date.now() + jobExpiryDays * 24 * 60 * 60 * 1000);

    const newJob = await Job.create(newJobData);

    const populated = await Job.findById(newJob._id)
      .populate('categories')
      .populate('user', 'name email phone');

    res.status(201).json({
      status: 'success',
      data: {
        job: populated
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};
