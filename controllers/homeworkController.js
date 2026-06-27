const Homework = require('../models/Homework');
const Student = require('../models/Student');
const catchAsync = require('../utils/catchAsync');

/**
 * @desc    Assign new homework
 * @route   POST /api/homework
 * @access  Private (Admin / Teacher)
 */
const createHomework = catchAsync(async (req, res) => {
  const { title, description, subject, class: targetClass, dueDate, attachmentUrl } = req.body;

  const homework = await Homework.create({
    title,
    description,
    subject,
    class: targetClass,
    dueDate,
    attachmentUrl,
    assignedBy: req.user._id,
  });

  res.status(201).json(homework);
});

/**
 * @desc    Get all homework
 * @route   GET /api/homework
 * @access  Private
 */
const getHomework = catchAsync(async (req, res) => {
  const filter = {};
  
  // Student can only see homework assigned to their class
  if (req.user.role === 'student') {
    const student = await Student.findOne({ userId: req.user._id });
    if (student) {
      filter.class = student.class;
    }
  } else if (req.query.class) {
    // Admins and teachers can filter by class
    filter.class = req.query.class;
  }

  const homeworkList = await Homework.find(filter)
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
    // Student can only view if it matches their class
    if (req.user.role === 'student') {
      const student = await Student.findOne({ userId: req.user._id });
      if (!student || homework.class !== student.class) {
        res.status(403);
        throw new Error('Not authorized to view this homework');
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
 * @route   PUT /api/homework/:id
 * @access  Private (Admin / Teacher)
 */
const updateHomework = catchAsync(async (req, res) => {
  const homework = await Homework.findById(req.params.id);

  if (homework) {
    homework.title = req.body.title || homework.title;
    homework.description = req.body.description || homework.description;
    homework.dueDate = req.body.dueDate || homework.dueDate;
    if (req.body.attachmentUrl) homework.attachmentUrl = req.body.attachmentUrl;

    const updatedHomework = await homework.save();
    res.json(updatedHomework);
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
  getHomeworkById,
  updateHomework,
  deleteHomework,
};
