const Student = require('../models/Student');
const User = require('../models/User');
const catchAsync = require('../utils/catchAsync');

/**
 * @desc    Create a new student profile
 * @route   POST /api/students
 * @access  Private (Admin / Teacher only)
 */
const createStudent = catchAsync(async (req, res) => {
  const { name, email, phone, password, studentId, class: studentClass, section, parentPhone, address } = req.body;

  // We check if studentId already exists
  const existingStudent = await Student.findOne({ studentId });
  if (existingStudent) {
    res.status(400);
    throw new Error('Student with this Roll Number already exists');
  }

  // Create User first
  const user = await User.create({
    name,
    email: email || undefined,
    phone: phone || undefined,
    password,
    role: 'student'
  });

  const student = await Student.create({
    userId: user._id, // Reference to the Auth User
    studentId,
    name,
    class: studentClass,
    section: section || 'A',
    phone,
    parentPhone: parentPhone || phone,
    address: address || 'N/A',
    // Note: profileImage will be handled via Cloudinary upload separately or passed in body
    profileImage: req.body.profileImage || 'https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg',
  });

  res.status(201).json(student);
});

/**
 * @desc    Get all students
 * @route   GET /api/students
 * @access  Private (Admin / Teacher)
 */
const getStudents = catchAsync(async (req, res) => {
  const students = await Student.find({});
  res.json(students);
});

/**
 * @desc    Get student by ID
 * @route   GET /api/students/:id
 * @access  Private (Admin / Teacher / The student themselves)
 */
const getStudentById = catchAsync(async (req, res) => {
  const student = await Student.findById(req.params.id);

  if (student) {
    res.json(student);
  } else {
    res.status(404);
    throw new Error('Student not found');
  }
});

/**
 * @desc    Update a student
 * @route   PUT /api/students/:id
 * @access  Private (Admin)
 */
const updateStudent = catchAsync(async (req, res) => {
  const student = await Student.findById(req.params.id);

  if (student) {
    student.name = req.body.name || student.name;
    student.class = req.body.class || student.class;
    student.section = req.body.section || student.section;
    student.phone = req.body.phone || student.phone;
    student.parentPhone = req.body.parentPhone || student.parentPhone;
    student.address = req.body.address || student.address;
    
    if (req.body.profileImage) {
      student.profileImage = req.body.profileImage;
    }

    const updatedStudent = await student.save();
    res.json(updatedStudent);
  } else {
    res.status(404);
    throw new Error('Student not found');
  }
});

/**
 * @desc    Delete a student
 * @route   DELETE /api/students/:id
 * @access  Private (Admin)
 */
const deleteStudent = catchAsync(async (req, res) => {
  const student = await Student.findById(req.params.id);

  if (student) {
    await student.deleteOne();
    res.json({ message: 'Student removed successfully' });
  } else {
    res.status(404);
    throw new Error('Student not found');
  }
});

module.exports = {
  createStudent,
  getStudents,
  getStudentById,
  updateStudent,
  deleteStudent,
};
