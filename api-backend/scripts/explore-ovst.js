/**
 * Explore ovst table for OP query
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

  // Describe ovst table
  console.log('=== ovst table structure ===');
  const [cols] = await conn.execute('DESCRIBE ovst');
  cols.forEach(col => {
    console.log(`  ${col.Field}: ${col.Type} ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'} ${col.Key ? `[${col.Key}]` : ''}`);
  });

  // Sample data
  console.log('\n=== Sample ovst data ===');
  const [sample] = await conn.execute('SELECT * FROM ovst LIMIT 2');
  console.log(sample);

  // Date range
  console.log('\n=== Date range in ovst ===');
  const [dateRange] = await conn.execute(`
    SELECT MIN(vstdate) as min_date, MAX(vstdate) as max_date, COUNT(*) as total
    FROM ovst
  `);
  console.log('Date range:', dateRange[0]);

  // Count by date (last 10 days)
  console.log('\n=== Visit count last 10 days ===');
  const [countByDate] = await conn.execute(`
    SELECT vstdate, COUNT(*) as visit_count
    FROM ovst
    WHERE vstdate >= DATE_SUB(CURDATE(), INTERVAL 10 DAY)
    GROUP BY vstdate
    ORDER BY vstdate DESC
  `);
  console.log('Recent visits:', countByDate);

  // Check clinic/department
  console.log('\n=== ovst columns related to clinic ===');
  const ovstCols = cols.filter(c => 
    c.Field.toLowerCase().includes('clinic') || 
    c.Field.toLowerCase().includes('depart') ||
    c.Field.toLowerCase().includes('type')
  );
  console.log('Clinic columns:', ovstCols.map(c => c.Field));

  // Check for clinic column
  console.log('\n=== Sample with clinic ===');
  const [sampleClinic] = await conn.execute(`
    SELECT pcucode, vn, vstdate, clinic, COUNT(*) as cnt
    FROM ovst
    GROUP BY pcucode, clinic
    LIMIT 10
  `);
  console.log('Clinic distribution:', sampleClinic);

  // Visit count per day for last 5 years
  console.log('\n=== Daily visits summary (last 5 years) ===');
  const [dailySummary] = await conn.execute(`
    SELECT 
      vstdate,
      COUNT(*) as visit_count
    FROM ovst
    WHERE vstdate >= DATE_SUB(CURDATE(), INTERVAL 5 YEAR)
    GROUP BY vstdate
    ORDER BY vstdate DESC
    LIMIT 20
  `);
  console.log('Daily summary (sample):', dailySummary);

  // Count total in 5 years
  const [total5Years] = await conn.execute(`
    SELECT COUNT(*) as total
    FROM ovst
    WHERE vstdate >= DATE_SUB(CURDATE(), INTERVAL 5 YEAR)
  `);
  console.log('\nTotal visits in 5 years:', total5Years[0].total);

  await conn.end();
}

explore().catch(e => console.error('Error:', e.message));