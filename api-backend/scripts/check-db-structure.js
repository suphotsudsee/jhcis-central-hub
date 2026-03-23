/**
 * Check database structure
 */

require('dotenv').config();
const db = require('../src/db/database');

async function checkStructure() {
  try {
    // Show all tables
    const tables = await db.query('SHOW TABLES');
    console.log('Tables:');
    tables.rows.forEach(row => {
      console.log(`  ${Object.values(row)[0]}`);
    });

    // Check if summary_op exists and what type
    const tableTypes = await db.query(`
      SELECT TABLE_NAME, TABLE_TYPE 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = 'jhcis_central'
      ORDER BY TABLE_NAME
    `);
    console.log('\nTable Types:');
    tableTypes.rows.forEach(row => {
      console.log(`  ${row.TABLE_NAME}: ${row.TABLE_TYPE}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkStructure();