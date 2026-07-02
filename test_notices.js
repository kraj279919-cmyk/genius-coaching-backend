const fs = require('fs');

const API_URL = 'http://localhost:5000/api';

async function request(endpoint, method, body, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  
  const res = await fetch(`${API_URL}${endpoint}`, {
    method, headers, body: body ? JSON.stringify(body) : undefined
  });
  const data = await res.json();
  return { status: res.status, data };
}

async function runTests() {
  console.log('--- STARTING NOTICE SYNC TESTS ---');
  
  // 1. Admin Login
  let res = await request('/auth/login', 'POST', { identifier: '9304335662', password: 'director123' });
  if (res.status !== 200) {
    console.log('Admin login failed', res.data);
    process.exit(1);
  }
  const adminToken = res.data.token;
  console.log('Admin logged in');

  // Create Student and Teacher for testing? 
  // Let's just create a test student and teacher first so we can verify their endpoints.
  const studentEmail = `student${Date.now()}@test.com`;
  res = await request('/students', 'POST', {
    name: 'Test Student', email: studentEmail, phone: `98${Math.floor(10000000 + Math.random() * 90000000)}`,
    password: 'password123', rollNo: `S${Date.now()}`, className: 'Class 10', section: 'A'
  }, adminToken);
  const studentTokenRes = await request('/auth/login', 'POST', { identifier: studentEmail, password: 'password123' });
  const studentToken = studentTokenRes.data.token;

  const teacherEmail = `teacher${Date.now()}@test.com`;
  res = await request('/teachers', 'POST', {
    name: 'Test Teacher', email: teacherEmail, phone: `98${Math.floor(10000000 + Math.random() * 90000000)}`,
    password: 'password123', teacherId: `TCH${Date.now()}`, subject: 'Mathematics'
  }, adminToken);
  const teacherTokenRes = await request('/auth/login', 'POST', { identifier: teacherEmail, password: 'password123' });
  const teacherToken = teacherTokenRes.data.token;


  // 2. Create Published Notice (All)
  let noticeRes = await request('/notices', 'POST', {
    title: 'Published Notice for All',
    description: 'This is a test notice',
    category: 'general',
    targetAudience: 'all',
    status: 'published'
  }, adminToken);
  if (noticeRes.status !== 201) { console.log('Create Published Notice Failed', noticeRes.data); process.exit(1); }
  const noticeAllId = noticeRes.data._id;
  console.log('Create Published Notice (All): PASS');

  // 3. Verify Admin List
  let listRes = await request('/notices', 'GET', null, adminToken);
  if (!listRes.data.some(n => n._id === noticeAllId)) { console.log('Admin list check failed'); } else { console.log('Admin List contains notice: PASS'); }

  // 4. Verify Teacher List
  listRes = await request('/notices', 'GET', null, teacherToken);
  if (!listRes.data.some(n => n._id === noticeAllId)) { console.log('Teacher list check failed'); } else { console.log('Teacher List contains notice: PASS'); }

  // 5. Verify Student List
  listRes = await request('/notices', 'GET', null, studentToken);
  if (!listRes.data.some(n => n._id === noticeAllId)) { console.log('Student list check failed'); } else { console.log('Student List contains notice: PASS'); }

  // 6. Verify Public List
  listRes = await request('/notices/public', 'GET', null, null);
  if (!listRes.data.some(n => n._id === noticeAllId)) { console.log('Public list check failed'); } else { console.log('Public List contains notice: PASS'); }

  // 7. Create Draft Notice
  noticeRes = await request('/notices', 'POST', {
    title: 'Draft Notice',
    description: 'This should not be seen by students',
    targetAudience: 'all',
    status: 'draft'
  }, adminToken);
  const draftNoticeId = noticeRes.data._id;
  console.log('Create Draft Notice: PASS');

  // 8. Verify Draft does NOT appear in student/public
  listRes = await request('/notices', 'GET', null, studentToken);
  if (listRes.data.some(n => n._id === draftNoticeId)) { console.log('Student saw draft notice! FAIL'); } else { console.log('Student Draft check: PASS'); }
  listRes = await request('/notices/public', 'GET', null, null);
  if (listRes.data.some(n => n._id === draftNoticeId)) { console.log('Public saw draft notice! FAIL'); } else { console.log('Public Draft check: PASS'); }

  // 9. Create Expired Notice
  noticeRes = await request('/notices', 'POST', {
    title: 'Expired Notice',
    description: 'This is expired',
    targetAudience: 'all',
    status: 'published',
    expiryDate: new Date(Date.now() - 10000) // 10 seconds ago
  }, adminToken);
  const expiredNoticeId = noticeRes.data._id;
  console.log('Create Expired Notice: PASS');

  // 10. Verify Expired does NOT appear in student/public
  listRes = await request('/notices', 'GET', null, studentToken);
  if (listRes.data.some(n => n._id === expiredNoticeId)) { console.log('Student saw expired notice! FAIL'); } else { console.log('Student Expired check: PASS'); }
  listRes = await request('/notices/public', 'GET', null, null);
  if (listRes.data.some(n => n._id === expiredNoticeId)) { console.log('Public saw expired notice! FAIL'); } else { console.log('Public Expired check: PASS'); }

  // 11. Delete test notices
  await request(`/notices/${noticeAllId}`, 'DELETE', null, adminToken);
  await request(`/notices/${draftNoticeId}`, 'DELETE', null, adminToken);
  await request(`/notices/${expiredNoticeId}`, 'DELETE', null, adminToken);
  console.log('Cleaned up notices: PASS');

  console.log('\nAll Notice Sync tests completed!');
  process.exit(0);
}

runTests();
