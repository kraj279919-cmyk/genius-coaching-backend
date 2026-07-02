const express = require('express');
const router = express.Router();
const {
  createAttendance,
  getAttendance,
  getAttendanceByStudent,
  getAttendanceByClass,
  getAttendanceSummary,
  updateAttendance,
  deleteAttendance,
} = require('../controllers/attendanceController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect);

router.route('/summary')
  .get(authorize('admin', 'director'), getAttendanceSummary);

router.route('/class/:className')
  .get(authorize('admin', 'director', 'teacher'), getAttendanceByClass);

router.route('/student/:studentId')
  .get(getAttendanceByStudent);

router.route('/')
  .get(getAttendance)
  .post(authorize('admin', 'director', 'teacher'), createAttendance);

router.route('/:id')
  .put(authorize('admin', 'director', 'teacher'), updateAttendance)
  .patch(authorize('admin', 'director', 'teacher'), updateAttendance)
  .delete(authorize('admin', 'director', 'teacher'), deleteAttendance);

module.exports = router;
