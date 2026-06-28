async function testHttpLogin() {
  try {
    const res = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: '9999999999',
        password: 'password123'
      })
    });
    const data = await res.json();
    console.log('Login response:', res.status, data);
  } catch (error) {
    console.error('Login failed:', error);
  }
}

testHttpLogin();
