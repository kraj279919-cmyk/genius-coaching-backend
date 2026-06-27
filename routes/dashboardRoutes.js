const express = require('express');
const router = express.Router();
const { getAdminDashboard, getTeacherDashboard, getStudentDashboard } = require('../controllers/dashboardController');
const { protect } = require('../middleware/authMiddleware');
const { adminOnly, teacherOnly, studentOnly } = require('../middleware/roleMiddleware');

router.use(protect);
router.get('/admin', adminOnly, getAdminDashboard);
router.get('/teacher', teacherOnly, getTeacherDashboard);
router.get('/student', studentOnly, getStudentDashboard);

module.exports = router;
