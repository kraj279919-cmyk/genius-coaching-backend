const mongoose = require('mongoose');
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
  console.log('--- STARTING PHASE 13.7 ENTERPRISE TESTS ---');
  
  // 1. Auth & Admin Login
  let res = await request('/auth/login', 'POST', { identifier: '9304335662', password: 'director123' });
  if (res.status !== 200) { console.log('Admin login failed', res.data); process.exit(1); }
  const adminToken = res.data.token;
  console.log('✅ Admin (Director) Login: PASS');

  // 2. Settings Test
  res = await request('/admin/settings', 'GET', null, adminToken);
  if (res.status !== 200) { console.log('Get settings failed', res.data); process.exit(1); }
  console.log('✅ Get Institute Settings: PASS', res.data.name);
  
  // Update Settings
  res = await request('/admin/settings', 'PUT', { name: 'Genius Coaching Enterprise', emergency: { maintenanceMode: true } }, adminToken);
  if (res.status !== 200 || !res.data.emergency.maintenanceMode) { console.log('Update settings failed', res.data); process.exit(1); }
  console.log('✅ Update Institute Settings (Merge): PASS');

  // 3. Health Test
  res = await request('/admin/health', 'GET', null, adminToken);
  if (res.status !== 200) { console.log('Health check failed', res.data); process.exit(1); }
  console.log('✅ System Health Check: PASS', `Mongo: ${res.data.mongodb}`);

  // 4. Academic Control Test
  res = await request('/admin/academic', 'GET', null, adminToken);
  if (res.status !== 200) { console.log('Academic status failed', res.data); process.exit(1); }
  console.log('✅ Get Academic Status: PASS', `Session: ${res.data.currentSession}`);

  // Start New Session
  res = await request('/admin/academic/new-session', 'POST', { newSession: '2026-27' }, adminToken);
  if (res.status !== 200) { console.log('Start new session failed', res.data); process.exit(1); }
  console.log('✅ Start New Session: PASS');

  // 5. Audit Logs
  res = await request('/admin/audit-logs', 'GET', null, adminToken);
  if (res.status !== 200) { console.log('Audit logs failed', res.data); process.exit(1); }
  console.log('✅ Get Audit Logs: PASS', `Total Logs: ${res.data.total}`);

  // 6. Backup Test
  res = await request('/admin/backup', 'GET', null, adminToken);
  if (res.status !== 200) { console.log('Backup failed', res.data); process.exit(1); }
  console.log('✅ Backup Generation: PASS');

  console.log('\n--- ALL ENTERPRISE TESTS COMPLETED SUCCESSFULLY ---');
  process.exit(0);
}

runTests();
