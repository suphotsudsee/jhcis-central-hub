#!/usr/bin/env node
/**
 * Update OP query to count distinct persons
 */

const mysql = require('mysql2/promise');
const http = require('http');

async function main() {
  // Test query first
  const jhcisConn = await mysql.createConnection({
    host: 'localhost',
    port: 3333,
    user: 'root',
    password: '123456',
    database: 'jhcisdb'
  });

  console.log('=== Testing query ===');
  const [visits] = await jhcisConn.execute(`
    SELECT 
      COUNT(*) as total_visits, 
      COUNT(DISTINCT pid) as total_persons 
    FROM visit 
    WHERE visitdate = CURDATE()
  `);
  console.log('Today:', visits[0]);

  const [yesterday] = await jhcisConn.execute(`
    SELECT 
      COUNT(*) as total_visits, 
      COUNT(DISTINCT pid) as total_persons 
    FROM visit 
    WHERE visitdate = DATE_SUB(CURDATE(), INTERVAL 1 DAY)
  `);
  console.log('Yesterday:', yesterday[0]);

  await jhcisConn.end();

  // Update central query via API
  console.log('\n=== Updating central query ===');

  const newQuery = `SELECT 
  '{hcode}' AS hcode, 
  '{date}' AS report_date, 
  DATE_FORMAT('{date}', '%Y-%m') AS report_period, 
  'op' AS summary_type, 
  (SELECT COUNT(*) FROM visit WHERE visitdate = '{date}') AS total_visits,
  (SELECT COUNT(DISTINCT pid) FROM visit WHERE visitdate = '{date}') AS total_persons
FROM dual`.replace(/\n/g, ' ');

  const payload = JSON.stringify({ sql: newQuery, isActive: true });

  const options = {
    hostname: 'localhost',
    port: 9021,
    path: '/api/v1/queries/op',
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': 'jhcis_a8HH-UqufmFmc60uZte2TWD5lSk1jE1q'
    }
  };

  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log('Response status:', res.statusCode);
        console.log('Response:', data);
        resolve();
      });
    });

    req.on('error', e => {
      console.error('Error:', e.message);
      reject(e);
    });
    req.write(payload);
    req.end();

    console.log('Request sent...');
  });
}

main().then(() => process.exit(0)).catch(e => {
  console.error('Failed:', e);
  process.exit(1);
});