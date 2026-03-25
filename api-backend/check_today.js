const mysql = require('mysql2/promise');
(async () => {
  const conn = await mysql.createConnection({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: '12345678',
    database: 'jhcis_central'
  });
  
  // Check syncs from today
  const [today] = await conn.execute(`
    SELECT hcode, report_date, data, created_at 
    FROM summary_op 
    WHERE DATE(created_at) = CURDATE()
    ORDER BY created_at DESC
  `);
  console.log('=== Today Syncs (' + today.length + ' records) ===');
  for (const row of today) {
    const data = JSON.parse(row.data);
    console.log(`${row.hcode} | ${row.report_date.toISOString().slice(0,10)} | visits: ${data.total_visits} | persons: ${data.total_persons || 'N/A'} | ${row.created_at.toISOString().slice(11,19)}`);
  }
  
  await conn.end();
})();