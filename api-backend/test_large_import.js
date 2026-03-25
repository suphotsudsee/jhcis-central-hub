const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const http = require('http');

async function testLargeImport() {
  // Generate test data
  const records = [];
  for (let i = 0; i < 7797; i++) {
    const date = new Date(2020, 0, 1 + i);
    const dateStr = date.toISOString().slice(0, 10);
    records.push({
      hcode: '03633',
      report_date: dateStr,
      report_period: dateStr.slice(0, 7),
      summary_type: 'OP',
      data: {
        total_visits: Math.floor(Math.random() * 100) + 10,
        total_persons: Math.floor(Math.random() * 90) + 10
      }
    });
  }
  
  // Create ZIP
  const AdmZip = require('adm-zip');
  const zip = new AdmZip();
  zip.addFile('data.json', Buffer.from(JSON.stringify(records, null, 2)));
  zip.addFile('metadata.json', Buffer.from(JSON.stringify({
    hcode: '03633',
    facility_name: 'Test',
    total_records: records.length,
    date_range: { start: '2020-01-01', end: '2026-03-25' }
  }, null, 2)));
  
  const zipBuffer = zip.toBuffer();
  console.log('ZIP size:', zipBuffer.length / 1024, 'KB');
  console.log('Records:', records.length);
  
  // Upload
  const boundary = '----FormBoundary' + Math.random().toString(16).slice(2);
  const payload = Buffer.concat([
    Buffer.from('--' + boundary + '\r\n'),
    Buffer.from('Content-Disposition: form-data; name="package"; filename="test.zip"\r\n'),
    Buffer.from('Content-Type: application/zip\r\n\r\n'),
    zipBuffer,
    Buffer.from('\r\n--' + boundary + '--\r\n'),
  ]);
  
  const options = {
    hostname: 'localhost',
    port: 9021,
    path: '/api/v1/import/upload',
    method: 'POST',
    headers: {
      'Content-Type': 'multipart/form-data; boundary=' + boundary,
      'X-API-Key': 'jhcis_a8HH-UqufmFmc60uZte2TWD5lSk1jE1q',
      'Content-Length': payload.length,
    },
  };
  
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log('Status:', res.statusCode);
        console.log('Response:', data);
        resolve();
      });
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

testLargeImport().catch(console.error);