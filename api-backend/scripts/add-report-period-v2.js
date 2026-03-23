/**
 * Add report_period column to summary_daily tables
 */

require('dotenv').config();
const db = require('../src/db/database');

async function addReportPeriod() {
  try {
    // Daily tables (base tables)
    const dailyTables = [
      'summary_op_daily',
      'summary_pp_daily',
      'summary_pharmacy_daily',
      'summary_lab_daily',
      'summary_financial_daily',
      'summary_resource_daily',
      'summary_ip_daily',
      'summary_er_daily',
      'summary_radiology_daily'
    ];

    for (const table of dailyTables) {
      try {
        // Check if column exists first
        const cols = await db.query(`SHOW COLUMNS FROM ${table} LIKE 'report_period'`);
        if (cols.rows.length === 0) {
          await db.query(`ALTER TABLE ${table} ADD COLUMN report_period VARCHAR(7) AFTER report_date`);
          console.log(`✅ Added report_period to ${table}`);
        } else {
          console.log(`⏭️ report_period already exists in ${table}`);
        }
      } catch (err) {
        console.log(`❌ Error adding to ${table}: ${err.message}`);
      }
    }

    // Verify
    console.log('\nVerification:');
    for (const table of dailyTables) {
      const cols = await db.query(`SHOW COLUMNS FROM ${table}`);
      const hasPeriod = cols.rows.some(c => c.Field === 'report_period');
      console.log(`  ${table}: ${hasPeriod ? '✅ has report_period' : '❌ missing'}`);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

addReportPeriod();