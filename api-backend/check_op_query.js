const mysql = require('mysql2/promise');
(async () => {
  const conn = await mysql.createConnection({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: '12345678',
    database: 'jhcis_central'
  });
  
  const [rows] = await conn.execute("SELECT summary_type, sql_text, updated_at FROM central_queries WHERE summary_type = 'op'");
  console.log('OP Query:', JSON.stringify(rows[0], null, 2));
  
  await conn.end();
})();