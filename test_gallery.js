const fs = require('fs');
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
  console.log('--- STARTING GALLERY TESTS ---');
  
  let res = await request('/auth/login', 'POST', { identifier: '9304335662', password: 'director123' });
  if (res.status !== 200) { console.log('Admin login failed', res.data); process.exit(1); }
  const adminToken = res.data.token;
  console.log('Admin logged in');

  const studentEmail = `studentgal${Date.now()}@test.com`;
  res = await request('/students', 'POST', {
    name: 'Gal Student', email: studentEmail, phone: `98${Math.floor(10000000 + Math.random() * 90000000)}`,
    password: 'password123', studentId: `SGAL${Date.now()}`, class: 'Class 9', section: 'A'
  }, adminToken);
  const studentTokenRes = await request('/auth/login', 'POST', { identifier: studentEmail, password: 'password123' });
  const studentToken = studentTokenRes.data.token;

  // 1. Create Gallery Image
  res = await request('/gallery', 'POST', {
    title: 'Annual function',
    imageUrl: 'https://example.com/annual.jpg',
    category: 'event'
  }, adminToken);
  if (res.status !== 201) { console.log('Create Gallery Failed', res.data); process.exit(1); }
  const galId = res.data._id;
  console.log('Create Gallery Image: PASS');

  // 2. Fetch admin gallery list
  res = await request('/gallery', 'GET', null, adminToken);
  if (!res.data.some(g => g._id === galId)) { console.log('Fetch Admin Gallery failed'); }
  else { console.log('Fetch Admin Gallery: PASS'); }

  // 3. Fetch public gallery list (should be visible)
  res = await request('/gallery/public', 'GET', null);
  if (res.status !== 200 || !res.data.some(g => g._id === galId)) { console.log('Fetch Public Gallery Failed', res.data); }
  else { console.log('Fetch Public Gallery (Active): PASS'); }

  // 4. Update Gallery Image to inactive
  res = await request(`/gallery/${galId}`, 'PATCH', { status: 'inactive' }, adminToken);
  if (res.status !== 200 || res.data.status !== 'inactive') { console.log('Update Gallery Failed', res.data); }
  else { console.log('Update Gallery Status: PASS'); }

  // 5. Fetch public gallery list again (should NOT be visible)
  res = await request('/gallery/public', 'GET', null);
  if (res.data.some(g => g._id === galId)) { console.log('Fetch Public Gallery Security Failed! Inactive image visible!'); }
  else { console.log('Fetch Public Gallery (Inactive Hidden): PASS'); }

  // 6. Student fetch specific gallery item (should fail because inactive)
  res = await request(`/gallery/${galId}`, 'GET', null, studentToken);
  if (res.status !== 403) { console.log('Student Gallery Security Failed - Should be 403', res.status); }
  else { console.log('Student Isolation for Inactive Image: PASS'); }

  console.log('\nAll Gallery tests completed!');
  process.exit(0);
}

runTests();
