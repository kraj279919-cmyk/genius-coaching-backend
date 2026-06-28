const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const catchAsync = require('../utils/catchAsync');

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public (or Admin only depending on business rules, we'll make it public for now)
 */
const registerUser = catchAsync(async (req, res) => {
  const { name, email, phone, password, role } = req.body;

  // Check if user already exists
  let userExists;
  if (email) userExists = await User.findOne({ email });
  if (!userExists && phone) userExists = await User.findOne({ phone });

  if (userExists) {
    res.status(400); // Bad request
    throw new Error('User already exists with this email or phone');
  }

  // Create new user in the database
  const user = await User.create({
    name,
    email,
    phone,
    password,
    role: role || 'student', // Default to student if no role provided
  });

  if (user) {
    // Respond with user info and token
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id, user.role),
    });
  } else {
    res.status(400);
    throw new Error('Invalid user data provided');
  }
});

/**
 * @desc    Authenticate user & get token
 * @route   POST /api/auth/login
 * @access  Public
 */
const loginUser = catchAsync(async (req, res) => {
  const { identifier, email, password } = req.body;

  // Fallback to email if identifier is not explicitly provided (backward compatibility)
  const loginId = identifier || email;

  // Find user by email or phone
  const user = await User.findOne({ 
    $or: [{ email: loginId }, { phone: loginId }] 
  });

  // Check if user exists and password matches
  if (user && (await user.matchPassword(password))) {
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      profileImage: user.profileImage,
      token: generateToken(user._id, user.role),
    });
  } else {
    res.status(401); // Unauthorized
    throw new Error('Invalid email or password');
  }
});

/**
 * @desc    Get current logged in user profile
 * @route   GET /api/auth/profile
 * @access  Private
 */
const getUserProfile = catchAsync(async (req, res) => {
  // req.user is set by the authMiddleware
  const user = await User.findById(req.user._id);

  if (user) {
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      profileImage: user.profileImage,
    });
  } else {
    res.status(404); // Not found
    throw new Error('User not found');
  }
});

module.exports = { registerUser, loginUser, getUserProfile };
