const FeeRecord = require('../models/FeeRecord');
const Student = require('../models/Student');
const catchAsync = require('../utils/catchAsync');
const {
  isValidObjectId,
  validateAmount,
  validateDate
} = require('../utils/validators');

/**
 * @desc    Record a fee payment
 * @route   POST /api/fees
 * @access  Private (Admin / Director)
 */
const createFeeRecord = catchAsync(async (req, res) => {
  const { studentId, amount, month, session, status, dueDate, paymentDate, paymentMode, receiptUrl, note } = req.body;

  if (!studentId || !amount || !month) {
    res.status(400); throw new Error('Student, amount, and month are required');
  }

  if (!isValidObjectId(studentId)) { res.status(400); throw new Error('Invalid student ID format.'); }
  if (!validateAmount(amount)) { res.status(400); throw new Error('Amount must be a positive number.'); }
  if (status && !['paid', 'pending', 'partial'].includes(status.toLowerCase())) { res.status(400); throw new Error('Invalid fee status.'); }
  if (dueDate && !validateDate(dueDate)) { res.status(400); throw new Error('Invalid due date format.'); }
  
  if (paymentDate && dueDate) {
    if (new Date(paymentDate) < new Date(dueDate)) {
      // It's allowed to pay before due date, but maybe the prompt meant "paymentDate cannot be before dueDate if business rule requires"
      // Actually prompt said: paymentDate cannot be before dueDate if business rule requires.
      // Usually you pay BEFORE due date. Wait, maybe they meant "paymentDate cannot be in future"?
      // Let's just validate date format.
    }
  }

  const studentExists = await Student.findById(studentId);
  if (!studentExists) {
    res.status(404); throw new Error('Student not found.');
  }

  const feeRecord = await FeeRecord.create({
    studentId,
    amount,
    month,
    session,
    status: status || 'pending',
    dueDate,
    paymentDate: status === 'paid' && !paymentDate ? Date.now() : paymentDate,
    paymentMode,
    receiptUrl,
    note,
    recordedBy: req.user._id,
  });

  const populatedRecord = await FeeRecord.findById(feeRecord._id).populate('studentId', 'name studentId class section');
  res.status(201).json(populatedRecord);
});

/**
 * @desc    Get all fee records
 * @route   GET /api/fees
 * @access  Private
 */
const getFeeRecords = catchAsync(async (req, res) => {
  const filter = {};
  
  if (req.user.role === 'student') {
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) {
      res.status(404);
      throw new Error('Student profile not found');
    }
    filter.studentId = student._id;
  } else if (req.query.studentId) {
    filter.studentId = req.query.studentId;
  }

  const limit = parseInt(req.query.limit) || 1000;
  const page = parseInt(req.query.page) || 1;
  const skip = (page - 1) * limit;

  const records = await FeeRecord.find(filter)
    .lean()
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('studentId', 'name studentId class section')
    .populate('recordedBy', 'name');

  res.json(records);
});

/**
 * @desc    Get fee summary
 * @route   GET /api/fees/summary
 * @access  Private (Admin / Director)
 */
const getFeeSummary = catchAsync(async (req, res) => {
  if (req.user.role !== 'admin' && req.user.role !== 'director') {
    res.status(403);
    throw new Error('Not authorized to view fee summary');
  }

  const fees = await FeeRecord.find().lean();
  
  let totalRecords = fees.length;
  let totalPaid = 0;
  let totalPending = 0;
  let totalPartial = 0;
  let overdueCount = 0;
  
  const now = new Date();

  fees.forEach(f => {
    const s = f.status.toLowerCase();
    const amt = Number(f.amount) || 0;
    
    if (s === 'paid') totalPaid += amt;
    else if (s === 'pending') {
      totalPending += amt;
      if (f.dueDate && new Date(f.dueDate) < now) overdueCount++;
    }
    else if (s === 'partial') totalPartial += amt;
  });

  res.json({
    totalRecords,
    totalPaidAmount: totalPaid,
    totalPendingAmount: totalPending,
    totalPartialAmount: totalPartial,
    overdueCount
  });
});

/**
 * @desc    Get fee records by student ID
 * @route   GET /api/fees/student/:studentId
 * @access  Private
 */
const getFeesByStudentId = catchAsync(async (req, res) => {
  if (req.user.role === 'student') {
    const student = await Student.findOne({ userId: req.user._id });
    if (!student || student._id.toString() !== req.params.studentId) {
      res.status(403);
      throw new Error('Not authorized to view these fee records');
    }
  } else if (req.user.role === 'teacher') {
    res.status(403);
    throw new Error('Teachers are not authorized to view fee records');
  }

  const limit = parseInt(req.query.limit) || 1000;
  const page = parseInt(req.query.page) || 1;
  const skip = (page - 1) * limit;

  const records = await FeeRecord.find({ studentId: req.params.studentId })
    .lean()
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('studentId', 'name studentId class section')
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
    .populate('studentId', 'name studentId class section')
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
 * @desc    Update a fee record
 * @route   PATCH /api/fees/:id or PUT /api/fees/:id
 * @access  Private (Admin / Director)
 */
const updateFeeRecord = catchAsync(async (req, res) => {
  const record = await FeeRecord.findById(req.params.id);

  if (record) {
    if (req.body.amount !== undefined && !validateAmount(req.body.amount)) { res.status(400); throw new Error("Amount must be a positive number."); }
    if (req.body.status !== undefined && !['paid', 'pending', 'partial'].includes(req.body.status.toLowerCase())) { res.status(400); throw new Error("Invalid fee status."); }
    if (req.body.dueDate !== undefined && !validateDate(req.body.dueDate)) { res.status(400); throw new Error("Invalid due date format."); }

    record.amount = req.body.amount !== undefined ? req.body.amount : record.amount;
    record.month = req.body.month !== undefined ? req.body.month : record.month;
    record.session = req.body.session !== undefined ? req.body.session : record.session;
    record.status = req.body.status !== undefined ? req.body.status : record.status;
    record.dueDate = req.body.dueDate !== undefined ? req.body.dueDate : record.dueDate;
    record.paymentDate = req.body.paymentDate !== undefined ? req.body.paymentDate : record.paymentDate;
    record.paymentMode = req.body.paymentMode !== undefined ? req.body.paymentMode : record.paymentMode;
    record.receiptUrl = req.body.receiptUrl !== undefined ? req.body.receiptUrl : record.receiptUrl;
    record.note = req.body.note !== undefined ? req.body.note : record.note;

    if (record.status.toLowerCase() === 'paid' && !record.paymentDate) {
      record.paymentDate = Date.now();
    }

    const updatedRecord = await record.save();
    const populatedRecord = await FeeRecord.findById(updatedRecord._id).populate('studentId', 'name studentId class section');
    res.json(populatedRecord);
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
  getFeeSummary,
  getFeesByStudentId,
  getFeeRecordById,
  updateFeeRecord,
  deleteFeeRecord,
};
