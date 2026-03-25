const fs = require('fs');
const http = require('http');

// Read ZIP file
const zipPath = 'C:\\fullstack\\jhcis-node-agent\\node-script\\release\\JHCISyncDesktop\\exports\\jhcis_sync_03633_20260325_163324.zip';
const apiKey = 'jhcis_a8HH-UqufmFmc60uZte2TWD5lSk1jE1q';

const zipData = fs.readFileSync(zipPath);
console.log('ZIP size:', zipData.length, 'bytes');

const boundary = '----FormBoundary' + Math.random().toString(16).slice(2);

const payload = Buffer.concat([
  Buffer.from('--' + boundary + '\r\n'),
  Buffer.from('Content-Disposition: form-data; name="package"; filename="package.zip"\r\n'),
  Buffer.from('Content-Type: application/zip\r\n\r\n'),
  zipData,
  Buffer.from('\r\n--' + boundary + '--\r\n'),
]);

console.log('Payload size:', payload.length, 'bytes');

const options = {
  hostname: 'localhost',
  port: 9021,
  path: '/api/v1/import/upload',
  method: 'POST',
  headers: {
    'Content-Type': 'multipart/form-data; boundary=' + boundary,
    'X-API-Key': apiKey,
    'Content-Length': payload.length,
  },
};

console.log('Sending request...');
const startTime = Date.now();

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const elapsed = Date.now() - startTime;
    console.log('Time:', elapsed, 'ms');
    console.log('Status:', res.statusCode);
    console.log('Response:', data.substring(0, 500));
  });
});

req.on('error', (e) => {
  console.error('Error:', e.message);
  console.error('Code:', e.code);
});

req.on('timeout', () => {
  console.error('Request timeout');
  req.destroy();
});

req.setTimeout(120000); // 2 minutes
req.write(payload);
req.end();