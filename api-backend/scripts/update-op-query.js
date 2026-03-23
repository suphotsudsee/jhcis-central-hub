/**
 * Update OP query in central_queries
 * 
 * OP (Outpatient) summary from visit table:
 * - Returns daily visit count for a specific date
 * - servicetype = '1' is OP (ผู้ป่วยนอก)
 * 
 * For historical sync (5 years), the agent will run this query for each date.
 * 
 * Query returns:
 * - hcode: facility code
 * - report_date: the date being queried
 * - total_visits: total OP visits for that date
 */

require('dotenv').config();
const db = require('../src/db/database');

async function updateOpQuery() {
  try {
    // Query for daily OP visits - single date query
    // The sync agent will call this for each date to sync historical data
    const sql = `
      SELECT 
        '{hcode}' AS hcode,
        '{date}' AS report_date,
        COUNT(*) AS total_visits
      FROM visit
      WHERE pcucode = '{hcode}'
        AND visitdate = '{date}'
        AND (servicetype = '1' OR servicetype IS NULL)
    `;

    await db.query(
      `UPDATE central_queries SET sql_text = ?, updated_at = CURRENT_TIMESTAMP WHERE summary_type = 'op'`,
      [sql]
    );

    console.log('✅ Updated OP query');

    // Verify
    const result = await db.query('SELECT summary_type, sql_text FROM central_queries WHERE summary_type = "op"');
    console.log('\nUpdated OP query:');
    console.log(result.rows[0].sql_text);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

updateOpQuery();