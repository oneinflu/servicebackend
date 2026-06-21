const express = require('express');
const { register, login, registerAdmin, getProfile, updateProfile, getAllUsers, deleteUser } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/register', register);
router.post('/register-admin', registerAdmin);
router.post('/login', login);
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.get('/users', protect, getAllUsers);
router.delete('/users/:id', protect, deleteUser);

module.exports = router;
