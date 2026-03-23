/**
 * Explore JHCIS database structure
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

  console.log('Connected to jhcisdb');

  // Find person-related tables
  const [tables] = await conn.execute('SHOW TABLES');
  console.log('\n=== All tables ===');
  const personTables = [];
  const villageTables = [];
  const houseTables = [];
  
  for (const row of tables) {
    const tableName = Object.values(row)[0];
    if (tableName.toLowerCase().includes('person')) {
      personTables.push(tableName);
    }
    if (tableName.toLowerCase().includes('village') || tableName.toLowerCase().includes('moo')) {
      villageTables.push(tableName);
    }
    if (tableName.toLowerCase().includes('house') || tableName.toLowerCase().includes('home')) {
      houseTables.push(tableName);
    }
  }

  console.log('\nPerson tables:', personTables);
  console.log('Village tables:', villageTables);
  console.log('House tables:', houseTables);

  // Describe person table
  if (personTables.length > 0) {
    console.log('\n=== person table structure ===');
    const [cols] = await conn.execute(`DESCRIBE \`${personTables[0]}\``);
    cols.forEach(col => {
      console.log(`  ${col.Field}: ${col.Type} ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'} ${col.Key ? `[${col.Key}]` : ''}`);
    });

    // Sample data
    console.log('\n=== Sample person data ===');
    const [sample] = await conn.execute(`SELECT * FROM \`${personTables[0]}\` LIMIT 3`);
    console.log(sample);
  }

  // Describe village/house tables
  for (const table of [...villageTables, ...houseTables]) {
    console.log(`\n=== ${table} table structure ===`);
    const [cols] = await conn.execute(`DESCRIBE \`${table}\``);
    cols.forEach(col => {
      console.log(`  ${col.Field}: ${col.Type} ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'} ${col.Key ? `[${col.Key}]` : ''}`);
    });
  }

  // Check for columns with 'sex' or 'gender'
  console.log('\n=== Looking for sex/gender columns ===');
  for (const table of personTables) {
    const [cols] = await conn.execute(`DESCRIBE \`${table}\``);
    const sexCol = cols.find(c => c.Field.toLowerCase().includes('sex') || c.Field.toLowerCase().includes('gender'));
    if (sexCol) {
      console.log(`  ${table}.${sexCol.Field}: ${sexCol.Type}`);
    }
  }

  await conn.end();
}

explore().catch(e => console.error('Error:', e.message));