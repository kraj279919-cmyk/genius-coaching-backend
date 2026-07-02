const express = require('express');
const router = express.Router();
const {
  getGallery,
  getPublicGallery,
  getGalleryById,
  createGalleryImage,
  updateGalleryImage,
  deleteGalleryImage,
} = require('../controllers/galleryController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

// Public route (no auth required)
router.route('/public')
  .get(getPublicGallery);

// Protected routes
router.use(protect);

router.route('/')
  .get(authorize('admin', 'director'), getGallery)
  .post(authorize('admin', 'director'), createGalleryImage);

router.route('/:id')
  .get(getGalleryById)
  .patch(authorize('admin', 'director'), updateGalleryImage)
  .put(authorize('admin', 'director'), updateGalleryImage)
  .delete(authorize('admin', 'director'), deleteGalleryImage);

module.exports = router;
