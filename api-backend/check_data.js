const mysql = require('mysql2/promise');
(async () => {
  const conn = await mysql.createConnection({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: '12345678',
    database: 'jhcis_central'
  });
  
  const [rows] = await conn.execute(`SELECT hcode, report_date, data FROM summary_op WHERE hcode = '03633' AND report_date = '2026-02-09'`);
  console.log('Data:', rows[0]?.data);
  
  await conn.end();
})();