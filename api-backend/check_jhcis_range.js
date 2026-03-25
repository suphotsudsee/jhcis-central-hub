const mysql = require('mysql2/promise');
(async () => {
  const jhcis = await mysql.createConnection({
    host: 'localhost',
    port: 3333,
    user: 'root',
    password: '123456',
    database: 'jhcisdb'
  });
  
  // Check max visitdate
  const [max] = await jhcis.execute(`
    SELECT MAX(visitdate) as max_date, MIN(visitdate) as min_date
    FROM visit 
    WHERE visitdate > '2020-01-01'
  `);
  console.log('=== JHCIS Date Range ===');
  console.log(`Min: ${max[0].min_date}`);
  console.log(`Max: ${max[0].max_date}`);
  
  // Check last 30 days with data
  const [recent] = await jhcis.execute(`
    SELECT visitdate, COUNT(*) as visits, COUNT(DISTINCT pid) as persons
    FROM visit 
    WHERE visitdate >= DATE_SUB(CURDATE(), INTERVAL 60 DAY)
    GROUP BY visitdate
    ORDER BY visitdate DESC
    LIMIT 30
  `);
  console.log('\n=== Last 30 days with data ===');
  for (const row of recent) {
    console.log(`${row.visitdate.toISOString().slice(0,10)} | visits: ${row.visits} | persons: ${row.persons}`);
  }
  
  await jhcis.end();
})();