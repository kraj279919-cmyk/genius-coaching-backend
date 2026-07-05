const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const User = require('./models/User');
const Student = require('./models/Student');
const Teacher = require('./models/Teacher');
const Homework = require('./models/Homework');
const Attendance = require('./models/Attendance');
const Result = require('./models/Result');

const APPLY_MODE = process.argv.includes('--apply');

async function runRepair() {
  console.log(`--- STARTING SAFE DATA REPAIR (${APPLY_MODE ? 'APPLY MODE' : 'DRY RUN'}) ---\n`);

  if (!APPLY_MODE) {
    console.log('NOTE: Running in DRY_RUN mode. No changes will be saved to the database.\n');
  }

  try {
    await mongoose.connect(process.env.MONGO_URI);

    // 1. Duplicate Homework by title+class+dueDate
    console.log('[1] Processing Duplicate Homework...');
    const homeworks = await Homework.find({}).sort({ createdAt: 1 }); // Oldest first
    const hwMap = {};
    let hwFixed = 0;
    
    for (const hw of homeworks) {
        const key = `${hw.title}-${hw.class}-${hw.dueDate}`;
        if (hwMap[key]) {
            console.log(`  -> FOUND Duplicate: "${hw.title}" for ${hw.class}`);
            if (hw.status === 'active') {
                console.log(`  -> CAN_FIX: Will mark HW ID ${hw._id} as 'expired'`);
                if (APPLY_MODE) {
                    hw.status = 'expired';
                    await hw.save();
                    console.log(`  -> FIXED: HW ID ${hw._id} is now expired.`);
                }
                hwFixed++;
            } else {
                console.log(`  -> SKIPPED: HW ID ${hw._id} is already ${hw.status}`);
            }
        } else {
            // Keep the first (oldest) active one
            if (hw.status === 'active') {
                hwMap[key] = true;
            }
        }
    }
    if (hwFixed === 0) console.log('  -> No active duplicates found.');
    console.log('');

    // 2. Results missing student reference
    console.log('[2] Processing Orphaned Results...');
    const results = await Result.find({}).populate('studentId');
    let orphanResults = 0;
    for (const res of results) {
        if (!res.studentId) {
            console.log(`  -> FOUND Orphan Result: ${res._id} (Exam: ${res.examName})`);
            console.log('  -> NEEDS_MANUAL_REVIEW: Cannot safely auto-delete financial/academic records.');
            orphanResults++;
        }
    }
    if (orphanResults === 0) console.log('  -> No orphaned results found.');
    console.log('');

    // 3. Attendance missing student reference
    console.log('[3] Processing Orphaned Attendance...');
    const attendance = await Attendance.find({}).populate('studentId');
    let orphanAtt = 0;
    for (const att of attendance) {
        if (!att.studentId) {
            console.log(`  -> FOUND Orphan Attendance: ${att._id} (Date: ${att.date})`);
            console.log('  -> NEEDS_MANUAL_REVIEW: Cannot safely auto-delete academic records.');
            orphanAtt++;
        }
    }
    if (orphanAtt === 0) console.log('  -> No orphaned attendance found.');
    console.log('');

    // 4. Missing profiles
    console.log('[4] Processing Missing Profiles...');
    const users = await User.find({});
    let usersNoProfile = 0;
    for (const u of users) {
        if (u.role === 'student') {
            const profile = await Student.findOne({ userId: u._id });
            if (!profile) {
                console.log(`  -> FOUND Missing Profile: User ${u.email} (Student)`);
                console.log('  -> NEEDS_MANUAL_REVIEW: Cannot safely auto-create profile without student details.');
                usersNoProfile++;
            }
        } else if (u.role === 'teacher') {
            const profile = await Teacher.findOne({ userId: u._id });
            if (!profile) {
                console.log(`  -> FOUND Missing Profile: User ${u.email} (Teacher)`);
                console.log('  -> NEEDS_MANUAL_REVIEW: Cannot safely auto-create profile without teacher details.');
                usersNoProfile++;
            }
        }
    }
    if (usersNoProfile === 0) console.log('  -> No missing profiles found.');
    console.log('');

    console.log(`--- REPAIR COMPLETE (${APPLY_MODE ? 'APPLIED' : 'DRY RUN'}) ---`);
    process.exit(0);

  } catch (error) {
    console.error('Repair failed:', error);
    process.exit(1);
  }
}

runRepair();
