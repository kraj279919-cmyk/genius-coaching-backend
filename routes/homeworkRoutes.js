const express = require('express');
const router = express.Router();
const {
  createHomework,
  getHomework,
  getHomeworkByClass,
  getHomeworkById,
  updateHomework,
  deleteHomework,
} = require('../controllers/homeworkController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect);

router.route('/class/:className')
  .get(getHomeworkByClass);

router.route('/')
  .get(getHomework)
  .post(authorize('admin', 'director', 'teacher'), createHomework);

router.route('/:id')
  .get(getHomeworkById)
  .put(authorize('admin', 'director', 'teacher'), updateHomework)
  .patch(authorize('admin', 'director', 'teacher'), updateHomework)
  .delete(authorize('admin', 'director', 'teacher'), deleteHomework);

module.exports = router;
