const mongoose = require('mongoose');
const cloudinary = require('cloudinary').v2;
const catchAsync = require('../utils/catchAsync');
const HealthCheckLog = require('../models/HealthCheckLog');
const ApiRequestLog = require('../models/ApiRequestLog');
const ErrorLog = require('../models/ErrorLog');
const JobQueue = require('../models/JobQueue');
const InstituteSettings = require('../models/InstituteSettings');
const packageJson = require('../package.json'); // requires package.json to exist, we will mock if needed

/**
 * @desc    Get API Version and App Info
 * @route   GET /api/ops/version
 * @access  Public or Admin (Depends on routing, Phase 1 requested GET /api/version, we'll expose safely)
 */
const getVersionInfo = catchAsync(async (req, res) => {
  let session = 'Unknown';
  try {
    const settings = await InstituteSettings.findOne().lean();
    if (settings) session = settings.academicSession;
  } catch (e) {}

  res.json({
    appName: 'Genius Coaching ERP',
    backendVersion: packageJson.version || '1.0.0',
    apiVersion: 'v1.3.8',
    databaseVersion: 'MongoDB Atlas',
    buildName: 'Enterprise Edition',
    environment: process.env.NODE_ENV || 'development',
    releaseDate: '2026-07-02',
    uptime: process.uptime(),
    nodeVersion: process.version,
    platform: process.platform,
    currentAcademicSession: session
  });
});

/**
 * @desc    Get Advanced Health API
 * @route   GET /api/ops/health
 * @access  Private (Admin)
 */
const getAdvancedHealth = catchAsync(async (req, res) => {
  const start = Date.now();
  
  const dbState = mongoose.connection.readyState;
  let mongoStatus = 'red';
  if (dbState === 1) mongoStatus = 'green';
  if (dbState === 2 || dbState === 3) mongoStatus = 'yellow';

  let cloudinaryStatus = 'red';
  try {
    const clResult = await cloudinary.api.ping();
    if (clResult.status === 'ok') cloudinaryStatus = 'green';
  } catch (err) {}

  const responseTime = Date.now() - start;
  const memoryUsage = process.memoryUsage();
  
  let settings = await InstituteSettings.findOne().lean();
  if (!settings) settings = { emergency: { maintenanceMode: false }, features: {} };

  const overallStatus = (mongoStatus === 'green' && cloudinaryStatus === 'green') ? 'green' : 'yellow';

  // Save history automatically
  await HealthCheckLog.create({
    backendStatus: 'green',
    mongoStatus,
    cloudinaryStatus,
    responseTime,
    memoryUsage: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
    status: overallStatus
  });

  res.json({
    backend: 'green',
    mongodb: mongoStatus,
    cloudinary: cloudinaryStatus,
    apiUptime: process.uptime(),
    memoryUsage: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
    responseTime: `${responseTime}ms`,
    environment: process.env.NODE_ENV,
    activeFeatureFlags: settings.features,
    maintenanceMode: settings.emergency.maintenanceMode
  });
});

/**
 * @desc    Get Health History
 * @route   GET /api/ops/health/history
 * @access  Private (Admin)
 */
const getHealthHistory = catchAsync(async (req, res) => {
  const logs = await HealthCheckLog.find({}).sort({ createdAt: -1 }).limit(50).lean();
  res.json(logs);
});

/**
 * @desc    Get API Request Stats
 * @route   GET /api/ops/api-stats
 * @access  Private (Admin)
 */
const getApiStats = catchAsync(async (req, res) => {
  // Aggregate stats from ApiRequestLog
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const totalRequests = await ApiRequestLog.countDocuments({ createdAt: { $gte: today } });
  const failedRequests = await ApiRequestLog.countDocuments({ createdAt: { $gte: today }, errorFlag: true });
  
  const avgTimeAggregation = await ApiRequestLog.aggregate([
    { $match: { createdAt: { $gte: today } } },
    { $group: { _id: null, avgTime: { $avg: '$responseTime' } } }
  ]);
  
  const avgResponseTime = avgTimeAggregation.length > 0 ? Math.round(avgTimeAggregation[0].avgTime) : 0;

  const slowestEndpoints = await ApiRequestLog.find({ createdAt: { $gte: today } })
    .sort({ responseTime: -1 })
    .limit(5)
    .select('route method responseTime');

  res.json({
    totalRequestsToday: totalRequests,
    failedRequestsToday: failedRequests,
    averageResponseTime: `${avgResponseTime}ms`,
    slowestEndpoints,
    mostUsedEndpoints: [], // Simplified for now
    recentErrors: []
  });
});

/**
 * @desc    Get Error Logs
 * @route   GET /api/ops/errors
 * @access  Private (Admin)
 */
const getErrorLogs = catchAsync(async (req, res) => {
  const errors = await ErrorLog.find({}).sort({ createdAt: -1 }).limit(50).populate('userId', 'name email').lean();
  res.json(errors);
});

/**
 * @desc    Get Job Queue Status
 * @route   GET /api/ops/jobs
 * @access  Private (Admin)
 */
const getJobs = catchAsync(async (req, res) => {
  const jobs = await JobQueue.find({}).sort({ createdAt: -1 }).limit(50).lean();
  res.json(jobs);
});

/**
 * @desc    Test Queue Job Creation
 * @route   POST /api/ops/jobs/test
 * @access  Private (Admin)
 */
const createTestJob = catchAsync(async (req, res) => {
  const job = await JobQueue.create({
    type: 'TEST_JOB',
    payloadSummary: 'Test job for architecture verification',
    status: 'pending'
  });
  res.json(job);
});

module.exports = {
  getVersionInfo,
  getAdvancedHealth,
  getHealthHistory,
  getApiStats,
  getErrorLogs,
  getJobs,
  createTestJob
};
