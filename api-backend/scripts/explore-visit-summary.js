/**
 * Explore visit table for OP query
 */

const mysql = require('mysql2/promise');

async function explore() {
  const conn = await mysql.createConnection({
    host: 'localhost',
    port: 3333,
    user: 'root',
    password: '123456',
    database: 'jhcisdb'
  });

  // Date range in visit table
  console.log('=== Date range in visit ===');
  const [dateRange] = await conn.execute(`
    SELECT MIN(visitdate) as min_date, MAX(visitdate) as max_date, COUNT(*) as total
    FROM visit
  `);
  console.log('Date range:', dateRange[0]);

  // Sample visit data
  console.log('\n=== Sample visit data ===');
  const [sample] = await conn.execute(`
    SELECT pcucode, visitno, visitdate, pcucodeperson, pid, timeservice, servicetype
    FROM visit 
    LIMIT 5
  `);
  console.log('Sample:', sample);

  // Visit count per day (last 10 days with data)
  console.log('\n=== Daily visits (recent) ===');
  const [dailyVisits] = await conn.execute(`
    SELECT visitdate, COUNT(*) as visit_count
    FROM visit
    GROUP BY visitdate
    ORDER BY visitdate DESC
    LIMIT 15
  `);
  console.log('Daily visits:', dailyVisits);

  // Count by service type
  console.log('\n=== Service type distribution ===');
  const [serviceType] = await conn.execute(`
    SELECT servicetype, COUNT(*) as count
    FROM visit
    GROUP BY servicetype
    ORDER BY count DESC
  `);
  console.log('Service types:', serviceType);

  // Total visits in last 5 years
  console.log('\n=== Visits in last 5 years ===');
  const [total5Years] = await conn.execute(`
    SELECT COUNT(*) as total
    FROM visit
    WHERE visitdate >= DATE_SUB(CURDATE(), INTERVAL 5 YEAR)
  `);
  console.log('Total visits (5 years):', total5Years[0].total);

  // Daily summary for last 5 years
  console.log('\n=== Daily summary (5 years) - sample ===');
  const [daily5Years] = await conn.execute(`
    SELECT 
      visitdate,
      COUNT(*) as visit_count
    FROM visit
    WHERE visitdate >= DATE_SUB(CURDATE(), INTERVAL 5 YEAR)
    GROUP BY visitdate
    ORDER BY visitdate DESC
    LIMIT 20
  `);
  console.log('Daily summary:', daily5Years);

  // Check clinic in visit
  console.log('\n=== Clinic in visit ===');
  const [visitClinic] = await conn.execute(`
    SELECT visitdate, COUNT(*) as cnt
    FROM visit
    WHERE visitdate >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
    GROUP BY visitdate
    ORDER BY visitdate DESC
  `);
  console.log('Last 30 days visits:', visitClinic.length, 'days with data');
  console.log('Sample:', visitClinic.slice(0, 10));

  await conn.end();
}

explore().catch(e => console.error('Error:', e.message));