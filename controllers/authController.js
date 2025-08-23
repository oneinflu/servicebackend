const User = require('../models/User');
const jwt = require('jsonwebtoken');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d'
  });
};

exports.register = async (req, res) => {
  try {
    const { name, email, phone, password, referredBy } = req.body;

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

    // Create new user with referral ID
    const userData = {
      name,
      email,
      phone,
      password,
      referralId
    };

    // If referredBy is provided, verify and add it
    if (referredBy) {
      const referrer = await User.findOne({ referralId: referredBy });
      if (referrer) {
        userData.referredBy = referrer._id;
        
        // Update referrer's stats
        await User.findByIdAndUpdate(referrer._id, {
          $inc: { referralCount: 1 },
          $push: { referredUsers: userData._id }
        });
      }
    }

    const user = await User.create(userData);

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
      role: 'admin'
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
          role: user.role
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

exports.getProfile = async (req, res) => {
  try {
    // Get user with referral information populated
    const user = await User.findById(req.user._id)
      .populate('referredBy', 'name email referralId')
      .populate('referredUsers', 'name email referralId');

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
