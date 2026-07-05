const mongoose = require('mongoose');
const Student = require('./models/Student');
const Attendance = require('./models/Attendance');
const FeeRecord = require('./models/FeeRecord');
const Result = require('./models/Result');
const Homework = require('./models/Homework');
const Notice = require('./models/Notice');
require('dotenv').config();

const runTest = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected');

    // 1. Test lean and pagination
    console.time('Student Find Lean');
    const students = await Student.find({}).lean().limit(10);
    console.timeEnd('Student Find Lean');
    if (!Array.isArray(students)) throw new Error('Expected array');

    // 2. Check indexes
    const studentIndexes = await Student.collection.getIndexes();
    if (!studentIndexes.userId_1) console.warn('Missing userId index on Student');

    const attendanceIndexes = await Attendance.collection.getIndexes();
    if (!attendanceIndexes.studentId_1_date_-1) console.warn('Missing studentId index on Attendance');

    console.log('PASS');
    process.exit(0);
  } catch (error) {
    console.error('FAIL:', error);
    process.exit(1);
  }
};

runTest();
