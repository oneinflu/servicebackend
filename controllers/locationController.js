const { resolveLocality } = require('../lib/locationService');

exports.resolveLocality = async (req, res) => {
  try {
    const { locality } = req.query;

    if (!locality || locality.trim() === '') {
      return res.status(400).json({
        status: 'error',
        message: 'locality query parameter is required'
      });
    }

    const resolved = await resolveLocality(locality);

    res.status(200).json({
      status: 'success',
      data: {
        location: {
          locality: resolved.locality,
          city: resolved.city,
          taluk: resolved.taluk,
          district: resolved.district,
          state: resolved.state,
          country: resolved.country,
          pincode: resolved.pincode
        }
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};
