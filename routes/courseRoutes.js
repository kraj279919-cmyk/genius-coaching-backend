const express = require('express');
const router = express.Router();
const {
  createCourse,
  getCourses,
  getCourseById,
  updateCourse,
  deleteCourse,
} = require('../controllers/courseController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

// Public routes
router.route('/')
  .get(getCourses);
router.route('/:id')
  .get(getCourseById);

// Protected Admin-only routes
router.use(protect);

router.route('/')
  .post(authorize('admin', 'director'), createCourse);

router.route('/:id')
  .put(authorize('admin', 'director'), updateCourse)
  .delete(authorize('admin', 'director'), deleteCourse);

module.exports = router;
