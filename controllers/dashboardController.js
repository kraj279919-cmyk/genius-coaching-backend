const catchAsync = require('../utils/catchAsync');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const Notice = require('../models/Notice');
const FeeRecord = require('../models/FeeRecord');
const Enquiry = require('../models/Enquiry');
const Attendance = require('../models/Attendance');
const { normalizeClassName, getAliasesForClass } = require('../utils/classNormalizer');

const getAdminDashboard = catchAsync(async (req, res) => {
  const Result = require('../models/Result');
  const Homework = require('../models/Homework');
  const StudyMaterial = require('../models/StudyMaterial');

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  const [
    totalStudents,
    totalTeachers,
    activeNotices,
    pendingFees,
    newEnquiries,
    todayAttendanceRecords,
    totalResultsCount,
    recentResults,
    activeHomework,
    studyMaterials
  ] = await Promise.all([
    Student.countDocuments(),
    Teacher.countDocuments(),
    Notice.countDocuments(),
    FeeRecord.countDocuments({ status: { $in: ['Pending', 'Unpaid'] } }).catch(() => 0),
    Enquiry.countDocuments({ status: 'New' }).catch(() => 0),
    Attendance.find({ date: { $gte: startOfDay, $lte: endOfDay } }).lean().catch(() => []),
    Result.countDocuments().catch(() => 0),
    Result.find().lean().sort({ createdAt: -1 }).limit(100).catch(() => []),
    Homework.countDocuments({ status: 'active' }).catch(() => 0),
    StudyMaterial.countDocuments({ status: 'active' }).catch(() => 0)
  ]);

  let todayAttendance = 'No data';
  if (todayAttendanceRecords.length > 0) {
    let presentCount = 0;
    let totalCount = todayAttendanceRecords.length;
    todayAttendanceRecords.forEach(record => {
      const s = record.status?.toLowerCase();
      if (s === 'present' || s === 'late') {
        presentCount++;
      }
    });
    if (totalCount > 0) {
      todayAttendance = Math.round((presentCount / totalCount) * 100) + '%';
    }
  }

  let latestResultAvg = 'No data';
  if (recentResults.length > 0) {
    let sum = 0;
    let count = 0;
    recentResults.forEach(r => {
      if (r.percentage !== undefined) {
        sum += r.percentage;
        count++;
      }
    });
    if (count > 0) {
      latestResultAvg = Math.round(sum / count) + '%';
    }
  }

  res.json({
    totalStudents,
    totalTeachers,
    activeNotices,
    pendingFees,
    todayAttendance,
    newEnquiries,
    totalResults: totalResultsCount,
    latestResultAvg,
    activeHomework,
    studyMaterials
  });
});


const getTeacherDashboard = catchAsync(async (req, res) => {
  const teacherId = req.user._id;

  const Homework = require('../models/Homework');
  const StudyMaterial = require('../models/StudyMaterial');
  const Result = require('../models/Result');

  const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);

  const [
    activeNotices,
    homeworkGiven,
    materialsShared,
    resultsUploaded,
    totalStudents,
    att,
    teacherDoc
  ] = await Promise.all([
    Notice.countDocuments({ status: 'active', targetAudience: { $in: ['teacher', 'all'] } }),
    Homework.countDocuments({ uploadedBy: teacherId }).catch(() => 0),
    StudyMaterial.countDocuments({ uploadedBy: teacherId }).catch(() => 0),
    Result.countDocuments({ uploadedBy: teacherId }).catch(() => 0),
    Student.countDocuments({ status: { $nin: ['inactive', 'left'] } }).catch(() => 0),
    Attendance.find({ date: { $gte: startOfDay } }).lean().catch(() => []),
    Teacher.findOne({ userId: teacherId }).lean()
  ]);

  let presentCount = 0;
  att.forEach(a => { if(a.status === 'present' || a.status === 'late') presentCount++; });
  const todayAttendance = att.length > 0 ? Math.round((presentCount / att.length) * 100) + '%' : '0%';

  const subject = teacherDoc ? teacherDoc.subject : 'N/A';
  const name = teacherDoc ? teacherDoc.name : req.user.name;

  res.json({
    name,
    subject,
    totalStudents,
    todayAttendance,
    homeworkGiven,
    materialsShared,
    resultsUploaded,
    activeNotices,
    lastSync: new Date().toLocaleTimeString()
  });
});

const getStudentDashboard = catchAsync(async (req, res) => {
  const studentId = req.user._id;
  
  const studentDoc = await Student.findOne({ userId: req.user._id });
  if (!studentDoc) {
    res.status(404);
    throw new Error('Student profile not found');
  }

  const name = studentDoc.name;
  const sClass = normalizeClassName(studentDoc.class);
  const roll = studentDoc.studentId;

  const Homework = require('../models/Homework');
  const StudyMaterial = require('../models/StudyMaterial');
  const Gallery = require('../models/Gallery');
  const Result = require('../models/Result');

  const [
    activeNotices,
    pendingHomework,
    materials,
    galleryCount,
    recentResult,
    att,
    recentFee
  ] = await Promise.all([
    Notice.countDocuments({ 
      status: 'published', 
      $or: [
        { targetAudience: { $in: ['all', 'students'] } },
        { targetAudience: 'class', targetClass: { $in: getAliasesForClass(sClass) } }
      ]
    }),
    Homework.countDocuments({ class: { $in: getAliasesForClass(sClass) }, status: 'active' }),
    StudyMaterial.countDocuments({ class: { $in: getAliasesForClass(sClass) }, status: 'active' }),
    Gallery.countDocuments({ status: 'active' }),
    Result.findOne({ studentId }).lean().sort({ createdAt: -1 }),
    Attendance.find({ studentId }).lean(),
    FeeRecord.findOne({ studentId }).lean().sort({ createdAt: -1 })
  ]);

  const latestResult = recentResult && recentResult.percentage ? `${recentResult.percentage}%` : 'N/A';

  let presentCount = 0;
  att.forEach(a => { if(a.status === 'present' || a.status === 'late') presentCount++; });
  const attendancePercentage = att.length > 0 ? Math.round((presentCount / att.length) * 100) + '%' : 'N/A';

  const feeStatus = recentFee ? recentFee.status : 'No Data';

  res.json({
    name,
    class: sClass,
    roll,
    attendancePercentage,
    pendingHomework,
    latestResult,
    feeStatus,
    activeNotices,
    materialsCount: materials,
    galleryCount,
    lastSync: new Date().toLocaleTimeString()
  });
});

module.exports = { getAdminDashboard, getTeacherDashboard, getStudentDashboard };
