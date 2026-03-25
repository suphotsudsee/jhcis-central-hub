const mysql = require('mysql2/promise');
(async () => {
  const conn = await mysql.createConnection({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: '12345678',
    database: 'jhcis_central'
  });
  
  const [count] = await conn.execute('SELECT COUNT(*) as total FROM summary_op WHERE hcode = "03633"');
  console.log('Total records for 03633:', count[0].total);
  
  const [range] = await conn.execute('SELECT MIN(report_date) as min, MAX(report_date) as max FROM summary_op WHERE hcode = "03633"');
  console.log('Date range:', range[0].min, 'to', range[0].max);
  
  await conn.end();
})();