const Service = require('../models/Service');
const Category = require('../models/Category');
const Subscription = require('../models/Subscription');

exports.createService = async (req, res) => {
  try {
    const { categoryPrices, location, isCompanyPost, companyId } = req.body;

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

    // Validate full location including address
    if (!location || !location.address || !location.district || !location.state || !location.city || !location.country || !location.pincode) {
      return res.status(400).json({
        status: 'error',
        message: 'Full location is required (address, district, state, city, country, pincode)'
      });
    }

    const service = await Service.create({
      categories: categoriesIds,
      categoryPrices,
      location: {
        address: location.address,
        district: location.district,
        state: location.state,
        city: location.city,
        country: location.country,
        pincode: location.pincode,
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
    const { keyword, city, state, district, country, pincode } = req.query;

    if (!keyword || keyword.trim() === '') {
      return res.status(400).json({
        status: 'error',
        message: 'Keyword is required for service search'
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

    // Tokenize keyword and build a combined regex for matching
    const tokens = String(keyword).split(/[^\w]+/).filter(Boolean);
    const combinedRegex = new RegExp(tokens.join('|'), 'i');

    // Find matching categories (type = Service)
    const matchingCategories = await Category.find({
      type: 'Service',
      name: combinedRegex
    }).select('_id');
    const categoryIds = matchingCategories.map(cat => cat._id);

    // Build location OR conditions using regex
    const locationOr = [
      { 'location.address': { $regex: combinedRegex } },
      { 'location.city': { $regex: combinedRegex } },
      { 'location.district': { $regex: combinedRegex } },
      { 'location.state': { $regex: combinedRegex } },
      { 'location.country': { $regex: combinedRegex } },
    ];
    const digitTokens = tokens.filter(t => /^(\d{4,})$/.test(t));
    if (digitTokens.length > 0) {
      locationOr.push({ 'location.pincode': { $in: digitTokens } });
    }

    // Search services by category or location text match
    const services = await Service.find({
      $or: [
        { 'categoryPrices.category': { $in: categoryIds } },
        ...locationOr,
      ]
    })
      .populate('categoryPrices.category')
      .populate('user', 'name email phone');

    // Optional: rank results by proximity to user-provided location
    const userLoc = {
      city: typeof city === 'string' ? city : undefined,
      state: typeof state === 'string' ? state : undefined,
      district: typeof district === 'string' ? district : undefined,
      country: typeof country === 'string' ? country : undefined,
      pincode: typeof pincode === 'string' ? pincode : undefined,
    };

    const scoreService = (svc) => {
      let score = 0;
      // Category match boost
      const svcCatIds = (svc.categoryPrices || []).map(cp => cp.category?._id).filter(Boolean);
      if (svcCatIds.some(id => String(categoryIds).includes(String(id)))) score += 3;
      // Keyword in location boost
      const locFields = [svc.location?.address, svc.location?.city, svc.location?.district, svc.location?.state, svc.location?.country]
        .filter(Boolean)
        .join(' ');
      if (combinedRegex.test(locFields)) score += 2;
      // User location proximity
      if (userLoc.pincode && svc.location?.pincode === userLoc.pincode) score += 10;
      if (userLoc.city && svc.location?.city && svc.location.city.toLowerCase() === userLoc.city.toLowerCase()) score += 8;
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

    const { categoryPrices, location } = req.body;
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
    if (location) {
      const { address, district, state, city, country, pincode } = location;
      if (!address || !district || !state || !city || !country || !pincode) {
        return res.status(400).json({ status: 'error', message: 'Full location (address, district, state, city, country, pincode) is required' });
      }
      service.location = { address, district, state, city, country, pincode };
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
