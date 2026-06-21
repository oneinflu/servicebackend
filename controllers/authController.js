const User = require('../models/User');
const jwt = require('jsonwebtoken');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d'
  });
};

exports.register = async (req, res) => {
  try {
    const { name, email, phone, password, referredBy, referral_code } = req.body;
    
    // Map referral_code to referredBy for frontend compatibility
    const referralCode = referral_code || referredBy;

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        status: 'error',
        message: 'User already exists'
      });
    }

    // Generate unique referral ID (combination of name and random string)
    const randomString = Math.random().toString(36).substring(2, 8);
    const referralId = `${name.substring(0, 3)}${randomString}`.toUpperCase();

    // Create new user data object
    const userData = {
      name,
      email,
      phone,
      password,
      referralId
    };

    // If referral code is provided, verify it
    let referrer = null;
    if (referralCode) {
      referrer = await User.findOne({ referralId: referralCode });
      if (referrer) {
        userData.referredBy = referrer._id;
      }
    }

    const user = await User.create(userData);

    // If there's a referrer, update their stats with the new user's actual ID
    if (referrer) {
      await User.findByIdAndUpdate(referrer._id, {
        $inc: { referralCount: 1 },
        $push: { referredUsers: user._id }
      });
    }

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      status: 'success',
      token,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          referralId: user.referralId
        }
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

exports.registerAdmin = async (req, res) => {
  try {
    const { name, email, phone, password, adminSecret } = req.body;

    // Verify admin secret
    if (adminSecret !== process.env.ADMIN_SECRET) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid admin secret'
      });
    }

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        status: 'error',
        message: 'User already exists'
      });
    }

    // Create new admin user
    const user = await User.create({
      name,
      email,
      phone,
      password,
      isAdmin: true
    });

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      status: 'success',
      token,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          isAdmin: user.isAdmin
        }
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid email or password'
      });
    }

    // Check if password is correct
    const isPasswordCorrect = await user.comparePassword(password);
    if (!isPasswordCorrect) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid email or password'
      });
    }

    // Generate token
    const token = generateToken(user._id);

    res.status(200).json({
      status: 'success',
      token,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          referralId: user.referralId,
          isAdmin: user.isAdmin
        }
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

exports.getProfile = async (req, res) => {
  try {
    // Get user with referral and company information populated
    const user = await User.findById(req.user._id)
      .populate('referredBy', 'name email referralId')
      .populate('referredUsers', 'name email referralId')
      .populate('company');

    res.status(200).json({
      status: 'success',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          isAdmin: user.isAdmin,
          skippedCompanyInfo: user.skippedCompanyInfo,
          referralId: user.referralId,
          referralCount: user.referralCount,
          referredBy: user.referredBy,
          referredUsers: user.referredUsers,
          company: user.company,
          profilePicUrl: user.profilePicUrl,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        }
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

// Update authenticated user's basic profile fields
exports.updateProfile = async (req, res) => {
  try {
    const allowedFields = ['name', 'email', 'phone', 'skippedCompanyInfo', 'profilePicUrl'];
    const updates = {};
    for (const key of allowedFields) {
      if (key in req.body) updates[key] = req.body[key];
    }

    const updatedUser = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
    })
      .populate('referredBy', 'name email referralId')
      .populate('referredUsers', 'name email referralId')
      .populate('company');

    if (!updatedUser) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        user: {
          id: updatedUser._id,
          name: updatedUser.name,
          email: updatedUser.email,
          phone: updatedUser.phone,
          isAdmin: updatedUser.isAdmin,
          skippedCompanyInfo: updatedUser.skippedCompanyInfo,
          referralId: updatedUser.referralId,
          referralCount: updatedUser.referralCount,
          referredBy: updatedUser.referredBy,
          referredUsers: updatedUser.referredUsers,
          company: updatedUser.company,
          profilePicUrl: updatedUser.profilePicUrl,
          createdAt: updatedUser.createdAt,
          updatedAt: updatedUser.updatedAt,
        }
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

// Admin: list all users (basic fields)
exports.getAllUsers = async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied. Admins only.'
      });
    }

    const users = await User.find()
      .select('name email phone isAdmin referralId referralCount profilePicUrl createdAt updatedAt');

    res.status(200).json({
      status: 'success',
      results: users.length,
      data: { users }
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

// Admin: delete a user by ID
exports.deleteUser = async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied. Admins only.'
      });
    }

    const { id } = req.params;

    if (id === req.user._id.toString()) {
      return res.status(400).json({
        status: 'error',
        message: 'Cannot delete your own admin account'
      });
    }

    const user = await User.findByIdAndDelete(id);

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'User deleted successfully'
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};