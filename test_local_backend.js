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
  console.log('--- STARTING LOCAL API TESTS ---');
  
  let res = await request('/auth/login', 'POST', { identifier: '9304335662', password: 'director123' });
  if (res.status !== 200) { console.log('Admin login failed'); process.exit(1); }
  const adminToken = res.data.token;
  console.log('✅ Admin Login: PASS');

  const tests = [
    { name: 'Analytics Overview', path: '/analytics/overview', method: 'GET' },
    { name: 'Ops Health', path: '/ops/health', method: 'GET' },
    { name: 'Ops API Stats', path: '/ops/api-stats', method: 'GET' },
    { name: 'Admin Settings', path: '/admin/settings', method: 'GET' },
  ];

  for (const t of tests) {
    res = await request(t.path, t.method, null, adminToken);
    console.log(`\nEndpoint: ${t.path} (${t.method})`);
    console.log(`Status Code: ${res.status}`);
    console.log(`Response Shape:`, Object.keys(res.data || {}));
    if (res.status >= 400) console.log(`Response Data:`, res.data);
  }

  console.log('\n--- TESTS COMPLETED ---');
  process.exit(0);
}

runTests();
