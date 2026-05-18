const Company = require('../models/Company');
const User = require('../models/User');
const { resolveLocality } = require('../lib/locationService');

// Helper: build location from locality or full location object
async function buildLocation(locality, location) {
  if (locality && locality.trim() !== '') {
    const resolved = await resolveLocality(locality.trim());
    return {
      address: resolved.locality,
      city: resolved.city,
      taluk: resolved.taluk,
      district: resolved.district,
      state: resolved.state,
      country: resolved.country,
      pincode: resolved.pincode
    };
  }
  if (location && location.address && !location.city) {
    const resolved = await resolveLocality(location.address.trim());
    return {
      address: resolved.locality,
      city: resolved.city,
      taluk: resolved.taluk,
      district: resolved.district,
      state: resolved.state,
      country: resolved.country,
      pincode: resolved.pincode
    };
  }
  return location; // already a full object
}

// Create a new company
exports.createCompany = async (req, res) => {
  try {
    const { name, location, locality, website, about, logo } = req.body;

    const resolvedLocation = await buildLocation(locality, location);

    const company = await Company.create({
      name,
      location: resolvedLocation,
      website,
      about,
      logo,
      user: req.user._id
    });

    // Update the user's company field
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { company: company._id },
      { new: true }
    ).populate('company');

    res.status(201).json({
      status: 'success',
      data: {
        company,
        user: updatedUser
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

// Get all companies
exports.getAllCompanies = async (req, res) => {
  try {
    const companies = await Company.find();

    res.status(200).json({
      status: 'success',
      results: companies.length,
      data: {
        companies
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

// Get company by ID
exports.getCompanyById = async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);

    if (!company) {
      return res.status(404).json({
        status: 'error',
        message: 'Company not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        company
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

// Get my companies
exports.getMyCompanies = async (req, res) => {
  try {
    const companies = await Company.find({ user: req.user._id });

    res.status(200).json({
      status: 'success',
      results: companies.length,
      data: {
        companies
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

// Update company
exports.updateCompany = async (req, res) => {
  try {
    const { name, location, locality, website, about, logo } = req.body;

    let company = await Company.findById(req.params.id);
    let isNewCompany = false;

    const resolvedLocation = await buildLocation(locality, location);

    // If no company found and user doesn't have a company, create a new one
    if (!company && !req.user.company) {
      company = await Company.create({
        name,
        location: resolvedLocation,
        website,
        about,
        logo,
        user: req.user._id
      });
      isNewCompany = true;
    } else if (!company) {
      return res.status(404).json({
        status: 'error',
        message: 'Company not found'
      });
    }

    // If updating existing company, check authorization
    if (!isNewCompany && company.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        status: 'error',
        message: 'You are not authorized to update this company'
      });
    }

    // Update company if not newly created
    if (!isNewCompany) {
      company = await Company.findByIdAndUpdate(
        req.params.id,
        { name, location: resolvedLocation, website, about, logo },
        { new: true, runValidators: true }
      );
    }

    // Update user's company field if it's a new company
    if (isNewCompany) {
      await req.user.updateOne({ company: company._id });
    }

    res.status(200).json({
      status: 'success',
      data: {
        company
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

// Delete company
exports.deleteCompany = async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);

    if (!company) {
      return res.status(404).json({
        status: 'error',
        message: 'Company not found'
      });
    }

    // Check if the company belongs to the logged-in user
    if (company.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        status: 'error',
        message: 'You are not authorized to delete this company'
      });
    }

    await Company.findByIdAndDelete(req.params.id);

    res.status(204).json({
      status: 'success',
      data: null
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};