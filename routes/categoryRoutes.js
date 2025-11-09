const express = require('express');
const { createCategories, getAllCategories, getCategoriesByType, updateCategory, deleteCategory } = require('../controllers/categoryController');
const { protect, isAdmin } = require('../middleware/authMiddleware');

const router = express.Router();

// Create categories (admin)
router.post('/', protect, isAdmin, createCategories);
router.get('/', getAllCategories);
router.get('/type/:type', getCategoriesByType);
// Update/delete category (admin)
router.put('/:id', protect, isAdmin, updateCategory);
router.delete('/:id', protect, isAdmin, deleteCategory);

module.exports = router;