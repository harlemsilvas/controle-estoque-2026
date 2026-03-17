const http = require('http');

const options = {
  hostname: 'localhost',
  port: 4300,
  path: '/login',
  method: 'OPTIONS',
  headers: {
    'Origin': 'http://localhost:4173'
  }
};

const req = http.request(options, (res) => {
  console.log('Status:', res.statusCode);
  console.log('\nHeaders:');
  Object.entries(res.headers).forEach(([key, value]) => {
    console.log(`  ${key}: ${value}`);
  });
  
  // Check for CORS header
  if (res.headers['access-control-allow-origin']) {
    console.log('\n✓ CORS header found:', res.headers['access-control-allow-origin']);
  } else {
    console.log('\n✗ CORS header NOT found');
  }
});

req.on('error', (e) => {
  console.error('Error:', e.message);
});

req.end();
