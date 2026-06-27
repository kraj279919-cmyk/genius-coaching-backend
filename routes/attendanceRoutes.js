const express = require('express');
const router = express.Router();
const {
  createAttendance,
  getAttendance,
  getAttendanceById,
  updateAttendance,
  deleteAttendance,
} = require('../controllers/attendanceController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect);

router.route('/')
  .get(getAttendance) // Anyone logged in can view
  .post(authorize('admin', 'teacher'), createAttendance); // Only Admin/Teacher can create

router.route('/:id')
  .get(getAttendanceById)
  .put(authorize('admin', 'teacher'), updateAttendance)
  .delete(authorize('admin', 'teacher'), deleteAttendance);

module.exports = router;
