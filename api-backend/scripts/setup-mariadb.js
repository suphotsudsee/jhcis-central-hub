require('dotenv').config();

const mysql = require('mysql2/promise');

const dbName = process.env.DB_NAME || 'jhcis_central';
const dbHost = process.env.DB_HOST || 'localhost';
const dbPort = Number(process.env.DB_PORT) || 3306;
const dbUser = process.env.DB_USER || 'root';
const dbPassword = process.env.DB_PASSWORD || '';

const seedFacility = {
  hcode: '10001000100',
  facility_name: 'JHCIS Demo Facility',
  api_key: 'test-api-key-10001000100',
  status: 'active',
};

const defaultCentralQueries = [
  {
    summary_type: 'person',
    sql_text: `
SELECT
  '{hcode}' AS hcode,
  '{date}' AS report_date,
  DATE_FORMAT('{date}', '%Y-%m') AS report_period,
  COUNT(*) AS total_person,
  SUM(CASE WHEN sex = '1' THEN 1 ELSE 0 END) AS male,
  SUM(CASE WHEN sex = '2' THEN 1 ELSE 0 END) AS female
FROM person
    `.trim(),
  },
];

const summaryTables = [
  'summary_op',
  'summary_pp',
  'summary_pharmacy',
  'summary_lab',
  'summary_financial',
  'summary_resource',
  'summary_person',
  'summary_general',
];

async function main() {
  const rootConnection = await mysql.createConnection({
    host: dbHost,
    port: dbPort,
    user: dbUser,
    password: dbPassword,
    multipleStatements: true,
  });

  try {
    await rootConnection.query(
      `CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    );
  } finally {
    await rootConnection.end();
  }

  const db = await mysql.createConnection({
    host: dbHost,
    port: dbPort,
    user: dbUser,
    password: dbPassword,
    database: dbName,
    charset: 'utf8mb4',
    multipleStatements: true,
  });

  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS health_facilities (
        hcode VARCHAR(11) PRIMARY KEY,
        facility_name VARCHAR(255) NOT NULL,
        api_key VARCHAR(255) NOT NULL UNIQUE,
        status VARCHAR(20) NOT NULL DEFAULT 'active',
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS central_queries (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
        summary_type VARCHAR(50) NOT NULL UNIQUE,
        sql_text LONGTEXT NOT NULL,
        is_active TINYINT(1) NOT NULL DEFAULT 1,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    for (const tableName of summaryTables) {
      await db.query(`
        CREATE TABLE IF NOT EXISTS \`${tableName}\` (
          id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
          hcode VARCHAR(11) NOT NULL,
          report_date DATE NOT NULL,
          report_period VARCHAR(20) NOT NULL,
          summary_type VARCHAR(20) NOT NULL,
          data JSON NOT NULL,
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          UNIQUE KEY uq_${tableName}_hcode_date (hcode, report_date),
          KEY idx_${tableName}_hcode (hcode),
          KEY idx_${tableName}_report_date (report_date),
          KEY idx_${tableName}_summary_type (summary_type)
        )
      `);
    }

    await db.execute(
      `
        INSERT INTO health_facilities (hcode, facility_name, api_key, status)
        VALUES (?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          facility_name = VALUES(facility_name),
          api_key = VALUES(api_key),
          status = VALUES(status)
      `,
      [
        seedFacility.hcode,
        seedFacility.facility_name,
        seedFacility.api_key,
        seedFacility.status,
      ]
    );

    for (const queryItem of defaultCentralQueries) {
      await db.execute(
        `
          INSERT INTO central_queries (summary_type, sql_text, is_active)
          VALUES (?, ?, 1)
          ON DUPLICATE KEY UPDATE
            sql_text = VALUES(sql_text),
            is_active = VALUES(is_active)
        `,
        [queryItem.summary_type, queryItem.sql_text]
      );
    }

    console.log(`Database ready: ${dbName}`);
    console.log(`Seed facility hcode: ${seedFacility.hcode}`);
    console.log(`Seed API key: ${seedFacility.api_key}`);
  } finally {
    await db.end();
  }
}

main().catch((error) => {
  console.error('MariaDB setup failed:', error.message);
  process.exit(1);
});
