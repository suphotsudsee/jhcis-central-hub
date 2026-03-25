const mysql = require('mysql2/promise');

(async () => {
  const conn = await mysql.createConnection({
    host: 'localhost',
    port: 3333,
    user: 'root',
    password: '123456',
    database: 'jhcisdb'
  });
  
  // Test the exact query from central_queries
  const query = `SELECT    '03633' AS hcode,    '2026-02-09' AS report_date,    DATE_FORMAT('2026-02-09', '%Y-%m') AS report_period,    'op' AS summary_type,    (SELECT COUNT(*) FROM visit WHERE visitdate = '2026-02-09') AS total_visits,   (SELECT COUNT(DISTINCT pid) FROM visit WHERE visitdate = '2026-02-09') AS total_persons FROM dual`;
  
  console.log('=== Testing query ===');
  console.log('Query:', query);
  
  const [rows] = await conn.execute(query);
  console.log('\nResult:', JSON.stringify(rows[0], null, 2));
  
  await conn.end();
})();