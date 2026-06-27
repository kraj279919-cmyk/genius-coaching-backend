const express = require('express');
const router = express.Router();
const { generateResponse } = require('../controllers/aiController');
const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/roleMiddleware');

router.post('/generate', protect, adminOnly, generateResponse);

module.exports = router;
