const express = require('express');
const router = express.Router();
const {
  createTeacher,
  getTeachers,
  getTeacherById,
  updateTeacher,
  deactivateTeacher,
  deleteTeacher,
} = require('../controllers/teacherController');
const { protect } = require('../middleware/authMiddleware');
const { adminOnly, authorize } = require('../middleware/roleMiddleware');

router.use(protect);

router.route('/')
  .get(authorize('admin', 'director', 'teacher'), getTeachers) // Secure teacher list
  .post(adminOnly, createTeacher); // Only admins can add new teachers

router.route('/:id')
  .get(getTeacherById)
  .put(adminOnly, updateTeacher)
  .delete(adminOnly, deleteTeacher);

router.patch('/:id/deactivate', adminOnly, deactivateTeacher);

module.exports = router;
