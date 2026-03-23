/**
 * Add report_period column to summary tables
 */

require('dotenv').config();
const db = require('../src/db/database');

async function addReportPeriod() {
  try {
    const tables = ['summary_op', 'summary_pp', 'summary_pharmacy', 'summary_lab', 
                    'summary_financial', 'summary_resource', 'summary_person'];

    for (const table of tables) {
      try {
        await db.query(`ALTER TABLE ${table} ADD COLUMN report_period VARCHAR(7) AFTER report_date`);
        console.log(`✅ Added report_period to ${table}`);
      } catch (err) {
        if (err.code === 'ER_DUP_FIELDNAME') {
          console.log(`⏭️ report_period already exists in ${table}`);
        } else {
          console.log(`❌ Error adding to ${table}: ${err.message}`);
        }
      }
    }

    // Verify
    for (const table of tables) {
      const cols = await db.query(`SHOW COLUMNS FROM ${table} LIKE 'report_period'`);
      console.log(`${table}: ${cols.rows.length > 0 ? 'has report_period' : 'NO report_period'}`);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

addReportPeriod();