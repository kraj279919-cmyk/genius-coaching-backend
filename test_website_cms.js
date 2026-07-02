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
  console.log('--- STARTING WEBSITE CMS TESTS ---');
  
  let res = await request('/auth/login', 'POST', { identifier: '9304335662', password: 'director123' });
  if (res.status !== 200) { console.log('Admin login failed', res.data); process.exit(1); }
  const adminToken = res.data.token;
  console.log('Admin logged in');

  const studentEmail = `studentweb${Date.now()}@test.com`;
  res = await request('/students', 'POST', {
    name: 'Web Student', email: studentEmail, phone: `98${Math.floor(10000000 + Math.random() * 90000000)}`,
    password: 'password123', studentId: `SWEB${Date.now()}`, class: 'Class 10', section: 'A'
  }, adminToken);
  const studentTokenRes = await request('/auth/login', 'POST', { identifier: studentEmail, password: 'password123' });
  const studentToken = studentTokenRes.data.token;

  // 1. GET /api/website (Admin)
  res = await request('/website', 'GET', null, adminToken);
  if (res.status !== 200) { console.log('Admin Fetch Website Failed'); }
  else { console.log('Admin Fetch Website: PASS'); }

  // 2. PUT /api/website (Admin)
  res = await request('/website', 'PUT', {
    instituteName: 'Genius Coaching Production',
    heroTitle: 'Excellence in Education',
    address: 'New Delhi, India',
    status: 'active'
  }, adminToken);
  if (res.status !== 200 && res.status !== 201) { console.log('Update Website Failed', res.data); }
  else { console.log('Update Website: PASS'); }

  // 3. GET /api/website/public (Public Sync)
  res = await request('/website/public', 'GET');
  if (res.status !== 200 || res.data.instituteName !== 'Genius Coaching Production') { console.log('Public Website Sync Failed', res.data); }
  else if (res.data.updatedBy) { console.log('Public Website Exposed sensitive updatedBy field!'); }
  else { console.log('Public Website Sync (Safe Data): PASS'); }

  // 4. Student update attempt (Should fail with 403)
  res = await request('/website', 'PUT', { instituteName: 'Hacked' }, studentToken);
  if (res.status !== 403) { console.log('Student Security Failed - Should be 403', res.status); }
  else { console.log('Student Website Update Isolation: PASS'); }

  // 5. Public Notices endpoint works
  res = await request('/notices/public', 'GET');
  if (res.status === 404) { console.log('Public Notices 404'); }
  else { console.log('Public Notices Route: PASS'); }

  // 6. Public Gallery endpoint works
  res = await request('/gallery/public', 'GET');
  if (res.status === 404) { console.log('Public Gallery 404'); }
  else { console.log('Public Gallery Route: PASS'); }

  console.log('\nAll Website CMS tests completed!');
  process.exit(0);
}

runTests();
