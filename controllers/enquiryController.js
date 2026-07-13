const Enquiry = require('../models/Enquiry');
const Student = require('../models/Student');
const User = require('../models/User');
const catchAsync = require('../utils/catchAsync');
const bcrypt = require('bcryptjs');

const getEnquiries = catchAsync(async (req, res) => {
  const enquiries = await Enquiry.find().sort('-createdAt');
  res.json(enquiries);
});

const createEnquiry = catchAsync(async (req, res) => {
  const enquiry = await Enquiry.create(req.body);
  res.status(201).json(enquiry);
});

const updateEnquiryStatus = catchAsync(async (req, res) => {
  const enquiry = await Enquiry.findById(req.params.id);
  if (enquiry) {
    enquiry.status = req.body.status || enquiry.status;
    const updated = await enquiry.save();
    res.json(updated);
  } else {
    res.status(404);
    throw new Error('Enquiry not found');
  }
});

const deleteEnquiry = catchAsync(async (req, res) => {
  const enquiry = await Enquiry.findById(req.params.id);
  if (enquiry) {
    await enquiry.deleteOne();
    res.json({ message: 'Enquiry removed' });
  } else {
    res.status(404);
    throw new Error('Enquiry not found');
  }
});

const addFollowUp = catchAsync(async (req, res) => {
  const enquiry = await Enquiry.findById(req.params.id);
  if (!enquiry) {
    res.status(404);
    throw new Error('Enquiry not found');
  }

  const { notes, status } = req.body;
  if (!notes) {
    res.status(400); throw new Error('Notes are required for a follow-up');
  }

  enquiry.followUps.push({ notes, status: status || enquiry.status });
  if (status) {
    enquiry.status = status;
  }
  
  const updated = await enquiry.save();
  res.json(updated);
});

const convertToStudent = catchAsync(async (req, res) => {
  const enquiry = await Enquiry.findById(req.params.id);
  if (!enquiry) {
    res.status(404); throw new Error('Enquiry not found');
  }
  if (enquiry.status === 'Converted') {
    res.status(400); throw new Error('Enquiry already converted');
  }

  const { class: studentClass, section, password } = req.body;
  if (!studentClass || !password) {
    res.status(400); throw new Error('Class and default password are required to convert to student');
  }

  // Check if phone already exists
  const existingUser = await User.findOne({ phone: enquiry.phone });
  if (existingUser) {
    res.status(400); throw new Error('A user with this phone number already exists.');
  }

  // Create User
  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = await User.create({
    name: enquiry.name,
    phone: enquiry.phone,
    password: hashedPassword,
    role: 'student'
  });

  // Create Student
  const newStudent = await Student.create({
    userId: newUser._id,
    name: enquiry.name,
    phone: enquiry.phone,
    class: studentClass,
    section: section || 'A',
    status: 'active'
  });

  // Update Enquiry
  enquiry.status = 'Converted';
  enquiry.convertedToStudent = newStudent._id;
  await enquiry.save();

  res.status(201).json({ message: 'Converted to student successfully', student: newStudent });
});

module.exports = { getEnquiries, createEnquiry, updateEnquiryStatus, deleteEnquiry, addFollowUp, convertToStudent };
