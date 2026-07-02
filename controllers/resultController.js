const Result = require('../models/Result');
const Student = require('../models/Student');
const catchAsync = require('../utils/catchAsync');

const calculateGrade = (percentage) => {
  if (percentage >= 90) return 'A+';
  if (percentage >= 80) return 'A';
  if (percentage >= 70) return 'B';
  if (percentage >= 60) return 'C';
  if (percentage >= 50) return 'D';
  return 'F';
};

/**
 * @desc    Upload a student's result
 * @route   POST /api/results
 * @access  Private (Admin / Teacher)
 */
const createResult = catchAsync(async (req, res) => {
  const { studentId, examName, subject, class: studentClass, marksObtained, totalMarks, remarks, reportUrl } = req.body;

  if (!studentId) { res.status(400); throw new Error('Please select a student'); }
  if (marksObtained === undefined || marksObtained === null) { res.status(400); throw new Error('Marks required'); }
  if (totalMarks === undefined || totalMarks === null) { res.status(400); throw new Error('Total marks required'); }
  if (Number(marksObtained) > Number(totalMarks)) { res.status(400); throw new Error('Marks cannot exceed total marks'); }

  const percentage = Math.round((Number(marksObtained) / Number(totalMarks)) * 100);
  const grade = calculateGrade(percentage);

  const result = await Result.create({
    studentId,
    examName,
    subject,
    class: studentClass,
    marksObtained: Number(marksObtained),
    totalMarks: Number(totalMarks),
    percentage,
    grade,
    remarks,
    reportUrl,
    uploadedBy: req.user._id,
  });

  const populated = await Result.findById(result._id).populate('studentId', 'name studentId class');
  res.status(201).json(populated);
});

/**
 * @desc    Get all results
 * @route   GET /api/results
 * @access  Private
 */
const getResults = catchAsync(async (req, res) => {
  const filter = {};
  
  if (req.user.role === 'student') {
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) {
      res.status(404);
      throw new Error('Student profile not found');
    }
    filter.studentId = student._id;
  } else {
    if (req.query.studentId) filter.studentId = req.query.studentId;
    if (req.query.class) filter.class = req.query.class;
    if (req.query.examName) filter.examName = req.query.examName;
    if (req.query.subject) filter.subject = req.query.subject;
  }

  const results = await Result.find(filter)
    .sort({ createdAt: -1 })
    .populate('studentId', 'name studentId class')
    .populate('uploadedBy', 'name role');

  res.json(results);
});

/**
 * @desc    Get a student's results
 * @route   GET /api/results/student/:studentId
 * @access  Private
 */
const getStudentResults = catchAsync(async (req, res) => {
  if (req.user.role === 'student') {
    const student = await Student.findOne({ userId: req.user._id });
    if (!student || student._id.toString() !== req.params.studentId) {
      res.status(403);
      throw new Error('Unauthorized access');
    }
  }

  const results = await Result.find({ studentId: req.params.studentId })
    .sort({ createdAt: -1 })
    .populate('studentId', 'name studentId class')
    .populate('uploadedBy', 'name role');

  res.json(results);
});

/**
 * @desc    Get specific result by ID
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
        throw new Error('Unauthorized access');
      }
    }
    res.json(result);
  } else {
    res.status(404);
    throw new Error('Result not found');
  }
});

/**
 * @desc    Get Student Progress Analytics
 * @route   GET /api/results/progress/:studentId
 * @access  Private (Admin / Teacher)
 */
const getStudentProgress = catchAsync(async (req, res) => {
  if (req.user.role === 'student') {
    res.status(403);
    throw new Error('Unauthorized access');
  }

  const results = await Result.find({ studentId: req.params.studentId }).sort({ createdAt: 1 });
  
  if (results.length === 0) {
    return res.json({ message: 'Not enough result data yet.' });
  }

  let totalPercentage = 0;
  const subjectMap = {};

  results.forEach(r => {
    totalPercentage += r.percentage;
    if (!subjectMap[r.subject]) {
      subjectMap[r.subject] = { total: 0, count: 0 };
    }
    subjectMap[r.subject].total += r.percentage;
    subjectMap[r.subject].count++;
  });

  const averagePercentage = Math.round(totalPercentage / results.length);
  
  let bestSubject = { name: '-', avg: 0 };
  let weakSubject = { name: '-', avg: 100 };

  for (const [sub, data] of Object.entries(subjectMap)) {
    const avg = data.total / data.count;
    if (avg > bestSubject.avg) bestSubject = { name: sub, avg };
    if (avg < weakSubject.avg) weakSubject = { name: sub, avg };
  }

  const latestTest = results[results.length - 1];

  res.json({
    totalTests: results.length,
    averagePercentage,
    bestSubject: bestSubject.name,
    weakSubject: weakSubject.name,
    latestTest: latestTest ? `${latestTest.examName} (${latestTest.subject}): ${latestTest.percentage}%` : 'N/A'
  });
});

/**
 * @desc    Get summary for Dashboard
 * @route   GET /api/results/summary
 * @access  Private (Admin)
 */
const getResultSummary = catchAsync(async (req, res) => {
  if (req.user.role === 'student') {
    res.status(403);
    throw new Error('Unauthorized access');
  }

  const results = await Result.find().sort({ createdAt: -1 }).limit(50);
  const total = await Result.countDocuments();
  
  let latestAvg = 0;
  if (results.length > 0) {
    const sum = results.reduce((acc, r) => acc + (r.percentage || 0), 0);
    latestAvg = Math.round(sum / results.length);
  }

  res.json({
    totalResults: total,
    latestAverage: latestAvg
  });
});

/**
 * @desc    Update a result
 * @route   PATCH /api/results/:id
 * @access  Private (Admin / Teacher)
 */
const updateResult = catchAsync(async (req, res) => {
  const result = await Result.findById(req.params.id);

  if (result) {
    const { marksObtained, totalMarks, remarks, reportUrl } = req.body;
    
    if (marksObtained !== undefined) result.marksObtained = Number(marksObtained);
    if (totalMarks !== undefined) result.totalMarks = Number(totalMarks);
    
    if (result.marksObtained > result.totalMarks) {
      res.status(400);
      throw new Error('Marks cannot exceed total marks');
    }
    
    result.percentage = Math.round((result.marksObtained / result.totalMarks) * 100);
    result.grade = calculateGrade(result.percentage);
    
    if (remarks !== undefined) result.remarks = remarks;
    if (reportUrl !== undefined) result.reportUrl = reportUrl;

    const updatedResult = await result.save();
    const populated = await Result.findById(updatedResult._id).populate('studentId', 'name studentId class');
    res.json(populated);
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
  getStudentResults,
  getResultById,
  getStudentProgress,
  getResultSummary,
  updateResult,
  deleteResult,
};
