/**
 * Explore person table structure for query
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

  // Full structure of person table
  console.log('=== person table full structure ===');
  const [personCols] = await conn.execute('DESCRIBE `person`');
  personCols.forEach(col => {
    console.log(`  ${col.Field}: ${col.Type} ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'} ${col.Key ? `[${col.Key}]` : ''}`);
  });

  // Sample data from person
  console.log('\n=== Sample person data ===');
  const [personSample] = await conn.execute('SELECT * FROM person LIMIT 3');
  console.log(personSample);

  // Check for type column
  console.log('\n=== Looking for person type ===');
  const [personTypeCols] = await conn.execute('DESCRIBE `persontype`');
  console.log('persontype columns:');
  personTypeCols.forEach(col => console.log(`  ${col.Field}: ${col.Type}`));

  // Sample persontype
  console.log('\n=== Sample persontype data ===');
  const [ptSample] = await conn.execute('SELECT * FROM persontype LIMIT 5');
  console.log(ptSample);

  // Check house count
  console.log('\n=== House count ===');
  const [houseCount] = await conn.execute('SELECT COUNT(*) as count FROM house');
  console.log('Houses:', houseCount[0].count);

  // Check village count  
  console.log('\n=== Village count ===');
  const [villageCount] = await conn.execute('SELECT COUNT(*) as count FROM village');
  console.log('Villages:', villageCount[0].count);

  // Check person count and sex distribution
  console.log('\n=== Person stats ===');
  const [personCount] = await conn.execute('SELECT COUNT(*) as total FROM person');
  console.log('Total persons:', personCount[0].count);

  const [sexDist] = await conn.execute("SELECT sex, COUNT(*) as count FROM person GROUP BY sex");
  console.log('Sex distribution:', sexDist);

  // Check house - relation to person
  console.log('\n=== House structure sample ===');
  const [houseSample] = await conn.execute('SELECT * FROM house LIMIT 2');
  console.log(houseSample);

  // Check village structure
  console.log('\n=== Village structure ===');
  const [villageCols] = await conn.execute('DESCRIBE `village`');
  villageCols.forEach(col => {
    console.log(`  ${col.Field}: ${col.Type}`);
  });
  
  console.log('\n=== Sample village data ===');
  const [villageSample] = await conn.execute('SELECT * FROM village LIMIT 3');
  console.log(villageSample);

  // Check cperson type for อสม. (Village Health Volunteer)
  console.log('\n=== Looking for อสม. (VHV) ===');
  const [cpersontypeCols] = await conn.execute('DESCRIBE `cpersontype`');
  console.log('cpersontype columns:');
  cpersontypeCols.forEach(col => console.log(`  ${col.Field}: ${col.Type}`));

  const [cpersontypeSample] = await conn.execute('SELECT * FROM cpersontype LIMIT 10');
  console.log('cpersontype sample:', cpersontypeSample);

  // Check if there's a volunteer table or column
  console.log('\n=== Checking for volunteer/VHV ===');
  const [volunteerCheck] = await conn.execute(`
    SELECT COLUMN_NAME, TABLE_NAME 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = 'jhcisdb' 
    AND (COLUMN_NAME LIKE '%volunt%' OR COLUMN_NAME LIKE '%vhv%' OR COLUMN_NAME LIKE '%อสม%')
    LIMIT 10
  `);
  console.log('Volunteer related columns:', volunteerCheck);

  await conn.end();
}

explore().catch(e => console.error('Error:', e.message));