const mysql = require('mysql2/promise');
(async () => {
  const conn = await mysql.createConnection({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: '12345678',
    database: 'jhcis_central'
  });
  
  // Check CURDATE()
  const [curdate] = await conn.execute('SELECT CURDATE() as today, NOW() as now');
  console.log('MySQL CURDATE():', curdate[0].today);
  console.log('MySQL NOW():', curdate[0].now);
  
  // Check latest data
  const [latest] = await conn.execute(`SELECT MAX(report_date) as max_date FROM summary_op WHERE hcode = '03633'`);
  console.log('Latest data date:', latest[0].max_date);
  
  // Check data in last 30 days from CURDATE()
  const [recent] = await conn.execute(`
    SELECT report_date, JSON_EXTRACT(data, '$.total_visits') as visits
    FROM summary_op 
    WHERE hcode = '03633' 
    AND report_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
    ORDER BY report_date DESC
    LIMIT 10
  `);
  console.log('\nRecent data (from CURDATE - 30 days):', recent.length, 'records');
  for (const row of recent) {
    console.log(row.report_date.toISOString().slice(0,10), 'visits:', row.visits);
  }
  
  // Check data in 2026-02
  const [feb] = await conn.execute(`
    SELECT report_date, JSON_EXTRACT(data, '$.total_visits') as visits
    FROM summary_op 
    WHERE hcode = '03633' 
    AND report_date >= '2026-02-01' AND report_date < '2026-03-01'
    ORDER BY report_date DESC
    LIMIT 10
  `);
  console.log('\nFeb 2026 data:', feb.length, 'records');
  for (const row of feb) {
    console.log(row.report_date.toISOString().slice(0,10), 'visits:', row.visits);
  }
  
  await conn.end();
})();