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
  console.log('--- STARTING TEACHER MANAGEMENT TESTS ---');
  
  // 1. Admin Login
  let res = await request('/auth/login', 'POST', { identifier: '9304335662', password: 'director123' });
  if (res.status !== 200) {
    console.log('Admin login failed', res.data);
    process.exit(1);
  }
  const token = res.data.token;
  console.log('Admin logged in');

  const teacherPhone = `98${Math.floor(10000000 + Math.random() * 90000000)}`;
  const teacherEmail = `teacher${Date.now()}@test.com`;
  const teacherId = `TCH${Date.now()}`;

  // 2. Add Teacher
  res = await request('/teachers', 'POST', {
    name: 'Test Teacher',
    email: teacherEmail,
    phone: teacherPhone,
    password: 'password123',
    teacherId,
    subject: 'Mathematics',
    qualification: 'M.Sc.',
    address: 'Test Address',
    experience: '5 years'
  }, token);
  
  if (res.status !== 201) {
    console.log('Add Teacher Failed', res.data);
    process.exit(1);
  }
  const teacher = res.data;
  console.log('Add Teacher: PASS');

  // 3. Edit Teacher
  res = await request(`/teachers/${teacher._id}`, 'PUT', { name: 'Updated Teacher', experience: '6 years' }, token);
  if (res.status !== 200 || res.data.name !== 'Updated Teacher') {
    console.log('Edit Teacher Failed', res.data);
  } else {
    console.log('Edit Teacher: PASS');
  }

  // 4. Detail Teacher
  res = await request(`/teachers/${teacher._id}`, 'GET', null, token);
  if (res.status !== 200 || !res.data.name) {
    console.log('Detail Teacher Failed', res.data);
  } else {
    console.log('Detail Teacher: PASS');
  }

  // 5. Deactivate Teacher
  res = await request(`/teachers/${teacher._id}/deactivate`, 'PATCH', null, token);
  if (res.status !== 200) {
    console.log('Deactivate Teacher Failed', res.data);
  } else {
    console.log('Deactivate Teacher: PASS');
  }

  // 6. Login after deactivate must fail
  let loginRes = await request('/auth/login', 'POST', { identifier: teacherPhone, password: 'password123' });
  if (loginRes.status === 200) {
    console.log('Login after deactivate Failed (Should have failed but passed)', loginRes.data);
  } else {
    console.log('Login after deactivate blocked: PASS');
  }

  // 7. Password Reset
  res = await request(`/users/${teacher.userId}/reset-password`, 'PATCH', { newPassword: 'newpassword123' }, token);
  if (res.status !== 200) {
    console.log('Password Reset Failed', res.data);
  } else {
    console.log('Password Reset: PASS');
  }

  // 8. We need to activate the teacher to test login with new password.
  res = await request(`/teachers/${teacher._id}`, 'PUT', { status: 'active' }, token);
  if (res.status !== 200) {
    console.log('Re-activate Teacher Failed', res.data);
  } else {
    // Login with new password must pass
    loginRes = await request('/auth/login', 'POST', { identifier: teacherPhone, password: 'newpassword123' });
    if (loginRes.status !== 200) {
      console.log('Login with new password Failed', loginRes.data);
    } else {
      console.log('Login with new password: PASS');
    }
  }

  // 9. Duplicate Phone
  res = await request('/teachers', 'POST', {
    name: 'Duplicate Phone',
    email: `dup${Date.now()}@test.com`,
    phone: teacherPhone,
    password: 'password123',
    teacherId: `TCH${Date.now()}2`,
    subject: 'Physics',
    qualification: 'M.Sc.'
  }, token);
  if (res.status === 201) {
    console.log('Duplicate Phone Failed (Should have failed but passed)');
  } else {
    console.log('Duplicate Phone blocked correctly: PASS', res.data.message);
  }

  console.log('\nAll API tests completed!');
  process.exit(0);
}

runTests();
