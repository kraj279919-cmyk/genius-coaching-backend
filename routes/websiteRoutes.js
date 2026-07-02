const express = require('express');
const router = express.Router();
const { 
  getWebsiteContent, 
  getPublicWebsiteContent, 
  updateWebsiteContent,
  updateWebsiteSection
} = require('../controllers/websiteController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

// Public route for frontend/website to consume safely
router.get('/public', getPublicWebsiteContent);

// Protected Admin Routes
router.use(protect);

router.route('/')
  .get(authorize('admin', 'director'), getWebsiteContent)
  .put(authorize('admin', 'director'), updateWebsiteContent);

router.route('/section/:section')
  .patch(authorize('admin', 'director'), updateWebsiteSection);

module.exports = router;
