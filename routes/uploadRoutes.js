const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { uploadResume } = require('../controllers/uploadController');

const router = express.Router();

// Upload resume (PDF/DOC/DOCX). Returns URL and saves to user.
router.post('/resume', protect, uploadResume);

module.exports = router;