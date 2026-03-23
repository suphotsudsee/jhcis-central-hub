/**
 * Update person query in central_queries
 */

require('dotenv').config();
const db = require('../src/db/database');

async function updatePersonQuery() {
  try {
    const sql = `
      SELECT 
        '{hcode}' AS hcode, 
        '{date}' AS report_date,
        COUNT(*) AS total_person,
        SUM(CASE WHEN sex = '1' THEN 1 ELSE 0 END) AS male,
        SUM(CASE WHEN sex = '2' THEN 1 ELSE 0 END) AS female,
        (SELECT COUNT(DISTINCT pt.pid) FROM persontype pt WHERE pt.pcucodeperson = '{hcode}' AND pt.typecode = '09') AS vhv_count,
        (SELECT COUNT(*) FROM village v WHERE v.pcucode = '{hcode}' AND v.villno > 0) AS village_count,
        (SELECT COUNT(*) FROM house h WHERE h.pcucode = '{hcode}') AS house_count
      FROM person p 
      WHERE p.pcucodeperson = '{hcode}'
    `;

    await db.query(
      `UPDATE central_queries SET sql_text = ?, updated_at = CURRENT_TIMESTAMP WHERE summary_type = 'person'`,
      [sql]
    );

    console.log('✅ Updated person query');

    // Verify
    const result = await db.query('SELECT summary_type, sql_text FROM central_queries WHERE summary_type = "person"');
    console.log('\nUpdated query:');
    console.log(result.rows[0].sql_text);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

updatePersonQuery();