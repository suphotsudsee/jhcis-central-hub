/**
 * Check facilities in local database
 */

require('dotenv').config();
const db = require('../src/db/database');

async function check() {
  try {
    const result = await db.query('SELECT hcode, facility_name, api_key, status, created_at FROM health_facilities ORDER BY hcode');
    console.log('Facilities in local database:');
    if (result.rows.length === 0) {
      console.log('  (No facilities found)');
    } else {
      result.rows.forEach(r => {
        console.log(`  ${r.hcode}: ${r.facility_name} - ${r.api_key} - ${r.status}`);
      });
    }
    process.exit(0);
  } catch (e) {
    console.error('Error:', e.message);
    process.exit(1);
  }
}

check();