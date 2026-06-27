const express = require('express');
const router = express.Router();
const {
  createNotice,
  getNotices,
  getNoticeById,
  updateNotice,
  deleteNotice,
} = require('../controllers/noticeController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect);

router.route('/')
  .get(getNotices) // Everyone can see notices
  // Only admins, coDirectors, and teachers can create notices
  .post(authorize('admin', 'coDirector', 'teacher'), createNotice);

router.route('/:id')
  .get(getNoticeById)
  .put(authorize('admin', 'coDirector', 'teacher'), updateNotice)
  .delete(authorize('admin', 'coDirector', 'teacher'), deleteNotice);

module.exports = router;
