const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

// Models
const User = require('./models/User');
const Student = require('./models/Student');
const Teacher = require('./models/Teacher');
const Homework = require('./models/Homework');
const Attendance = require('./models/Attendance');
const Result = require('./models/Result');
const FeeRecord = require('./models/FeeRecord');
const Gallery = require('./models/Gallery');

async function runAudit() {
  console.log('--- STARTING BACKEND DATA QUALITY AUDIT ---\n');
  
  try {
    // We are only reading data, no deprecation options are used here.
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected successfully.\n');

    // 1. Duplicate Homework by title+class+dueDate
    console.log('[1] Checking for duplicate homework (title+class+dueDate)...');
    const homeworks = await Homework.find({});
    const hwMap = {};
    let dupHw = 0;
    homeworks.forEach(hw => {
        const key = `${hw.title}-${hw.class}-${hw.dueDate}`;
        if (hwMap[key]) {
            console.log(`  -> Duplicate found: "${hw.title}" for class ${hw.class} due ${hw.dueDate}`);
            dupHw++;
        } else {
            hwMap[key] = true;
        }
    });
    if (dupHw === 0) console.log('  -> OK (No duplicates)');
    console.log('');

    // 2. Results missing student reference
    console.log('[2] Checking results for missing student references...');
    const results = await Result.find({}).populate('studentId');
    let orphanResults = 0;
    results.forEach(res => {
        if (!res.studentId) {
            console.log(`  -> Orphan Result: ${res._id} (Exam: ${res.examName})`);
            orphanResults++;
        }
    });
    if (orphanResults === 0) console.log('  -> OK (No orphaned results)');
    console.log('');

    // 3. Attendance missing student reference
    console.log('[3] Checking attendance for missing student references...');
    const attendance = await Attendance.find({}).populate('studentId');
    let orphanAtt = 0;
    attendance.forEach(att => {
        if (!att.studentId) {
            console.log(`  -> Orphan Attendance: ${att._id} (Date: ${att.date})`);
            orphanAtt++;
        }
    });
    if (orphanAtt === 0) console.log('  -> OK (No orphaned attendance)');
    console.log('');

    // 4. Fees missing student reference
    console.log('[4] Checking fees for missing student references...');
    const fees = await FeeRecord.find({}).populate('studentId');
    let orphanFees = 0;
    fees.forEach(fee => {
        if (!fee.studentId) {
            console.log(`  -> Orphan Fee: ${fee._id} (Status: ${fee.status})`);
            orphanFees++;
        }
    });
    if (orphanFees === 0) console.log('  -> OK (No orphaned fees)');
    console.log('');

    // 5. Users without student/teacher profile
    console.log('[5] Checking users for missing profile documents...');
    const users = await User.find({});
    let usersNoProfile = 0;
    for (const u of users) {
        if (u.role === 'student') {
            const profile = await Student.findOne({ userId: u._id });
            if (!profile) {
                console.log(`  -> User ${u.email} (Student) has no Student profile`);
                usersNoProfile++;
            }
        } else if (u.role === 'teacher') {
            const profile = await Teacher.findOne({ userId: u._id });
            if (!profile) {
                console.log(`  -> User ${u.email} (Teacher) has no Teacher profile`);
                usersNoProfile++;
            }
        }
    }
    if (usersNoProfile === 0) console.log('  -> OK (All users have profiles)');
    console.log('');

    // 6. Profiles without user account
    console.log('[6] Checking profiles for missing user accounts...');
    const students = await Student.find({});
    let profilesNoUser = 0;
    for (const s of students) {
        const u = await User.findById(s.userId);
        if (!u) {
            console.log(`  -> Student Profile ${s.studentId} has no User account`);
            profilesNoUser++;
        }
    }
    const teachers = await Teacher.find({});
    for (const t of teachers) {
        const u = await User.findById(t.userId);
        if (!u) {
            console.log(`  -> Teacher Profile ${t.name} has no User account`);
            profilesNoUser++;
        }
    }
    if (profilesNoUser === 0) console.log('  -> OK (All profiles have user accounts)');
    console.log('');

    // 7. Gallery visibility
    console.log('[7] Checking gallery active/public visibility count...');
    const galleryCount = await Gallery.countDocuments({ status: 'active' });
    console.log(`  -> Active Gallery Images: ${galleryCount}`);
    console.log('');

    console.log('--- AUDIT COMPLETE ---');
    process.exit(0);

  } catch (error) {
    console.error('Audit failed:', error);
    process.exit(1);
  }
}

runAudit();
