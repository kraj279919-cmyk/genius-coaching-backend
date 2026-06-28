const API_URL = 'http://localhost:5000/api';

async function runTests() {
  console.log('--- STARTING BACKEND SECURITY TESTS ---');
  let adminToken, teacherToken, studentToken;

  const fetchJson = async (url, options) => {
    const res = await fetch(url, options);
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      const err = new Error(`HTTP ${res.status}`);
      err.status = res.status;
      err.data = data;
      throw err;
    }
    return { status: res.status, data };
  };

  // 1. Login as Director
  try {
    const res = await fetchJson(`${API_URL}/auth/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: 'geniuscoachinginstitute1@gmail.com', password: 'director123' })
    });
    adminToken = res.data.token;
    console.log('✅ Director login successful');
  } catch (e) {
    console.error('❌ Director login failed', e.data?.message || e.message);
  }

  // 2. Login as Teacher
  try {
    const res = await fetchJson(`${API_URL}/auth/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: '9876543210', password: 'password123' })
    });
    teacherToken = res.data.token;
    console.log('✅ Teacher login successful');
  } catch (e) {
    console.error('❌ Teacher login failed', e.data?.message || e.message);
  }

  // 3. Login as Student
  try {
    const res = await fetchJson(`${API_URL}/auth/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: '9999999999', password: 'password123' })
    });
    studentToken = res.data.token;
    console.log('✅ Student login successful');
  } catch (e) {
    console.error('❌ Student login failed', e.data?.message || e.message);
  }

  const testRoute = async (name, url, method, token, expectedStatus) => {
    try {
      const res = await fetch(`${API_URL}${url}`, {
        method,
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.status === expectedStatus || (expectedStatus === 200 && res.status === 201)) {
        console.log(`✅ [PASS] ${name} returned ${res.status}`);
      } else {
        console.log(`❌ [FAIL] ${name} returned ${res.status}, expected ${expectedStatus}`);
      }
    } catch (e) {
      console.log(`❌ [FAIL] ${name} error: ${e.message}`);
    }
  };

  // Admin route: POST /students
  await testRoute('Teacher token on admin route (POST /students)', '/students', 'POST', teacherToken, 403);
  await testRoute('Student token on admin route (POST /students)', '/students', 'POST', studentToken, 403);
  
  // Teacher route: GET /students
  await testRoute('Student token on teacher route (GET /students)', '/students', 'GET', studentToken, 403);

  // Pass tests
  await testRoute('Director token on admin route (GET /dashboard/admin)', '/dashboard/admin', 'GET', adminToken, 200);
  await testRoute('Teacher token on teacher route (GET /dashboard/teacher)', '/dashboard/teacher', 'GET', teacherToken, 200);
  await testRoute('Student token on student own routes (GET /dashboard/student)', '/dashboard/student', 'GET', studentToken, 200);

  console.log('--- BACKEND SECURITY TESTS FINISHED ---');
}

runTests();
