#!/usr/bin/env node
/**
 * Add health facilities to the central database
 * Run: node add_facilities.js
 */

const mysql = require('mysql2/promise');
const crypto = require('crypto');

// List of facilities to add
// Format: { hcode, facility_name }
const FACILITIES = [
  // Example:
  // { hcode: '03633', facility_name: 'รพ.สต.ตบหู' },
  // { hcode: '03634', facility_name: 'รพ.สต.สมุย' },
  // Add your 80 facilities here
];

function generateApiKey() {
  const prefix = 'jhcis_';
  const randomBytes = crypto.randomBytes(24).toString('base64url');
  return `${prefix}${randomBytes}`;
}

async function main() {
  const conn = await mysql.createConnection({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: '12345678',
    database: 'jhcis_central'
  });

  console.log('=== Adding Health Facilities ===\n');

  for (const facility of FACILITIES) {
    try {
      const apiKey = generateApiKey();
      
      await conn.execute(`
        INSERT INTO health_facilities (hcode, facility_name, api_key, status, created_at, updated_at)
        VALUES (?, ?, ?, 'active', NOW(), NOW())
        ON DUPLICATE KEY UPDATE 
          facility_name = VALUES(facility_name),
          api_key = VALUES(api_key),
          updated_at = NOW()
      `, [facility.hcode, facility.facility_name, apiKey]);

      console.log(`✓ ${facility.hcode}: ${facility.facility_name}`);
      console.log(`  API Key: ${apiKey}\n`);
    } catch (error) {
      console.error(`✗ ${facility.hcode}: ${error.message}`);
    }
  }

  // Show all facilities
  const [rows] = await conn.execute('SELECT hcode, facility_name, status FROM health_facilities ORDER BY hcode');
  console.log('\n=== All Facilities ===');
  console.log(`Total: ${rows.length} facilities\n`);
  
  for (const row of rows) {
    console.log(`${row.hcode}: ${row.facility_name} (${row.status})`);
  }

  await conn.end();
}

main().catch(console.error);