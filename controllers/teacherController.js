const Teacher = require('../models/Teacher');
const User = require('../models/User');
const Homework = require('../models/Homework');
const Attendance = require('../models/Attendance');
const Result = require('../models/Result');
const Notice = require('../models/Notice');
const StudyMaterial = require('../models/StudyMaterial');
const catchAsync = require('../utils/catchAsync');

/**
 * @desc    Create a new teacher profile
 * @route   POST /api/teachers
 * @access  Private (Admin only)
 */
const createTeacher = catchAsync(async (req, res) => {
  const { name, email, phone, password, teacherId, subject, qualification, address, experience, status, assignedClasses } = req.body;

  const existingTeacher = await Teacher.findOne({ teacherId });
  if (existingTeacher) {
    res.status(400);
    throw new Error('Teacher with this ID already exists');
  }

  // Create User first
  const cleanEmail = email ? email.trim().toLowerCase() : undefined;
  const cleanPhone = phone ? phone.trim() : undefined;
  
  const user = await User.create({
    name,
    email: cleanEmail === '' ? undefined : cleanEmail,
    phone: cleanPhone === '' ? undefined : cleanPhone,
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
    assignedClasses: assignedClasses || [],
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
    teacher.name = req.body.name !== undefined ? req.body.name : teacher.name;
    teacher.email = req.body.email !== undefined ? req.body.email : teacher.email;
    teacher.subject = req.body.subject !== undefined ? req.body.subject : teacher.subject;
    teacher.qualification = req.body.qualification !== undefined ? req.body.qualification : teacher.qualification;
    teacher.phone = req.body.phone !== undefined ? req.body.phone : teacher.phone;
    teacher.address = req.body.address !== undefined ? req.body.address : teacher.address;
    teacher.experience = req.body.experience !== undefined ? req.body.experience : teacher.experience;
    teacher.status = req.body.status !== undefined ? req.body.status : teacher.status;
    teacher.assignedClasses = req.body.assignedClasses !== undefined ? req.body.assignedClasses : teacher.assignedClasses;
    
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
    const linkedHomework = await Homework.countDocuments({ createdBy: teacher.userId });
    const linkedAttendance = await Attendance.countDocuments({ markedBy: teacher.userId });
    const linkedResults = await Result.countDocuments({ recordedBy: teacher.userId });
    const linkedNotices = await Notice.countDocuments({ createdBy: teacher.userId });
    const linkedMaterials = await StudyMaterial.countDocuments({ uploadedBy: teacher.userId });
    
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
