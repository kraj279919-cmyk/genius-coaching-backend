const axios = require('axios');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const fs = require('fs');

dotenv.config();

const API_URL = 'http://localhost:5000/api';

const runTests = async () => {
  let output = '# Phase 1: Authentication API Test Results\n\n';
  const log = (msg) => {
    console.log(msg);
    output += msg + '\n';
  };

  try {
    // 1. Setup Test Passwords
    await mongoose.connect(process.env.MONGO_URI);
    const User = require('./models/User');
    
    const hashPwd = await bcrypt.hash('Test@123', 10);
    await User.updateOne({ email: 'geniuscoachinginstitute1@gmail.com' }, { password: hashPwd });
    await User.updateOne({ email: 'teacher@test.com' }, { password: hashPwd });
    await User.updateOne({ email: 'rajgupta@gmail.com' }, { password: hashPwd });
    
    log('✅ Test setup: Passwords updated successfully.\n');

    let adminToken = '';
    let teacherToken = '';
    let studentToken = '';

    // --- TEST 1: Valid Admin Login ---
    try {
      const res = await axios.post(`${API_URL}/auth/login`, { identifier: 'geniuscoachinginstitute1@gmail.com', password: 'Test@123' });
      if (res.data.token && res.data.role === 'admin') {
        adminToken = res.data.token;
        log('▶ Test 1: Valid admin login\nInput: geniuscoachinginstitute1@gmail.com\nExpected: Token & admin role\nActual: Success\nStatus: PASS\n');
      } else {
        log('▶ Test 1: Valid admin login\nStatus: FAIL\n');
      }
    } catch (err) {
      log(`▶ Test 1: Valid admin login\nStatus: FAIL (${err.response?.data?.message || err.message})\n`);
    }

    // --- TEST 2: Valid Teacher Login ---
    try {
      const res = await axios.post(`${API_URL}/auth/login`, { identifier: 'teacher@test.com', password: 'Test@123' });
      if (res.data.token && res.data.role === 'teacher') {
        teacherToken = res.data.token;
        log('▶ Test 2: Valid teacher login\nInput: teacher@test.com\nExpected: Token & teacher role\nActual: Success\nStatus: PASS\n');
      } else {
        log('▶ Test 2: Valid teacher login\nStatus: FAIL\n');
      }
    } catch (err) {
      log(`▶ Test 2: Valid teacher login\nStatus: FAIL (${err.response?.data?.message || err.message})\n`);
    }

    // --- TEST 3: Valid Student Login ---
    try {
      const res = await axios.post(`${API_URL}/auth/login`, { identifier: 'rajgupta@gmail.com', password: 'Test@123' });
      if (res.data.token && res.data.role === 'student') {
        studentToken = res.data.token;
        log('▶ Test 3: Valid student login\nInput: rajgupta@gmail.com\nExpected: Token & student role\nActual: Success\nStatus: PASS\n');
      } else {
        log('▶ Test 3: Valid student login\nStatus: FAIL\n');
      }
    } catch (err) {
      log(`▶ Test 3: Valid student login\nStatus: FAIL (${err.response?.data?.message || err.message})\n`);
    }

    // --- TEST 4: Wrong Password ---
    try {
      await axios.post(`${API_URL}/auth/login`, { identifier: 'rajgupta@gmail.com', password: 'WrongPassword!' });
      log('▶ Test 4: Wrong password\nInput: rajgupta@gmail.com / WrongPassword!\nExpected: 401 Unauthorized\nActual: 200 OK\nStatus: FAIL\n');
    } catch (err) {
      if (err.response?.status === 401) {
        log('▶ Test 4: Wrong password\nInput: rajgupta@gmail.com / WrongPassword!\nExpected: 401 Unauthorized\nActual: 401 Unauthorized\nStatus: PASS\n');
      } else {
        log(`▶ Test 4: Wrong password\nStatus: FAIL (${err.response?.status} - ${err.response?.data?.message})\n`);
      }
    }

    // --- TEST 5: Unknown User ---
    try {
      await axios.post(`${API_URL}/auth/login`, { identifier: 'nobody@nowhere.com', password: 'Test@123' });
      log('▶ Test 5: Unknown user\nInput: nobody@nowhere.com\nExpected: 401 Unauthorized\nActual: 200 OK\nStatus: FAIL\n');
    } catch (err) {
      if (err.response?.status === 401) {
        log('▶ Test 5: Unknown user\nInput: nobody@nowhere.com\nExpected: 401 Unauthorized\nActual: 401 Unauthorized\nStatus: PASS\n');
      } else {
        log(`▶ Test 5: Unknown user\nStatus: FAIL (${err.response?.status} - ${err.response?.data?.message})\n`);
      }
    }

    // --- TEST 6: Missing Token ---
    try {
      await axios.get(`${API_URL}/dashboard/admin`);
      log('▶ Test 6: Missing token\nInput: GET /dashboard/admin (no token)\nExpected: 401 Unauthorized\nActual: 200 OK\nStatus: FAIL\n');
    } catch (err) {
      if (err.response?.status === 401) {
        log('▶ Test 6: Missing token\nInput: GET /dashboard/admin (no token)\nExpected: 401 Unauthorized\nActual: 401 Unauthorized\nStatus: PASS\n');
      } else {
        log(`▶ Test 6: Missing token\nStatus: FAIL (${err.response?.status} - ${err.response?.data?.message})\n`);
      }
    }

    // --- TEST 7: Malformed Token ---
    try {
      await axios.get(`${API_URL}/dashboard/admin`, { headers: { Authorization: 'Bearer thisisnotarealtoken' } });
      log('▶ Test 7: Malformed token\nInput: GET /dashboard/admin (bad token)\nExpected: 401 Unauthorized\nActual: 200 OK\nStatus: FAIL\n');
    } catch (err) {
      if (err.response?.status === 401) {
        log('▶ Test 7: Malformed token\nInput: GET /dashboard/admin (bad token)\nExpected: 401 Unauthorized\nActual: 401 Unauthorized\nStatus: PASS\n');
      } else {
        log(`▶ Test 7: Malformed token\nStatus: FAIL (${err.response?.status} - ${err.response?.data?.message})\n`);
      }
    }

    // --- TEST 8: Expired Token ---
    // Create an explicitly expired token using jsonwebtoken
    const jwt = require('jsonwebtoken');
    const expiredToken = jwt.sign({ id: 'dummy', role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '-1s' });
    try {
      await axios.get(`${API_URL}/dashboard/admin`, { headers: { Authorization: `Bearer ${expiredToken}` } });
      log('▶ Test 8: Expired token\nInput: GET /dashboard/admin (expired token)\nExpected: 401 Unauthorized\nActual: 200 OK\nStatus: FAIL\n');
    } catch (err) {
      if (err.response?.status === 401) {
        log('▶ Test 8: Expired token\nInput: GET /dashboard/admin (expired token)\nExpected: 401 Unauthorized\nActual: 401 Unauthorized\nStatus: PASS\n');
      } else {
        log(`▶ Test 8: Expired token\nStatus: FAIL (${err.response?.status} - ${err.response?.data?.message})\n`);
      }
    }

    // --- TEST 9: Wrong-role protected route ---
    try {
      await axios.get(`${API_URL}/dashboard/admin`, { headers: { Authorization: `Bearer ${studentToken}` } });
      log('▶ Test 9: Wrong-role protected route\nInput: GET /dashboard/admin (using student token)\nExpected: 403 Forbidden\nActual: 200 OK\nStatus: FAIL\n');
    } catch (err) {
      if (err.response?.status === 403) {
        log('▶ Test 9: Wrong-role protected route\nInput: GET /dashboard/admin (using student token)\nExpected: 403 Forbidden\nActual: 403 Forbidden\nStatus: PASS\n');
      } else {
        log(`▶ Test 9: Wrong-role protected route\nStatus: FAIL (${err.response?.status} - ${err.response?.data?.message})\n`);
      }
    }

    fs.writeFileSync('PHASE_1_TEST_RESULTS.md', output);
    console.log('Test results saved to PHASE_1_TEST_RESULTS.md');
    
  } catch (error) {
    console.error('Fatal Test Error:', error.message);
  } finally {
    mongoose.connection.close();
    process.exit(0);
  }
};

runTests();
