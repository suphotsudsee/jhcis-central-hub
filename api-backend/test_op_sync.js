const mysql = require('mysql2/promise');
const http = require('http');

async function testSync() {
  // Get some dates with data from JHCIS
  const jhcisConn = await mysql.createConnection({
    host: 'localhost',
    port: 3333,
    user: 'root',
    password: '123456',
    database: 'jhcisdb'
  });

  console.log('=== Finding dates with data ===');
  const [dates] = await jhcisConn.execute(`
    SELECT DISTINCT visitdate as date, 
           COUNT(*) as visits, 
           COUNT(DISTINCT pid) as persons
    FROM visit 
    WHERE visitdate IS NOT NULL 
    AND visitdate != '0000-00-00'
    GROUP BY visitdate
    ORDER BY visitdate DESC 
    LIMIT 10
  `);
  console.log('Recent dates:', dates);
  
  await jhcisConn.end();

  if (dates.length === 0) {
    console.log('No data to test');
    return;
  }

  // Test sync for the most recent date
  const testDate = dates[0].date.toISOString().slice(0, 10);
  console.log(`\n=== Testing sync for ${testDate} ===`);
  console.log(`Visits: ${dates[0].visits}, Persons: ${dates[0].persons}`);

  const payload = JSON.stringify({
    hcode: '03633',
    report_date: testDate,
    report_period: testDate.slice(0, 7),
    summary_type: 'op',
    total_visits: dates[0].visits,
    total_persons: dates[0].persons
  });

  const options = {
    hostname: 'localhost',
    port: 9021,
    path: '/api/v1/sync/op',
    method: 'POST',
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
    req.on('error', e => reject(e));
    req.write(payload);
    req.end();
  });
}

testSync().then(() => process.exit(0)).catch(e => {
  console.error('Failed:', e);
  process.exit(1);
});