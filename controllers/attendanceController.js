const Attendance = require('../models/Attendance');
const Student = require('../models/Student');
const catchAsync = require('../utils/catchAsync');

/**
 * @desc    Mark attendance for a student
 * @route   POST /api/attendance
 * @access  Private (Admin / Teacher)
 */
const createAttendance = catchAsync(async (req, res) => {
  const { studentId, date, status, class: studentClass, remarks } = req.body;

  const attendance = await Attendance.create({
    studentId,
    date: date || Date.now(),
    status,
    class: studentClass,
    markedBy: req.user._id,
    remarks,
  });

  res.status(201).json(attendance);
});

/**
 * @desc    Get all attendance records
 * @route   GET /api/attendance
 * @access  Private
 */
const getAttendance = catchAsync(async (req, res) => {
  const filter = {};
  
  // Student can only see their own attendance
  if (req.user.role === 'student') {
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) {
      res.status(404);
      throw new Error('Student profile not found');
    }
    filter.studentId = student._id;
  } else {
    // Teachers and Admins can filter by class or specific student
    if (req.query.class) filter.class = req.query.class;
    if (req.query.studentId) filter.studentId = req.query.studentId;
  }

  const records = await Attendance.find(filter)
    .sort({ date: -1 })
    .populate('studentId', 'name studentId')
    .populate('markedBy', 'name');

  res.json(records);
});

/**
 * @desc    Get specific attendance record by ID
 * @route   GET /api/attendance/:id
 * @access  Private
 */
const getAttendanceById = catchAsync(async (req, res) => {
  const record = await Attendance.findById(req.params.id)
    .populate('studentId', 'name studentId')
    .populate('markedBy', 'name');

  if (record) {
    // If student, ensure it belongs to them
    if (req.user.role === 'student') {
      const student = await Student.findOne({ userId: req.user._id });
      if (!student || record.studentId._id.toString() !== student._id.toString()) {
        res.status(403);
        throw new Error('Not authorized to view this record');
      }
    }
    res.json(record);
  } else {
    res.status(404);
    throw new Error('Attendance record not found');
  }
});

/**
 * @desc    Update an attendance record
 * @route   PUT /api/attendance/:id
 * @access  Private (Admin / Teacher)
 */
const updateAttendance = catchAsync(async (req, res) => {
  const record = await Attendance.findById(req.params.id);

  if (record) {
    record.status = req.body.status || record.status;
    record.remarks = req.body.remarks || record.remarks;
    
    const updatedRecord = await record.save();
    res.json(updatedRecord);
  } else {
    res.status(404);
    throw new Error('Attendance record not found');
  }
});

/**
 * @desc    Delete an attendance record
 * @route   DELETE /api/attendance/:id
 * @access  Private (Admin / Teacher)
 */
const deleteAttendance = catchAsync(async (req, res) => {
  const record = await Attendance.findById(req.params.id);

  if (record) {
    await record.deleteOne();
    res.json({ message: 'Attendance record deleted successfully' });
  } else {
    res.status(404);
    throw new Error('Attendance record not found');
  }
});

module.exports = {
  createAttendance,
  getAttendance,
  getAttendanceById,
  updateAttendance,
  deleteAttendance,
};
