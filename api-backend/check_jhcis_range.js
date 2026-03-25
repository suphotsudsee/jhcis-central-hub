const mysql = require('mysql2/promise');
(async () => {
  const jhcis = await mysql.createConnection({
    host: 'localhost',
    port: 3333,
    user: 'root',
    password: '123456',
    database: 'jhcisdb'
  });
  
  // Check date range in JHCIS
  const [range] = await jhcis.execute(`
    SELECT 
      MIN(visitdate) as min_date, 
      MAX(visitdate) as max_date,
      COUNT(DISTINCT visitdate) as total_dates,
      COUNT(*) as total_visits
    FROM visit 
    WHERE visitdate IS NOT NULL 
    AND visitdate != '0000-00-00'
  `);
  console.log('=== JHCIS Data Range ===');
  console.log('Min date:', range[0].min_date);
  console.log('Max date:', range[0].max_date);
  console.log('Total dates with data:', range[0].total_dates);
  console.log('Total visits:', range[0].total_visits);
  
  // Check if there's data in the last 30 days
  const [recent] = await jhcis.execute(`
    SELECT COUNT(DISTINCT visitdate) as dates, COUNT(*) as visits
    FROM visit 
    WHERE visitdate >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
  `);
  console.log('\n=== Last 30 days ===');
  console.log('Dates with data:', recent[0].dates);
  console.log('Total visits:', recent[0].visits);
  
  await jhcis.end();
})();