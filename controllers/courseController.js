const Course = require('../models/Course');
const catchAsync = require('../utils/catchAsync');

/**
 * @desc    Create a new course
 * @route   POST /api/courses
 * @access  Private (Admin)
 */
const createCourse = catchAsync(async (req, res) => {
  const { title, description, classLevel, board, fee, imageUrl } = req.body;

  const course = await Course.create({
    title,
    description,
    classLevel,
    board,
    fee,
    imageUrl,
    createdBy: req.user._id,
  });

  res.status(201).json(course);
});

/**
 * @desc    Get all courses
 * @route   GET /api/courses
 * @access  Public
 */
const getCourses = catchAsync(async (req, res) => {
  const filter = {};
  if (req.query.classLevel) filter.classLevel = req.query.classLevel;

  const courses = await Course.find(filter)
    .sort({ createdAt: -1 })
    .populate('createdBy', 'name');

  res.json(courses);
});

/**
 * @desc    Get course by ID
 * @route   GET /api/courses/:id
 * @access  Public
 */
const getCourseById = catchAsync(async (req, res) => {
  const course = await Course.findById(req.params.id)
    .populate('createdBy', 'name');

  if (course) {
    res.json(course);
  } else {
    res.status(404);
    throw new Error('Course not found');
  }
});

/**
 * @desc    Update a course
 * @route   PUT /api/courses/:id
 * @access  Private (Admin)
 */
const updateCourse = catchAsync(async (req, res) => {
  const course = await Course.findById(req.params.id);

  if (course) {
    course.title = req.body.title || course.title;
    course.description = req.body.description || course.description;
    course.classLevel = req.body.classLevel || course.classLevel;
    course.board = req.body.board || course.board;
    course.fee = req.body.fee || course.fee;
    if (req.body.imageUrl) course.imageUrl = req.body.imageUrl;

    const updatedCourse = await course.save();
    res.json(updatedCourse);
  } else {
    res.status(404);
    throw new Error('Course not found');
  }
});

/**
 * @desc    Delete a course
 * @route   DELETE /api/courses/:id
 * @access  Private (Admin)
 */
const deleteCourse = catchAsync(async (req, res) => {
  const course = await Course.findById(req.params.id);

  if (course) {
    await course.deleteOne();
    res.json({ message: 'Course deleted successfully' });
  } else {
    res.status(404);
    throw new Error('Course not found');
  }
});

module.exports = {
  createCourse,
  getCourses,
  getCourseById,
  updateCourse,
  deleteCourse,
};
