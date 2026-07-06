const https = require('https');

const fetchEndpoint = (url) => {
  return new Promise((resolve) => {
    https.get(url, (res) => {
      resolve({ url, status: res.statusCode });
    }).on('error', (err) => {
      resolve({ url, error: err.message });
    });
  });
};

const runAudit = async () => {
  const publicUrls = [
    'https://genius-coaching-backend.onrender.com/',
    'https://genius-coaching-backend.onrender.com/api/version',
    'https://genius-coaching-backend.onrender.com/api/website/public',
    'https://genius-coaching-backend.onrender.com/api/notices/public',
    'https://genius-coaching-backend.onrender.com/api/gallery/public'
  ];

  const protectedUrls = [
    'https://genius-coaching-backend.onrender.com/api/ops/health',
    'https://genius-coaching-backend.onrender.com/api/analytics/overview',
    'https://genius-coaching-backend.onrender.com/api/admin/settings'
  ];

  console.log('--- Public Endpoints ---');
  for (const url of publicUrls) {
    const res = await fetchEndpoint(url);
    console.log(`${res.url} -> ${res.status}`);
  }

  console.log('\n--- Protected Endpoints (Should be 401/403) ---');
  for (const url of protectedUrls) {
    const res = await fetchEndpoint(url);
    console.log(`${res.url} -> ${res.status}`);
  }
};

runAudit();
