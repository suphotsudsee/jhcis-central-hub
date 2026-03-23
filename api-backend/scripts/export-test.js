/**
 * Debug Thai encoding in database
 */

require('dotenv').config();
const db = require('../src/db/database');
const fs = require('fs');

async function debug() {
  try {
    await db.query("SET NAMES utf8mb4");

    const result = await db.query('SELECT hcode, facility_name FROM health_facilities ORDER BY hcode');

    // Write to file to avoid console encoding issues
    const output = result.rows.map(r => `${r.hcode}: ${r.facility_name}`).join('\n');
    fs.writeFileSync('facilities-debug.txt', output, 'utf8');

    console.log('Written to facilities-debug.txt');
    console.log('Bytes in facility_name for TEST002:');
    const test002 = result.rows.find(r => r.hcode === 'TEST002');
    if (test002) {
      const buf = Buffer.from(test002.facility_name, 'utf8');
      console.log('  Length:', buf.length, 'bytes');
      console.log('  Hex:', buf.toString('hex'));
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

debug();