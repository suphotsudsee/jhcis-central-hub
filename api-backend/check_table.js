const mysql = require('mysql2/promise');
(async () => {
  const conn = await mysql.createConnection({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: '12345678',
    database: 'jhcis_central'
  });
  
  // Check table structure
  const [structure] = await conn.execute('DESCRIBE summary_op');
  console.log('=== summary_op structure ===');
  for (const col of structure) {
    console.log(col.Field, ':', col.Type);
  }
  
  // Check if table was truncated
  const [status] = await conn.execute('SHOW TABLE STATUS LIKE "summary_op"');
  console.log('\n=== Table status ===');
  console.log('Rows:', status[0]?.Rows);
  console.log('Auto_increment:', status[0]?.Auto_increment);
  console.log('Create_time:', status[0]?.Create_time);
  console.log('Update_time:', status[0]?.Update_time);
  
  await conn.end();
})();