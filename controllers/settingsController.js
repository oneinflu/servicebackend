const AppSettings = require('../models/AppSettings');

// Default values used if the DB has no record yet
const DEFAULTS = {
  jobExpiryDays: { value: 7, description: 'Number of days before a job post expires' },
};

// Ensure defaults exist in DB on first access
const ensureDefaults = async () => {
  for (const [key, meta] of Object.entries(DEFAULTS)) {
    await AppSettings.findOneAndUpdate(
      { key },
      { $setOnInsert: { key, value: meta.value, description: meta.description } },
      { upsert: true, new: false }
    );
  }
};

// GET /api/settings  — returns all settings (admin only)
exports.getAllSettings = async (req, res) => {
  try {
    await ensureDefaults();
    const settings = await AppSettings.find().sort('key');
    res.status(200).json({ status: 'success', data: { settings } });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

// PUT /api/settings/:key  — update a single setting (admin only)
exports.updateSetting = async (req, res) => {
  try {
    const { key } = req.params;
    const { value } = req.body;

    if (value === undefined || value === null) {
      return res.status(400).json({ status: 'error', message: 'value is required' });
    }

    const updated = await AppSettings.findOneAndUpdate(
      { key },
      { value },
      { new: true, upsert: true, runValidators: true }
    );

    res.status(200).json({ status: 'success', data: { setting: updated } });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

// Helper: get a single setting value (used internally by other controllers)
exports.getSettingValue = async (key) => {
  const doc = await AppSettings.findOne({ key });
  return doc ? doc.value : (DEFAULTS[key]?.value ?? null);
};
