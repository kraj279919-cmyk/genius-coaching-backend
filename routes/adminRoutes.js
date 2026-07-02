const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const catchAsync = require('../utils/catchAsync');
const logAction = require('../utils/auditLogger');

// Models
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const User = require('../models/User');
const FeeRecord = require('../models/FeeRecord');

// Settings Controllers
const {
  getSettings,
  updateSettings,
  getSystemHealth,
  getAuditLogs
} = require('../controllers/adminSettingsController');

/**
 * @desc    Backup all critical database collections
 * @route   GET /api/admin/backup
 * @access  Private (Director/Admin only)
 */
const generateBackup = catchAsync(async (req, res) => {
  // Extract all core collections
  const students = await Student.find({}).lean();
  const teachers = await Teacher.find({}).lean();
  
  // SANITIZE USERS: Never export passwords
  const users = await User.find({}).select('-password').lean();
  
  const fees = await FeeRecord.find({}).lean();

  const backupData = {
    timestamp: new Date().toISOString(),
    version: '1.0',
    collections: {
      users,
      students,
      teachers,
      fees
    }
  };

  // Log the action for security auditing
  await logAction(req, 'BACKUP_GENERATED', 'Director requested a full JSON database backup.', 'System');

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename=genius_backup_${Date.now()}.json`);
  res.send(JSON.stringify(backupData, null, 2));
});

router.route('/backup').get(protect, authorize('admin', 'director'), generateBackup);

router.route('/settings')
  .get(protect, authorize('admin', 'director'), getSettings)
  .put(protect, authorize('admin', 'director'), updateSettings);

router.route('/health')
  .get(protect, authorize('admin', 'director'), getSystemHealth);

router.route('/audit-logs')
  .get(protect, authorize('admin', 'director'), getAuditLogs);

// Academic Controllers
const {
  getAcademicStatus,
  startNewSession,
  bulkArchive
} = require('../controllers/adminAcademicController');

router.route('/academic')
  .get(protect, authorize('admin', 'director'), getAcademicStatus);

router.route('/academic/new-session')
  .post(protect, authorize('admin', 'director'), startNewSession);

router.route('/academic/bulk-archive')
  .post(protect, authorize('admin', 'director'), bulkArchive);

module.exports = router;
