const express = require('express');
const router = express.Router();
const { getWebsiteContent, updateWebsiteContent } = require('../controllers/websiteController');
const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/roleMiddleware');

router.get('/', getWebsiteContent); // Public
router.put('/', protect, adminOnly, updateWebsiteContent);

module.exports = router;
