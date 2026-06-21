const express = require('express');
const { createCategories, getAllCategories, getPendingCategories, getCategoriesByType, updateCategory, deleteCategory, requestCategory, approveCategory } = require('../controllers/categoryController');
const { protect, isAdmin, protectOptional } = require('../middleware/authMiddleware');

const router = express.Router();

// Create categories (admin)
router.post('/', protect, isAdmin, createCategories);
// Authenticated users request a new category (saves as pending)
router.post('/request', protect, requestCategory);
// Admin: approve a pending category
router.put('/:id/approve', protect, isAdmin, approveCategory);
// Admin: list pending categories
router.get('/pending', protect, isAdmin, getPendingCategories);
// Public list (approved only) — token optional, used for graceful auth
router.get('/', protectOptional, getAllCategories);
router.get('/type/:type', getCategoriesByType);
// Update/delete category (admin)
router.put('/:id', protect, isAdmin, updateCategory);
router.delete('/:id', protect, isAdmin, deleteCategory);

module.exports = router;