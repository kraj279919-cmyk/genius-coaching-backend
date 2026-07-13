const axios = require('axios');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: './.env' });
const API_URL = 'http://localhost:5000/api';

async function runTests() {
  console.log('--- STARTING API REGRESSION TESTS ---');
  let adminToken, teacherToken, studentToken;

  try {
    // 1. AUTH TESTS
    console.log('Testing Admin Login...');
    const adminRes = await axios.post(`${API_URL}/auth/login`, { username: 'admin123', password: 'password123' });
    adminToken = adminRes.data.token;
    console.log('Admin Login: PASS');

    console.log('Testing Teacher Login...');
    const teacherRes = await axios.post(`${API_URL}/auth/login`, { username: 'teacher1', password: 'password123' });
    teacherToken = teacherRes.data.token;
    console.log('Teacher Login: PASS');

    console.log('Testing Student Login...');
    const studentRes = await axios.post(`${API_URL}/auth/login`, { username: '1001', password: 'password123' });
    studentToken = studentRes.data.token;
    console.log('Student Login: PASS');

    console.log('Testing Invalid Login...');
    try {
      await axios.post(`${API_URL}/auth/login`, { username: 'wrong', password: 'wrong' });
      console.log('Invalid Login: FAIL (Expected 401)');
    } catch (e) {
      if (e.response.status === 401) console.log('Invalid Login: PASS');
      else console.log('Invalid Login: FAIL');
    }

    // 2. HELPDESK TESTS
    let ticketId;
    console.log('Testing Student Create Ticket...');
    const tCreate = await axios.post(`${API_URL}/tickets`, { subject: 'Test', message: 'Test Msg', category: 'General' }, { headers: { Authorization: `Bearer ${studentToken}` } });
    ticketId = tCreate.data._id;
    console.log('Student Create Ticket: PASS');

    console.log('Testing Student Cannot List All Tickets...');
    try {
      await axios.get(`${API_URL}/tickets/all`, { headers: { Authorization: `Bearer ${studentToken}` } });
      console.log('Student List All Tickets: FAIL (Expected 403)');
    } catch (e) {
      if (e.response.status === 403) console.log('Student List All Tickets: PASS (Blocked)');
      else console.log(`Student List All Tickets: FAIL (${e.response.status})`);
    }

    console.log('Testing Admin Update Ticket...');
    const tUpdate = await axios.put(`${API_URL}/tickets/${ticketId}`, { status: 'Resolved', reply: 'Done' }, { headers: { Authorization: `Bearer ${adminToken}` } });
    if (tUpdate.data.status === 'Resolved') console.log('Admin Update Ticket: PASS');
    else console.log('Admin Update Ticket: FAIL');

    // 3. NOTIFICATIONS
    console.log('Testing Admin Create Notification...');
    const nCreate = await axios.post(`${API_URL}/notifications`, { title: 'Test Notif', body: 'Test Body', targetRole: 'student' }, { headers: { Authorization: `Bearer ${adminToken}` } });
    console.log('Admin Create Notification: PASS');

    console.log('Testing Student Retrieve Notifications...');
    const nGet = await axios.get(`${API_URL}/notifications`, { headers: { Authorization: `Bearer ${studentToken}` } });
    if (Array.isArray(nGet.data)) console.log('Student Retrieve Notifications: PASS');
    else console.log('Student Retrieve Notifications: FAIL');

    // 4. TIMETABLE
    console.log('Testing Admin Create Timetable...');
    const ttCreate = await axios.post(`${API_URL}/timetable`, { class: '10', day: 'Monday', subject: 'Math', teacher: 'John', startTime: '10:00' }, { headers: { Authorization: `Bearer ${adminToken}` } });
    console.log('Admin Create Timetable: PASS');

    console.log('Testing Teacher Cannot Create Timetable...');
    try {
      await axios.post(`${API_URL}/timetable`, { class: '10', day: 'Monday', subject: 'Math', teacher: 'John', startTime: '10:00' }, { headers: { Authorization: `Bearer ${teacherToken}` } });
      console.log('Teacher Create Timetable: FAIL (Expected 403)');
    } catch (e) {
      if (e.response.status === 403) console.log('Teacher Create Timetable: PASS (Blocked)');
      else console.log(`Teacher Create Timetable: FAIL (${e.response.status})`);
    }

    // 5. CORE REGRESSION
    console.log('Testing Attendance Class Filter...');
    const attGet = await axios.get(`${API_URL}/attendance/class/10?date=2026-07-13`, { headers: { Authorization: `Bearer ${adminToken}` } });
    if (Array.isArray(attGet.data.data) || Array.isArray(attGet.data)) console.log('Attendance Class Filter: PASS');
    else console.log('Attendance Class Filter: FAIL');

    console.log('Testing Homework CRUD...');
    const hwGet = await axios.get(`${API_URL}/homework`, { headers: { Authorization: `Bearer ${teacherToken}` } });
    if (Array.isArray(hwGet.data.data) || Array.isArray(hwGet.data)) console.log('Homework CRUD Read: PASS');
    else console.log('Homework CRUD Read: FAIL');

  } catch (error) {
    console.error('Test Failed:', error.response ? error.response.data : error.message);
  }
}
runTests();
