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
  console.log('--- STARTING TEACHER APP TESTS ---');
  
  let res = await request('/auth/login', 'POST', { identifier: '9304335662', password: 'director123' });
  if (res.status !== 200) { console.log('Admin login failed', res.data); process.exit(1); }
  const adminToken = res.data.token;
  
  const teacherEmail = `teachapp${Date.now()}@test.com`;
  res = await request('/teachers', 'POST', {
    name: 'App Teacher', email: teacherEmail, phone: `88${Math.floor(10000000 + Math.random() * 90000000)}`,
    password: 'password123', teacherId: `TAPP${Date.now()}`, subject: 'Science'
  }, adminToken);
  
  const teacherTokenRes = await request('/auth/login', 'POST', { identifier: teacherEmail, password: 'password123' });
  const teacherToken = teacherTokenRes.data.token;
  console.log('Teacher logged in');

  // 1. Teacher Dashboard
  res = await request('/dashboard/teacher', 'GET', null, teacherToken);
  if (res.status !== 200) console.log('Fetch Teacher Dashboard Failed', res.data);
  else console.log('Teacher Dashboard Load: PASS', `{ Subject: ${res.data.subject} }`);

  // 2. Teacher fetch students list (should work, handled by studentRoutes)
  res = await request('/students', 'GET', null, teacherToken);
  if (res.status !== 200) console.log('Teacher fetch students failed', res.data);
  else console.log('Teacher View Students: PASS');

  // 3. Teacher creates homework
  res = await request('/homework', 'POST', {
    title: 'Science Chap 1', description: 'Read page 10', class: 'Class 10', subject: 'Science', dueDate: new Date().toISOString()
  }, teacherToken);
  if (res.status !== 201) console.log('Teacher create homework failed', res.data);
  else console.log('Teacher Create Homework: PASS');

  // 4. Teacher creates material
  res = await request('/materials', 'POST', {
    title: 'Science Notes', description: 'Exam notes', class: 'Class 10', subject: 'Science', type: 'pdf', fileUrl: 'http://test.com/note.pdf'
  }, teacherToken);
  if (res.status !== 201) console.log('Teacher create material failed', res.data);
  else console.log('Teacher Create Material: PASS');

  // 5. Teacher fetches notices
  res = await request('/notices', 'GET', null, teacherToken);
  if (res.status !== 200) console.log('Teacher fetch notice failed', res.data);
  else console.log('Teacher View Notices: PASS');

  // 6. Block Teacher from Admin analytics route
  res = await request('/analytics/overview', 'GET', null, teacherToken);
  if (res.status !== 403) console.log('Security Failed! Teacher accessed Analytics', res.status);
  else console.log('Security (Teacher Blocked from Admin Analytics): PASS');

  // 7. Block Teacher from Fees
  res = await request('/fees', 'GET', null, teacherToken);
  if (res.status !== 403) console.log('Security Failed! Teacher accessed Fees', res.status);
  else console.log('Security (Teacher Blocked from Fees): PASS');

  console.log('\nAll Teacher App tests completed!');
  process.exit(0);
}

runTests();
