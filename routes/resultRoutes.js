const express = require('express');
const router = express.Router();
const {
  createResult,
  getResults,
  getStudentResults,
  getResultById,
  getStudentProgress,
  getResultSummary,
  updateResult,
  deleteResult,
} = require('../controllers/resultController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect);

router.route('/summary')
  .get(authorize('admin', 'director'), getResultSummary);

router.route('/progress/:studentId')
  .get(authorize('admin', 'director', 'teacher'), getStudentProgress);

router.route('/student/:studentId')
  .get(getStudentResults);

router.route('/')
  .get(getResults)
  .post(authorize('admin', 'director', 'teacher'), createResult);

router.route('/:id')
  .get(getResultById)
  .put(authorize('admin', 'director', 'teacher'), updateResult)
  .patch(authorize('admin', 'director', 'teacher'), updateResult)
  .delete(authorize('admin', 'director', 'teacher'), deleteResult);

module.exports = router;
