const mysql = require('mysql2/promise');
(async () => {
  const jhcis = await mysql.createConnection({
    host: 'localhost',
    port: 3333,
    user: 'root',
    password: '123456',
    database: 'jhcisdb'
  });
  
  // Check latest visit date in JHCIS
  const [latest] = await jhcis.execute(`SELECT MAX(visitdate) as max_date, MIN(visitdate) as min_date FROM visit WHERE visitdate > '2020-01-01'`);
  console.log('JHCIS visit date range:', latest[0].min_date, 'to', latest[0].max_date);
  
  // Check visits in Feb 2026
  const [feb] = await jhcis.execute(`
    SELECT visitdate, COUNT(*) as visits, COUNT(DISTINCT pid) as persons
    FROM visit 
    WHERE visitdate >= '2026-02-01' AND visitdate < '2026-03-01'
    GROUP BY visitdate
    ORDER BY visitdate DESC
    LIMIT 15
  `);
  console.log('\nFeb 2026 visits:');
  for (const row of feb) {
    console.log(row.visitdate.toISOString().slice(0,10), 'visits:', row.visits, 'persons:', row.persons);
  }
  
  await jhcis.end();
})();