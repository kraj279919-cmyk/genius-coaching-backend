const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getUserProfile } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// Route to register a new user
router.post('/register', registerUser);

// Route to login a user and get token
router.post('/login', loginUser);

// Route to get the current logged-in user's profile
// 'protect' middleware ensures only logged-in users can access this
router.get('/profile', protect, getUserProfile);

module.exports = router;
