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
  console.log('--- STARTING FEES MANAGEMENT TESTS ---');
  
  // 1. Admin Login
  let res = await request('/auth/login', 'POST', { identifier: '9304335662', password: 'director123' });
  if (res.status !== 200) { console.log('Admin login failed', res.data); process.exit(1); }
  const adminToken = res.data.token;
  console.log('Admin logged in');

  // Create test student and teacher
  const studentEmail = `studentfee${Date.now()}@test.com`;
  res = await request('/students', 'POST', {
    name: 'Fee Student', email: studentEmail, phone: `98${Math.floor(10000000 + Math.random() * 90000000)}`,
    password: 'password123', studentId: `S${Date.now()}`, class: 'Class 10', section: 'A'
  }, adminToken);
  if (res.status !== 201) { console.log('Create Student Failed', res.data); process.exit(1); }
  const studentId = res.data._id;
  const studentTokenRes = await request('/auth/login', 'POST', { identifier: studentEmail, password: 'password123' });
  const studentToken = studentTokenRes.data.token;

  const teacherEmail = `teacherfee${Date.now()}@test.com`;
  res = await request('/teachers', 'POST', {
    name: 'Fee Teacher', email: teacherEmail, phone: `98${Math.floor(10000000 + Math.random() * 90000000)}`,
    password: 'password123', teacherId: `TCH${Date.now()}`, subject: 'Mathematics'
  }, adminToken);
  const teacherTokenRes = await request('/auth/login', 'POST', { identifier: teacherEmail, password: 'password123' });
  const teacherToken = teacherTokenRes.data.token;

  // 3. Create fee record using real student _id
  res = await request('/fees', 'POST', {
    studentId,
    amount: 1500,
    month: 'May 2026',
    session: '2026-2027',
    status: 'pending',
    dueDate: new Date(Date.now() - 86400000) // yesterday (overdue)
  }, adminToken);
  if (res.status !== 201) { console.log('Create Fee Failed', res.data); process.exit(1); }
  const feeId = res.data._id;
  console.log('Create Fee Record: PASS');

  // 4. Verify fee list contains record
  res = await request('/fees', 'GET', null, adminToken);
  if (!res.data.some(f => f._id === feeId)) { console.log('Fee list check failed'); }
  else { console.log('Admin Fee List Check: PASS'); }

  // 5. Update fee status paid
  res = await request(`/fees/${feeId}`, 'PATCH', { status: 'paid', paymentMode: 'cash' }, adminToken);
  if (res.status !== 200 || res.data.status !== 'paid') { console.log('Update Fee Failed', res.data); }
  else { console.log('Update Fee Status Paid: PASS'); }

  // 6. Verify summary updates
  res = await request('/fees/summary', 'GET', null, adminToken);
  if (res.status !== 200 || res.data.totalRecords === undefined) { console.log('Fee Summary Failed', res.data); }
  else { console.log('Fee Summary Check: PASS', res.data); }

  // 8. Try student token reading own fees
  res = await request('/fees', 'GET', null, studentToken);
  if (res.status !== 200 || !res.data.some(f => f._id === feeId)) { console.log('Student Fee List Failed', res.data); }
  else { console.log('Student Read Own Fees: PASS'); }

  // 9. Try student reading summary (should fail)
  res = await request('/fees/summary', 'GET', null, studentToken);
  if (res.status === 200) { console.log('Student Read Summary Should Fail'); }
  else { console.log('Student Read Summary Blocked: PASS'); }

  // 10. Teacher fee modification must fail
  res = await request('/fees', 'POST', {
    studentId, amount: 2000, month: 'June 2026'
  }, teacherToken);
  if (res.status === 201) { console.log('Teacher modify fees should fail'); }
  else { console.log('Teacher Modify Fees Blocked: PASS'); }

  // 7. Delete fee if safe
  res = await request(`/fees/${feeId}`, 'DELETE', null, adminToken);
  if (res.status !== 200) { console.log('Delete Fee Failed', res.data); }
  else { console.log('Delete Fee Record: PASS'); }

  console.log('\nAll Fee Sync tests completed!');
  process.exit(0);
}

runTests();
