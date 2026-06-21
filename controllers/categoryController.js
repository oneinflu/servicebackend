const Category = require('../models/Category');

exports.createCategories = async (req, res) => {
  try {
    const categories = Array.isArray(req.body) ? req.body : [req.body];

    // Validate all categories before saving
    categories.forEach(category => {
      if (!category.name || !category.type) {
        throw new Error('Name and type are required for all categories');
      }
      if (!['Service', 'Job'].includes(category.type)) {
        throw new Error('Type must be either "Service" or "Job"');
      }
    });

    const createdCategories = await Category.insertMany(categories);

    res.status(201).json({
      status: 'success',
      data: {
        categories: createdCategories
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

exports.getAllCategories = async (req, res) => {
  try {
    // Exclude only explicitly pending — existing docs without a status field are treated as approved
    const categories = await Category.find({ status: { $ne: 'pending' } });
    res.status(200).json({ status: 'success', data: { categories } });
  } catch (error) {
    res.status(400).json({ status: 'error', message: error.message });
  }
};

exports.getPendingCategories = async (req, res) => {
  try {
    const categories = await Category.find({ status: 'pending' })
      .populate('requestedBy', 'name email');
    res.status(200).json({ status: 'success', data: { categories } });
  } catch (error) {
    res.status(400).json({ status: 'error', message: error.message });
  }
};

exports.getCategoriesByType = async (req, res) => {
  try {
    const { type } = req.params;

    if (!['Service', 'Job'].includes(type)) {
      return res.status(400).json({
        status: 'error',
        message: 'Type must be either "Service" or "Job"'
      });
    }

    // Exclude only explicitly pending — existing docs without a status field are treated as approved
    const categories = await Category.find({ type, status: { $ne: 'pending' } });

    res.status(200).json({
      status: 'success',
      data: {
        categories
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Authenticated user requests a new category (goes to pending)
exports.requestCategory = async (req, res) => {
  try {
    const { name, type } = req.body;

    if (!name || !type) {
      return res.status(400).json({ status: 'error', message: 'Name and type are required' });
    }
    if (!['Service', 'Job'].includes(type)) {
      return res.status(400).json({ status: 'error', message: 'Type must be "Service" or "Job"' });
    }

    const existing = await Category.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
    if (existing) {
      return res.status(400).json({ status: 'error', message: 'A category with this name already exists or is pending approval' });
    }

    const category = await Category.create({
      name,
      type,
      status: 'pending',
      requestedBy: req.user._id,
    });

    res.status(201).json({
      status: 'success',
      message: 'Category request submitted for admin approval',
      data: { category }
    });
  } catch (error) {
    res.status(400).json({ status: 'error', message: error.message });
  }
};

// Admin approves a pending category
exports.approveCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await Category.findByIdAndUpdate(
      id,
      { status: 'approved' },
      { new: true }
    );
    if (!updated) {
      return res.status(404).json({ status: 'error', message: 'Category not found' });
    }
    res.status(200).json({ status: 'success', data: { category: updated } });
  } catch (error) {
    res.status(400).json({ status: 'error', message: error.message });
  }
};

// Update a single category by ID
exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, type } = req.body || {};

    if (!name && !type) {
      return res.status(400).json({
        status: 'error',
        message: 'Nothing to update. Provide name and/or type.'
      });
    }

    if (type && !['Service', 'Job'].includes(type)) {
      return res.status(400).json({
        status: 'error',
        message: 'Type must be either "Service" or "Job"'
      });
    }

    const updated = await Category.findByIdAndUpdate(
      id,
      { ...(name ? { name } : {}), ...(type ? { type } : {}) },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({
        status: 'error',
        message: 'Category not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: { category: updated }
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

// Delete a single category by ID
exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await Category.findById(id);
    if (!existing) {
      return res.status(404).json({
        status: 'error',
        message: 'Category not found'
      });
    }
    await Category.findByIdAndDelete(id);
    res.status(200).json({
      status: 'success',
      message: 'Category deleted'
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};