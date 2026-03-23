/**
 * Test person query for JHCIS Central
 * 
 * Data from jhcisdb (port 3333):
 * - person table: population, sex (1=male, 2=female)
 * - persontype table: person types (typecode='09' = อสม.)
 * - village table: villages (villno > 0 = actual villages)
 * - house table: houses
 */

const mysql = require('mysql2/promise');

async function testPersonQuery() {
  const conn = await mysql.createConnection({
    host: 'localhost',
    port: 3333,
    user: 'root',
    password: '123456',
    database: 'jhcisdb'
  });

  const pcucode = '03633'; // Test with this facility code

  // Count total persons
  const [personCount] = await conn.execute(
    'SELECT COUNT(*) as total FROM person WHERE pcucodeperson = ?',
    [pcucode]
  );
  console.log('Total persons:', personCount[0].total);

  // Count by sex
  const [sexCount] = await conn.execute(
    'SELECT sex, COUNT(*) as count FROM person WHERE pcucodeperson = ? GROUP BY sex',
    [pcucode]
  );
  console.log('Sex distribution:', sexCount);

  // Count อสม. (VHV - Village Health Volunteer)
  // typecode='09' = อสม.
  const [vhvCount] = await conn.execute(
    `SELECT COUNT(DISTINCT pt.pid) as vhv_count 
     FROM persontype pt 
     WHERE pt.pcucodeperson = ? AND pt.typecode = '09'`,
    [pcucode]
  );
  console.log('อสม. count:', vhvCount[0].vhv_count);

  // Count villages (villno > 0 = actual villages, not "นอกเขต")
  const [villageCount] = await conn.execute(
    'SELECT COUNT(*) as count FROM village WHERE pcucode = ? AND villno > 0',
    [pcucode]
  );
  console.log('Villages:', villageCount[0].count);

  // Count houses
  const [houseCount] = await conn.execute(
    'SELECT COUNT(*) as count FROM house WHERE pcucode = ?',
    [pcucode]
  );
  console.log('Houses:', houseCount[0].count);

  // Full combined query
  console.log('\n=== Testing combined query ===');
  const [result] = await conn.execute(`
    SELECT 
      ? AS hcode,
      CURDATE() AS report_date,
      (SELECT COUNT(*) FROM person p WHERE p.pcucodeperson = ?) AS total_person,
      (SELECT COUNT(*) FROM person p WHERE p.pcucodeperson = ? AND p.sex = '1') AS male,
      (SELECT COUNT(*) FROM person p WHERE p.pcucodeperson = ? AND p.sex = '2') AS female,
      (SELECT COUNT(DISTINCT pt.pid) FROM persontype pt WHERE pt.pcucodeperson = ? AND pt.typecode = '09') AS vhv_count,
      (SELECT COUNT(*) FROM village v WHERE v.pcucode = ? AND v.villno > 0) AS village_count,
      (SELECT COUNT(*) FROM house h WHERE h.pcucode = ?) AS house_count
  `, [pcucode, pcucode, pcucode, pcucode, pcucode, pcucode, pcucode]);

  console.log('Result:', result[0]);

  // Alternative single query with JOINs
  console.log('\n=== Alternative single query ===');
  const [altResult] = await conn.execute(`
    SELECT 
      ? AS hcode,
      CURDATE() AS report_date,
      COUNT(DISTINCT p.pid) AS total_person,
      SUM(CASE WHEN p.sex = '1' THEN 1 ELSE 0 END) AS male,
      SUM(CASE WHEN p.sex = '2' THEN 1 ELSE 0 END) AS female,
      (SELECT COUNT(DISTINCT pt.pid) FROM persontype pt WHERE pt.pcucodeperson = ? AND pt.typecode = '09') AS vhv_count,
      (SELECT COUNT(*) FROM village v WHERE v.pcucode = ? AND v.villno > 0) AS village_count,
      (SELECT COUNT(*) FROM house h WHERE h.pcucode = ?) AS house_count
    FROM person p
    WHERE p.pcucodeperson = ?
  `, [pcucode, pcucode, pcucode, pcucode, pcucode]);

  console.log('Alt result:', altResult[0]);

  await conn.end();
}

testPersonQuery().catch(e => console.error('Error:', e.message));