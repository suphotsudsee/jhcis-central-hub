/**
 * Explore visit/ovst tables for OP query
 */

const mysql = require('mysql2/promise');

async function explore() {
  const conn = await mysql.createConnection({
    host: 'localhost',
    port: 3333,
    user: 'root',
    password: '123456',
    database: 'jhcisdb'
  });

  // Find visit-related tables
  console.log('=== Finding visit/ovst tables ===');
  const [tables] = await conn.execute('SHOW TABLES');
  const visitTables = [];
  for (const row of tables) {
    const tableName = Object.values(row)[0];
    if (tableName.toLowerCase().includes('visit') || tableName.toLowerCase().includes('ovst')) {
      visitTables.push(tableName);
    }
  }
  console.log('Visit tables:', visitTables);

  // Describe ovst table
  if (visitTables.includes('ovst')) {
    console.log('\n=== ovst table structure ===');
    const [cols] = await conn.execute('DESCRIBE ovst');
    cols.forEach(col => {
      console.log(`  ${col.Field}: ${col.Type} ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'} ${col.Key ? `[${col.Key}]` : ''}`);
    });

    // Sample data
    console.log('\n=== Sample ovst data ===');
    const [sample] = await conn.execute('SELECT * FROM ovst LIMIT 2');
    console.log(sample);

    // Date range
    console.log('\n=== Date range in ovst ===');
    const [dateRange] = await conn.execute(`
      SELECT MIN(vstdate) as min_date, MAX(vstdate) as max_date, COUNT(*) as total
      FROM ovst
    `);
    console.log('Date range:', dateRange[0]);

    // Count by date (last 5 years)
    console.log('\n=== Visit count last 5 years (sample) ===');
    const [countByDate] = await conn.execute(`
      SELECT vstdate, COUNT(*) as visit_count
      FROM ovst
      WHERE vstdate >= DATE_SUB(CURDATE(), INTERVAL 5 YEAR)
      GROUP BY vstdate
      ORDER BY vstdate DESC
      LIMIT 10
    `);
    console.log('Recent visits:', countByDate);
  }

  // Check if there's a main visit table with more details
  if (visitTables.includes('visit')) {
    console.log('\n=== visit table structure ===');
    const [cols] = await conn.execute('DESCRIBE visit');
    cols.forEach(col => {
      console.log(`  ${col.Field}: ${col.Type}`);
    });
  }

  await conn.end();
}

explore().catch(e => console.error('Error:', e.message));