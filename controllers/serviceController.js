const Service = require('../models/Service');
const Category = require('../models/Category');
const Subscription = require('../models/Subscription');
const { resolveLocality } = require('../lib/locationService');

exports.createService = async (req, res) => {
  try {
    const { categoryPrices, location, isCompanyPost, companyId, locality } = req.body;

    // Verify categoryPrices exist and are properly formatted
    if (!categoryPrices || !Array.isArray(categoryPrices) || categoryPrices.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'At least one category with price is required'
      });
    }

    // Extract category IDs from categoryPrices
    const categoriesIds = categoryPrices.map(item => item.category);

    // Verify all categories exist and are of type 'Service'
    const categories = await Category.find({
      _id: { $in: categoriesIds },
      type: 'Service'
    });

    if (categories.length !== categoriesIds.length) {
      return res.status(400).json({
        status: 'error',
        message: 'One or more categories are invalid or not of type Service'
      });
    }

    // Check user's subscription status and free post usage
    const userSubscriptions = await Subscription.find({
      user: req.user._id,
      endDate: { $gte: new Date() }
    });

    const servicePostSub = userSubscriptions.find(sub => sub.type === 'SERVICE_POST');
    const existingServicePosts = await Service.countDocuments({ user: req.user._id });

    if (!servicePostSub && existingServicePosts >= 1) {
      return res.status(403).json({
        status: 'error',
        message: 'You have used your free service post. Please subscribe to Service Post plan to post more services',
        subscriptionRequired: true,
        subscriptionType: 'SERVICE_POST'
      });
    }

    let serviceLocation = location;
    if (locality) {
      const resolved = await resolveLocality(locality);
      serviceLocation = {
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
      serviceLocation = {
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
    if (!serviceLocation || !serviceLocation.address || !serviceLocation.district || !serviceLocation.state || !serviceLocation.city || !serviceLocation.country || !serviceLocation.pincode) {
      return res.status(400).json({
        status: 'error',
        message: 'Full location is required (address, district, state, city, country, pincode)'
      });
    }

    const service = await Service.create({
      categories: categoriesIds,
      categoryPrices,
      location: {
        address: serviceLocation.address,
        district: serviceLocation.district,
        state: serviceLocation.state,
        city: serviceLocation.city,
        taluk: serviceLocation.taluk || '',
        country: serviceLocation.country,
        pincode: serviceLocation.pincode,
      },
      isCompanyPost,
      companyId,
      user: req.user._id
    });

    res.status(201).json({
      status: 'success',
      data: {
        service
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};
exports.getMyServices = async (req, res) => {
  try {
    const services = await Service.find({ user: req.user._id })
      .populate('categoryPrices.category')
      .populate('user', 'name email phone');

    res.status(200).json({
      status: 'success',
      results: services.length,
      data: {
        services
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

exports.getAllServices = async (req, res) => {
  try {
    // Admins can access all services without subscription checks
    if (!req.user.isAdmin) {
      // Check subscription for non-admin users
      const userSubscriptions = await Subscription.find({
        user: req.user._id,
        endDate: { $gte: new Date() }
      });

      const canSearchServices = userSubscriptions.some(sub => 
        ['SERVICE_SEARCH', 'SERVICE_POST'].includes(sub.type)
      );

      if (!canSearchServices) {
        return res.status(403).json({
          status: 'error',
          message: 'Please subscribe to search services',
          subscriptionRequired: true
        });
      }
    }

    const services = await Service.find()
      .populate('categoryPrices.category')
      .populate('user', 'name email phone');

    res.status(200).json({
      status: 'success',
      results: services.length,
      data: {
        services
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

exports.getServiceById = async (req, res) => {
  try {
    // Admins can access without subscription checks
    if (!req.user.isAdmin) {
      const userSubscriptions = await Subscription.find({
        user: req.user._id,
        endDate: { $gte: new Date() }
      });

      const canSearchServices = userSubscriptions.some(sub => 
        ['SERVICE_SEARCH', 'SERVICE_POST'].includes(sub.type)
      );

      if (!canSearchServices) {
        return res.status(403).json({
          status: 'error',
          message: 'Please subscribe to search services',
          subscriptionRequired: true
        });
      }
    }

    const service = await Service.findById(req.params.id)
      .populate('categoryPrices.category')
      .populate('user', 'name email phone');

    if (!service) {
      return res.status(404).json({
        status: 'error',
        message: 'Service not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        service
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};


exports.searchServicesByKeyword = async (req, res) => {
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

      const canSearchServices = userSubscriptions.some(sub =>
        ['SERVICE_SEARCH', 'SERVICE_POST'].includes(sub.type)
      );

      if (!canSearchServices) {
        return res.status(403).json({
          status: 'error',
          message: 'Please subscribe to search services',
          subscriptionRequired: true
        });
      }
    }

    const findQuery = {};

    let categoryIds = [];
    let combinedRegex = null;

    if (keyword && keyword.trim() !== '') {
      // Tokenize keyword and build a combined regex for matching
      const tokens = String(keyword).split(/[^\w]+/).filter(Boolean);
      combinedRegex = new RegExp(tokens.join('|'), 'i');

      // Find matching categories (type = Service)
      const matchingCategories = await Category.find({
        type: 'Service',
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
        { 'categoryPrices.category': { $in: categoryIds } },
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

    // Search services by category or location text match
    const services = await Service.find(findQuery)
      .populate('categoryPrices.category')
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

    const scoreService = (svc) => {
      let score = 0;
      // Category match boost
      const svcCatIds = (svc.categoryPrices || []).map(cp => cp.category?._id).filter(Boolean);
      if (categoryIds.length > 0 && svcCatIds.some(id => String(categoryIds).includes(String(id)))) score += 3;
      
      // Keyword in location boost
      if (combinedRegex) {
        const locFields = [svc.location?.address, svc.location?.city, svc.location?.taluk, svc.location?.district, svc.location?.state, svc.location?.country]
          .filter(Boolean)
          .join(' ');
        if (combinedRegex.test(locFields)) score += 2;
      }

      // User location proximity
      if (userLoc.pincode && svc.location?.pincode === userLoc.pincode) score += 10;
      if (userLoc.locality && svc.location?.address && svc.location.address.toLowerCase().includes(userLoc.locality.toLowerCase())) score += 10;
      if (userLoc.city && svc.location?.city && svc.location.city.toLowerCase() === userLoc.city.toLowerCase()) score += 8;
      if (userLoc.taluk && svc.location?.taluk && svc.location.taluk.toLowerCase() === userLoc.taluk.toLowerCase()) score += 8;
      if (userLoc.district && svc.location?.district && svc.location.district.toLowerCase() === userLoc.district.toLowerCase()) score += 8;
      if (userLoc.state && svc.location?.state && svc.location.state.toLowerCase() === userLoc.state.toLowerCase()) score += 5;
      if (userLoc.country && svc.location?.country && svc.location.country.toLowerCase() === userLoc.country.toLowerCase()) score += 2;
      return score;
    };

    const ranked = services.sort((a, b) => scoreService(b) - scoreService(a));

    res.status(200).json({
      status: 'success',
      results: ranked.length,
      data: {
        services: ranked
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

// Update a service owned by the authenticated user
exports.updateService = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) {
      return res.status(404).json({ status: 'error', message: 'Service not found' });
    }
    if (service.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ status: 'error', message: 'Not authorized to update this service' });
    }

    const { categoryPrices, location, locality } = req.body;
    if (!categoryPrices || !Array.isArray(categoryPrices) || categoryPrices.length === 0) {
      return res.status(400).json({ status: 'error', message: 'At least one category with price is required' });
    }
    const categoriesIds = categoryPrices.map(item => item.category);
    const categories = await Category.find({ _id: { $in: categoriesIds }, type: 'Service' });
    if (categories.length !== categoriesIds.length) {
      return res.status(400).json({ status: 'error', message: 'One or more categories are invalid or not of type Service' });
    }

    // Enforce subscription rule for multiple categories
    const userSubscriptions = await Subscription.find({ user: req.user._id, endDate: { $gte: new Date() } });
    const hasPostSub = userSubscriptions.some(sub => sub.type === 'SERVICE_POST');
    if (!hasPostSub && categoriesIds.length > 1) {
      return res.status(403).json({
        status: 'error',
        message: 'Multiple categories require a Service Post subscription',
        subscriptionRequired: true,
        subscriptionType: 'SERVICE_POST'
      });
    }

    service.categoryPrices = categoryPrices;
    service.categories = categoriesIds;

    let serviceLocation = location;
    if (locality) {
      const resolved = await resolveLocality(locality);
      serviceLocation = {
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
      serviceLocation = {
        address: resolved.locality,
        city: resolved.city,
        taluk: resolved.taluk,
        district: resolved.district,
        state: resolved.state,
        country: resolved.country,
        pincode: resolved.pincode
      };
    }

    if (serviceLocation) {
      const { address, district, state, city, country, pincode, taluk } = serviceLocation;
      if (!address || !district || !state || !city || !country || !pincode) {
        return res.status(400).json({ status: 'error', message: 'Full location (address, district, state, city, country, pincode) is required' });
      }
      service.location = { address, district, state, city, country, pincode, taluk: taluk || '' };
    }
    const updated = await service.save();

    const populated = await Service.findById(updated._id)
      .populate('categoryPrices.category')
      .populate('user', 'name email phone');

    return res.status(200).json({ status: 'success', data: { service: populated } });
  } catch (error) {
    return res.status(400).json({ status: 'error', message: error.message });
  }
};

// Delete a service owned by the authenticated user
exports.deleteService = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) {
      return res.status(404).json({ status: 'error', message: 'Service not found' });
    }
    if (service.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ status: 'error', message: 'Not authorized to delete this service' });
    }

    await Service.findByIdAndDelete(req.params.id);
    return res.status(204).json({ status: 'success', data: null });
  } catch (error) {
    return res.status(400).json({ status: 'error', message: error.message });
  }
};
