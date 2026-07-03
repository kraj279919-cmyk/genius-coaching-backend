const express = require('express');
const router = express.Router();
const {
  createAnnouncement,
  getAnnouncements,
  getAnnouncementById,
  updateAnnouncement,
  deleteAnnouncement,
} = require('../controllers/announcementController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

// Public routes
router.route('/')
  .get(getAnnouncements);
router.route('/:id')
  .get(getAnnouncementById);

// Protected routes
router.use(protect);

router.route('/')
  .post(authorize('admin', 'director'), createAnnouncement);

router.route('/:id')
  .put(authorize('admin', 'director'), updateAnnouncement)
  .delete(authorize('admin', 'director'), deleteAnnouncement);

module.exports = router;
