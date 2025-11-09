const express = require('express');
const { register, login, registerAdmin, getProfile, updateProfile, getAllUsers } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/register', register);
router.post('/register-admin', registerAdmin);
router.post('/login', login);
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.get('/users', protect, getAllUsers);

module.exports = router;
