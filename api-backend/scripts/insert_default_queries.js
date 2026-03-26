const mysql = require('mysql2/promise');

const DEFAULT_QUERIES = {
  op: `SELECT '{hcode}' AS hcode, '{date}' AS report_date, DATE_FORMAT('{date}', '%Y-%m') AS report_period, 'op' AS summary_type, (SELECT COUNT(*) FROM visit WHERE visitdate = '{date}') AS total_visits, (SELECT COUNT(DISTINCT pid) FROM visit WHERE visitdate = '{date}') AS total_persons FROM dual`,
  
  er: `SELECT '{hcode}' AS hcode, '{date}' AS report_date, DATE_FORMAT('{date}', '%Y-%m') AS report_period, 'er' AS summary_type, COUNT(*) AS total_cases, COUNT(DISTINCT pid) AS total_persons FROM er_visit WHERE visit_date = '{date}' GROUP BY hcode`,
  
  pp: `SELECT '{hcode}' AS hcode, '{date}' AS report_date, DATE_FORMAT('{date}', '%Y-%m') AS report_period, 'pp' AS summary_type, COUNT(*) AS total_cases FROM pp_visit WHERE visit_date = '{date}' GROUP BY hcode`,
  
  pharmacy: `SELECT '{hcode}' AS hcode, '{date}' AS report_date, DATE_FORMAT('{date}', '%Y-%m') AS report_period, 'pharmacy' AS summary_type, COUNT(*) AS total_dispensed FROM pharmacy_dispense WHERE dispense_date = '{date}' GROUP BY hcode`,
  
  lab: `SELECT '{hcode}' AS hcode, '{date}' AS report_date, DATE_FORMAT('{date}', '%Y-%m') AS report_period, 'lab' AS summary_type, COUNT(*) AS total_tests FROM lab_result WHERE result_date = '{date}' GROUP BY hcode`,
  
  financial: `SELECT '{hcode}' AS hcode, '{date}' AS report_date, DATE_FORMAT('{date}', '%Y-%m') AS report_period, 'financial' AS summary_type, SUM(amount) AS total_revenue FROM financial_transactions WHERE transaction_date = '{date}' GROUP BY hcode`,
  
  resource: `SELECT '{hcode}' AS hcode, '{date}' AS report_date, DATE_FORMAT('{date}', '%Y-%m') AS report_period, 'resource' AS summary_type, COUNT(*) AS total_resources FROM resource_usage WHERE usage_date = '{date}' GROUP BY hcode`,
  
  person: `SELECT '{hcode}' AS hcode, '{date}' AS report_date, DATE_FORMAT('{date}', '%Y-%m') AS report_period, 'person' AS summary_type, COUNT(*) AS total_persons FROM person WHERE active = 1 GROUP BY hcode`
};

async function main() {
  const conn = await mysql.createConnection({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: '12345678',
    database: 'jhcis_central'
  });

  console.log('=== Inserting Default Queries ===\n');

  for (const [summaryType, sqlText] of Object.entries(DEFAULT_QUERIES)) {
    try {
      await conn.execute(`
        INSERT INTO central_queries (summary_type, sql_text, is_active, created_at, updated_at)
        VALUES (?, ?, 1, NOW(), NOW())
        ON DUPLICATE KEY UPDATE
          sql_text = VALUES(sql_text),
          is_active = VALUES(is_active),
          updated_at = NOW()
      `, [summaryType, sqlText]);
      
      console.log(`✓ ${summaryType}: inserted/updated`);
    } catch (error) {
      console.log(`✗ ${summaryType}: ${error.message}`);
    }
  }

  // Verify
  console.log('\n=== Verifying Queries ===\n');
  const [rows] = await conn.execute('SELECT summary_type, is_active FROM central_queries ORDER BY summary_type');
  for (const row of rows) {
    console.log(`${row.summary_type}: ${row.is_active ? 'active' : 'inactive'}`);
  }

  await conn.end();
}

main().catch(console.error);