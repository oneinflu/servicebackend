const express = require('express');
const { resolveLocality } = require('../controllers/locationController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Protected route to resolve a locality using OpenAI with DB caching
router.get('/resolve', protect, resolveLocality);

module.exports = router;
