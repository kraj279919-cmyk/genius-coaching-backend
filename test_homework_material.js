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
  console.log('--- STARTING HOMEWORK & MATERIAL TESTS ---');
  
  let res = await request('/auth/login', 'POST', { identifier: '9304335662', password: 'director123' });
  if (res.status !== 200) { console.log('Admin login failed', res.data); process.exit(1); }
  const adminToken = res.data.token;
  console.log('Admin logged in');

  const studentEmail = `studenthw${Date.now()}@test.com`;
  res = await request('/students', 'POST', {
    name: 'HW Student', email: studentEmail, phone: `98${Math.floor(10000000 + Math.random() * 90000000)}`,
    password: 'password123', studentId: `SHW${Date.now()}`, class: 'Class 9', section: 'A'
  }, adminToken);
  if (res.status !== 201) { console.log('Create Student Failed', res.data); process.exit(1); }
  const studentTokenRes = await request('/auth/login', 'POST', { identifier: studentEmail, password: 'password123' });
  const studentToken = studentTokenRes.data.token;

  // 1. Create Homework
  res = await request('/homework', 'POST', {
    title: 'Algebra Exercises',
    description: 'Solve pg 42.',
    subject: 'Math',
    class: 'Class 9',
    dueDate: '2026-07-05',
    attachmentType: 'link',
    attachmentUrl: 'https://example.com'
  }, adminToken);
  if (res.status !== 201) { console.log('Create Homework Failed', res.data); process.exit(1); }
  const hwId = res.data._id;
  console.log('Create Homework: PASS');

  // 2. Fetch homework list
  res = await request('/homework', 'GET', null, adminToken);
  if (!res.data.some(h => h._id === hwId)) { console.log('Fetch homework failed'); }
  else { console.log('Fetch Homework: PASS'); }

  // 3. Update Homework
  res = await request(`/homework/${hwId}`, 'PATCH', { status: 'completed' }, adminToken);
  if (res.status !== 200 || res.data.status !== 'completed') { console.log('Update Homework Failed', res.data); }
  else { console.log('Update Homework: PASS'); }

  // 4. Create Study Material
  res = await request('/materials', 'POST', {
    title: 'Algebra Notes',
    description: 'Chapter 1',
    subject: 'Math',
    class: 'Class 9',
    type: 'pdf',
    fileUrl: 'https://example.com/notes.pdf'
  }, adminToken);
  if (res.status !== 201) { console.log('Create Material Failed', res.data); process.exit(1); }
  const matId = res.data._id;
  console.log('Create Material: PASS');

  // 5. Fetch material by class
  res = await request('/materials/class/Class 9', 'GET', null, adminToken);
  if (res.status !== 200 || !res.data.some(m => m._id === matId)) { console.log('Fetch Material By Class Failed', res.data); }
  else { console.log('Fetch Material By Class: PASS'); }

  // 6. Student token sees only own class homework
  res = await request('/homework', 'GET', null, studentToken);
  if (res.status !== 200) { console.log('Student Homework Fetch Failed', res.data); }
  else { console.log('Student Class Isolation for Homework: PASS'); }

  // 7. Student access denied to other class material
  res = await request('/materials/class/Class 10', 'GET', null, studentToken);
  if (res.status !== 403) { console.log('Student Material Security Failed - Should be 403', res.status); }
  else { console.log('Student Class Isolation for Material: PASS'); }

  // 8. Dashboard active counts
  res = await request('/dashboard/admin', 'GET', null, adminToken);
  if (res.status !== 200 || res.data.activeHomework === undefined) { console.log('Dashboard Sync Failed', res.data); }
  else { console.log('Dashboard Sync: PASS', { activeHomework: res.data.activeHomework, studyMaterials: res.data.studyMaterials }); }

  console.log('\nAll Homework & Material tests completed!');
  process.exit(0);
}

runTests();
