const express = require('express');
const router = express.Router();
const {
  createHomework,
  getHomework,
  getHomeworkById,
  updateHomework,
  deleteHomework,
} = require('../controllers/homeworkController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect);

router.route('/')
  .get(getHomework) // Students can view
  .post(authorize('admin', 'teacher'), createHomework);

router.route('/:id')
  .get(getHomeworkById)
  .put(authorize('admin', 'teacher'), updateHomework)
  .delete(authorize('admin', 'teacher'), deleteHomework);

module.exports = router;
