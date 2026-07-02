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
  console.log('--- STARTING ANALYTICS TESTS ---');
  
  let res = await request('/auth/login', 'POST', { identifier: '9304335662', password: 'director123' });
  if (res.status !== 200) { console.log('Admin login failed', res.data); process.exit(1); }
  const adminToken = res.data.token;
  console.log('Admin logged in');

  const studentEmail = `studentstat${Date.now()}@test.com`;
  res = await request('/students', 'POST', {
    name: 'Stat Student', email: studentEmail, phone: `98${Math.floor(10000000 + Math.random() * 90000000)}`,
    password: 'password123', studentId: `SSTAT${Date.now()}`, class: 'Class 10', section: 'A'
  }, adminToken);
  const studentTokenRes = await request('/auth/login', 'POST', { identifier: studentEmail, password: 'password123' });
  const studentToken = studentTokenRes.data.token;

  // 1. Overview Analytics
  res = await request('/analytics/overview', 'GET', null, adminToken);
  if (res.status !== 200) console.log('Fetch Overview Failed', res.data);
  else console.log('Fetch Overview: PASS', `{ Total Students: ${res.data.totalStudents}, Pending Fees: ${res.data.pendingFees} }`);

  // 2. Student Analytics
  res = await request('/analytics/students', 'GET', null, adminToken);
  if (res.status !== 200) console.log('Fetch Student Analytics Failed');
  else console.log('Fetch Student Analytics: PASS', `{ Active: ${res.data.activeStudents} }`);

  // 3. Teacher Analytics
  res = await request('/analytics/teachers', 'GET', null, adminToken);
  if (res.status !== 200) console.log('Fetch Teacher Analytics Failed');
  else console.log('Fetch Teacher Analytics: PASS');

  // 4. Fee Analytics
  res = await request('/analytics/fees', 'GET', null, adminToken);
  if (res.status !== 200) console.log('Fetch Fee Analytics Failed');
  else console.log('Fetch Fee Analytics: PASS');

  // 5. Attendance Analytics
  res = await request('/analytics/attendance', 'GET', null, adminToken);
  if (res.status !== 200) console.log('Fetch Attendance Analytics Failed');
  else console.log('Fetch Attendance Analytics: PASS');

  // 6. Results Analytics
  res = await request('/analytics/results', 'GET', null, adminToken);
  if (res.status !== 200) console.log('Fetch Results Analytics Failed');
  else console.log('Fetch Results Analytics: PASS');

  // 7. Security Isolation Check (Student accessing analytics)
  res = await request('/analytics/overview', 'GET', null, studentToken);
  if (res.status !== 403) console.log('Security Isolation Failed - Should be 403', res.status);
  else console.log('Security Isolation (Student Blocked): PASS');

  console.log('\nAll Analytics tests completed!');
  process.exit(0);
}

runTests();
