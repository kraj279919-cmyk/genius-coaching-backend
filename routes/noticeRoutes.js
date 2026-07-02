const express = require('express');
const router = express.Router();
const {
  createNotice,
  getNotices,
  getPublicNotices,
  getNoticeById,
  updateNotice,
  deleteNotice,
} = require('../controllers/noticeController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

// Public route for Website Sync
router.get('/public', getPublicNotices);

// Protected routes
router.use(protect);

router.route('/')
  .get(getNotices) // All authenticated users can see appropriate notices
  .post(authorize('admin', 'director', 'teacher'), createNotice);

router.route('/:id')
  .get(getNoticeById)
  .put(authorize('admin', 'director', 'teacher'), updateNotice)
  .delete(authorize('admin', 'director', 'teacher'), deleteNotice);

module.exports = router;
