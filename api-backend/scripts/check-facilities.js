/**
 * Check facility API keys
 */

require('dotenv').config();
const db = require('../src/db/database');

async function checkKeys() {
  try {
    const result = await db.query('SELECT hcode, facility_name, api_key, status FROM health_facilities ORDER BY hcode');
    console.log('Facilities:');
    result.rows.forEach(row => {
      console.log(`  ${row.hcode}: ${row.facility_name} - API Key: ${row.api_key} - Status: ${row.status}`);
    });
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkKeys();