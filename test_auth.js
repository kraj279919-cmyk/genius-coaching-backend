const API_URL = 'http://localhost:5000/api/auth/login';

async function testLogin(role, identifier, password, expectedStatus) {
  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, password })
    });
    const data = await res.json();
    const passed = res.status === expectedStatus;
    console.log(`[${passed ? 'PASS' : 'FAIL'}] ${role} login with ${identifier} - Expected: ${expectedStatus}, Got: ${res.status}`);
    if (!passed) console.log(data);
    return passed;
  } catch (err) {
    console.error('Error:', err.message);
    return false;
  }
}

async function runTests() {
  console.log('--- STARTING LOGIN TESTS ---');
  let allPass = true;
  
  // Director
  allPass &= await testLogin('Director (Email)', 'geniuscoachinginstitute1@gmail.com', 'director123', 200);
  allPass &= await testLogin('Director (Phone)', '9304335662', 'director123', 200);
  
  // Teacher
  allPass &= await testLogin('Teacher (Email)', 'teacher@test.com', 'password123', 200);
  allPass &= await testLogin('Teacher (Phone)', '9988776655', 'password123', 200);
  
  // Student
  allPass &= await testLogin('Student (Email)', 'student@test.com', 'password123', 200);
  allPass &= await testLogin('Student (Phone)', '1234567890', 'password123', 200);
  
  // Failure cases
  allPass &= await testLogin('Inactive Account', 'inactive@test.com', 'password123', 403);
  allPass &= await testLogin('Wrong Password', '9304335662', 'wrong123', 401);
  allPass &= await testLogin('Wrong Phone', '9999999999', 'director123', 401);
  
  if (allPass) {
    console.log('\n✅ All tests passed successfully!');
  } else {
    console.log('\n❌ Some tests failed.');
  }
  process.exit(0);
}

runTests();
