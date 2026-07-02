const InstituteSettings = require('../models/InstituteSettings');
const Student = require('../models/Student');
const FeeRecord = require('../models/FeeRecord');
const catchAsync = require('../utils/catchAsync');
const logAction = require('../utils/auditLogger');

/**
 * @desc    Get Current Academic Controls
 * @route   GET /api/admin/academic
 * @access  Private (Admin)
 */
const getAcademicStatus = catchAsync(async (req, res) => {
  let settings = await InstituteSettings.findOne();
  if (!settings) settings = await InstituteSettings.create({});

  const studentCount = await Student.countDocuments({ status: 'active', academicYear: settings.academicSession });
  
  res.json({
    currentSession: settings.academicSession,
    activeStudents: studentCount,
    // Add additional session data if needed
  });
});

/**
 * @desc    Start a New Session
 * @route   POST /api/admin/academic/new-session
 * @access  Private (Admin)
 */
const startNewSession = catchAsync(async (req, res) => {
  const { newSession } = req.body;
  if (!newSession) throw new Error('New session name is required');

  let settings = await InstituteSettings.findOne();
  const oldSession = settings.academicSession;
  settings.academicSession = newSession;
  await settings.save();

  await logAction(req, 'SESSION_STARTED', `Transitioned from ${oldSession} to ${newSession}`, 'System');
  
  res.json({ message: `Successfully started new session: ${newSession}`, currentSession: newSession });
});

/**
 * @desc    Bulk Archive Old Session Data (Soft Delete)
 * @route   POST /api/admin/academic/bulk-archive
 * @access  Private (Admin)
 */
const bulkArchive = catchAsync(async (req, res) => {
  const { targetSession } = req.body;
  
  // Archive students who belong to the old session
  const result = await Student.updateMany(
    { academicYear: targetSession, status: 'active' },
    { $set: { status: 'archived' } }
  );

  await logAction(req, 'BULK_ARCHIVE', `Archived ${result.modifiedCount} students from session ${targetSession}`, 'System');

  res.json({ message: `Archived ${result.modifiedCount} students.`, count: result.modifiedCount });
});

module.exports = {
  getAcademicStatus,
  startNewSession,
  bulkArchive
};
