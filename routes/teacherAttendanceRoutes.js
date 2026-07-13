const express = require('express');
const router = express.Router();
const {
  createTeacherAttendance,
  getTeacherAttendance,
  updateTeacherAttendance,
  bulkMarkTeacherAttendance,
} = require('../controllers/teacherAttendanceController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect);

router.route('/bulk')
  .post(authorize('admin', 'director'), bulkMarkTeacherAttendance);

router.route('/')
  .get(authorize('admin', 'director', 'teacher'), getTeacherAttendance)
  .post(authorize('admin', 'director'), createTeacherAttendance);

router.route('/:id')
  .put(authorize('admin', 'director'), updateTeacherAttendance);

module.exports = router;
