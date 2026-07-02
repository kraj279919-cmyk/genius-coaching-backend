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
  console.log('--- STARTING STUDENT APP TESTS ---');
  
  let res = await request('/auth/login', 'POST', { identifier: '9304335662', password: 'director123' });
  if (res.status !== 200) { console.log('Admin login failed', res.data); process.exit(1); }
  const adminToken = res.data.token;
  
  const studentEmail = `stuapp${Date.now()}@test.com`;
  res = await request('/students', 'POST', {
    name: 'App Student', email: studentEmail, phone: `99${Math.floor(10000000 + Math.random() * 90000000)}`,
    password: 'password123', studentId: `STUAPP${Date.now()}`, class: 'Class 10', section: 'A'
  }, adminToken);
  
  const studentTokenRes = await request('/auth/login', 'POST', { identifier: studentEmail, password: 'password123' });
  const studentToken = studentTokenRes.data.token;
  console.log('Student logged in');

  // 1. Student Dashboard
  res = await request('/dashboard/student', 'GET', null, studentToken);
  if (res.status !== 200) console.log('Fetch Student Dashboard Failed', res.data);
  else console.log('Student Dashboard Load: PASS', `{ Class: ${res.data.class} }`);

  // 2. Block Student from Admin Analytics route
  res = await request('/analytics/overview', 'GET', null, studentToken);
  if (res.status !== 403) console.log('Security Failed! Student accessed Analytics', res.status);
  else console.log('Security (Student Blocked from Admin Analytics): PASS');

  // 3. Block Student from Teachers
  res = await request('/teachers', 'GET', null, studentToken);
  if (res.status !== 403) console.log('Security Failed! Student accessed Teachers', res.status);
  else console.log('Security (Student Blocked from Teachers): PASS');
  
  // 4. Student View Homework (Should only show Class 10 homework)
  res = await request('/homework', 'GET', null, studentToken);
  if (res.status !== 200) console.log('Student fetch homework failed', res.data);
  else console.log('Student View Homework: PASS');

  // 5. Block Student from Creating Homework
  res = await request('/homework', 'POST', {
    title: 'Hacked', description: 'desc', class: 'Class 10', subject: 'Science', dueDate: new Date().toISOString()
  }, studentToken);
  if (res.status !== 403) console.log('Security Failed! Student created homework', res.status);
  else console.log('Security (Student Blocked from Creating Homework): PASS');

  // 6. Block Student from Viewing other students Fees (Testing feeRoutes)
  res = await request('/fees', 'GET', null, studentToken);
  if (res.status !== 403) console.log('Security Failed! Student accessed global fees', res.status);
  else console.log('Security (Student Blocked from Global Fees): PASS');

  console.log('\nAll Student App tests completed!');
  process.exit(0);
}

runTests();
