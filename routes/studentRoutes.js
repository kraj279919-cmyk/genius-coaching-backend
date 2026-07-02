const express = require('express');
const router = express.Router();
const {
  createStudent,
  getStudents,
  getStudentById,
  updateStudent,
  deleteStudent,
  deactivateStudent,
  promoteClassPreview,
  promoteClassExecute,
} = require('../controllers/studentController');
const { protect } = require('../middleware/authMiddleware');
const { adminOnly, teacherOnly } = require('../middleware/roleMiddleware');

// All routes here require the user to be logged in
router.use(protect);

// Bulk promotion routes (must be before /:id)
router.post('/promote-class/preview', adminOnly, promoteClassPreview);
router.post('/promote-class/execute', adminOnly, promoteClassExecute);

// GET all students and POST new student
router.route('/')
  .get(teacherOnly, getStudents) // Teachers and admins can view all students
  .post(adminOnly, createStudent); // Only admins can create students

// GET, PUT, DELETE specific student by ID
router.route('/:id')
  .get(getStudentById) // Anyone logged in can try to view (we might add logic to only view self later)
  .put(adminOnly, updateStudent)
  .delete(adminOnly, deleteStudent);

// Deactivate a student
router.patch('/:id/deactivate', adminOnly, deactivateStudent);

module.exports = router;
