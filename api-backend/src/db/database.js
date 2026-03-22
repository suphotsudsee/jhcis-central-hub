/**
 * Database Connection Module
 * Supports PostgreSQL and MariaDB/MySQL
 */

const dbClient = (process.env.DB_CLIENT || 'postgres').toLowerCase();
const isMySql = dbClient === 'mysql' || dbClient === 'mariadb';

const baseConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || (isMySql ? 3306 : 5432),
  database: process.env.DB_NAME || 'jhcis_central',
  user: process.env.DB_USER || (isMySql ? 'root' : 'postgres'),
  password: process.env.DB_PASSWORD || 'password',
};

const pool = isMySql
  ? require('mysql2/promise').createPool({
      ...baseConfig,
      charset: 'utf8mb4',
      dateStrings: true,
      waitForConnections: true,
      connectionLimit: 20,
      queueLimit: 0,
    })
  : new (require('pg').Pool)({
      ...baseConfig,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

if (!isMySql) {
  pool.on('connect', () => {
    console.log('Database connected successfully');
  });

  pool.on('error', (err) => {
    console.error('Unexpected database error:', err);
    process.exit(-1);
  });
}

function normalizeQuery(text) {
  if (!isMySql) {
    return text;
  }

  return text.replace(/\$\d+/g, '?');
}

async function execute(connection, text, params = []) {
  if (isMySql) {
    const [rows] = await connection.execute(normalizeQuery(text), params);
    return {
      rows: Array.isArray(rows) ? rows : [],
      rowCount: Array.isArray(rows) ? rows.length : rows.affectedRows || 0,
      raw: rows,
    };
  }

  return connection.query(text, params);
}

/**
 * Execute a query with parameters
 * @param {string} text - SQL query text
 * @param {Array} params - Query parameters
 * @returns {Promise<Object>} Query result
 */
async function query(text, params = []) {
  if (isMySql) {
    return execute(pool, text, params);
  }

  const client = await pool.connect();
  try {
    return await execute(client, text, params);
  } finally {
    client.release();
  }
}

/**
 * Execute multiple queries in a transaction
 * @param {Array} queries - Array of {text, params} objects
 * @returns {Promise<Object>} Transaction result
 */
async function transaction(queries) {
  if (isMySql) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      const results = [];
      for (const { text, params } of queries) {
        results.push(await execute(connection, text, params));
      }
      await connection.commit();
      return results;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const results = [];
    for (const { text, params } of queries) {
      results.push(await execute(client, text, params));
    }
    await client.query('COMMIT');
    return results;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Upsert helper for single-column conflicts
 * @param {string} table - Table name
 * @param {Object} data - Data to insert/update
 * @param {string} conflictColumn - Column to check for conflicts
 * @returns {Promise<Object>} Upsert result
 */
async function upsert(table, data, conflictColumn) {
  const columns = Object.keys(data);
  const values = Object.values(data);
  const placeholders = values.map((_, index) => (isMySql ? '?' : `$${index + 1}`)).join(', ');

  if (isMySql) {
    const updateFields = columns
      .filter((col) => col !== conflictColumn)
      .map((col) => `${col} = VALUES(${col})`)
      .join(', ');

    const text = `
      INSERT INTO ${table} (${columns.join(', ')})
      VALUES (${placeholders})
      ON DUPLICATE KEY UPDATE ${updateFields}
    `;

    return query(text, values);
  }

  const updateFields = columns
    .filter((col) => col !== conflictColumn)
    .map((col) => `${col} = EXCLUDED.${col}`)
    .join(', ');

  const text = `
    INSERT INTO ${table} (${columns.join(', ')})
    VALUES (${placeholders})
    ON CONFLICT (${conflictColumn})
    DO UPDATE SET ${updateFields}
    RETURNING *
  `;

  return query(text, values);
}

module.exports = {
  dbClient,
  isMySql,
  pool,
  query,
  transaction,
  upsert,
};
