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
  console.log('--- STARTING PHASE 13.5 FOUNDATION AUDIT TESTS ---');
  
  // 1. Auth & Admin Login
  let res = await request('/auth/login', 'POST', { identifier: '9304335662', password: 'director123' });
  if (res.status !== 200) { console.log('Admin login failed', res.data); process.exit(1); }
  const adminToken = res.data.token;
  console.log('✅ Admin (Director) Login: PASS');

  // 2. Create Student
  const phone = `99${Math.floor(10000000 + Math.random() * 90000000)}`;
  const email = `stu${Date.now()}@test.com`;
  res = await request('/students', 'POST', {
    name: 'Audit Student', email, phone,
    password: 'password123', studentId: `AUDIT${Date.now()}`, class: 'Class 10', section: 'A'
  }, adminToken);
  
  if (res.status !== 201) { console.log('Create student failed', res.data); process.exit(1); }
  const studentDbId = res.data._id;
  console.log('✅ Director Create Student: PASS');

  // 3. Immediately Login as that Student (Phone)
  let stuLoginRes = await request('/auth/login', 'POST', { identifier: phone, password: 'password123' });
  if (stuLoginRes.status !== 200) console.log('❌ Student Login by Phone: FAIL', stuLoginRes.data);
  else console.log('✅ Student Login by Phone: PASS');

  // 4. Immediately Login as that Student (Email)
  stuLoginRes = await request('/auth/login', 'POST', { identifier: email, password: 'password123' });
  if (stuLoginRes.status !== 200) console.log('❌ Student Login by Email: FAIL', stuLoginRes.data);
  else console.log('✅ Student Login by Email: PASS');
  
  const studentToken = stuLoginRes.data.token;

  // 5. Wrong Password check
  let badLoginRes = await request('/auth/login', 'POST', { identifier: email, password: 'wrongpassword' });
  if (badLoginRes.status !== 401) console.log('❌ Wrong password check: FAIL', badLoginRes.data);
  else console.log('✅ Wrong Password Rejection: PASS');

  // 6. Test Error Middleware (Trigger Duplicate Key)
  let dupRes = await request('/students', 'POST', {
    name: 'Audit Student Dup', email, phone, // using same email/phone
    password: 'password123', studentId: `AUDIT${Date.now()}2`, class: 'Class 10', section: 'A'
  }, adminToken);
  console.log('Duplicate test raw status:', dupRes.status);
  if (dupRes.status !== 400 || !dupRes.data.message.includes('Duplicate')) console.log('❌ Duplicate error handling: FAIL', dupRes.data);
  else console.log('✅ Duplicate Error Handling: PASS', '("'+dupRes.data.message+'")');

  // 7. Director Deactivates Student
  res = await request(`/students/${studentDbId}/deactivate`, 'PATCH', null, adminToken);
  if (res.status !== 200) console.log('❌ Deactivate student: FAIL', res.data);
  else console.log('✅ Director Deactivate Student: PASS');

  // 8. Inactive Student Login (Must Fail)
  let inactiveLoginRes = await request('/auth/login', 'POST', { identifier: email, password: 'password123' });
  if (inactiveLoginRes.status !== 403) console.log('❌ Inactive Student Login: FAIL (Should block)', inactiveLoginRes.status);
  else console.log('✅ Inactive Student Login Rejection: PASS');

  // 9. Director Deletes Student (Cascades to User)
  res = await request(`/students/${studentDbId}`, 'DELETE', null, adminToken);
  if (res.status !== 200) console.log('❌ Delete student: FAIL', res.data);
  else console.log('✅ Director Delete Student (Cleanup): PASS');

  console.log('\n--- ALL CRITICAL FOUNDATION CRUD/AUTH TESTS COMPLETED ---');
  process.exit(0);
}

runTests();
