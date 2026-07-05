const mongoose = require('mongoose');
require('dotenv').config({ path: 'C:/Users/RAJAN KUMAR RAJ/OneDrive/Desktop/genius 2/backend/.env' });

const API_BASE = 'http://localhost:5000/api';

async function runTests() {
  let studentToken = '';
  let studentId = '';

  try {
    console.log('--- STARTING STUDENT WORKFLOW SYNC TESTS ---');

    // 1. Connect to DB to ensure we can fetch a valid student or insert one
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB');

    // Try logging in as a student (find one from DB)
    const Student = require('C:/Users/RAJAN KUMAR RAJ/OneDrive/Desktop/genius 2/backend/models/Student.js');
    const User = require('C:/Users/RAJAN KUMAR RAJ/OneDrive/Desktop/genius 2/backend/models/User.js');
    
    let studentDoc = await Student.findOne({ userId: { $exists: true } });
    if (!studentDoc) {
        console.log('No student profile found with userId. Exiting.');
        process.exit(1);
    }
    let studentUser = await User.findById(studentDoc.userId);
    if (!studentUser) {
        console.log('User not found for studentDoc. Exiting.');
        process.exit(1);
    }
    console.log('Found Student User:', studentUser.email || studentUser.phone, 'StudentID:', studentDoc._id);
    
    // Generate Token Directly
    try {
        const generateToken = require('C:/Users/RAJAN KUMAR RAJ/OneDrive/Desktop/genius 2/backend/utils/generateToken.js');
        studentToken = generateToken(studentUser._id, studentUser.role);
        studentId = studentDoc._id; // Use Student collection ID for endpoints
        console.log('Student Token Generated: SUCCESS');
    } catch (e) {
        console.log('Token generation failed.');
        console.error(e.message);
        process.exit(1);
    }

    const headers = { Authorization: `Bearer ${studentToken}`, 'Content-Type': 'application/json' };

    // Helper to fetch
    const fetchApi = async (url) => {
        const res = await fetch(url, { headers });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Fetch failed');
        return data;
    }

    // 2. Fetch Dashboard
    try {
        const data = await fetchApi(`${API_BASE}/dashboard/student`);
        console.log('Dashboard fetch: SUCCESS', Object.keys(data));
    } catch (e) {
        console.log('Dashboard fetch: FAILED', e.message);
    }

    // 3. Fetch Homework
    try {
        const data = await fetchApi(`${API_BASE}/homework`);
        console.log('Homework fetch: SUCCESS, count:', data.length);
    } catch (e) {
        console.log('Homework fetch: FAILED', e.message);
    }

    // 4. Fetch Materials
    try {
        const data = await fetchApi(`${API_BASE}/materials`);
        console.log('Materials fetch: SUCCESS, count:', data.length);
    } catch (e) {
        console.log('Materials fetch: FAILED', e.message);
    }

    // 5. Fetch Attendance
    try {
        const data = await fetchApi(`${API_BASE}/attendance/student/${studentId}`);
        console.log('Attendance fetch: SUCCESS, count:', data.length);
    } catch (e) {
        console.log('Attendance fetch: FAILED', e.message);
    }

    // 6. Fetch Results
    try {
        const data = await fetchApi(`${API_BASE}/results/student/${studentId}`);
        console.log('Results fetch: SUCCESS, count:', data.length);
    } catch (e) {
        console.log('Results fetch: FAILED', e.message);
    }

    // 7. Fetch Fees
    try {
        const data = await fetchApi(`${API_BASE}/fees/student/${studentId}`);
        console.log('Fees fetch: SUCCESS, count:', data.length);
    } catch (e) {
        console.log('Fees fetch: FAILED', e.message);
    }

    // 8. Fetch Notices
    try {
        const data = await fetchApi(`${API_BASE}/notices`);
        console.log('Notices fetch: SUCCESS, count:', data.length);
    } catch (e) {
        console.log('Notices fetch: FAILED', e.message);
    }

    // 9. Fetch Gallery
    try {
        const data = await fetchApi(`${API_BASE}/gallery`);
        console.log('Gallery fetch: SUCCESS, count:', data.length);
    } catch (e) {
        console.log('Gallery fetch: FAILED', e.message);
    }

    console.log('--- ATTEMPTING FORBIDDEN ACTIONS ---');
    // 10. Attempt forbidden actions (Create Homework)
    try {
        const hwRes = await fetch(`${API_BASE}/homework`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ title: 'Hacked', subject: 'Math', class: 'Class X', dueDate: '2025-01-01' })
        });
        if (!hwRes.ok) throw new Error(`Got ${hwRes.status}`);
        console.log('Forbidden POST Homework: FAILED (Expected 403, got success)');
    } catch (e) {
        console.log(`Forbidden POST Homework: SUCCESS (${e.message})`);
    }

    console.log('--- TESTS COMPLETE ---');

  } catch (error) {
    console.error('Test script crashed:', error);
  } finally {
    mongoose.disconnect();
  }
}

runTests();
