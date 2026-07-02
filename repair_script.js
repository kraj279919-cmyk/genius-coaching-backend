const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Student = require('./models/Student');
const Teacher = require('./models/Teacher');
const User = require('./models/User');

dotenv.config();

async function runRepair() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('--- STARTING DATA CONSISTENCY REPAIR ---');

  const students = await Student.find({});
  const teachers = await Teacher.find({});
  const users = await User.find({});

  console.log(`Total Students: ${students.length}`);
  console.log(`Total Teachers: ${teachers.length}`);
  console.log(`Total Users: ${users.length}`);

  let missingUserCount = 0;
  let mismatchedStatusCount = 0;

  // 1. Check Students without User
  for (const student of students) {
    if (!student.userId) {
      console.log(`[WARN] Student ${student.name} (${student.studentId}) has NO userId!`);
      continue;
    }
    const user = await User.findById(student.userId);
    if (!user) {
      console.log(`[ERROR] Student ${student.name} points to deleted/missing User ${student.userId}.`);
      missingUserCount++;
      // Safe repair: Create a new User
      const newUser = await User.create({
        name: student.name,
        email: student.email,
        phone: student.phone,
        password: 'password123', // Default safe reset
        role: 'student',
        status: student.status
      });
      student.userId = newUser._id;
      await student.save();
      console.log(`   -> [FIXED] Created new User for Student ${student.name}`);
    } else {
      if (user.status !== student.status) {
        console.log(`[WARN] Status mismatch for Student ${student.name}. Student:${student.status} User:${user.status}`);
        user.status = student.status;
        await user.save();
        mismatchedStatusCount++;
        console.log(`   -> [FIXED] Synced User status to match Student profile.`);
      }
    }
  }

  // 2. Check Teachers without User
  for (const teacher of teachers) {
    if (!teacher.userId) {
      console.log(`[WARN] Teacher ${teacher.name} (${teacher.teacherId}) has NO userId!`);
      continue;
    }
    const user = await User.findById(teacher.userId);
    if (!user) {
      console.log(`[ERROR] Teacher ${teacher.name} points to deleted/missing User ${teacher.userId}.`);
      missingUserCount++;
      const newUser = await User.create({
        name: teacher.name,
        email: teacher.email,
        phone: teacher.phone,
        password: 'password123',
        role: 'teacher',
        status: teacher.status
      });
      teacher.userId = newUser._id;
      await teacher.save();
      console.log(`   -> [FIXED] Created new User for Teacher ${teacher.name}`);
    } else {
      if (user.status !== teacher.status) {
        console.log(`[WARN] Status mismatch for Teacher ${teacher.name}. Teacher:${teacher.status} User:${user.status}`);
        user.status = teacher.status;
        await user.save();
        mismatchedStatusCount++;
        console.log(`   -> [FIXED] Synced User status to match Teacher profile.`);
      }
    }
  }

  console.log(`\nRepair Complete. Fixed ${missingUserCount} missing users, ${mismatchedStatusCount} status mismatches.`);
  process.exit(0);
}

runRepair();
