const express = require('express');
const router = express.Router();
const {
  createFeeRecord,
  getFeeRecords,
  getFeeRecordById,
  updateFeeRecord,
  deleteFeeRecord,
} = require('../controllers/feeController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect);

router.route('/')
  .get(getFeeRecords)
  .post(authorize('admin', 'coDirector'), createFeeRecord);

router.route('/:id')
  .get(getFeeRecordById)
  .put(authorize('admin', 'coDirector'), updateFeeRecord)
  .delete(authorize('admin'), deleteFeeRecord); // Only true Admin can delete fee records

module.exports = router;
