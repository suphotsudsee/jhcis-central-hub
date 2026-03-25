const mysql = require('mysql2/promise');
(async () => {
  const conn = await mysql.createConnection({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: '12345678',
    database: 'jhcis_central'
  });
  
  // Check recent syncs
  const [recent] = await conn.execute(`
    SELECT hcode, report_date, summary_type, created_at, updated_at 
    FROM summary_op 
    ORDER BY created_at DESC 
    LIMIT 10
  `);
  console.log('=== Recent OP Syncs ===');
  for (const row of recent) {
    console.log(`${row.hcode} | ${row.report_date.toISOString().slice(0,10)} | ${row.summary_type} | ${row.created_at}`);
  }
  
  // Check health facilities
  const [facilities] = await conn.execute('SELECT hcode, facility_name, status FROM health_facilities');
  console.log('\n=== Health Facilities ===');
  for (const f of facilities) {
    console.log(`${f.hcode}: ${f.facility_name} (${f.status})`);
  }
  
  await conn.end();
})();