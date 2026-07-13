const Result = require('../models/Result');
const Student = require('../models/Student');
const catchAsync = require('../utils/catchAsync');
const { normalizeClassName, getAliasesForClass } = require('../utils/classNormalizer');
const {
  isValidObjectId,
  validateMarks,
  validateRequiredFields
} = require('../utils/validators');

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

  const requiredError = validateRequiredFields(['studentId', 'examName', 'subject', 'marksObtained', 'totalMarks'], req.body);
  if (requiredError) { res.status(400); throw new Error(requiredError); }

  if (!isValidObjectId(studentId)) { res.status(400); throw new Error('Invalid student ID format.'); }
  
  if (!validateMarks(marksObtained, totalMarks)) {
    res.status(400); throw new Error('Invalid marks: Marks must be positive and cannot exceed total marks.');
  }

  const studentExists = await Student.findById(studentId);
  if (!studentExists) { res.status(404); throw new Error('Student not found.'); }
  
  const normalizedClass = normalizeClassName(studentClass);
  
  if (req.user.role === 'teacher') {
    const teacher = await require('../models/Teacher').findOne({ userId: req.user._id });
    if (!teacher) { res.status(404); throw new Error('Teacher profile not found'); }
    
    const aliases = getAliasesForClass(normalizedClass);
    const hasAccess = teacher.assignedClasses && teacher.assignedClasses.some(c => aliases.includes(c));
    if (!hasAccess) {
      res.status(403); throw new Error('You are not authorized to upload results for this class');
    }
  }

  const percentage = Math.round((Number(marksObtained) / Number(totalMarks)) * 100);
  const grade = calculateGrade(percentage);

  const result = await Result.create({
    studentId,
    examName,
    subject,
    class: normalizedClass,
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
    if (req.user.role === 'teacher') {
      const teacher = await require('../models/Teacher').findOne({ userId: req.user._id });
      if (!teacher) { res.status(404); throw new Error('Teacher profile not found'); }
      
      const teacherClassAliases = (teacher.assignedClasses || []).flatMap(c => getAliasesForClass(c));
      
      if (req.query.class) {
        // Teacher is filtering by class, make sure they are allowed
        const queryClass = typeof req.query.class === 'string' ? [req.query.class] : req.query.class;
        const queryAliases = queryClass.flatMap(c => getAliasesForClass(c));
        const allowedAliases = queryAliases.filter(a => teacherClassAliases.includes(a));
        
        if (allowedAliases.length === 0) {
          res.status(403); throw new Error('You are not authorized to view results for the requested class');
        }
        filter.class = { $in: allowedAliases };
      } else {
        // Teacher is not filtering, limit to their assigned classes
        if (teacherClassAliases.length > 0) {
          filter.class = { $in: teacherClassAliases };
        } else {
           // Teacher has no assigned classes, show no results
           filter.class = { $in: ['__none__'] };
        }
      }
    } else {
      // Admin logic
      if (req.query.class) {
        if (typeof req.query.class === 'string') {
          filter.class = { $in: getAliasesForClass(req.query.class) };
        } else if (Array.isArray(req.query.class)) {
          filter.class = { $in: req.query.class.flatMap(c => getAliasesForClass(c)) };
        }
      }
    }
    
    if (req.query.studentId) filter.studentId = req.query.studentId;
    if (req.query.examName) filter.examName = req.query.examName;
    if (req.query.subject) filter.subject = req.query.subject;
  }

  const limit = parseInt(req.query.limit) || 1000;
  const page = parseInt(req.query.page) || 1;
  const skip = (page - 1) * limit;

  const results = await Result.find(filter)
    .lean()
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
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
    const student = await Student.findOne({ userId: req.user._id }).lean();
    if (!student || student._id.toString() !== req.params.studentId) {
      res.status(403);
      throw new Error('Unauthorized access');
    }
  }

  const limit = parseInt(req.query.limit) || 1000;
  const page = parseInt(req.query.page) || 1;
  const skip = (page - 1) * limit;

  const results = await Result.find({ studentId: req.params.studentId })
    .lean()
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
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
    const student = await Student.findOne({ userId: req.user._id }).lean();
    if (!student || student._id.toString() !== req.params.studentId) {
      res.status(403);
      throw new Error('Unauthorized access');
    }
  }

  const results = await Result.find({ studentId: req.params.studentId }).lean().sort({ createdAt: 1 });
  
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

  const results = await Result.find().lean().sort({ createdAt: -1 }).limit(50);
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
    if (req.user.role === 'teacher') {
      const teacher = await require('../models/Teacher').findOne({ userId: req.user._id });
      if (!teacher) { res.status(404); throw new Error('Teacher profile not found'); }
      
      const aliases = getAliasesForClass(result.class);
      const hasAccess = teacher.assignedClasses && teacher.assignedClasses.some(c => aliases.includes(c));
      
      if (!hasAccess) {
        res.status(403); throw new Error('You are not authorized to edit this result');
      }
    }
    const { marksObtained, totalMarks, remarks, reportUrl } = req.body;
    
    if (marksObtained !== undefined) result.marksObtained = Number(marksObtained);
    if (totalMarks !== undefined) result.totalMarks = Number(totalMarks);
    
    if (!validateMarks(result.marksObtained, result.totalMarks)) {
      res.status(400); throw new Error('Invalid marks: Marks must be positive and cannot exceed total marks.');
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
    if (req.user.role === 'teacher') {
      const teacher = await require('../models/Teacher').findOne({ userId: req.user._id });
      if (!teacher) { res.status(404); throw new Error('Teacher profile not found'); }
      
      const aliases = getAliasesForClass(result.class);
      const hasAccess = teacher.assignedClasses && teacher.assignedClasses.some(c => aliases.includes(c));
      
      if (!hasAccess) {
        res.status(403); throw new Error('You are not authorized to delete this result');
      }
    }
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
