const FeeRecord = require('../models/FeeRecord');
const Student = require('../models/Student');
const catchAsync = require('../utils/catchAsync');

/**
 * @desc    Record a fee payment
 * @route   POST /api/fees
 * @access  Private (Admin / Co-Director)
 */
const createFeeRecord = catchAsync(async (req, res) => {
  const { studentId, amount, month, status, paymentDate, receiptUrl } = req.body;

  const feeRecord = await FeeRecord.create({
    studentId,
    amount,
    month,
    status: status || 'Pending',
    paymentDate: paymentDate || Date.now(),
    receiptUrl,
    recordedBy: req.user._id,
  });

  res.status(201).json(feeRecord);
});

/**
 * @desc    Get all fee records
 * @route   GET /api/fees
 * @access  Private
 */
const getFeeRecords = catchAsync(async (req, res) => {
  const filter = {};
  
  if (req.user.role === 'student') {
    // Students only see their own fee records
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) {
      res.status(404);
      throw new Error('Student profile not found');
    }
    filter.studentId = student._id;
  } else if (req.query.studentId) {
    filter.studentId = req.query.studentId;
  }

  const records = await FeeRecord.find(filter)
    .sort({ paymentDate: -1 })
    .populate('studentId', 'name studentId class')
    .populate('recordedBy', 'name');

  res.json(records);
});

/**
 * @desc    Get fee record by ID
 * @route   GET /api/fees/:id
 * @access  Private
 */
const getFeeRecordById = catchAsync(async (req, res) => {
  const record = await FeeRecord.findById(req.params.id)
    .populate('studentId', 'name studentId class')
    .populate('recordedBy', 'name');

  if (record) {
    if (req.user.role === 'student') {
      const student = await Student.findOne({ userId: req.user._id });
      if (!student || record.studentId._id.toString() !== student._id.toString()) {
        res.status(403);
        throw new Error('Not authorized to view this fee record');
      }
    }
    res.json(record);
  } else {
    res.status(404);
    throw new Error('Fee record not found');
  }
});

/**
 * @desc    Update a fee record (e.g. change status to Paid)
 * @route   PUT /api/fees/:id
 * @access  Private (Admin / Co-Director)
 */
const updateFeeRecord = catchAsync(async (req, res) => {
  const record = await FeeRecord.findById(req.params.id);

  if (record) {
    record.amount = req.body.amount || record.amount;
    record.status = req.body.status || record.status;
    if (req.body.receiptUrl) record.receiptUrl = req.body.receiptUrl;

    const updatedRecord = await record.save();
    res.json(updatedRecord);
  } else {
    res.status(404);
    throw new Error('Fee record not found');
  }
});

/**
 * @desc    Delete a fee record
 * @route   DELETE /api/fees/:id
 * @access  Private (Admin only)
 */
const deleteFeeRecord = catchAsync(async (req, res) => {
  const record = await FeeRecord.findById(req.params.id);

  if (record) {
    await record.deleteOne();
    res.json({ message: 'Fee record deleted successfully' });
  } else {
    res.status(404);
    throw new Error('Fee record not found');
  }
});

module.exports = {
  createFeeRecord,
  getFeeRecords,
  getFeeRecordById,
  updateFeeRecord,
  deleteFeeRecord,
};
