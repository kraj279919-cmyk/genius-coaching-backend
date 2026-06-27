const Result = require('../models/Result');
const Student = require('../models/Student');
const catchAsync = require('../utils/catchAsync');

/**
 * @desc    Upload a student's result
 * @route   POST /api/results
 * @access  Private (Admin / Teacher)
 */
const createResult = catchAsync(async (req, res) => {
  const { studentId, examName, subject, class: studentClass, marksObtained, totalMarks, remarks } = req.body;

  const result = await Result.create({
    studentId,
    examName,
    subject,
    class: studentClass,
    marksObtained,
    totalMarks,
    remarks,
    uploadedBy: req.user._id,
  });

  res.status(201).json(result);
});

/**
 * @desc    Get all results
 * @route   GET /api/results
 * @access  Private
 */
const getResults = catchAsync(async (req, res) => {
  const filter = {};
  
  if (req.user.role === 'student') {
    // Students only see their own results
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) {
      res.status(404);
      throw new Error('Student profile not found');
    }
    filter.studentId = student._id;
  } else {
    if (req.query.studentId) filter.studentId = req.query.studentId;
    if (req.query.class) filter.class = req.query.class;
  }

  const results = await Result.find(filter)
    .sort({ createdAt: -1 })
    .populate('studentId', 'name studentId class')
    .populate('uploadedBy', 'name role');

  res.json(results);
});

/**
 * @desc    Get a specific result by ID
 * @route   GET /api/results/:id
 * @access  Private
 */
const getResultById = catchAsync(async (req, res) => {
  const result = await Result.findById(req.params.id)
    .populate('studentId', 'name studentId class')
    .populate('uploadedBy', 'name role');

  if (result) {
    if (req.user.role === 'student') {
      const student = await Student.findOne({ userId: req.user._id });
      if (!student || result.studentId._id.toString() !== student._id.toString()) {
        res.status(403);
        throw new Error('Not authorized to view this result');
      }
    }
    res.json(result);
  } else {
    res.status(404);
    throw new Error('Result not found');
  }
});

/**
 * @desc    Update a result
 * @route   PUT /api/results/:id
 * @access  Private (Admin / Teacher)
 */
const updateResult = catchAsync(async (req, res) => {
  const result = await Result.findById(req.params.id);

  if (result) {
    result.marksObtained = req.body.marksObtained || result.marksObtained;
    result.remarks = req.body.remarks || result.remarks;

    const updatedResult = await result.save();
    res.json(updatedResult);
  } else {
    res.status(404);
    throw new Error('Result not found');
  }
});

/**
 * @desc    Delete a result
 * @route   DELETE /api/results/:id
 * @access  Private (Admin / Teacher)
 */
const deleteResult = catchAsync(async (req, res) => {
  const result = await Result.findById(req.params.id);

  if (result) {
    await result.deleteOne();
    res.json({ message: 'Result deleted successfully' });
  } else {
    res.status(404);
    throw new Error('Result not found');
  }
});

module.exports = {
  createResult,
  getResults,
  getResultById,
  updateResult,
  deleteResult,
};
