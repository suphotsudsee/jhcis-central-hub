const mysql = require('mysql2/promise');
(async () => {
  const jhcis = await mysql.createConnection({
    host: 'localhost',
    port: 3333,
    user: 'root',
    password: '123456',
    database: 'jhcisdb'
  });
  
  // Check recent visits
  const [recent] = await jhcis.execute(`
    SELECT visitdate, COUNT(*) as visits, COUNT(DISTINCT pid) as persons
    FROM visit 
    WHERE visitdate >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
    GROUP BY visitdate
    ORDER BY visitdate DESC
  `);
  console.log('=== JHCIS Recent Visits ===');
  for (const row of recent) {
    console.log(`${row.visitdate.toISOString().slice(0,10)} | visits: ${row.visits} | persons: ${row.persons}`);
  }
  
  // Check today
  const [today] = await jhcis.execute(`
    SELECT COUNT(*) as visits, COUNT(DISTINCT pid) as persons
    FROM visit 
    WHERE visitdate = CURDATE()
  `);
  console.log('\n=== Today (JHCIS) ===');
  console.log(`visits: ${today[0].visits}, persons: ${today[0].persons}`);
  
  await jhcis.end();
})();