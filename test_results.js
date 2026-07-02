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
  console.log('--- STARTING RESULTS MANAGEMENT TESTS ---');
  
  let res = await request('/auth/login', 'POST', { identifier: '9304335662', password: 'director123' });
  if (res.status !== 200) { console.log('Admin login failed', res.data); process.exit(1); }
  const adminToken = res.data.token;
  console.log('Admin logged in');

  const studentEmail = `studentres${Date.now()}@test.com`;
  res = await request('/students', 'POST', {
    name: 'Res Student', email: studentEmail, phone: `98${Math.floor(10000000 + Math.random() * 90000000)}`,
    password: 'password123', studentId: `S${Date.now()}`, class: 'Class 9', section: 'A'
  }, adminToken);
  if (res.status !== 201) { console.log('Create Student Failed', res.data); process.exit(1); }
  const studentId = res.data._id;
  const studentTokenRes = await request('/auth/login', 'POST', { identifier: studentEmail, password: 'password123' });
  const studentToken = studentTokenRes.data.token;

  const teacherEmail = `teacherres${Date.now()}@test.com`;
  res = await request('/teachers', 'POST', {
    name: 'Res Teacher', email: teacherEmail, phone: `98${Math.floor(10000000 + Math.random() * 90000000)}`,
    password: 'password123', teacherId: `TCH${Date.now()}`, subject: 'Mathematics'
  }, adminToken);
  const teacherTokenRes = await request('/auth/login', 'POST', { identifier: teacherEmail, password: 'password123' });
  const teacherToken = teacherTokenRes.data.token;

  // 3. Create result for real student _id
  res = await request('/results', 'POST', {
    studentId,
    examName: 'Mid-Term',
    subject: 'Mathematics',
    class: 'Class 9',
    marksObtained: 85,
    totalMarks: 100
  }, adminToken);
  if (res.status !== 201) { console.log('Create Result Failed', res.data); process.exit(1); }
  const resultId = res.data._id;
  if (res.data.percentage !== 85 || res.data.grade !== 'A') {
    console.log('Percentage/Grade calculation failed', res.data); process.exit(1);
  }
  console.log('Create Result Record & Calculation: PASS');

  // 4. Fetch student result list
  res = await request(`/results/student/${studentId}`, 'GET', null, adminToken);
  if (!res.data.some(r => r._id === resultId)) { console.log('Fetch student results failed'); }
  else { console.log('Fetch Student Results: PASS'); }

  // 5. Fetch progress summary
  res = await request(`/results/progress/${studentId}`, 'GET', null, adminToken);
  if (res.status !== 200 || res.data.averagePercentage !== 85) { console.log('Progress Summary Failed', res.data); }
  else { console.log('Progress Summary Check: PASS'); }

  // 6. Update result
  res = await request(`/results/${resultId}`, 'PATCH', { marksObtained: 92 }, adminToken);
  if (res.status !== 200 || res.data.marksObtained !== 92 || res.data.grade !== 'A+') { 
    console.log('Update Result Failed', res.data); 
  } else { console.log('Update Result Calculation: PASS'); }

  // 7. Student token can view own results
  res = await request(`/results/student/${studentId}`, 'GET', null, studentToken);
  if (res.status !== 200 || !res.data.some(r => r._id === resultId)) { console.log('Student view own failed'); }
  else { console.log('Student View Own Results: PASS'); }

  // 8. Student token cannot view other student's results
  res = await request(`/results/progress/some-other-id`, 'GET', null, studentToken);
  if (res.status === 200) { console.log('Student should be blocked from others'); }
  else { console.log('Student Access Isolation: PASS'); }

  // 9. Dashboard result summary returns clean data
  res = await request('/results/summary', 'GET', null, adminToken);
  if (res.status !== 200 || res.data.totalResults === undefined) { console.log('Summary Failed', res.data); }
  else { console.log('Result Summary Check: PASS', res.data); }

  console.log('\nAll Result Sync tests completed!');
  process.exit(0);
}

runTests();
