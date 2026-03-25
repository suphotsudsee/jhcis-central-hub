const mysql = require('mysql2/promise');
(async () => {
  const conn = await mysql.createConnection({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: '12345678',
    database: 'jhcis_central'
  });
  
  // Count total records
  const [count] = await conn.execute(`SELECT COUNT(*) as total FROM summary_op WHERE hcode = '03633'`);
  console.log('Total OP records:', count[0].total);
  
  // Check date range
  const [range] = await conn.execute(`SELECT MIN(report_date) as min_date, MAX(report_date) as max_date FROM summary_op WHERE hcode = '03633'`);
  console.log('Date range:', range[0].min_date.toISOString().slice(0,10), 'to', range[0].max_date.toISOString().slice(0,10));
  
  // Check records with total_persons
  const [withPersons] = await conn.execute(`SELECT COUNT(*) as total FROM summary_op WHERE hcode = '03633' AND JSON_EXTRACT(data, '$.total_persons') IS NOT NULL`);
  console.log('Records with total_persons:', withPersons[0].total);
  
  // Sample data
  const [sample] = await conn.execute(`SELECT report_date, data FROM summary_op WHERE hcode = '03633' ORDER BY report_date DESC LIMIT 5`);
  console.log('\n=== Latest 5 records ===');
  for (const row of sample) {
    const data = JSON.parse(row.data);
    console.log(row.report_date.toISOString().slice(0,10) + ': visits=' + data.total_visits + ', persons=' + (data.total_persons || 'N/A'));
  }
  
  await conn.end();
})();