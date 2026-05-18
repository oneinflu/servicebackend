const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { uploadResume, uploadPayoutProof } = require('../controllers/uploadController');

const router = express.Router();

// Upload resume (PDF/DOC/DOCX). Returns URL and saves to user.
router.post('/resume', protect, uploadResume);

// Upload payout proof screenshot/receipt (JPEG/PNG/PDF). Returns URL. Admin only.
router.post('/proof', protect, uploadPayoutProof);

module.exports = router;