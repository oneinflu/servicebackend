const express = require('express');
const { createService, getAllServices, getServiceById, getMyServices, searchServicesByKeyword, updateService, deleteService } = require('../controllers/serviceController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Protected routes
router.post('/', protect, createService);
router.get('/my-services', protect, getMyServices);
router.get('/', protect, getAllServices);
// Important: define specific routes BEFORE parameterized ':id' to avoid clashes
router.get('/search', protect, searchServicesByKeyword);
router.get('/:id', protect, getServiceById);
router.put('/:id', protect, updateService);
router.delete('/:id', protect, deleteService);

module.exports = router;