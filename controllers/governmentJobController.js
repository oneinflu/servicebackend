const GovernmentJob = require('../models/GovernmentJob');
const { fetchGovernmentJobsFromWeb } = require('../lib/governmentJobFetcher');

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Central jobs are visible to everyone; State jobs only to users in that state.
// Always excludes postings whose deadline has passed.
function buildVisibilityConditions({ state, jobType, keyword }) {
  const conditions = [{ lastDateToApply: { $gte: new Date() } }];

  if (jobType) {
    const types = Array.isArray(jobType)
      ? jobType
      : String(jobType).split(',').map((t) => t.trim()).filter(Boolean);
    if (types.length > 0) conditions.push({ jobType: { $in: types } });
  }

  if (state && String(state).trim() !== '') {
    conditions.push({
      $or: [
        { level: 'Central' },
        { level: 'State', state: { $regex: new RegExp(`^${escapeRegex(state.trim())}$`, 'i') } }
      ]
    });
  }

  if (keyword && String(keyword).trim() !== '') {
    const tokens = String(keyword).split(/[\W_]+/).filter(Boolean);
    const combinedRegex = new RegExp(tokens.join('|'), 'i');
    conditions.push({
      $or: [
        { jobTitle: { $regex: combinedRegex } },
        { organizationName: { $regex: combinedRegex } }
      ]
    });
  }

  return conditions;
}

exports.createGovernmentJob = async (req, res) => {
  try {
    const { jobTitle, organizationName, lastDateToApply, applyLink, jobType, level, state } = req.body;

    const governmentJob = await GovernmentJob.create({
      jobTitle,
      organizationName,
      lastDateToApply,
      applyLink,
      jobType,
      level: level === 'State' ? 'State' : 'Central',
      state: level === 'State' ? (state || '') : '',
      postedBy: req.user._id,
      source: 'admin'
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

// Admin-triggered (or scheduled) discovery of new postings from the web.
// Inserts go live immediately — no separate review/approval step.
exports.triggerGovernmentJobFetch = async (req, res) => {
  try {
    const result = await fetchGovernmentJobsFromWeb();
    res.status(200).json({ status: 'success', data: result });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

exports.getAllGovernmentJobs = async (req, res) => {
  try {
    const { state, jobType } = req.query;
    const conditions = buildVisibilityConditions({ state, jobType });

    const governmentJobs = await GovernmentJob.find({ $and: conditions })
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

// Search government jobs by keyword, optional jobType, and the viewer's state
exports.searchGovernmentJobs = async (req, res) => {
  try {
    const { keyword, jobType, state } = req.query;
    const conditions = buildVisibilityConditions({ state, jobType, keyword });

    const governmentJobs = await GovernmentJob.find({ $and: conditions }).sort({ createdAt: -1 });

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