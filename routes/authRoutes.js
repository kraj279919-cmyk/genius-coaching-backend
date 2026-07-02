const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getUserProfile, updateUserProfile } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// Route to register a new user
router.post('/register', registerUser);

// Route to login a user and get token
router.post('/login', loginUser);

// Route to get or update the current logged-in user's profile
router.route('/profile').get(protect, getUserProfile).put(protect, updateUserProfile);

module.exports = router;
