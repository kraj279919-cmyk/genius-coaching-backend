const dotenv = require('dotenv');

dotenv.config();
const API_URL = 'https://genius-coaching-backend.onrender.com/api';

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
  console.log('--- RUNNING PRODUCTION DEPLOYMENT VERIFICATION ---');
  console.log(`Targeting API: ${API_URL}`);
  
  // 1. Director Login
  let res = await request('/auth/login', 'POST', { identifier: '9304335662', password: 'director123' });
  if (res.status !== 200) { console.log('Admin login failed', res.data); process.exit(1); }
  const adminToken = res.data.token;
  console.log('✅ Director Login: 200');

  // 2. Analytics Overview
  let analyticsRes = await request('/analytics/overview', 'GET', null, adminToken);
  console.log(`Analytics Overview (Expected 200): ${analyticsRes.status}`);

  // 3. Ops Health
  let opsRes = await request('/ops/health', 'GET', null, adminToken);
  console.log(`Ops Health (Expected 200): ${opsRes.status}`);

  // 4-9. Director Student & Teacher actions
  console.log('\n--- Testing Director Student/Teacher Actions ---');
  let studentRes = await request('/students', 'POST', {
    name: 'DeployTest Student', phone: '9999999993', studentId: 'DEPST01', password: 'password123', class: '10'
  }, adminToken);
  
  if (studentRes.status === 201) {
    const student = studentRes.data;
    let updateRes = await request(`/students/${student._id}`, 'PUT', { name: 'DeployTest Student Updated' }, adminToken);
    console.log(`Student Update (Expected 200): ${updateRes.status}`);

    let deactivateRes = await request(`/students/${student._id}/deactivate`, 'PATCH', null, adminToken);
    console.log(`Student Deactivate (Expected 200): ${deactivateRes.status}`);

    if (student.userId) {
      let resetRes = await request(`/users/${student.userId}/reset-password`, 'PATCH', { newPassword: 'newpassword123' }, adminToken);
      console.log(`Student Password Reset (Expected 200): ${resetRes.status}`);
    } else {
      console.log('❌ Student missing userId, cannot test password reset');
    }

    // Student Fee Test Prep
    // Login as the student
    let stLogin = await request('/auth/login', 'POST', { identifier: '9999999993', password: 'newpassword123' });
    const studentToken = stLogin.data.token;
    console.log(`Student Login (Expected 200): ${stLogin.status}`);
    
    if (studentToken) {
      let stFees = await request('/fees/my-fees', 'GET', null, studentToken);
      console.log(`Student view own fees (Expected 200): ${stFees.status}`);
      
      let stCreateFee = await request('/fees', 'POST', { amount: 100 }, studentToken);
      console.log(`Student create fee (Expected 403): ${stCreateFee.status}`);
      
      let stUpdateFee = await request('/fees/invalid_id', 'PUT', { amount: 200 }, studentToken);
      console.log(`Student update fee (Expected 403): ${stUpdateFee.status}`);
    }

    let delRes = await request(`/students/${student._id}`, 'DELETE', null, adminToken);
    console.log(`Student Delete (Expected 200): ${delRes.status}`);
  } else {
    console.log('❌ Failed to create temp student', studentRes.data);
  }

  // Teacher Tests
  let teacherRes = await request('/teachers', 'POST', {
    name: 'DeployTest Teacher', phone: '9999999994', teacherId: 'DEPT01', subject: 'Science', password: 'password123'
  }, adminToken);

  if (teacherRes.status === 201) {
    const teacher = teacherRes.data;
    let updateRes = await request(`/teachers/${teacher._id}`, 'PUT', { name: 'DeployTest Teacher Updated' }, adminToken);
    console.log(`Teacher Update (Expected 200): ${updateRes.status}`);

    let deactivateRes = await request(`/teachers/${teacher._id}/deactivate`, 'PATCH', null, adminToken);
    console.log(`Teacher Deactivate (Expected 200): ${deactivateRes.status}`);

    if (teacher.userId) {
      let resetRes = await request(`/users/${teacher.userId}/reset-password`, 'PATCH', { newPassword: 'newpassword123' }, adminToken);
      console.log(`Teacher Password Reset (Expected 200): ${resetRes.status}`);
    }

    // Teacher Login and Fee Test
    let thLogin = await request('/auth/login', 'POST', { identifier: '9999999994', password: 'newpassword123' });
    const teacherToken = thLogin.data.token;
    if (teacherToken) {
      let thFees = await request('/fees', 'GET', null, teacherToken);
      console.log(`Teacher view all fees (Expected 403): ${thFees.status}`);
    }

    let delRes = await request(`/teachers/${teacher._id}`, 'DELETE', null, adminToken);
    console.log(`Teacher Delete (Expected 200): ${delRes.status}`);
  } else {
    console.log('❌ Failed to create temp teacher', teacherRes.data);
  }

  console.log('\n--- TESTS COMPLETED ---');
  process.exit(0);
}

runTests();
