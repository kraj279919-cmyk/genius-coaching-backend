const express = require('express');
const router = express.Router();
const {
  createFeeRecord,
  getFeeRecords,
  getFeeSummary,
  getFeesByStudentId,
  getFeeRecordById,
  updateFeeRecord,
  deleteFeeRecord,
} = require('../controllers/feeController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect);

router.route('/summary')
  .get(authorize('admin', 'director'), getFeeSummary);

router.route('/student/:studentId')
  .get(authorize('admin', 'director', 'student'), getFeesByStudentId);

router.route('/')
  .get(authorize('admin', 'director', 'student'), getFeeRecords)
  .post(authorize('admin', 'director'), createFeeRecord);

router.route('/:id')
  .get(authorize('admin', 'director', 'student'), getFeeRecordById)
  .put(authorize('admin', 'director'), updateFeeRecord)
  .patch(authorize('admin', 'director'), updateFeeRecord)
  .delete(authorize('admin', 'director'), deleteFeeRecord);

module.exports = router;
