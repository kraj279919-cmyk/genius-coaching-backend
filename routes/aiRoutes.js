const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const {
  generateNotice,
  generateContent,
  generateTest,
  analyzeResult,
  analyzeAttendance,
  chatAssistant
} = require('../controllers/aiController');

// All AI routes require authentication
router.use(protect);

// Director only
router.post('/notice-writer', authorize('admin', 'director'), generateNotice);
router.post('/content-writer', authorize('admin', 'director'), generateContent);

// Teacher/Admin
router.post('/test-generator', authorize('admin', 'director', 'teacher'), generateTest);
router.post('/result-analysis', authorize('admin', 'director', 'teacher'), analyzeResult);
router.post('/attendance-analysis', authorize('admin', 'director', 'teacher'), analyzeAttendance);

// Everyone
router.post('/chat', chatAssistant);

module.exports = router;
