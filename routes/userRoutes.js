const express = require('express');
const router = express.Router();
const { resetPassword } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/roleMiddleware');

router.use(protect);
router.use(adminOnly);

// PATCH /api/users/:id/reset-password
router.patch('/:id/reset-password', resetPassword);

module.exports = router;
