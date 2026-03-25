const mysql = require('mysql2/promise');
(async () => {
  const conn = await mysql.createConnection({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: '12345678',
    database: 'jhcis_central'
  });
  
  // Check MAX date
  const [maxDate] = await conn.execute(`SELECT MAX(report_date) as max_date FROM summary_op WHERE hcode = '03633'`);
  console.log('Max date in DB:', maxDate[0].max_date);
  
  // Check data around Feb 2026
  const [febData] = await conn.execute(`
    SELECT report_date, JSON_EXTRACT(data, '$.total_visits') as visits, JSON_EXTRACT(data, '$.total_persons') as persons
    FROM summary_op 
    WHERE hcode = '03633'
    AND report_date >= '2026-02-01' AND report_date < '2026-03-01'
    AND JSON_EXTRACT(data, '$.total_visits') > 0
    ORDER BY report_date DESC
    LIMIT 15
  `);
  console.log('\nFeb 2026 with visits > 0:', febData.length, 'records');
  for (const row of febData) {
    console.log(row.report_date.toISOString().slice(0,10), 'visits:', row.visits, 'persons:', row.persons);
  }
  
  // Count records with data
  const [countWithData] = await conn.execute(`
    SELECT COUNT(*) as total FROM summary_op 
    WHERE hcode = '03633'
    AND JSON_EXTRACT(data, '$.total_visits') > 0
  `);
  console.log('\nTotal records with visits > 0:', countWithData[0].total);
  
  await conn.end();
})();