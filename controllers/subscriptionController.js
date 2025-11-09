const Subscription = require('../models/Subscription');
const User = require('../models/User');

exports.createSubscription = async (req, res) => {
  try {
    const { type } = req.body;
    
    // Calculate end date (365 days from now)
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 365);

    // Check if user already has an active subscription of this type
    const existingSubscription = await Subscription.findOne({
      user: req.user._id,
      type,
      endDate: { $gte: new Date() }
    });

    if (existingSubscription) {
      return res.status(400).json({
        status: 'error',
        message: 'You already have an active subscription of this type'
      });
    }

    const subscription = await Subscription.create({
      user: req.user._id,
      type,
      endDate
    });

    res.status(201).json({
      status: 'success',
      data: {
        subscription
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

exports.getUserSubscriptions = async (req, res) => {
  try {
    const subscriptions = await Subscription.find({
      user: req.user._id,
      endDate: { $gte: new Date() }
    });

    res.status(200).json({
      status: 'success',
      data: {
        subscriptions
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

// Admin: get subscriptions for a specific user by id
exports.getSubscriptionsByUserId = async (req, res) => {
  try {
    const { id } = req.params;
    const subscriptions = await Subscription.find({
      user: id,
      endDate: { $gte: new Date() }
    });

    res.status(200).json({
      status: 'success',
      data: { subscriptions }
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

// Admin: list all subscriptions with summary stats
exports.getAllSubscriptionsAdmin = async (req, res) => {
  try {
    // Admin check is enforced in the route middleware
    const now = new Date();
    const rawSubs = await Subscription.find()
      .populate('user', 'name email phone createdAt');

    // Prepare enriched subscriptions
    const subscriptions = rawSubs.map((s) => {
      const isActive = s.endDate && s.endDate >= now;
      const daysRemaining = isActive ? Math.ceil((s.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : 0;
      return {
        ...s.toObject(),
        isActive,
        daysRemaining,
      };
    });

    // Active subscriptions and counts by type
    const activeSubs = subscriptions.filter((s) => s.isActive);
    const activeCounts = {
      SERVICE_POST: activeSubs.filter((s) => s.type === 'SERVICE_POST').length,
      JOB_SEARCH: activeSubs.filter((s) => s.type === 'JOB_SEARCH').length,
      SERVICE_SEARCH: activeSubs.filter((s) => s.type === 'SERVICE_SEARCH').length,
    };

    // Users with any active subscription
    const activeUserIds = new Set(activeSubs.map((s) => String(s.user?._id || s.user)));
    const totalUsers = await User.countDocuments();
    const freeUsersCount = Math.max(0, totalUsers - activeUserIds.size);

    return res.status(200).json({
      status: 'success',
      results: subscriptions.length,
      data: {
        subscriptions,
        summary: {
          activeCounts,
          totalUsers,
          activeUsersCount: activeUserIds.size,
          freeUsersCount,
        },
      },
    });
  } catch (error) {
    return res.status(400).json({ status: 'error', message: error.message });
  }
};