const dotenv = require('dotenv');

dotenv.config();
// Set to local since we cannot deploy to production Render from this environment, 
// but this script is ready to run against production once deployed.
const API_URL = process.env.TEST_API_URL || 'http://localhost:5000/api';

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
  console.log('--- RUNNING APK ADMIN BUGS TEST ---');
  console.log(`Targeting API: ${API_URL}`);
  
  let res = await request('/auth/login', 'POST', { identifier: '9304335662', password: 'director123' });
  if (res.status !== 200) { console.log('Admin login failed', res.data); process.exit(1); }
  const adminToken = res.data.token;
  console.log('✅ Admin Login: 200');

  // Test Analytics
  res = await request('/analytics/overview', 'GET', null, adminToken);
  console.log(`Analytics Overview: ${res.status}`);

  // Test Ops
  res = await request('/ops/health', 'GET', null, adminToken);
  console.log(`Ops Health: ${res.status}`);

  // Test Settings
  res = await request('/admin/settings', 'GET', null, adminToken);
  console.log(`Settings: ${res.status}`);

  // Test Student endpoints
  console.log('\n--- Testing Student Actions ---');
  let studentRes = await request('/students', 'POST', {
    name: 'Temp Student', phone: '9999999991', studentId: 'TEMP001', password: 'password123', class: '10'
  }, adminToken);
  
  if (studentRes.status === 201) {
    console.log('✅ Student Create: 201');
    const student = studentRes.data;

    let updateRes = await request(`/students/${student._id}`, 'PUT', { name: 'Temp Student Updated' }, adminToken);
    console.log(`Student Update: ${updateRes.status}`);

    let deactivateRes = await request(`/students/${student._id}/deactivate`, 'PATCH', null, adminToken);
    console.log(`Student Deactivate: ${deactivateRes.status}`);

    if (student.userId) {
      let resetRes = await request(`/users/${student.userId}/reset-password`, 'PATCH', { newPassword: 'newpassword123' }, adminToken);
      console.log(`Student Password Reset: ${resetRes.status}`);
    } else {
      console.log('❌ Student missing userId, cannot test password reset');
    }

    let delRes = await request(`/students/${student._id}`, 'DELETE', null, adminToken);
    console.log(`Student Delete: ${delRes.status}`);
  } else {
    console.log('❌ Failed to create temp student', studentRes.data);
  }

  // Test Teacher endpoints
  console.log('\n--- Testing Teacher Actions ---');
  let teacherRes = await request('/teachers', 'POST', {
    name: 'Temp Teacher', phone: '9999999992', teacherId: 'TEMPT01', subject: 'Math', password: 'password123'
  }, adminToken);

  if (teacherRes.status === 201) {
    console.log('✅ Teacher Create: 201');
    const teacher = teacherRes.data;

    let updateRes = await request(`/teachers/${teacher._id}`, 'PUT', { name: 'Temp Teacher Updated' }, adminToken);
    console.log(`Teacher Update: ${updateRes.status}`);

    let deactivateRes = await request(`/teachers/${teacher._id}/deactivate`, 'PATCH', null, adminToken);
    console.log(`Teacher Deactivate: ${deactivateRes.status}`);

    if (teacher.userId) {
      let resetRes = await request(`/users/${teacher.userId}/reset-password`, 'PATCH', { newPassword: 'newpassword123' }, adminToken);
      console.log(`Teacher Password Reset: ${resetRes.status}`);
    } else {
      console.log('❌ Teacher missing userId, cannot test password reset');
    }

    let delRes = await request(`/teachers/${teacher._id}`, 'DELETE', null, adminToken);
    console.log(`Teacher Delete: ${delRes.status}`);
  } else {
    console.log('❌ Failed to create temp teacher', teacherRes.data);
  }

  console.log('\n--- TESTS COMPLETED ---');
  process.exit(0);
}

runTests();
