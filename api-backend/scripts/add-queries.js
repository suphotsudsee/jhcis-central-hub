const mysql = require('mysql2/promise');
async function addQueries() {
  const conn = await mysql.createConnection({
    host: 'localhost', user: 'root', password: '12345678', database: 'jhcis_central'
  });
  
  const queries = [
    { type: 'person', sql: "SELECT COUNT(1) AS total_person, SUM(CASE WHEN sex = '1' THEN 1 ELSE 0 END) AS male, SUM(CASE WHEN sex = '2' THEN 1 ELSE 0 END) AS female FROM person" },
    { type: 'op', sql: "SELECT '{hcode}' AS hcode, '{date}' AS report_date, COUNT(1) AS total_visits FROM visit WHERE DATE(vstdate) = '{date}'" },
    { type: 'er', sql: "SELECT '{hcode}' AS hcode, '{date}' AS report_date, COUNT(1) AS total_visits FROM visit WHERE emerg = '1' AND DATE(vstdate) = '{date}'" },
    { type: 'pp', sql: "SELECT '{hcode}' AS hcode, '{date}' AS report_date, COUNT(1) AS total_services FROM visit WHERE vsttype = 'P' AND DATE(vstdate) = '{date}'" },
    { type: 'pharmacy', sql: "SELECT '{hcode}' AS hcode, '{date}' AS report_date, COUNT(1) AS total_prescriptions FROM drug_dispense WHERE DATE(dispense_date) = '{date}'" },
    { type: 'lab', sql: "SELECT '{hcode}' AS hcode, '{date}' AS report_date, COUNT(1) AS total_tests FROM lab_order WHERE DATE(order_date) = '{date}'" },
    { type: 'financial', sql: "SELECT '{hcode}' AS hcode, '{date}' AS report_date, COALESCE(SUM(amount), 0) AS total_revenue, 0 AS total_expense FROM billing WHERE DATE(bill_date) = '{date}'" },
    { type: 'resource', sql: "SELECT '{hcode}' AS hcode, '{date}' AS report_date, COUNT(1) AS staff_count, 0 AS bed_capacity, 0 AS equipment_count FROM person WHERE typecode = '09'" },
  ];
  
  for (const q of queries) {
    await conn.query(
      'INSERT INTO central_queries (summary_type, sql_text, is_active) VALUES (?, ?, 1) ON DUPLICATE KEY UPDATE sql_text = VALUES(sql_text)',
      [q.type, q.sql]
    );
    console.log('Updated: ' + q.type);
  }
  
  await conn.end();
  console.log('Done!');
}
addQueries();