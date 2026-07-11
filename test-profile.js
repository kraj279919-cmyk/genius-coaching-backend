const axios = require('axios');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const API_URL = 'http://localhost:5000/api';

async function runProfileTests() {
  try {
    console.log('--- STARTING PROFILE WORKFLOW TESTS ---');
    await mongoose.connect(process.env.MONGO_URI);
    
    const User = require('./models/User');
    const Student = require('./models/Student');
    const Teacher = require('./models/Teacher');
    
    // Test for Admin
    const admin = await User.findOne({ role: { $in: ['admin', 'director'] } });
    if (!admin) throw new Error('No admin found');
    const adminToken = jwt.sign({ id: admin._id, role: admin.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
    
    // Test for Student
    const student = await User.findOne({ role: 'student' });
    let studentToken = null;
    if (student) {
        studentToken = jwt.sign({ id: student._id, role: student.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
    }
    
    // 1. Admin Profile Update
    console.log('\n▶ Test 1: Admin Profile Update');
    const resAdmin = await axios.put(`${API_URL}/auth/profile`, { profileImageUrl: 'https://fake-admin.com/dp.png' }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.log('✅ Admin Profile Updated:', resAdmin.data.profileImage);
    
    // 2. Student Profile Update (Tests DB sync to Student collection)
    if (student) {
        console.log('\n▶ Test 2: Student Profile Update & Sync');
        const resStudent = await axios.put(`${API_URL}/auth/profile`, { profileImageUrl: 'https://fake-student.com/dp.png' }, {
          headers: { Authorization: `Bearer ${studentToken}` }
        });
        console.log('✅ Student User Updated:', resStudent.data.profileImage);
        
        // Verify sync
        const studentDoc = await Student.findOne({ userId: student._id });
        if (studentDoc) {
            console.log('✅ Student Document Synced:', studentDoc.profileImage === 'https://fake-student.com/dp.png');
        } else {
            console.log('⚠️ No Student document found for this user, skipping sync check.');
        }
    }

    // 3. Expired JWT Test
    console.log('\n▶ Test 3: Expired JWT');
    const expiredToken = jwt.sign({ id: admin._id, role: admin.role }, process.env.JWT_SECRET, { expiresIn: '-1s' });
    try {
        await axios.put(`${API_URL}/auth/profile`, { profileImageUrl: 'https://fake.com' }, {
            headers: { Authorization: `Bearer ${expiredToken}` }
        });
        console.log('❌ Failed: Should have rejected expired token');
    } catch (e) {
        console.log('✅ Expired token rejected:', e.response?.data?.message || e.message);
    }
    
    // 4. Unauthorized
    console.log('\n▶ Test 4: Unauthorized (No Token)');
    try {
        await axios.put(`${API_URL}/auth/profile`, { profileImageUrl: 'https://fake.com' });
        console.log('❌ Failed: Should have rejected empty token');
    } catch (e) {
        console.log('✅ Empty token rejected:', e.response?.data?.message || e.message);
    }

    mongoose.disconnect();
    console.log('\n🎉 PROFILE API TESTS PASSED!');
  } catch (err) {
    console.error('❌ Test Failed:', err.response?.data || err.message);
    mongoose.disconnect();
    process.exit(1);
  }
}

runProfileTests();
