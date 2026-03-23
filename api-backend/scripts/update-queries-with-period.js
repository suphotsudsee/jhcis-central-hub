/**
 * Update OP query with report_period
 */

require('dotenv').config();
const db = require('../src/db/database');

async function updateQueries() {
  try {
    // Update OP query
    const opQuery = `
      SELECT 
        '{hcode}' AS hcode,
        '{date}' AS report_date,
        LEFT('{date}', 7) AS report_period,
        COUNT(*) AS total_visits
      FROM visit
      WHERE pcucode = '{hcode}'
        AND visitdate = '{date}'
        AND (servicetype = '1' OR servicetype IS NULL)
    `;

    await db.query(
      `UPDATE central_queries SET sql_text = ?, updated_at = CURRENT_TIMESTAMP WHERE summary_type = 'op'`,
      [opQuery]
    );
    console.log('✅ Updated OP query');

    // Update person query with report_period
    const personQuery = `
      SELECT 
        '{hcode}' AS hcode,
        '{date}' AS report_date,
        LEFT('{date}', 7) AS report_period,
        COUNT(*) AS total_person,
        SUM(CASE WHEN sex = '1' THEN 1 ELSE 0 END) AS male,
        SUM(CASE WHEN sex = '2' THEN 1 ELSE 0 END) AS female,
        (SELECT COUNT(DISTINCT pt.pid) FROM persontype pt WHERE pt.pcucodeperson = '{hcode}' AND pt.typecode = '09') AS vhv_count,
        (Select COUNT(*) FROM village v WHERE v.pcucode = '{hcode}' AND v.villno > 0) AS village_count,
        (Select COUNT(*) FROM house h WHERE h.pcucode = '{hcode}') AS house_count
      FROM person p
      WHERE p.pcucodeperson = '{hcode}'
    `;

    await db.query(
      `UPDATE central_queries SET sql_text = ?, updated_at = CURRENT_TIMESTAMP WHERE summary_type = 'person'`,
      [personQuery]
    );
    console.log('✅ Updated person query');

    // Verify
    const result = await db.query('SELECT summary_type, is_active FROM central_queries ORDER BY summary_type');
    console.log('\nQueries:');
    result.rows.forEach(row => {
      console.log(`  ${row.summary_type}: ${row.is_active ? 'active' : 'inactive'}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

updateQueries();