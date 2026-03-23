/**
 * Fix facility names with correct Thai encoding
 */

require('dotenv').config();
const db = require('../src/db/database');

async function fixFacilityNames() {
  try {
    // First, let's see what's in the database
    const check = await db.query('SELECT hcode, facility_name FROM health_facilities');
    console.log('📋 Current facility names:');
    check.rows.forEach(row => {
      console.log(`  ${row.hcode}: ${row.facility_name}`);
    });

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
    console.log('\n📋 Updated facility names:');
    result.rows.forEach(row => {
      console.log(`  ${row.hcode}: ${row.facility_name}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

fixFacilityNames();