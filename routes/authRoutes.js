const express = require('express');
const { register, login, registerAdmin, getProfile } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/register', register);
router.post('/register-admin', registerAdmin);
router.post('/login', login);
router.get('/profile', protect, getProfile);

module.exports = router;
