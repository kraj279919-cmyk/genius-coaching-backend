const Student = require('../models/Student');
const User = require('../models/User');
const catchAsync = require('../utils/catchAsync');
const {
  isValidPhone,
  isValidEmailOptional,
  normalizePhone,
  normalizeEmail,
  normalizeClassName,
  validateRequiredFields
} = require('../utils/validators');

/**
 * @desc    Create a new student profile
 * @route   POST /api/students
 * @access  Private (Admin / Teacher only)
 */
const createStudent = catchAsync(async (req, res) => {
  const { name, email, phone, password, studentId, class: studentClass, section, parentPhone, address, status } = req.body;

  const requiredError = validateRequiredFields(['name', 'phone', 'class', 'password'], req.body);
  if (requiredError) { res.status(400); throw new Error(requiredError); }

  if (!isValidPhone(phone)) { res.status(400); throw new Error('Phone number must be 10 digits.'); }
  if (!isValidEmailOptional(email)) { res.status(400); throw new Error('Invalid email format.'); }
  if (parentPhone && !isValidPhone(parentPhone)) { res.status(400); throw new Error('Parent phone number must be 10 digits.'); }
  if (status && !['active', 'inactive', 'left'].includes(status)) { res.status(400); throw new Error('Invalid status.'); }

  const cleanEmail = normalizeEmail(email);
  const cleanPhone = normalizePhone(phone);
  const cleanParentPhone = normalizePhone(parentPhone);
  const cleanClass = normalizeClassName(studentClass);

  if (cleanEmail !== '') {
    const emailExists = await User.findOne({ email: cleanEmail });
    if (emailExists) { res.status(400); throw new Error('This email is already registered.'); }
  }
  
  const phoneExists = await User.findOne({ phone: cleanPhone });
  if (phoneExists) { res.status(400); throw new Error('This phone number is already registered.'); }

  // We check if studentId already exists
  const existingStudent = await Student.findOne({ studentId });
  if (existingStudent) {
    res.status(400);
    throw new Error('Student with this Roll Number already exists');
  }

  const user = await User.create({
    name,
    email: cleanEmail === '' ? undefined : cleanEmail,
    phone: cleanPhone,
    password,
    role: 'student'
  });

  const student = await Student.create({
    userId: user._id, // Reference to the Auth User
    studentId,
    name,
    class: cleanClass,
    section: section || 'A',
    phone: cleanPhone,
    parentPhone: cleanParentPhone || cleanPhone,
    address: address || 'N/A',
    status: status || 'active',
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
  const limit = parseInt(req.query.limit) || 1000;
  const page = parseInt(req.query.page) || 1;
  const skip = (page - 1) * limit;
  const students = await Student.find({}).lean().sort({ createdAt: -1 }).skip(skip).limit(limit);
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
    if (req.user.role === 'student' && student.userId.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error('Unauthorized to view this profile');
    }
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
    if (req.body.name !== undefined && req.body.name.trim() === '') { res.status(400); throw new Error("Student name is required."); }
    if (req.body.phone !== undefined && !isValidPhone(req.body.phone)) { res.status(400); throw new Error("Phone number must be 10 digits."); }
    if (req.body.email !== undefined && !isValidEmailOptional(req.body.email)) { res.status(400); throw new Error("Invalid email format."); }
    if (req.body.parentPhone !== undefined && !isValidPhone(req.body.parentPhone)) { res.status(400); throw new Error("Parent phone number must be 10 digits."); }
    if (req.body.status !== undefined && !['active', 'inactive', 'left'].includes(req.body.status)) { res.status(400); throw new Error("Invalid status."); }

    if (req.body.phone) {
      const cleanPhone = normalizePhone(req.body.phone);
      const phoneExists = await User.findOne({ phone: cleanPhone, _id: { $ne: student.userId } });
      if (phoneExists) { res.status(400); throw new Error('This phone number is already registered.'); }
    }
    
    if (req.body.email) {
      const cleanEmail = normalizeEmail(req.body.email);
      const emailExists = await User.findOne({ email: cleanEmail, _id: { $ne: student.userId } });
      if (emailExists) { res.status(400); throw new Error('This email is already registered.'); }
    }

    student.name = req.body.name || student.name;
    student.class = req.body.class ? normalizeClassName(req.body.class) : student.class;
    student.section = req.body.section || student.section;
    student.phone = req.body.phone ? normalizePhone(req.body.phone) : student.phone;
    student.parentPhone = req.body.parentPhone ? normalizePhone(req.body.parentPhone) : student.parentPhone;
    student.address = req.body.address || student.address;
    if (req.body.status) student.status = req.body.status;
    
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
  
  await Promise.all(students.map(async (student) => {
    student.previousClassHistory.push({
      class: student.class,
      academicYear: student.academicYear || 'Unknown',
      promotedAt: new Date()
    });
    student.class = toClass;
    student.academicYear = academicYear;
    await student.save();
  }));
  res.json({ message: `Successfully promoted ${students.length} students to ${toClass}` });
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
