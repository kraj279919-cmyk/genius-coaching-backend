const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const { normalizeClassName } = require('../utils/classNormalizer');

// Models
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const Homework = require('../models/Homework');
const StudyMaterial = require('../models/StudyMaterial');
const Notice = require('../models/Notice');
const Result = require('../models/Result');
const Attendance = require('../models/Attendance');

async function dryRunMigration() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB for Dry Run');

    let output = '# Class Data Migration Dry Run Report\n\n';
    
    // 1. Students
    console.log('Checking Students...');
    const students = await Student.find().lean();
    let studentChanges = [];
    students.forEach(s => {
      if (s.class) {
        const norm = normalizeClassName(s.class);
        if (norm !== s.class) {
          studentChanges.push({ id: s._id, name: s.name, old: s.class, new: norm });
        }
      }
    });
    output += `## Students\nTotal: ${students.length}\nNeeds Update: ${studentChanges.length}\n`;
    studentChanges.slice(0, 10).forEach(c => output += `- ID: ${c.id} | Name: ${c.name} | Old: "${c.old}" -> New: "${c.new}"\n`);
    if (studentChanges.length > 10) output += `- ... and ${studentChanges.length - 10} more.\n`;
    output += '\n';

    // 2. Teachers (assignedClasses)
    console.log('Checking Teachers...');
    const teachers = await Teacher.find().lean();
    let teacherChanges = [];
    teachers.forEach(t => {
      if (t.assignedClasses && t.assignedClasses.length > 0) {
        const normArr = t.assignedClasses.map(c => normalizeClassName(c)).filter(Boolean);
        if (JSON.stringify(t.assignedClasses) !== JSON.stringify(normArr)) {
          teacherChanges.push({ id: t._id, name: t.name, old: t.assignedClasses, new: normArr });
        }
      }
    });
    output += `## Teachers (assignedClasses)\nTotal: ${teachers.length}\nNeeds Update: ${teacherChanges.length}\n`;
    teacherChanges.slice(0, 10).forEach(c => output += `- ID: ${c.id} | Name: ${c.name} | Old: [${c.old}] -> New: [${c.new}]\n`);
    if (teacherChanges.length > 10) output += `- ... and ${teacherChanges.length - 10} more.\n`;
    output += '\n';

    // 3. Homework
    console.log('Checking Homework...');
    const homeworks = await Homework.find().lean();
    let hwChanges = [];
    homeworks.forEach(h => {
      if (h.class) {
        const norm = normalizeClassName(h.class);
        if (norm !== h.class) {
          hwChanges.push({ id: h._id, title: h.title, old: h.class, new: norm });
        }
      }
    });
    output += `## Homework\nTotal: ${homeworks.length}\nNeeds Update: ${hwChanges.length}\n`;
    hwChanges.slice(0, 10).forEach(c => output += `- ID: ${c.id} | Title: ${c.title} | Old: "${c.old}" -> New: "${c.new}"\n`);
    if (hwChanges.length > 10) output += `- ... and ${hwChanges.length - 10} more.\n`;
    output += '\n';

    // 4. StudyMaterial
    console.log('Checking Study Materials...');
    const materials = await StudyMaterial.find().lean();
    let matChanges = [];
    materials.forEach(m => {
      if (m.class) {
        const norm = normalizeClassName(m.class);
        if (norm !== m.class) {
          matChanges.push({ id: m._id, title: m.title, old: m.class, new: norm });
        }
      }
    });
    output += `## Study Materials\nTotal: ${materials.length}\nNeeds Update: ${matChanges.length}\n`;
    matChanges.slice(0, 10).forEach(c => output += `- ID: ${c.id} | Title: ${c.title} | Old: "${c.old}" -> New: "${c.new}"\n`);
    if (matChanges.length > 10) output += `- ... and ${matChanges.length - 10} more.\n`;
    output += '\n';

    // 5. Notice
    console.log('Checking Notices...');
    const notices = await Notice.find().lean();
    let noticeChanges = [];
    notices.forEach(n => {
      if (n.targetAudience === 'class' && n.targetClass) {
        const norm = normalizeClassName(n.targetClass);
        if (norm !== n.targetClass) {
          noticeChanges.push({ id: n._id, title: n.title, old: n.targetClass, new: norm });
        }
      }
    });
    output += `## Notices (targetClass)\nTotal: ${notices.length}\nNeeds Update: ${noticeChanges.length}\n`;
    noticeChanges.slice(0, 10).forEach(c => output += `- ID: ${c.id} | Title: ${c.title} | Old: "${c.old}" -> New: "${c.new}"\n`);
    if (noticeChanges.length > 10) output += `- ... and ${noticeChanges.length - 10} more.\n`;
    output += '\n';

    // 6. Result
    console.log('Checking Results...');
    const results = await Result.find().lean();
    let resChanges = [];
    results.forEach(r => {
      if (r.class) {
        const norm = normalizeClassName(r.class);
        if (norm !== r.class) {
          resChanges.push({ id: r._id, exam: r.examName, old: r.class, new: norm });
        }
      }
    });
    output += `## Results\nTotal: ${results.length}\nNeeds Update: ${resChanges.length}\n`;
    resChanges.slice(0, 10).forEach(c => output += `- ID: ${c.id} | Exam: ${c.exam} | Old: "${c.old}" -> New: "${c.new}"\n`);
    if (resChanges.length > 10) output += `- ... and ${resChanges.length - 10} more.\n`;
    output += '\n';

    // 7. Attendance
    console.log('Checking Attendance...');
    const attendance = await Attendance.find().lean();
    let attChanges = [];
    attendance.forEach(a => {
      if (a.class) {
        const norm = normalizeClassName(a.class);
        if (norm !== a.class) {
          attChanges.push({ id: a._id, date: a.date, old: a.class, new: norm });
        }
      }
    });
    output += `## Attendance\nTotal: ${attendance.length}\nNeeds Update: ${attChanges.length}\n`;
    attChanges.slice(0, 10).forEach(c => output += `- ID: ${c.id} | Date: ${c.date} | Old: "${c.old}" -> New: "${c.new}"\n`);
    if (attChanges.length > 10) output += `- ... and ${attChanges.length - 10} more.\n`;
    output += '\n';

    const outPath = path.join(__dirname, '../../CLASS_DATA_MIGRATION_DRY_RUN.md');
    fs.writeFileSync(outPath, output);
    console.log(`Dry run complete. Report saved to ${outPath}`);

  } catch (err) {
    console.error('Error in dry run migration:', err);
  } finally {
    mongoose.connection.close();
    process.exit(0);
  }
}

dryRunMigration();
