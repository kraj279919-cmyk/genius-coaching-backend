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
  const cleanEmail = email ? email.trim().toLowerCase() : undefined;
  const cleanPhone = phone ? phone.trim() : undefined;
  
  const user = await User.create({
    name,
    email: cleanEmail === '' ? undefined : cleanEmail,
    phone: cleanPhone === '' ? undefined : cleanPhone,
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

    // Sync auth User
    const user = await User.findById(student.userId);
    if (user) {
      user.name = student.name;
      user.phone = student.phone;
      await user.save();
    }

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
    const userId = student.userId;
    await student.deleteOne();
    
    // Also delete the auth User
    if (userId) {
      await User.findByIdAndDelete(userId);
    }
    
    res.json({ message: 'Student removed successfully' });
  } else {
    res.status(404);
    throw new Error('Student not found');
  }
});

/**
 * @desc    Deactivate a student
 * @route   PATCH /api/students/:id/deactivate
 * @access  Private (Admin)
 */
const deactivateStudent = catchAsync(async (req, res) => {
  const student = await Student.findById(req.params.id);
  if (!student) {
    res.status(404);
    throw new Error('Student not found');
  }
  student.status = 'inactive';
  await student.save();

  const user = await User.findById(student.userId);
  if (user) {
    user.status = 'inactive';
    await user.save();
  }
  res.json({ message: 'Student deactivated safely' });
});

/**
 * @desc    Preview class promotion
 * @route   POST /api/students/promote-class/preview
 * @access  Private (Admin)
 */
const promoteClassPreview = catchAsync(async (req, res) => {
  const { fromClass } = req.body;
  if (!fromClass) {
    res.status(400); throw new Error('fromClass is required');
  }
  const count = await Student.countDocuments({ class: fromClass, status: 'active' });
  res.json({ count, message: `${count} active students found in ${fromClass} ready for promotion` });
});

/**
 * @desc    Execute class promotion
 * @route   POST /api/students/promote-class/execute
 * @access  Private (Admin)
 */
const promoteClassExecute = catchAsync(async (req, res) => {
  const { fromClass, toClass, academicYear } = req.body;
  if (!fromClass || !toClass || !academicYear) {
    res.status(400); throw new Error('fromClass, toClass, and academicYear are required');
  }
  const students = await Student.find({ class: fromClass, status: 'active' });
  
  let promotedCount = 0;
  for (const student of students) {
    student.previousClassHistory.push({
      class: student.class,
      academicYear: student.academicYear || 'Unknown',
      promotedAt: new Date()
    });
    student.class = toClass;
    student.academicYear = academicYear;
    await student.save();
    promotedCount++;
  }
  res.json({ message: `Successfully promoted ${promotedCount} students to ${toClass}` });
});

module.exports = {
  createStudent,
  getStudents,
  getStudentById,
  updateStudent,
  deleteStudent,
  deactivateStudent,
  promoteClassPreview,
  promoteClassExecute,
};
