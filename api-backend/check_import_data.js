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
  console.log('Total OP records for 03633:', count[0].total);
  
  const [recent] = await conn.execute('SELECT report_date, data FROM summary_op WHERE hcode = "03633" ORDER BY report_date DESC LIMIT 5');
  console.log('\nLatest 5 records:');
  for (const r of recent) {
    const data = JSON.parse(r.data);
    console.log(r.report_date.toISOString().slice(0,10), '-> visits:', data.total_visits, 'persons:', data.total_persons);
  }
  
  await conn.end();
})();