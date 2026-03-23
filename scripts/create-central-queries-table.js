/**
 * Create central_queries table if not exists
 */

require('dotenv').config({ path: '../api-backend/.env' });
const db = require('../api-backend/src/db/database');

async function createTable() {
  try {
    const createSQL = `
      CREATE TABLE IF NOT EXISTS central_queries (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        summary_type VARCHAR(50) NOT NULL,
        sql_text TEXT NOT NULL,
        is_active TINYINT(1) DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uk_summary_type (summary_type)
      )
    `;

    await db.query(createSQL);
    console.log('✅ central_queries table created or already exists');

    // Insert default queries
    const defaults = [
      ['op', "SELECT '{hcode}' AS hcode, '{date}' AS report_date, COUNT(*) AS total_visits FROM ovst WHERE vstdate = '{date}'", 1],
      ['pp', "SELECT '{hcode}' AS hcode, '{date}' AS report_date, COUNT(*) AS total_pp FROM pp WHERE vstdate = '{date}'", 1],
      ['pharmacy', "SELECT '{hcode}' AS hcode, '{date}' AS report_date, COUNT(*) AS total_rx FROM opitemnos WHERE vstdate = '{date}'", 1],
      ['lab', "SELECT '{hcode}' AS hcode, '{date}' AS report_date, COUNT(*) AS total_lab FROM lab_head WHERE order_date = '{date}'", 1],
      ['financial', "SELECT '{hcode}' AS hcode, '{date}' AS report_date, SUM(total_amount) AS total_revenue FROM finance WHERE date = '{date}'", 1],
      ['resource', "SELECT '{hcode}' AS hcode, '{date}' AS report_date, COUNT(*) AS total_staff FROM staff WHERE active = 1", 1],
      ['person', "SELECT '{hcode}' AS hcode, '{date}' AS report_date, COUNT(*) AS total_person FROM person", 1],
      ['general', "SELECT '{hcode}' AS hcode, '{date}' AS report_date, 1 AS dummy", 1],
    ];

    for (const [summaryType, sqlText, isActive] of defaults) {
      const insertSQL = `
        INSERT INTO central_queries (summary_type, sql_text, is_active)
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE sql_text = VALUES(sql_text), is_active = VALUES(is_active)
      `;
      await db.query(insertSQL, [summaryType, sqlText, isActive]);
      console.log(`✅ Inserted default query for: ${summaryType}`);
    }

    // Verify
    const result = await db.query('SELECT summary_type, is_active FROM central_queries ORDER BY summary_type');
    console.log('\n📋 Central queries table contents:');
    result.rows.forEach(row => {
      console.log(`  - ${row.summary_type}: ${row.is_active ? 'active' : 'inactive'}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

createTable();