const Attendance = require('../models/Attendance');
const Student = require('../models/Student');
const catchAsync = require('../utils/catchAsync');
const { normalizeClassName, getAliasesForClass } = require('../utils/classNormalizer');
const {
  isValidObjectId,
  validateDate
} = require('../utils/validators');

/**
 * @desc    Mark attendance for a student (or multiple students)
 * @route   POST /api/attendance
 * @access  Private (Admin / Teacher)
 */
const createAttendance = catchAsync(async (req, res) => {
  const { studentId, date, status, class: studentClass, section, remarks } = req.body;

  if (!studentId || !date || !status || !studentClass) {
    res.status(400); throw new Error('Student, date, status, and class are required');
  }

  if (!isValidObjectId(studentId)) { res.status(400); throw new Error('Invalid student ID format.'); }
  if (!validateDate(date)) { res.status(400); throw new Error('Invalid date format.'); }
  if (!['present', 'absent', 'late', 'leave'].includes(status.toLowerCase())) { res.status(400); throw new Error('Invalid attendance status.'); }

  const studentExists = await Student.findById(studentId);
  if (!studentExists) { res.status(404); throw new Error('Student not found.'); }

  // Check if attendance already exists for this student on this date
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const existing = await Attendance.findOne({
    studentId,
    date: { $gte: startOfDay, $lte: endOfDay }
  });

  if (existing) {
    res.status(400);
    throw new Error('Attendance already marked for this date');
  }

  const normalizedClass = normalizeClassName(studentClass);

  const attendance = await Attendance.create({
    studentId,
    date,
    status: status.toLowerCase(),
    class: normalizedClass,
    section,
    markedBy: req.user._id,
    remarks,
  });

  const populated = await Attendance.findById(attendance._id).populate('studentId', 'name studentId class section');
  res.status(201).json(populated);
});

/**
 * @desc    Get all attendance records
 * @route   GET /api/attendance
 * @access  Private
 */
const getAttendance = catchAsync(async (req, res) => {
  const filter = {};
  
  if (req.user.role === 'student') {
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) {
      res.status(404);
      throw new Error('Student profile not found');
    }
    filter.studentId = student._id;
  } else {
    if (req.query.class) {
      if (typeof req.query.class === 'string') {
        filter.class = { $in: getAliasesForClass(req.query.class) };
      } else if (Array.isArray(req.query.class)) {
        filter.class = { $in: req.query.class.flatMap(c => getAliasesForClass(c)) };
      }
    }
    if (req.query.date) {
      const startOfDay = new Date(req.query.date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(req.query.date);
      endOfDay.setHours(23, 59, 59, 999);
      filter.date = { $gte: startOfDay, $lte: endOfDay };
    }
  }

  const limit = parseInt(req.query.limit) || 1000;
  const page = parseInt(req.query.page) || 1;
  const skip = (page - 1) * limit;

  const records = await Attendance.find(filter)
    .lean()
    .sort({ date: -1 })
    .skip(skip)
    .limit(limit)
    .populate('studentId', 'name studentId class section')
    .populate('markedBy', 'name');

  res.json(records);
});

/**
 * @desc    Get attendance by student ID
 * @route   GET /api/attendance/student/:studentId
 * @access  Private
 */
const getAttendanceByStudent = catchAsync(async (req, res) => {
  if (req.user.role === 'student') {
    const student = await Student.findOne({ userId: req.user._id }).lean();
    if (!student || student._id.toString() !== req.params.studentId) {
      res.status(403);
      throw new Error('Not authorized to view these records');
    }
  }

  const limit = parseInt(req.query.limit) || 1000;
  const page = parseInt(req.query.page) || 1;
  const skip = (page - 1) * limit;

  const records = await Attendance.find({ studentId: req.params.studentId })
    .lean()
    .sort({ date: -1 })
    .skip(skip)
    .limit(limit)
    .populate('studentId', 'name studentId class section')
    .populate('markedBy', 'name');
    
  res.json(records);
});

/**
 * @desc    Get attendance by class
 * @route   GET /api/attendance/class/:className
 * @access  Private (Admin / Teacher)
 */
const getAttendanceByClass = catchAsync(async (req, res) => {
  if (req.user.role === 'student') {
    res.status(403);
    throw new Error('Students cannot view class attendance');
  }

  const filter = { class: { $in: getAliasesForClass(req.params.className) } };
  if (req.query.date) {
    const startOfDay = new Date(req.query.date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(req.query.date);
    endOfDay.setHours(23, 59, 59, 999);
    filter.date = { $gte: startOfDay, $lte: endOfDay };
  }

  const limit = parseInt(req.query.limit) || 1000;
  const page = parseInt(req.query.page) || 1;
  const skip = (page - 1) * limit;

  const records = await Attendance.find(filter)
    .lean()
    .sort({ date: -1 })
    .skip(skip)
    .limit(limit)
    .populate('studentId', 'name studentId class section')
    .populate('markedBy', 'name');
    
  res.json(records);
});

/**
 * @desc    Get summary stats (dashboard sync)
 * @route   GET /api/attendance/summary
 * @access  Private (Admin)
 */
const getAttendanceSummary = catchAsync(async (req, res) => {
  if (req.user.role === 'student') {
    res.status(403);
    throw new Error('Unauthorized');
  }

  // Get today's attendance summary
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  const todaysRecords = await Attendance.find({
    date: { $gte: startOfDay, $lte: endOfDay }
  }).lean();

  const total = todaysRecords.length;
  let present = 0, absent = 0, late = 0, leave = 0;

  todaysRecords.forEach(r => {
    const s = r.status.toLowerCase();
    if (s === 'present') present++;
    else if (s === 'absent') absent++;
    else if (s === 'late') late++;
    else if (s === 'leave') leave++;
  });

  res.json({
    date: startOfDay,
    total,
    present,
    absent,
    late,
    leave,
    percentage: total > 0 ? Math.round(((present + late) / total) * 100) : 0
  });
});

/**
 * @desc    Update an attendance record
 * @route   PATCH /api/attendance/:id
 * @access  Private (Admin / Teacher)
 */
const updateAttendance = catchAsync(async (req, res) => {
  const record = await Attendance.findById(req.params.id);

  if (record) {
    if (req.body.status !== undefined && !['present', 'absent', 'late', 'leave'].includes(req.body.status.toLowerCase())) {
      res.status(400); throw new Error('Invalid attendance status.');
    }
    
    record.status = req.body.status ? req.body.status.toLowerCase() : record.status;
    record.remarks = req.body.remarks !== undefined ? req.body.remarks : record.remarks;
    
    const updatedRecord = await record.save();
    const populated = await Attendance.findById(updatedRecord._id).populate('studentId', 'name studentId class section');
    res.json(populated);
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
  getAttendanceByStudent,
  getAttendanceByClass,
  getAttendanceSummary,
  updateAttendance,
  deleteAttendance,
};
