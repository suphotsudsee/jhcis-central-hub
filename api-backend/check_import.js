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
  console.log('Total OP records:', count[0].total);
  
  const [sample] = await conn.execute('SELECT hcode, report_date, data FROM summary_op WHERE hcode = "03633" ORDER BY report_date DESC LIMIT 5');
  console.log('\nSample data:');
  for (const r of sample) {
    console.log(r.report_date.toISOString().slice(0,10), r.data);
  }
  
  await conn.end();
})();