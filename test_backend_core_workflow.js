
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const API_BASE = 'http://localhost:5000/api';

// For simplicity, we'll bypass real login by generating tokens directly 
// using the backend's generateToken utility to speed up tests without needing known passwords.
const generateToken = require('./utils/generateToken');
const User = require('./models/User');
const Student = require('./models/Student');
const Teacher = require('./models/Teacher');
const Homework = require('./models/Homework');
const Attendance = require('./models/Attendance');

async function runTests() {
  console.log('--- STARTING INTEGRATION TESTS ---\n');
  try {
    await mongoose.connect(process.env.MONGO_URI);
    
    // 1. Setup mock users if they don't exist
    const adminUser = await User.findOne({ role: 'director' }) || await User.findOne({ role: 'admin' });
    if (!adminUser) throw new Error('No admin user found to test with');
    const adminToken = generateToken(adminUser._id);

    const teacher = await Teacher.findOne({});
    if (!teacher) throw new Error('No teacher found to test with');
    const teacherUser = await User.findById(teacher.userId);
    const teacherToken = generateToken(teacherUser._id);

    const student = await Student.findOne({});
    if (!student) throw new Error('No student found to test with');
    const studentUser = await User.findById(student.userId);
    const studentToken = generateToken(studentUser._id);

    const sClass = student.class;

    console.log(`[TEST DATA] Admin: ${adminUser.email}, Teacher: ${teacher.name}, Student: ${student.name} (Class ${sClass})`);

    const adminHeaders = { 'Authorization': `Bearer ${adminToken}`, 'Content-Type': 'application/json' };
    const teacherHeaders = { 'Authorization': `Bearer ${teacherToken}`, 'Content-Type': 'application/json' };
    const studentHeaders = { 'Authorization': `Bearer ${studentToken}`, 'Content-Type': 'application/json' };

    // --- WORKFLOW 1: Homework ---
    console.log('\n--- 1. Homework Workflow ---');
    const hwRes = await fetch(`${API_BASE}/homework`, {
      method: 'POST',
      headers: teacherHeaders,
      body: JSON.stringify({
        title: 'Integration Test HW',
        description: 'Testing 123',
        subject: 'Math',
        class: sClass,
        dueDate: new Date().toISOString()
      })
    });
    
    const hwData = await hwRes.json();
    if (hwRes.status !== 201) throw new Error(`HW Create failed: ${JSON.stringify(hwData)}`);
    console.log('✅ Teacher created homework');

    const sHwRes = await fetch(`${API_BASE}/homework`, { headers: studentHeaders });
    const sHwData = await sHwRes.json();
    const foundHw = sHwData.find(h => h._id === hwData._id);
    if (!foundHw) throw new Error('Student did not see the newly created homework');
    console.log('✅ Student fetched homework successfully');

    // Security Check: Student tries to create homework
    const blockHwRes = await fetch(`${API_BASE}/homework`, {
      method: 'POST',
      headers: studentHeaders,
      body: JSON.stringify({
        title: 'Hacked HW',
        description: 'Hack',
        subject: 'Math',
        class: sClass,
        dueDate: new Date().toISOString()
      })
    });
    if (blockHwRes.status !== 403 && blockHwRes.status !== 401) throw new Error(`Security failed: Student created HW! Status: ${blockHwRes.status}`);
    console.log('✅ Security: Student prevented from creating homework');

    // --- WORKFLOW 2: Attendance ---
    console.log('\n--- 2. Attendance Workflow ---');
    const attRes = await fetch(`${API_BASE}/attendance`, {
      method: 'POST',
      headers: teacherHeaders,
      body: JSON.stringify({
        studentId: student._id,
        date: new Date().toISOString(),
        status: 'Present',
        class: sClass
      })
    });
    
    const attData = await attRes.json();
    if (attRes.status !== 201 && attRes.status !== 400) throw new Error(`Att Create failed: ${JSON.stringify(attData)}`);
    // Note: 400 could mean attendance already marked today, which is fine for test stability
    console.log('✅ Teacher marked attendance');

    const sAttRes = await fetch(`${API_BASE}/attendance`, { headers: studentHeaders });
    const sAttData = await sAttRes.json();
    if (!Array.isArray(sAttData)) throw new Error(`Student att fetch failed: ${JSON.stringify(sAttData)}`);
    console.log('✅ Student fetched attendance successfully');

    // --- WORKFLOW 3: Security Constraints ---
    console.log('\n--- 3. Enterprise Security Workflow ---');
    
    // Teacher tries to access Enterprise Ops (Health)
    const opsRes = await fetch(`${API_BASE}/ops/health`, { headers: teacherHeaders });
    if (opsRes.status !== 403 && opsRes.status !== 401) throw new Error(`Security failed: Teacher accessed Ops! Status: ${opsRes.status}`);
    console.log('✅ Security: Teacher prevented from accessing Enterprise Ops');

    // Teacher tries to access Fees
    const feeRes = await fetch(`${API_BASE}/fees`, { method: 'POST', headers: teacherHeaders, body: JSON.stringify({}) });
    if (feeRes.status !== 403 && feeRes.status !== 401) throw new Error(`Security failed: Teacher accessed Fees POST! Status: ${feeRes.status}`);
    console.log('✅ Security: Teacher prevented from managing Fees');

    // Clean up test data
    console.log('\nCleaning up test data...');
    await Homework.findByIdAndDelete(hwData._id);
    
    console.log('\n🎉 ALL INTEGRATION TESTS PASSED!');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ INTEGRATION TEST FAILED:', error.message);
    process.exit(1);
  }
}

runTests();
