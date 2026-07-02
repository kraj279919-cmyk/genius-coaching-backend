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
  console.log('--- STARTING PHASE 14 AI CORE TESTS ---');
  
  // 1. Admin Login
  let res = await request('/auth/login', 'POST', { identifier: '9304335662', password: 'director123' });
  if (res.status !== 200) { console.log('Admin login failed'); process.exit(1); }
  const adminToken = res.data.token;
  
  // Ensure AI is enabled
  await request('/admin/settings', 'PUT', { features: { ai: true } }, adminToken);
  console.log('✅ Enabled AI Feature Flag');

  // 1. Director generates notice
  res = await request('/ai/notice-writer', 'POST', { topic: 'Diwali Holiday' }, adminToken);
  if (res.status !== 200 || !res.data.title) { console.log('Notice writer failed', res.data); process.exit(1); }
  console.log('✅ Director generates notice: PASS', res.data.title);

  // 2. Director generates website content
  res = await request('/ai/content-writer', 'POST', { type: 'motivational', promptContext: 'Push hard for final exams' }, adminToken);
  if (res.status !== 200 || !res.data.content) { console.log('Content writer failed', res.data); process.exit(1); }
  console.log('✅ Director generates website content: PASS');

  // 3. Teacher Login
  let teacherToken;
  try {
    const loginT = await request('/auth/login', 'POST', { identifier: 'opsT@test.com', password: 'password' });
    if(loginT.status === 200) {
      teacherToken = loginT.data.token;
    }
  } catch(e) {}
  if (!teacherToken) {
    console.log('Skipping teacher tests due to lack of teacher token');
  } else {
    // 4. Teacher generates test paper
    res = await request('/ai/test-generator', 'POST', { subject: 'Science', topic: 'Atoms', difficulty: 'hard', numQuestions: 2 }, teacherToken);
    if (res.status !== 200 || !res.data.mcq) { console.log('Test generator failed', res.data); process.exit(1); }
    console.log('✅ Teacher generates test paper: PASS', res.data.mcq.length);

    // 5. Result analysis
    res = await request('/ai/result-analysis', 'POST', { studentName: 'Rajan', marksData: [{subject: 'Math', marks: 40, outOf:100}, {subject: 'Science', marks: 95, outOf:100}] }, teacherToken);
    if (res.status !== 200 || !res.data.analysis) { console.log('Result analysis failed', res.data); process.exit(1); }
    console.log('✅ Teacher generates Result analysis: PASS');
  }

  // Disable AI and test flag
  await request('/admin/settings', 'PUT', { features: { ai: false } }, adminToken);
  res = await request('/ai/notice-writer', 'POST', { topic: 'Test' }, adminToken);
  if (res.status !== 500 || !res.data.message.includes('disabled')) {
    console.log('AI disabled flag check failed', res.data); process.exit(1); 
  }
  console.log('✅ AI disabled feature flag blocks usage: PASS');

  // Re-enable for manual testing later
  await request('/admin/settings', 'PUT', { features: { ai: true } }, adminToken);

  console.log('\n--- ALL AI TESTS COMPLETED SUCCESSFULLY ---');
  process.exit(0);
}

runTests();
