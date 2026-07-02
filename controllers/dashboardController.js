const catchAsync = require('../utils/catchAsync');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const Notice = require('../models/Notice');
const FeeRecord = require('../models/FeeRecord');
const Enquiry = require('../models/Enquiry');
const Attendance = require('../models/Attendance');

const getAdminDashboard = catchAsync(async (req, res) => {
  const totalStudents = await Student.countDocuments();
  const totalTeachers = await Teacher.countDocuments();
  const activeNotices = await Notice.countDocuments();
  
  // Pending fees (assuming status 'Pending' or 'Unpaid')
  const pendingFees = await FeeRecord.countDocuments({ status: { $in: ['Pending', 'Unpaid'] } }).catch(() => 0);
  
  // New enquiries
  const newEnquiries = await Enquiry.countDocuments({ status: 'New' }).catch(() => 0);
  
  // Today attendance
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);
  
  const todayAttendanceRecords = await Attendance.find({
    date: { $gte: startOfDay, $lte: endOfDay }
  }).catch(() => []);
  
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
  
  const Result = require('../models/Result');
  
  const totalResultsCount = await Result.countDocuments().catch(() => 0);
  let latestResultAvg = 'No data';
  
  if (totalResultsCount > 0) {
    const recentResults = await Result.find().sort({ createdAt: -1 }).limit(100).catch(() => []);
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
  }

  const Homework = require('../models/Homework');
  const StudyMaterial = require('../models/StudyMaterial');
  
  const activeHomework = await Homework.countDocuments({ status: 'active' }).catch(() => 0);
  const studyMaterials = await StudyMaterial.countDocuments({ status: 'active' }).catch(() => 0);

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

  const activeNotices = await Notice.countDocuments({ status: 'active', targetAudience: { $in: ['teacher', 'all'] } });
  
  const Homework = require('../models/Homework');
  const StudyMaterial = require('../models/StudyMaterial');
  const Result = require('../models/Result');

  const homeworkGiven = await Homework.countDocuments({ uploadedBy: teacherId }).catch(() => 0);
  const materialsShared = await StudyMaterial.countDocuments({ uploadedBy: teacherId }).catch(() => 0);
  const resultsUploaded = await Result.countDocuments({ uploadedBy: teacherId }).catch(() => 0);
  
  // Total students active
  const totalStudents = await Student.countDocuments({ status: { $nin: ['inactive', 'left'] } }).catch(() => 0);
  
  // Today's attendance overall
  const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);
  const att = await Attendance.find({ date: { $gte: startOfDay } }).catch(() => []);
  let presentCount = 0;
  att.forEach(a => { if(a.status === 'present' || a.status === 'late') presentCount++; });
  const todayAttendance = att.length > 0 ? Math.round((presentCount / att.length) * 100) + '%' : '0%';

  // We can fetch teacher's specific assigned classes from teacher doc
  const teacherDoc = await Teacher.findOne({ userId: teacherId });
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
  const sClass = studentDoc.class;
  const roll = studentDoc.studentId;

  // Active notices targeted to all or students or specific class
  const activeNotices = await Notice.countDocuments({ 
    status: 'active', 
    targetAudience: { $in: ['all', 'students'] } 
  });

  const Homework = require('../models/Homework');
  const pendingHomework = await Homework.countDocuments({ class: sClass, status: 'active' });
  
  const StudyMaterial = require('../models/StudyMaterial');
  const materials = await StudyMaterial.countDocuments({ class: sClass, status: 'active' });
  
  const Gallery = require('../models/Gallery');
  const galleryCount = await Gallery.countDocuments({ status: 'active' });

  const Result = require('../models/Result');
  const recentResult = await Result.findOne({ studentId }).sort({ createdAt: -1 });
  const latestResult = recentResult && recentResult.percentage ? `${recentResult.percentage}%` : 'N/A';

  // Overall Attendance
  const att = await Attendance.find({ studentId });
  let presentCount = 0;
  att.forEach(a => { if(a.status === 'present' || a.status === 'late') presentCount++; });
  const attendancePercentage = att.length > 0 ? Math.round((presentCount / att.length) * 100) + '%' : 'N/A';

  // Latest fee status
  const recentFee = await FeeRecord.findOne({ studentId }).sort({ createdAt: -1 });
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
