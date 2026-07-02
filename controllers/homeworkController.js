const Homework = require('../models/Homework');
const Student = require('../models/Student');
const catchAsync = require('../utils/catchAsync');

/**
 * @desc    Assign new homework
 * @route   POST /api/homework
 * @access  Private (Admin / Teacher)
 */
const createHomework = catchAsync(async (req, res) => {
  const { title, description, subject, class: targetClass, dueDate, attachmentUrl, attachmentType, status } = req.body;

  if (!title) { res.status(400); throw new Error('Title required'); }
  if (!targetClass) { res.status(400); throw new Error('Class required'); }
  if (!subject) { res.status(400); throw new Error('Subject required'); }
  if (!dueDate) { res.status(400); throw new Error('Due date required'); }

  const homework = await Homework.create({
    title,
    description: description || '',
    subject,
    class: targetClass,
    dueDate,
    attachmentUrl,
    attachmentType: attachmentType || 'none',
    status: status || 'active',
    assignedBy: req.user._id,
  });

  const populated = await Homework.findById(homework._id).populate('assignedBy', 'name role');
  res.status(201).json(populated);
});

/**
 * @desc    Get all homework
 * @route   GET /api/homework
 * @access  Private
 */
const getHomework = catchAsync(async (req, res) => {
  const filter = {};
  
  if (req.user.role === 'student') {
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) { res.status(404); throw new Error('Student profile not found'); }
    filter.class = student.class;
    filter.status = 'active'; // Students see active homework by default unless specified
  } else {
    if (req.query.class) filter.class = req.query.class;
    if (req.query.subject) filter.subject = req.query.subject;
    if (req.query.status) filter.status = req.query.status;
  }

  const homeworkList = await Homework.find(filter)
    .sort({ createdAt: -1 })
    .populate('assignedBy', 'name role');

  res.json(homeworkList);
});

/**
 * @desc    Get homework by class
 * @route   GET /api/homework/class/:className
 * @access  Private
 */
const getHomeworkByClass = catchAsync(async (req, res) => {
  if (req.user.role === 'student') {
    const student = await Student.findOne({ userId: req.user._id });
    if (!student || student.class !== req.params.className) {
      res.status(403);
      throw new Error('Unauthorized access to this class homework');
    }
  }

  const homeworkList = await Homework.find({ class: req.params.className })
    .sort({ createdAt: -1 })
    .populate('assignedBy', 'name role');

  res.json(homeworkList);
});

/**
 * @desc    Get specific homework by ID
 * @route   GET /api/homework/:id
 * @access  Private
 */
const getHomeworkById = catchAsync(async (req, res) => {
  const homework = await Homework.findById(req.params.id)
    .populate('assignedBy', 'name role');

  if (homework) {
    if (req.user.role === 'student') {
      const student = await Student.findOne({ userId: req.user._id });
      if (!student || homework.class !== student.class) {
        res.status(403);
        throw new Error('Unauthorized access');
      }
    }
    res.json(homework);
  } else {
    res.status(404);
    throw new Error('Homework not found');
  }
});

/**
 * @desc    Update homework
 * @route   PATCH /api/homework/:id
 * @access  Private (Admin / Teacher)
 */
const updateHomework = catchAsync(async (req, res) => {
  const homework = await Homework.findById(req.params.id);

  if (homework) {
    const { title, description, subject, class: targetClass, dueDate, attachmentUrl, attachmentType, status } = req.body;
    
    if (title) homework.title = title;
    if (description !== undefined) homework.description = description;
    if (subject) homework.subject = subject;
    if (targetClass) homework.class = targetClass;
    if (dueDate) homework.dueDate = dueDate;
    if (attachmentUrl !== undefined) homework.attachmentUrl = attachmentUrl;
    if (attachmentType) homework.attachmentType = attachmentType;
    if (status) homework.status = status;

    const updatedHomework = await homework.save();
    const populated = await Homework.findById(updatedHomework._id).populate('assignedBy', 'name role');
    res.json(populated);
  } else {
    res.status(404);
    throw new Error('Homework not found');
  }
});

/**
 * @desc    Delete homework
 * @route   DELETE /api/homework/:id
 * @access  Private (Admin / Teacher)
 */
const deleteHomework = catchAsync(async (req, res) => {
  const homework = await Homework.findById(req.params.id);

  if (homework) {
    await homework.deleteOne();
    res.json({ message: 'Homework deleted successfully' });
  } else {
    res.status(404);
    throw new Error('Homework not found');
  }
});

module.exports = {
  createHomework,
  getHomework,
  getHomeworkByClass,
  getHomeworkById,
  updateHomework,
  deleteHomework,
};
