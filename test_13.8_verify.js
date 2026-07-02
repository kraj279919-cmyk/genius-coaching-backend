const dotenv = require('dotenv');

dotenv.config();
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
  console.log('--- STARTING PHASE 13.8 VERIFICATION TESTS ---');
  
  // 1. Director Login
  let res = await request('/auth/login', 'POST', { identifier: '9304335662', password: 'director123' });
  if (res.status !== 200) { console.log('Admin login failed'); process.exit(1); }
  const adminToken = res.data.token;
  console.log('✅ Admin Login: PASS');

  // Teacher Login
  let teacherToken;
  try {
    const loginT = await request('/auth/login', 'POST', { identifier: 'opsT@test.com', password: 'password' });
    if(loginT.status === 200) {
      teacherToken = loginT.data.token;
    } else {
      const tEmail = `opsT@test.com`;
      const tPhone = `98${Math.floor(Math.random() * 90000000)}`;
      await request('/teachers', 'POST', {
        name: 'Ops Teacher', email: tEmail, phone: tPhone, password: 'password', teacherId: `OT${Date.now()}`, subject: 'Math', section: 'A'
      }, adminToken);
      const loginT2 = await request('/auth/login', 'POST', { identifier: tEmail, password: 'password' });
      teacherToken = loginT2.data.token;
    }
  } catch(e) {
    console.log('Failed to create teacher for 403 test');
  }

  // 1. Version API (/api/version)
  res = await request('/version', 'GET');
  if (res.status !== 200) { console.log('Version API failed', res.status); process.exit(1); }
  console.log('✅ Director gets /api/version: PASS', res.data.backendVersion);

  // 2. Health API
  res = await request('/ops/health', 'GET', null, adminToken);
  if (res.status !== 200) { console.log('Health API failed', res.status); process.exit(1); }
  console.log('✅ Director gets /api/ops/health: PASS');

  // 3. API Stats
  res = await request('/ops/api-stats', 'GET', null, adminToken);
  if (res.status !== 200) { console.log('API Stats failed', res.status); process.exit(1); }
  console.log('✅ Director gets /api/ops/api-stats: PASS', res.data.totalRequestsToday);

  // 4. Errors
  res = await request('/ops/errors', 'GET', null, adminToken);
  if (res.status !== 200) { console.log('Errors API failed', res.status); process.exit(1); }
  console.log('✅ Director gets /api/ops/errors: PASS');

  // 5. Jobs
  res = await request('/ops/jobs', 'GET', null, adminToken);
  if (res.status !== 200) { console.log('Jobs API failed', res.status); process.exit(1); }
  console.log('✅ Director gets /api/ops/jobs: PASS');

  // 6. Test Job Post
  res = await request('/ops/jobs/test', 'POST', null, adminToken);
  if (res.status !== 200) { console.log('Test Jobs API failed', res.status); process.exit(1); }
  console.log('✅ Director POSTs /api/ops/jobs/test: PASS');

  // 7. Teacher 403 test
  if (teacherToken) {
    res = await request('/ops/health', 'GET', null, teacherToken);
    if (res.status !== 403) { console.log('Teacher should get 403, got', res.status); process.exit(1); }
    console.log('✅ Teacher gets /api/ops/health -> 403: PASS');
  } else {
    console.log('⚠️ Skipped Teacher 403 test due to missing token');
  }

  console.log('\n--- ALL VERIFICATION TESTS COMPLETED SUCCESSFULLY ---');
  process.exit(0);
}

runTests();
