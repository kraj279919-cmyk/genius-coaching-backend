const fs = require('fs');

const API_URL = 'http://localhost:5000/api';

async function request(endpoint, method, body, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  
  const res = await fetch(`${API_URL}${endpoint}`, {
    method, headers, body: body ? JSON.stringify(body) : undefined
  });
  const data = await res.json();
  return { status: res.status, data };
}

async function runTests() {
  console.log('--- STARTING STUDENT MANAGEMENT TESTS ---');
  
  // 1. Admin Login
  let res = await request('/auth/login', 'POST', { identifier: '9304335662', password: 'director123' });
  if (res.status !== 200) {
    console.log('Admin login failed', res.data);
    process.exit(1);
  }
  const token = res.data.token;
  console.log('Admin logged in');

  // 2. Add Student
  res = await request('/students', 'POST', {
    name: 'Test Student',
    email: `test${Date.now()}@test.com`,
    phone: `98${Math.floor(10000000 + Math.random() * 90000000)}`,
    password: 'password123',
    studentId: `STU${Date.now()}`,
    class: '10th',
    section: 'A',
    parentPhone: '9999999999',
    address: 'Test Address'
  }, token);
  
  if (res.status !== 201) {
    console.log('Add Student Failed', res.data);
    process.exit(1);
  }
  const student = res.data;
  console.log('Add Student: PASS');

  // 3. Edit Student
  res = await request(`/students/${student._id}`, 'PUT', { name: 'Updated Student' }, token);
  if (res.status !== 200 || res.data.name !== 'Updated Student') {
    console.log('Edit Student Failed', res.data);
  } else {
    console.log('Edit Student: PASS');
  }

  // 4. Detail Student
  res = await request(`/students/${student._id}`, 'GET', null, token);
  if (res.status !== 200 || !res.data.name) {
    console.log('Detail Student Failed', res.data);
  } else {
    console.log('Detail Student: PASS');
  }

  // 5. Password Reset
  res = await request(`/users/${student.userId}/reset-password`, 'PATCH', { newPassword: 'newpassword123' }, token);
  if (res.status !== 200) {
    console.log('Password Reset Failed', res.data);
  } else {
    console.log('Password Reset: PASS');
  }

  // 6. Deactivate Student
  res = await request(`/students/${student._id}/deactivate`, 'PATCH', null, token);
  if (res.status !== 200) {
    console.log('Deactivate Student Failed', res.data);
  } else {
    console.log('Deactivate Student: PASS');
  }

  // 7. Class Promotion Preview
  res = await request('/students/promote-class/preview', 'POST', { fromClass: '10th' }, token);
  if (res.status !== 200) {
    console.log('Promotion Preview Failed', res.data);
  } else {
    console.log(`Promotion Preview: PASS (${res.data.count} active students)`);
  }

  // 8. Class Promotion Execute
  // We need an active student in 10th to promote. The one we just made is inactive.
  // We'll create a temporary active one.
  const tempRes = await request('/students', 'POST', {
    name: 'Temp Active',
    phone: `98${Math.floor(10000000 + Math.random() * 90000000)}`,
    password: 'password123',
    studentId: `STU${Date.now()}2`,
    class: '10th',
    section: 'A',
    parentPhone: '9999999999',
    address: 'Temp Address'
  }, token);

  res = await request('/students/promote-class/execute', 'POST', { fromClass: '10th', toClass: '11th', academicYear: '2026-2027' }, token);
  if (res.status !== 200) {
    console.log('Promotion Execute Failed', res.data);
  } else {
    console.log('Promotion Execute: PASS');
  }

  console.log('\nAll API tests completed!');
  process.exit(0);
}

runTests();
