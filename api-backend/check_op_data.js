const mysql = require('mysql2/promise');

(async () => {
  const conn = await mysql.createConnection({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: '12345678',
    database: 'jhcis_central'
  });
  
  const [rows] = await conn.execute(`
    SELECT hcode, report_date, summary_type, data, updated_at 
    FROM summary_op 
    WHERE hcode = '03633' 
    ORDER BY report_date DESC 
    LIMIT 5
  `);
  
  console.log('=== OP Summary Data ===');
  for (const row of rows) {
    console.log(`\nDate: ${row.report_date.toISOString().slice(0, 10)}`);
    console.log('Data:', row.data);
  }
  
  await conn.end();
})();