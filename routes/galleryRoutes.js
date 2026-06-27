const express = require('express');
const router = express.Router();
const {
  createGalleryImage,
  getGalleryImages,
  getGalleryImageById,
  updateGalleryImage,
  deleteGalleryImage,
} = require('../controllers/galleryController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

// Public routes (anyone can see the gallery)
router.route('/')
  .get(getGalleryImages);
router.route('/:id')
  .get(getGalleryImageById);

// Protected routes
router.use(protect);

router.route('/')
  .post(authorize('admin', 'coDirector'), createGalleryImage);

router.route('/:id')
  .put(authorize('admin', 'coDirector'), updateGalleryImage)
  .delete(authorize('admin', 'coDirector'), deleteGalleryImage);

module.exports = router;
