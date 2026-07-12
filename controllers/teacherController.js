const Teacher = require('../models/Teacher');
const User = require('../models/User');
const Homework = require('../models/Homework');
const Attendance = require('../models/Attendance');
const Result = require('../models/Result');
const Notice = require('../models/Notice');
const StudyMaterial = require('../models/StudyMaterial');
const catchAsync = require('../utils/catchAsync');
const {
  isValidPhone,
  isValidEmailOptional,
  normalizePhone,
  normalizeEmail,
  validateRequiredFields
} = require('../utils/validators');
const { normalizeClassName } = require('../utils/classNormalizer');

/**
 * @desc    Create a new teacher profile
 * @route   POST /api/teachers
 * @access  Private (Admin only)
 */
const createTeacher = catchAsync(async (req, res) => {
  const { name, email, phone, password, teacherId, subject, qualification, address, experience, status, assignedClasses } = req.body;

  const requiredError = validateRequiredFields(['name', 'phone', 'subject', 'password'], req.body);
  if (requiredError) { res.status(400); throw new Error(requiredError); }

  if (!isValidPhone(phone)) { res.status(400); throw new Error('Phone number must be 10 digits.'); }
  if (!isValidEmailOptional(email)) { res.status(400); throw new Error('Invalid email format.'); }
  if (status && !['active', 'inactive'].includes(status)) { res.status(400); throw new Error('Invalid status.'); }

  const cleanEmail = normalizeEmail(email);
  const cleanPhone = normalizePhone(phone);

  if (cleanEmail !== '') {
    const emailExists = await User.findOne({ email: cleanEmail });
    if (emailExists) { res.status(400); throw new Error('This email is already registered.'); }
  }
  
  const phoneExists = await User.findOne({ phone: cleanPhone });
  if (phoneExists) { res.status(400); throw new Error('This phone number is already registered.'); }

  const existingTeacher = await Teacher.findOne({ teacherId });
  if (existingTeacher) {
    res.status(400);
    throw new Error('Teacher with this ID already exists');
  }

  const user = await User.create({
    name,
    email: cleanEmail === '' ? undefined : cleanEmail,
    phone: cleanPhone,
    password,
    role: 'teacher',
    status: status === 'inactive' ? 'inactive' : 'active'
  });

  const teacher = await Teacher.create({
    userId: user._id,
    teacherId,
    name,
    subject,
    email: cleanEmail,
    qualification: qualification || 'N/A',
    phone: cleanPhone,
    address,
    experience,
    status: status || 'active',
    assignedClasses: (assignedClasses || []).map(c => normalizeClassName(c)).filter(Boolean),
    profileImage: req.body.profileImage || 'https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg',
    cloudinaryPublicId: req.body.cloudinaryPublicId
  });

  res.status(201).json(teacher);
});

/**
 * @desc    Get all teachers
 * @route   GET /api/teachers
 * @access  Private
 */
const getTeachers = catchAsync(async (req, res) => {
  const limit = parseInt(req.query.limit) || 1000;
  const page = parseInt(req.query.page) || 1;
  const skip = (page - 1) * limit;
  const teachers = await Teacher.find({}).lean().sort({ createdAt: -1 }).skip(skip).limit(limit);
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
    if (req.body.name !== undefined && req.body.name.trim() === '') { res.status(400); throw new Error("Teacher name is required."); }
    if (req.body.phone !== undefined && !isValidPhone(req.body.phone)) { res.status(400); throw new Error("Phone number must be 10 digits."); }
    if (req.body.email !== undefined && !isValidEmailOptional(req.body.email)) { res.status(400); throw new Error("Invalid email format."); }
    if (req.body.subject !== undefined && req.body.subject.trim() === '') { res.status(400); throw new Error("Subject is required."); }
    if (req.body.status !== undefined && !['active', 'inactive'].includes(req.body.status)) { res.status(400); throw new Error("Invalid status."); }

    if (req.body.phone) {
      const cleanPhone = normalizePhone(req.body.phone);
      const phoneExists = await User.findOne({ phone: cleanPhone, _id: { $ne: teacher.userId } });
      if (phoneExists) { res.status(400); throw new Error('This phone number is already registered.'); }
    }
    
    if (req.body.email) {
      const cleanEmail = normalizeEmail(req.body.email);
      const emailExists = await User.findOne({ email: cleanEmail, _id: { $ne: teacher.userId } });
      if (emailExists) { res.status(400); throw new Error('This email is already registered.'); }
    }

    teacher.name = req.body.name || teacher.name;
    teacher.email = req.body.email ? normalizeEmail(req.body.email) : teacher.email;
    teacher.subject = req.body.subject || teacher.subject;
    teacher.qualification = req.body.qualification !== undefined ? req.body.qualification : teacher.qualification;
    teacher.phone = req.body.phone ? normalizePhone(req.body.phone) : teacher.phone;
    teacher.address = req.body.address !== undefined ? req.body.address : teacher.address;
    teacher.experience = req.body.experience !== undefined ? req.body.experience : teacher.experience;
    if (req.body.status) teacher.status = req.body.status;
    teacher.assignedClasses = req.body.assignedClasses !== undefined ? req.body.assignedClasses.map(c => normalizeClassName(c)).filter(Boolean) : teacher.assignedClasses;
    
    if (req.body.profileImage) teacher.profileImage = req.body.profileImage;
    if (req.body.cloudinaryPublicId) teacher.cloudinaryPublicId = req.body.cloudinaryPublicId;

    const updatedTeacher = await teacher.save();

    // Also update User if name/phone/email/status changed
    const user = await User.findById(teacher.userId);
    if (user) {
      if (req.body.name) user.name = req.body.name;
      if (req.body.phone) user.phone = req.body.phone;
      if (req.body.email) user.email = req.body.email;
      if (req.body.status) user.status = req.body.status === 'inactive' ? 'inactive' : 'active';
      await user.save();
    }

    res.json(updatedTeacher);
  } else {
    res.status(404);
    throw new Error('Teacher not found');
  }
});

/**
 * @desc    Deactivate a teacher
 * @route   PATCH /api/teachers/:id/deactivate
 * @access  Private (Admin)
 */
const deactivateTeacher = catchAsync(async (req, res) => {
  const teacher = await Teacher.findById(req.params.id);
  if (!teacher) {
    res.status(404);
    throw new Error('Teacher not found');
  }

  teacher.status = 'inactive';
  await teacher.save();

  const user = await User.findById(teacher.userId);
  if (user) {
    user.status = 'inactive';
    await user.save();
  }

  res.json({ message: 'Teacher deactivated successfully', teacher });
});

/**
 * @desc    Delete a teacher
 * @route   DELETE /api/teachers/:id
 * @access  Private (Admin)
 */
const deleteTeacher = catchAsync(async (req, res) => {
  const teacher = await Teacher.findById(req.params.id);

  if (teacher) {
    // Check linked data
    const [linkedHomework, linkedAttendance, linkedResults, linkedNotices, linkedMaterials] = await Promise.all([
      Homework.countDocuments({ createdBy: teacher.userId }),
      Attendance.countDocuments({ markedBy: teacher.userId }),
      Result.countDocuments({ recordedBy: teacher.userId }),
      Notice.countDocuments({ createdBy: teacher.userId }),
      StudyMaterial.countDocuments({ uploadedBy: teacher.userId })
    ]);
    
    const totalLinked = linkedHomework + linkedAttendance + linkedResults + linkedNotices + linkedMaterials;

    if (totalLinked > 0) {
      res.status(400);
      throw new Error(`Cannot delete: Teacher has ${totalLinked} linked records (Homework/Attendance/Results/Notices/Materials). Please deactivate instead.`);
    }

    // If safe, delete User and Teacher
    await User.findByIdAndDelete(teacher.userId);
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
  deactivateTeacher,
  deleteTeacher,
};
