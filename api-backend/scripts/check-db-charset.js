/**
 * Check and fix database charset
 */

require('dotenv').config();
const db = require('../src/db/database');

async function checkCharset() {
  try {
    // Set connection charset
    await db.query("SET NAMES utf8mb4");
    console.log('✅ Set connection charset to utf8mb4');

    // Check database charset
    const dbCharset = await db.query("SELECT DEFAULT_CHARACTER_SET_NAME, DEFAULT_COLLATION_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = 'jhcis_central'");
    console.log('\n📊 Database charset:');
    if (dbCharset.rows.length > 0) {
      console.log(`  Character Set: ${dbCharset.rows[0].DEFAULT_CHARACTER_SET_NAME}`);
      console.log(`  Collation: ${dbCharset.rows[0].DEFAULT_COLLATION_NAME}`);
    }

    // Check table charset
    const tableStatus = await db.query("SHOW TABLE STATUS LIKE 'health_facilities'");
    console.log('\n📋 Table status:');
    if (tableStatus.rows.length > 0) {
      console.log(`  Collation: ${tableStatus.rows[0].Collation}`);
    }

    // Update with correct Thai names
    const updates = [
      { hcode: 'TEST001', name: 'โรงพยาบาลทดสอบ' },
      { hcode: 'TEST002', name: 'โรงพยาบาลสมุทรปราการ' },
      { hcode: 'TEST003', name: 'โรงพยาบาลนนทบุรี' },
    ];

    for (const { hcode, name } of updates) {
      await db.query(
        'UPDATE health_facilities SET facility_name = ?, updated_at = CURRENT_TIMESTAMP WHERE hcode = ?',
        [name, hcode]
      );
      console.log(`✅ Updated ${hcode}: ${name}`);
    }

    // Verify
    const result = await db.query('SELECT hcode, facility_name FROM health_facilities ORDER BY hcode');
    console.log('\n📋 Final facility names:');
    result.rows.forEach(row => {
      console.log(`  ${row.hcode}: ${row.facility_name}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkCharset();