/**
 * Add missing columns to summary_daily tables
 */

require('dotenv').config();
const db = require('../src/db/database');

async function addMissingColumns() {
  try {
    // Daily tables that need columns
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
      // Add summary_type column
      try {
        const typeCols = await db.query(`SHOW COLUMNS FROM ${table} LIKE 'summary_type'`);
        if (typeCols.rows.length === 0) {
          await db.query(`ALTER TABLE ${table} ADD COLUMN summary_type VARCHAR(50) AFTER report_period`);
          console.log(`✅ Added summary_type to ${table}`);
        } else {
          console.log(`⏭️ summary_type already exists in ${table}`);
        }
      } catch (err) {
        console.log(`❌ Error adding summary_type to ${table}: ${err.message}`);
      }

      // Add data column
      try {
        const dataCols = await db.query(`SHOW COLUMNS FROM ${table} LIKE 'data'`);
        if (dataCols.rows.length === 0) {
          await db.query(`ALTER TABLE ${table} ADD COLUMN data JSON AFTER summary_type`);
          console.log(`✅ Added data to ${table}`);
        } else {
          console.log(`⏭️ data already exists in ${table}`);
        }
      } catch (err) {
        console.log(`❌ Error adding data to ${table}: ${err.message}`);
      }

      // Add created_at column
      try {
        const createdCols = await db.query(`SHOW COLUMNS FROM ${table} LIKE 'created_at'`);
        if (createdCols.rows.length === 0) {
          await db.query(`ALTER TABLE ${table} ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`);
          console.log(`✅ Added created_at to ${table}`);
        } else {
          console.log(`⏭️ created_at already exists in ${table}`);
        }
      } catch (err) {
        console.log(`❌ Error adding created_at to ${table}: ${err.message}`);
      }

      // Add updated_at column
      try {
        const updatedCols = await db.query(`SHOW COLUMNS FROM ${table} LIKE 'updated_at'`);
        if (updatedCols.rows.length === 0) {
          await db.query(`ALTER TABLE ${table} ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`);
          console.log(`✅ Added updated_at to ${table}`);
        } else {
          console.log(`⏭️ updated_at already exists in ${table}`);
        }
      } catch (err) {
        console.log(`❌ Error adding updated_at to ${table}: ${err.message}`);
      }
    }

    // Verify
    console.log('\nVerification:');
    for (const table of dailyTables) {
      const cols = await db.query(`SHOW COLUMNS FROM ${table}`);
      const hasType = cols.rows.some(c => c.Field === 'summary_type');
      const hasData = cols.rows.some(c => c.Field === 'data');
      const hasPeriod = cols.rows.some(c => c.Field === 'report_period');
      const hasCreated = cols.rows.some(c => c.Field === 'created_at');
      const hasUpdated = cols.rows.some(c => c.Field === 'updated_at');
      console.log(`  ${table}: ${hasType ? '✅' : '❌'} summary_type, ${hasData ? '✅' : '❌'} data, ${hasPeriod ? '✅' : '❌'} report_period, ${hasCreated ? '✅' : '❌'} created_at, ${hasUpdated ? '✅' : '❌'} updated_at`);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

addMissingColumns();