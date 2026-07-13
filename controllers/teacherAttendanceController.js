const TeacherAttendance = require('../models/TeacherAttendance');
const Teacher = require('../models/Teacher');
const catchAsync = require('../utils/catchAsync');
const { isValidObjectId, validateDate } = require('../utils/validators');

const createTeacherAttendance = catchAsync(async (req, res) => {
  const { teacherId, date, status, remarks } = req.body;

  if (!teacherId || !date || !status) {
    res.status(400); throw new Error('Teacher, date, and status are required');
  }

  if (!isValidObjectId(teacherId)) { res.status(400); throw new Error('Invalid teacher ID format.'); }
  if (!validateDate(date)) { res.status(400); throw new Error('Invalid date format.'); }
  if (!['present', 'absent', 'late', 'leave'].includes(status.toLowerCase())) { res.status(400); throw new Error('Invalid attendance status.'); }

  const teacherExists = await Teacher.findById(teacherId);
  if (!teacherExists) { res.status(404); throw new Error('Teacher not found.'); }

  const startOfDay = new Date(date); startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date); endOfDay.setHours(23, 59, 59, 999);

  const existing = await TeacherAttendance.findOne({
    teacherId,
    date: { $gte: startOfDay, $lte: endOfDay }
  });

  if (existing) {
    res.status(400); throw new Error('Attendance already marked for this teacher on this date');
  }

  const attendance = await TeacherAttendance.create({
    teacherId,
    date,
    status: status.toLowerCase(),
    markedBy: req.user._id,
    remarks,
  });

  const populated = await TeacherAttendance.findById(attendance._id).populate('teacherId', 'name email teacherId');
  res.status(201).json(populated);
});

const getTeacherAttendance = catchAsync(async (req, res) => {
  const filter = {};
  
  if (req.user.role === 'teacher') {
    const teacher = await Teacher.findOne({ userId: req.user._id });
    if (!teacher) { res.status(404); throw new Error('Teacher profile not found'); }
    filter.teacherId = teacher._id;
  }
  
  if (req.query.date) {
    const startOfDay = new Date(req.query.date); startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(req.query.date); endOfDay.setHours(23, 59, 59, 999);
    filter.date = { $gte: startOfDay, $lte: endOfDay };
  }

  const records = await TeacherAttendance.find(filter)
    .lean()
    .sort({ date: -1 })
    .populate('teacherId', 'name email teacherId')
    .populate('markedBy', 'name');

  res.json(records);
});

const updateTeacherAttendance = catchAsync(async (req, res) => {
  const record = await TeacherAttendance.findById(req.params.id);

  if (record) {
    if (req.body.status !== undefined && !['present', 'absent', 'late', 'leave'].includes(req.body.status.toLowerCase())) {
      res.status(400); throw new Error('Invalid attendance status.');
    }
    
    record.status = req.body.status ? req.body.status.toLowerCase() : record.status;
    record.remarks = req.body.remarks !== undefined ? req.body.remarks : record.remarks;
    
    const updatedRecord = await record.save();
    const populated = await TeacherAttendance.findById(updatedRecord._id).populate('teacherId', 'name email teacherId');
    res.json(populated);
  } else {
    res.status(404); throw new Error('Teacher attendance record not found');
  }
});

const bulkMarkTeacherAttendance = catchAsync(async (req, res) => {
  const { date, status } = req.body;

  if (!date || !status) {
    res.status(400); throw new Error('Date and status are required');
  }

  if (!validateDate(date)) { res.status(400); throw new Error('Invalid date format.'); }
  if (!['present', 'absent', 'late', 'leave'].includes(status.toLowerCase())) { res.status(400); throw new Error('Invalid attendance status.'); }

  const teachers = await Teacher.find({ status: 'active' }).lean();
  if (teachers.length === 0) { res.status(404); throw new Error('No active teachers found'); }

  const startOfDay = new Date(date); startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date); endOfDay.setHours(23, 59, 59, 999);

  const existingRecords = await TeacherAttendance.find({
    date: { $gte: startOfDay, $lte: endOfDay },
    teacherId: { $in: teachers.map(t => t._id) }
  }).lean();

  const existingTeacherIds = new Set(existingRecords.map(r => r.teacherId.toString()));

  const newRecords = teachers
    .filter(t => !existingTeacherIds.has(t._id.toString()))
    .map(t => ({
      teacherId: t._id,
      date,
      status: status.toLowerCase(),
      markedBy: req.user._id,
      remarks: 'Bulk marked',
    }));

  if (newRecords.length > 0) {
    await TeacherAttendance.insertMany(newRecords);
  }

  res.status(201).json({
    message: `Marked attendance for ${newRecords.length} teachers. ${existingTeacherIds.size} already marked.`,
    markedCount: newRecords.length,
    skippedCount: existingTeacherIds.size
  });
});

module.exports = {
  createTeacherAttendance,
  getTeacherAttendance,
  updateTeacherAttendance,
  bulkMarkTeacherAttendance,
};
