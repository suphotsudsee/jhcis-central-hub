const mysql = require('mysql2/promise');
(async () => {
  const conn = await mysql.createConnection({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: '12345678',
    database: 'jhcis_central'
  });
  
  const [queries] = await conn.execute('SELECT summary_type, sql_text FROM central_queries ORDER BY summary_type');
  console.log('=== Central Queries ===');
  for (const q of queries) {
    console.log(`${q.summary_type}: ${q.sql_text.substring(0, 80)}...`);
  }
  
  await conn.end();
})();