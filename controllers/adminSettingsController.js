const InstituteSettings = require('../models/InstituteSettings');
const AuditLog = require('../models/AuditLog');
const mongoose = require('mongoose');
const cloudinary = require('cloudinary').v2;
const logAction = require('../utils/auditLogger');
const catchAsync = require('../utils/catchAsync');

/**
 * @desc    Get Institute Settings (creates defaults if none exist)
 * @route   GET /api/admin/settings
 * @access  Private (Admin)
 */
const getSettings = catchAsync(async (req, res) => {
  let settings = await InstituteSettings.findOne();
  if (!settings) {
    settings = await InstituteSettings.create({});
  }
  res.json(settings);
});

/**
 * @desc    Update Institute Settings
 * @route   PUT /api/admin/settings
 * @access  Private (Admin)
 */
const updateSettings = catchAsync(async (req, res) => {
  let settings = await InstituteSettings.findOne();
  if (!settings) {
    settings = new InstituteSettings(req.body);
  } else {
    // Deep merge for nested objects like features and emergency
    if (req.body.features) {
      settings.features = { ...settings.features, ...req.body.features };
      delete req.body.features;
    }
    if (req.body.emergency) {
      settings.emergency = { ...settings.emergency, ...req.body.emergency };
      delete req.body.emergency;
    }
    Object.assign(settings, req.body);
  }
  
  await settings.save();
  await logAction(req, 'SETTINGS_UPDATED', 'Institute settings were updated.', 'Settings');
  res.json(settings);
});

/**
 * @desc    Get System Health (Phase 6)
 * @route   GET /api/admin/health
 * @access  Private (Admin)
 */
const getSystemHealth = catchAsync(async (req, res) => {
  const dbState = mongoose.connection.readyState;
  let dbStatus = 'Red';
  if (dbState === 1) dbStatus = 'Green';
  if (dbState === 2 || dbState === 3) dbStatus = 'Yellow';

  const memoryUsage = process.memoryUsage();
  
  let cloudinaryStatus = 'Red';
  try {
    const clResult = await cloudinary.api.ping();
    if (clResult.status === 'ok') cloudinaryStatus = 'Green';
  } catch (err) {
    cloudinaryStatus = 'Red';
  }

  res.json({
    backend: 'Green',
    mongodb: dbStatus,
    cloudinary: cloudinaryStatus,
    memoryUsage: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)} MB`,
    timestamp: new Date()
  });
});

/**
 * @desc    Get Audit Logs (Phase 3 & 4)
 * @route   GET /api/admin/audit-logs
 * @access  Private (Admin)
 */
const getAuditLogs = catchAsync(async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 50;
  const skip = (page - 1) * limit;

  const logs = await AuditLog.find({})
    .populate('user', 'name email role')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await AuditLog.countDocuments();

  res.json({
    logs,
    page,
    pages: Math.ceil(total / limit),
    total
  });
});

module.exports = {
  getSettings,
  updateSettings,
  getSystemHealth,
  getAuditLogs
};
