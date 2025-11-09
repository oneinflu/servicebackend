const GovernmentJob = require('../models/GovernmentJob');

exports.createGovernmentJob = async (req, res) => {
  try {
    const { jobTitle, organizationName, lastDateToApply, applyLink, jobType } = req.body;

    const governmentJob = await GovernmentJob.create({
      jobTitle,
      organizationName,
      lastDateToApply,
      applyLink,
      jobType,
      postedBy: req.user._id
    });

    res.status(201).json({
      status: 'success',
      data: {
        governmentJob
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

exports.getAllGovernmentJobs = async (req, res) => {
  try {
    const governmentJobs = await GovernmentJob.find()
      .sort({ createdAt: -1 });

    res.status(200).json({
      status: 'success',
      results: governmentJobs.length,
      data: {
        governmentJobs
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

// Search government jobs by keyword and optional jobType filter
exports.searchGovernmentJobs = async (req, res) => {
  try {
    const { keyword, jobType } = req.query;

    const query = {};

    // Filter by jobType if provided (string or comma-separated list)
    if (jobType) {
      const types = Array.isArray(jobType)
        ? jobType
        : String(jobType)
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean);
      if (types.length > 0) {
        query.jobType = { $in: types };
      }
    }

    // Build text search across jobTitle and organizationName if keyword present
    if (keyword && String(keyword).trim() !== '') {
      const tokens = String(keyword).split(/[\W_]+/).filter(Boolean);
      const combinedRegex = new RegExp(tokens.join('|'), 'i');
      query.$or = [
        { jobTitle: { $regex: combinedRegex } },
        { organizationName: { $regex: combinedRegex } },
      ];
    }

    const governmentJobs = await GovernmentJob.find(query).sort({ createdAt: -1 });

    return res.status(200).json({
      status: 'success',
      results: governmentJobs.length,
      data: { governmentJobs },
    });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

exports.getGovernmentJobById = async (req, res) => {
  try {
    const governmentJob = await GovernmentJob.findById(req.params.id);

    if (!governmentJob) {
      return res.status(404).json({
        status: 'error',
        message: 'Government job not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        governmentJob
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

exports.updateGovernmentJob = async (req, res) => {
  try {
    const governmentJob = await GovernmentJob.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    if (!governmentJob) {
      return res.status(404).json({
        status: 'error',
        message: 'Government job not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        governmentJob
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

exports.deleteGovernmentJob = async (req, res) => {
  try {
    const governmentJob = await GovernmentJob.findByIdAndDelete(req.params.id);

    if (!governmentJob) {
      return res.status(404).json({
        status: 'error',
        message: 'Government job not found'
      });
    }

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