const mysql = require('mysql2/promise');
(async () => {
  const conn = await mysql.createConnection({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: '12345678',
    database: 'jhcis_central'
  });
  
  // Check all records
  const [count] = await conn.execute('SELECT COUNT(*) as total FROM summary_op');
  console.log('Total OP records (all):', count[0].total);
  
  // Check by hcode
  const [byHcode] = await conn.execute('SELECT hcode, COUNT(*) as cnt FROM summary_op GROUP BY hcode');
  console.log('\nBy hcode:');
  for (const r of byHcode) {
    console.log(r.hcode, ':', r.cnt);
  }
  
  // Check recent syncs
  const [recent] = await conn.execute('SELECT hcode, report_date, created_at FROM summary_op ORDER BY created_at DESC LIMIT 10');
  console.log('\nRecent syncs:');
  for (const r of recent) {
    console.log(r.hcode, r.report_date.toISOString().slice(0,10), r.created_at.toISOString().slice(11,19));
  }
  
  await conn.end();
})();