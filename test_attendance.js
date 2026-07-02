const fs = require('fs');
const API_URL = 'http://localhost:5000/api';

async function request(endpoint, method, body, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  
  const res = await fetch(`${API_URL}${endpoint}`, {
    method, headers, body: body ? JSON.stringify(body) : undefined
  });
  let data;
  try { data = await res.json(); } catch(e) { data = await res.text(); }
  return { status: res.status, data };
}

async function runTests() {
  console.log('--- STARTING ATTENDANCE MANAGEMENT TESTS ---');
  
  // 1. Admin Login
  let res = await request('/auth/login', 'POST', { identifier: '9304335662', password: 'director123' });
  if (res.status !== 200) { console.log('Admin login failed', res.data); process.exit(1); }
  const adminToken = res.data.token;
  console.log('Admin logged in');

  // Create test student and teacher
  const studentEmail = `studentatt${Date.now()}@test.com`;
  res = await request('/students', 'POST', {
    name: 'Att Student', email: studentEmail, phone: `98${Math.floor(10000000 + Math.random() * 90000000)}`,
    password: 'password123', studentId: `S${Date.now()}`, class: 'Class 9', section: 'A'
  }, adminToken);
  if (res.status !== 201) { console.log('Create Student Failed', res.data); process.exit(1); }
  const studentId = res.data._id;
  const studentTokenRes = await request('/auth/login', 'POST', { identifier: studentEmail, password: 'password123' });
  const studentToken = studentTokenRes.data.token;

  const teacherEmail = `teacheratt${Date.now()}@test.com`;
  res = await request('/teachers', 'POST', {
    name: 'Att Teacher', email: teacherEmail, phone: `98${Math.floor(10000000 + Math.random() * 90000000)}`,
    password: 'password123', teacherId: `TCH${Date.now()}`, subject: 'Mathematics'
  }, adminToken);
  if (res.status !== 201) { console.log('Create Teacher Failed', res.data); process.exit(1); }
  const teacherTokenRes = await request('/auth/login', 'POST', { identifier: teacherEmail, password: 'password123' });
  const teacherToken = teacherTokenRes.data.token;

  // 3. Mark attendance for test class/date
  const today = new Date().toISOString();
  res = await request('/attendance', 'POST', {
    studentId,
    date: today,
    class: 'Class 9',
    section: 'A',
    status: 'present'
  }, adminToken);
  if (res.status !== 201) { console.log('Create Attendance Failed', res.data); process.exit(1); }
  const attId = res.data._id;
  console.log('Mark Attendance Record: PASS');

  // 4. Fetch attendance by class/date
  res = await request(`/attendance/class/Class 9?date=${today}`, 'GET', null, adminToken);
  if (!res.data.some(f => f._id === attId)) { console.log('Attendance class fetch failed'); }
  else { console.log('Fetch By Class/Date: PASS'); }

  // 5. Update one record
  res = await request(`/attendance/${attId}`, 'PATCH', { status: 'absent', remarks: 'Sick' }, adminToken);
  if (res.status !== 200 || res.data.status !== 'absent') { console.log('Update Attendance Failed', res.data); }
  else { console.log('Update Attendance Status: PASS'); }

  // 6. Student token can view own attendance
  res = await request('/attendance', 'GET', null, studentToken);
  if (res.status !== 200 || !res.data.some(f => f._id === attId)) { console.log('Student View Own Attendance Failed', res.data); }
  else { console.log('Student View Own Attendance: PASS'); }

  // 7. Student token cannot view other student's attendance
  // By class route is protected from students
  res = await request(`/attendance/class/Class 9`, 'GET', null, studentToken);
  if (res.status === 200) { console.log('Student Read Class Attendance Should Fail'); }
  else { console.log('Student Read Class Attendance Blocked: PASS'); }

  // 8. Teacher can access allowed attendance route
  res = await request(`/attendance/class/Class 9`, 'GET', null, teacherToken);
  if (res.status !== 200) { console.log('Teacher fetch attendance failed'); }
  else { console.log('Teacher View Class Attendance: PASS'); }

  // 9. Dashboard attendance summary returns clean data
  res = await request('/attendance/summary', 'GET', null, adminToken);
  if (res.status !== 200 || res.data.total === undefined) { console.log('Attendance Summary Failed', res.data); }
  else { console.log('Attendance Summary Check: PASS', res.data); }

  console.log('\nAll Attendance Sync tests completed!');
  process.exit(0);
}

runTests();
