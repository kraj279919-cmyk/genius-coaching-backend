const express = require('express');
const router = express.Router();
const {
  getOverviewAnalytics,
  getStudentAnalytics,
  getTeacherAnalytics,
  getFeeAnalytics,
  getAttendanceAnalytics,
  getResultAnalytics,
  getNoticeAnalytics
} = require('../controllers/analyticsController');
const { protect } = require('../middleware/authMiddleware');
const { authorize, adminOnly } = require('../middleware/roleMiddleware');

// All routes here are strictly for Director / Admin only
router.use(protect);
router.use(adminOnly); // Enforce Director only

router.get('/overview', getOverviewAnalytics);
router.get('/students', getStudentAnalytics);
router.get('/teachers', getTeacherAnalytics);
router.get('/fees', getFeeAnalytics);
router.get('/attendance', getAttendanceAnalytics);
router.get('/results', getResultAnalytics);
router.get('/notices', getNoticeAnalytics);

module.exports = router;
