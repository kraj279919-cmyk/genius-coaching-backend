const Teacher = require('../models/Teacher');
const catchAsync = require('../utils/catchAsync');

/**
 * @desc    Create a new teacher profile
 * @route   POST /api/teachers
 * @access  Private (Admin only)
 */
const createTeacher = catchAsync(async (req, res) => {
  const { userId, teacherId, name, subject, qualification, phone } = req.body;

  const existingTeacher = await Teacher.findOne({ teacherId });
  if (existingTeacher) {
    res.status(400);
    throw new Error('Teacher with this ID already exists');
  }

  const teacher = await Teacher.create({
    userId,
    teacherId,
    name,
    subject,
    qualification,
    phone,
    profileImage: req.body.profileImage || 'https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg',
  });

  res.status(201).json(teacher);
});

/**
 * @desc    Get all teachers
 * @route   GET /api/teachers
 * @access  Private
 */
const getTeachers = catchAsync(async (req, res) => {
  const teachers = await Teacher.find({});
  res.json(teachers);
});

/**
 * @desc    Get teacher by ID
 * @route   GET /api/teachers/:id
 * @access  Private
 */
const getTeacherById = catchAsync(async (req, res) => {
  const teacher = await Teacher.findById(req.params.id);

  if (teacher) {
    res.json(teacher);
  } else {
    res.status(404);
    throw new Error('Teacher not found');
  }
});

/**
 * @desc    Update a teacher
 * @route   PUT /api/teachers/:id
 * @access  Private (Admin)
 */
const updateTeacher = catchAsync(async (req, res) => {
  const teacher = await Teacher.findById(req.params.id);

  if (teacher) {
    teacher.name = req.body.name || teacher.name;
    teacher.subject = req.body.subject || teacher.subject;
    teacher.qualification = req.body.qualification || teacher.qualification;
    teacher.phone = req.body.phone || teacher.phone;
    
    if (req.body.profileImage) {
      teacher.profileImage = req.body.profileImage;
    }

    const updatedTeacher = await teacher.save();
    res.json(updatedTeacher);
  } else {
    res.status(404);
    throw new Error('Teacher not found');
  }
});

/**
 * @desc    Delete a teacher
 * @route   DELETE /api/teachers/:id
 * @access  Private (Admin)
 */
const deleteTeacher = catchAsync(async (req, res) => {
  const teacher = await Teacher.findById(req.params.id);

  if (teacher) {
    await teacher.deleteOne();
    res.json({ message: 'Teacher removed successfully' });
  } else {
    res.status(404);
    throw new Error('Teacher not found');
  }
});

module.exports = {
  createTeacher,
  getTeachers,
  getTeacherById,
  updateTeacher,
  deleteTeacher,
};
