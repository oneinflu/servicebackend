const multer = require('multer');
const cloudinary = require('../lib/cloudinary');
const Subscription = require('../models/Subscription');
const User = require('../models/User');

// Accept files in memory and stream to Cloudinary
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Invalid file type. Allowed: PDF, DOC, DOCX'));
  },
});

const hasActiveSubscription = async (userId) => {
  const now = new Date();
  const sub = await Subscription.findOne({
    user: userId,
    type: 'JOB_SEARCH',
    startDate: { $lte: now },
    endDate: { $gte: now },
  });
  return Boolean(sub);
};

// POST /api/uploads/resume
// Protected: requires auth and JOB_SEARCH subscription (or admin)
const uploadResume = [
  upload.single('resume'),
  async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ status: 'error', message: 'Not authenticated' });
      }
      const canUpload = req.user.isAdmin || (await hasActiveSubscription(req.user._id));
      if (!canUpload) {
        return res.status(403).json({ status: 'error', message: 'JOB_SEARCH subscription required' });
      }

      if (!req.file) {
        return res.status(400).json({ status: 'error', message: 'No file uploaded. Use field name "resume".' });
      }

      // Upload as raw resource so PDF/DOC are supported
      const folder = `resumes/${req.user._id}`;
      const uploadStream = cloudinary.uploader.upload_stream(
        { resource_type: 'raw', folder },
        async (error, result) => {
          if (error) {
            return res.status(500).json({ status: 'error', message: error.message || 'Upload failed' });
          }
          // Persist URL to user profile
          const secureUrl = result.secure_url || result.url;
          await User.findByIdAndUpdate(req.user._id, { resumeUrl: secureUrl });
          return res.json({ status: 'success', data: { url: secureUrl, public_id: result.public_id } });
        }
      );
      uploadStream.end(req.file.buffer);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return res.status(500).json({ status: 'error', message });
    }
  },
];

module.exports = { uploadResume };