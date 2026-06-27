const catchAsync = require('../utils/catchAsync');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const Notice = require('../models/Notice');

const getAdminDashboard = catchAsync(async (req, res) => {
  const totalStudents = await Student.countDocuments();
  const totalTeachers = await Teacher.countDocuments();
  const activeNotices = await Notice.countDocuments();
  
  res.json({
    totalStudents,
    totalTeachers,
    activeNotices,
    pendingFees: 15,
    todayAttendance: '95%',
    newEnquiries: 5
  });
});

const getTeacherDashboard = catchAsync(async (req, res) => {
  const activeNotices = await Notice.countDocuments();
  res.json({
    totalStudents: 45,
    presentToday: 42,
    homeworkGiven: 3,
    pendingDoubts: 2,
    activeNotices
  });
});

const getStudentDashboard = catchAsync(async (req, res) => {
  const activeNotices = await Notice.countDocuments();
  res.json({
    attendancePercentage: '92%',
    pendingHomework: 2,
    latestResult: '85%',
    feeStatus: 'Paid',
    activeNotices
  });
});

module.exports = { getAdminDashboard, getTeacherDashboard, getStudentDashboard };
