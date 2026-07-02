const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const {
  getVersionInfo,
  getAdvancedHealth,
  getHealthHistory,
  getApiStats,
  getErrorLogs,
  getJobs,
  createTestJob
} = require('../controllers/opsController');

// Protected Operations Routes - strictly 'director'/'admin'
router.get('/health', protect, authorize('admin', 'director'), getAdvancedHealth);
router.get('/health/history', protect, authorize('admin', 'director'), getHealthHistory);
router.get('/api-stats', protect, authorize('admin', 'director'), getApiStats);
router.get('/errors', protect, authorize('admin', 'director'), getErrorLogs);
router.get('/jobs', protect, authorize('admin', 'director'), getJobs);
router.post('/jobs/test', protect, authorize('admin', 'director'), createTestJob);

module.exports = router;
