const User = require('../models/User');
const Commission = require('../models/Commission');
const WithdrawalRequest = require('../models/WithdrawalRequest');
const ReferralSettings = require('../models/ReferralSettings');

// Build referral tree up to maxDepth for the authenticated user
exports.getMyReferralTree = async (req, res) => {
  try {
    const maxDepth = Math.min(Number(req.query.maxDepth) || 10, 10);
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 100);
    const skip = (page - 1) * limit;

    // Helper to build sub-tree, applying pagination only at level 1 (direct groups)
    const buildLevel = async (parentId, depth) => {
      if (depth > maxDepth) return [];
      const baseQuery = User.find({ referredBy: parentId })
        .select('name email referralId referredBy createdAt')
        .lean();

      // Apply pagination only for the first level under the authenticated user
      let childrenQuery = baseQuery;
      if (depth === 1) {
        childrenQuery = baseQuery.skip(skip).limit(limit);
      }

      const children = await childrenQuery;

      const nodes = [];
      for (const child of children) {
        const subtree = await buildLevel(child._id, depth + 1);
        nodes.push({
          id: child._id,
          name: child.name,
          email: child.email,
          referralId: child.referralId,
          level: depth,
          children: subtree,
        });
      }
      return nodes;
    };

    const [tree, totalLevel1] = await Promise.all([
      buildLevel(req.user._id, 1),
      User.countDocuments({ referredBy: req.user._id })
    ]);

    res.status(200).json({
      status: 'success',
      data: { tree },
      meta: {
        pagination: {
          page,
          limit,
          total: totalLevel1,
          totalPages: Math.max(Math.ceil(totalLevel1 / limit), 1)
        }
      }
    });
  } catch (error) {
    res.status(400).json({ status: 'error', message: error.message });
  }
};

// List commissions earned by the authenticated user (paginated)
exports.getMyCommissions = async (req, res) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 100);
    const skip = (page - 1) * limit;

    const [commissions, total] = await Promise.all([
      Commission.find({ receiver: req.user._id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('sourceUser', 'name email referralId')
        .populate('transaction')
        .lean(),
      Commission.countDocuments({ receiver: req.user._id })
    ]);

    res.status(200).json({
      status: 'success',
      results: commissions.length,
      data: { commissions },
      meta: {
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.max(Math.ceil(total / limit), 1)
        }
      }
    });
  } catch (error) {
    res.status(400).json({ status: 'error', message: error.message });
  }
};

// Summary totals by level and wallet balance
exports.getMyReferralSummary = async (req, res) => {
  try {
    const agg = await Commission.aggregate([
      { $match: { receiver: req.user._id } },
      { $group: { _id: '$level', total: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    const byLevel = agg.map(a => ({ level: a._id, total: a.total, count: a.count }));

    const [user, settings, pendingRequests] = await Promise.all([
      User.findById(req.user._id).select('walletBalance referralId referralCount').lean(),
      ReferralSettings.findOne().lean(),
      WithdrawalRequest.find({ user: req.user._id, status: { $in: ['requested', 'approved'] } }).lean()
    ]);

    const walletBalance = user?.walletBalance || 0;
    const pendingWithdrawalAmount = (pendingRequests || []).reduce((sum, r) => sum + (r.amount || 0), 0);
    const availableBalance = Math.max(walletBalance - pendingWithdrawalAmount, 0);
    const minWithdrawal = settings?.minWithdrawal ?? 200;
    const hasPendingWithdrawal = (pendingRequests || []).length > 0;

    res.status(200).json({
      status: 'success',
      data: {
        walletBalance,
        availableBalance,
        minWithdrawal,
        pendingWithdrawalAmount,
        hasPendingWithdrawal,
        referralId: user?.referralId || null,
        referralCount: user?.referralCount || 0,
        byLevel,
        totalEarned: byLevel.reduce((sum, l) => sum + l.total, 0)
      }
    });
  } catch (error) {
    res.status(400).json({ status: 'error', message: error.message });
  }
};