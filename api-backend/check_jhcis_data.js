const mysql = require('mysql2/promise');
(async () => {
  const jhcis = await mysql.createConnection({
    host: 'localhost',
    port: 3333,
    user: 'root',
    password: '123456',
    database: 'jhcisdb'
  });
  
  // Check dates with data (last 60 days)
  const [recent] = await jhcis.execute(`
    SELECT visitdate, COUNT(*) as visits, COUNT(DISTINCT pid) as persons
    FROM visit 
    WHERE visitdate >= '2026-01-01'
    GROUP BY visitdate
    ORDER BY visitdate DESC
    LIMIT 30
  `);
  console.log('Dates with data in 2026:');
  for (const r of recent) {
    console.log(r.visitdate.toISOString ? r.visitdate.toISOString().slice(0,10) : r.visitdate, 'visits:', r.visits, 'persons:', r.persons);
  }
  
  await jhcis.end();
})();