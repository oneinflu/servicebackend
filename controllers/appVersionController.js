const AppVersion = require('../models/AppVersion');

const getAppVersion = async (req, res) => {
  try {
    let versionData = await AppVersion.findOne().sort({ createdAt: -1 });
    
    if (!versionData) {
      versionData = await AppVersion.create({});
    }

    res.status(200).json({
      status: 'success',
      data: {
        latestVersion: versionData.latestVersion,
        minVersion: versionData.minVersion,
        updateUrl: versionData.updateUrl,
        forceUpdate: versionData.forceUpdate
      }
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      message: 'Server error',
      error: err.message
    });
  }
};

module.exports = { getAppVersion };
