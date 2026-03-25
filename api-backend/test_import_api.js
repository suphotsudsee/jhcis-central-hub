const http = require('http');
const fs = require('fs');
const path = require('path');

const zipPath = 'C:\\fullstack\\jhcis-node-agent\\node-script\\release\\JHCISyncDesktop\\exports\\jhcis_sync_03633_20260325_163324.zip';
const apiKey = 'jhcis_a8HH-UqufmFmc60uZte2TWD5lSk1jE1q';

if (!fs.existsSync(zipPath)) {
  console.log('ZIP file not found:', zipPath);
  process.exit(1);
}

const boundary = '----FormBoundary' + Math.random().toString(16).slice(2);
const fileData = fs.readFileSync(zipPath);

const payload = Buffer.concat([
  Buffer.from('--' + boundary + '\r\n'),
  Buffer.from('Content-Disposition: form-data; name="package"; filename="package.zip"\r\n'),
  Buffer.from('Content-Type: application/zip\r\n\r\n'),
  fileData,
  Buffer.from('\r\n--' + boundary + '--\r\n'),
]);

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

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Response:', data);
  });
});

req.on('error', e => console.error('Error:', e.message));
req.write(payload);
req.end();