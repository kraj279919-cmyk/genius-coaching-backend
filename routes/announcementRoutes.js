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
  .post(authorize('admin', 'coDirector'), createAnnouncement);

router.route('/:id')
  .put(authorize('admin', 'coDirector'), updateAnnouncement)
  .delete(authorize('admin', 'coDirector'), deleteAnnouncement);

module.exports = router;
