const express = require('express');
const router = express.Router();
const {
  createTeacher,
  getTeachers,
  getTeacherById,
  updateTeacher,
  deleteTeacher,
} = require('../controllers/teacherController');
const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/roleMiddleware');

router.use(protect);

router.route('/')
  .get(getTeachers) // Anyone logged in can see the teachers list
  .post(adminOnly, createTeacher); // Only admins can add new teachers

router.route('/:id')
  .get(getTeacherById)
  .put(adminOnly, updateTeacher)
  .delete(adminOnly, deleteTeacher);

module.exports = router;
