const ReferralSettings = require('../models/ReferralSettings');

exports.getSettings = async (req, res) => {
  try {
    const settings = await ReferralSettings.findOne().lean();
    res.status(200).json({ status: 'success', data: { settings } });
  } catch (error) {
    res.status(400).json({ status: 'error', message: error.message });
  }
};

exports.updateSettings = async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ status: 'error', message: 'Admins only' });
    }
    const { levelRates, minWithdrawal } = req.body;
    const update = {};
    if (Array.isArray(levelRates)) update.levelRates = levelRates.slice(0, 10);
    if (typeof minWithdrawal === 'number') update.minWithdrawal = minWithdrawal;
    update.updatedBy = req.user._id;

    const settings = await ReferralSettings.findOneAndUpdate({}, update, { new: true, upsert: true, runValidators: true });
    res.status(200).json({ status: 'success', data: { settings } });
  } catch (error) {
    res.status(400).json({ status: 'error', message: error.message });
  }
};