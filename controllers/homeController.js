const Service = require('../models/Service');
const Job = require('../models/Job');
const Category = require('../models/Category');

// AI Suggestions: real data — the categories with the most active posts right now,
// phrased as a search shortcut. No ML involved, just usage-ranked categories.
exports.getSuggestions = async (req, res) => {
  try {
    const [topServiceCats, topJobCats] = await Promise.all([
      Service.aggregate([
        { $unwind: '$categoryPrices' },
        { $group: { _id: '$categoryPrices.category', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 3 },
      ]),
      Job.aggregate([
        { $unwind: '$categories' },
        { $group: { _id: '$categories', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 2 },
      ]),
    ]);

    const serviceCatIds = topServiceCats.map((c) => c._id);
    const jobCatIds = topJobCats.map((c) => c._id);
    const categories = await Category.find({ _id: { $in: [...serviceCatIds, ...jobCatIds] } });
    const nameById = new Map(categories.map((c) => [String(c._id), c.name]));

    const suggestions = [
      ...serviceCatIds
        .filter((id) => nameById.has(String(id)))
        .map((id) => ({ label: `Need a ${nameById.get(String(id))}`, type: 'service', categoryId: id })),
      ...jobCatIds
        .filter((id) => nameById.has(String(id)))
        .map((id) => ({ label: `Find ${nameById.get(String(id))} Jobs`, type: 'job', categoryId: id })),
    ];

    res.status(200).json({ status: 'success', data: { suggestions } });
  } catch (error) {
    res.status(400).json({ status: 'error', message: error.message });
  }
};

// Trending Near You: category post-counts, optionally scoped to a city/district.
exports.getTrending = async (req, res) => {
  try {
    const { city, district } = req.query;
    const locationMatch = {};
    if (city) locationMatch['location.city'] = { $regex: new RegExp(`^${city}$`, 'i') };
    if (district) locationMatch['location.district'] = { $regex: new RegExp(`^${district}$`, 'i') };

    const trending = await Service.aggregate([
      { $match: locationMatch },
      { $unwind: '$categoryPrices' },
      { $group: { _id: '$categoryPrices.category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 8 },
      { $lookup: { from: 'categories', localField: '_id', foreignField: '_id', as: 'category' } },
      { $unwind: '$category' },
      { $project: { _id: 0, categoryId: '$_id', name: '$category.name', count: 1 } },
    ]);

    res.status(200).json({ status: 'success', data: { trending } });
  } catch (error) {
    res.status(400).json({ status: 'error', message: error.message });
  }
};

// Professionals Near You: real service providers and real prices/locations.
// No star ratings, distance-in-km, or live availability — none of that is
// tracked anywhere yet, so we don't fabricate it.
exports.getProfessionalsNearYou = async (req, res) => {
  try {
    const { city, district, limit } = req.query;
    const match = {};
    if (city) match['location.city'] = { $regex: new RegExp(`^${city}$`, 'i') };
    if (district) match['location.district'] = { $regex: new RegExp(`^${district}$`, 'i') };

    const services = await Service.find(match)
      .sort({ createdAt: -1 })
      .limit(Number(limit) || 10)
      .populate('categoryPrices.category', 'name')
      .populate('companyId', 'name')
      .populate('user', 'name phone');

    const professionals = services.map((s) => ({
      id: s._id,
      providerName: s.isCompanyPost ? s.companyId?.name : s.user?.name,
      isCompanyPost: s.isCompanyPost,
      locality: `${s.location.city}, ${s.location.district}`,
      categories: s.categoryPrices.map((cp) => ({ name: cp.category?.name, price: cp.price })),
      startingPrice: Math.min(...s.categoryPrices.map((cp) => cp.price)),
    }));

    res.status(200).json({ status: 'success', data: { professionals } });
  } catch (error) {
    res.status(400).json({ status: 'error', message: error.message });
  }
};

exports.getRecommendedJobs = async (req, res) => {
  try {
    const { limit } = req.query;
    const jobs = await Job.find()
      .sort({ createdAt: -1 })
      .limit(Number(limit) || 6)
      .populate('categories', 'name');

    res.status(200).json({ status: 'success', data: { jobs } });
  } catch (error) {
    res.status(400).json({ status: 'error', message: error.message });
  }
};

exports.getRecommendedServices = async (req, res) => {
  try {
    const { limit } = req.query;
    const services = await Service.find()
      .sort({ createdAt: -1 })
      .limit(Number(limit) || 6)
      .populate('categoryPrices.category', 'name');

    res.status(200).json({ status: 'success', data: { services } });
  } catch (error) {
    res.status(400).json({ status: 'error', message: error.message });
  }
};

// Recent Activity: the logged-in user's own recent job/service posts.
// There's no generic activity-log (search history, views, saves) yet,
// so this reflects account activity rather than a full event feed.
exports.getRecentActivity = async (req, res) => {
  try {
    const [jobs, services] = await Promise.all([
      Job.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(5).select('createdAt categories'),
      Service.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(5).select('createdAt categoryPrices'),
    ]);

    const activity = [
      ...jobs.map((j) => ({ type: 'job_post', refId: j._id, createdAt: j.createdAt })),
      ...services.map((s) => ({ type: 'service_post', refId: s._id, createdAt: s.createdAt })),
    ].sort((a, b) => b.createdAt - a.createdAt).slice(0, 8);

    res.status(200).json({ status: 'success', data: { activity } });
  } catch (error) {
    res.status(400).json({ status: 'error', message: error.message });
  }
};
