const SavedJob = require('../models/SavedJob');
const JobApplication = require('../models/JobApplication');
const ServiceLead = require('../models/ServiceLead');
const ProfileView = require('../models/ProfileView');
const Service = require('../models/Service');
const Job = require('../models/Job');

// Toggle save/unsave — returns the new saved state.
exports.toggleSaveJob = async (req, res) => {
  try {
    const { jobId } = req.params;
    const existing = await SavedJob.findOne({ user: req.user._id, job: jobId });

    if (existing) {
      await SavedJob.deleteOne({ _id: existing._id });
      return res.status(200).json({ status: 'success', data: { saved: false } });
    }

    await SavedJob.create({ user: req.user._id, job: jobId });
    res.status(201).json({ status: 'success', data: { saved: true } });
  } catch (error) {
    res.status(400).json({ status: 'error', message: error.message });
  }
};

exports.getSavedJobs = async (req, res) => {
  try {
    const saved = await SavedJob.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .populate({ path: 'job', populate: { path: 'categories', select: 'name' } });

    res.status(200).json({
      status: 'success',
      results: saved.length,
      data: { jobs: saved.map((s) => s.job).filter(Boolean) }
    });
  } catch (error) {
    res.status(400).json({ status: 'error', message: error.message });
  }
};

// Idempotent per (user, job) — tapping Apply/Call more than once on the
// same job doesn't inflate the count.
exports.logJobApplication = async (req, res) => {
  try {
    const { jobId } = req.params;
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ status: 'error', message: 'Job not found' });
    }

    await JobApplication.findOneAndUpdate(
      { user: req.user._id, job: jobId },
      { user: req.user._id, job: jobId },
      { upsert: true }
    );

    res.status(200).json({ status: 'success' });
  } catch (error) {
    res.status(400).json({ status: 'error', message: error.message });
  }
};

exports.logServiceLead = async (req, res) => {
  try {
    const { serviceId } = req.params;
    const service = await Service.findById(serviceId);
    if (!service) {
      return res.status(404).json({ status: 'error', message: 'Service not found' });
    }
    if (String(service.user) === String(req.user._id)) {
      return res.status(200).json({ status: 'success', message: 'Provider viewing their own service' });
    }

    await ServiceLead.create({
      service: serviceId,
      provider: service.user,
      contactedBy: req.user._id
    });

    res.status(200).json({ status: 'success' });
  } catch (error) {
    res.status(400).json({ status: 'error', message: error.message });
  }
};

exports.logProfileView = async (req, res) => {
  try {
    const { userId } = req.params;
    if (String(userId) === String(req.user._id)) {
      return res.status(200).json({ status: 'success', message: 'Self view not counted' });
    }

    await ProfileView.findOneAndUpdate(
      { profileOwner: userId, viewedBy: req.user._id },
      { profileOwner: userId, viewedBy: req.user._id },
      { upsert: true }
    );

    res.status(200).json({ status: 'success' });
  } catch (error) {
    res.status(400).json({ status: 'error', message: error.message });
  }
};

// Powers the home screen stats row — all real counts, no placeholders.
exports.getMyStats = async (req, res) => {
  try {
    const userId = req.user._id;
    const isBusiness = req.user.accountType === 'business';

    if (isBusiness) {
      const [jobsPosted, servicesPosted, profileViews] = await Promise.all([
        Job.countDocuments({ user: userId }),
        Service.countDocuments({ user: userId }),
        ProfileView.countDocuments({ profileOwner: userId })
      ]);
      res.status(200).json({
        status: 'success',
        data: {
          jobsPosted,
          savedProfiles: 0,
          servicesPosted,
          profileViews
        }
      });
    } else {
      const [jobsApplied, savedJobs, servicesPosted, profileViews] = await Promise.all([
        JobApplication.countDocuments({ user: userId }),
        SavedJob.countDocuments({ user: userId }),
        Service.countDocuments({ user: userId }),
        ProfileView.countDocuments({ profileOwner: userId })
      ]);
      res.status(200).json({
        status: 'success',
        data: {
          jobsApplied,
          savedJobs,
          servicesPosted,
          profileViews
        }
      });
    }
  } catch (error) {
    res.status(400).json({ status: 'error', message: error.message });
  }
};
