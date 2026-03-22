const db = require('../db/database');
const { isSafeSelectQuery } = require('../utils/querySafety');

const DEFAULT_QUERIES = {
  person: `
SELECT
  '{hcode}' AS hcode,
  '{date}' AS report_date,
  DATE_FORMAT('{date}', '%Y-%m') AS report_period,
  COUNT(*) AS total_person,
  SUM(CASE WHEN sex = '1' THEN 1 ELSE 0 END) AS male,
  SUM(CASE WHEN sex = '2' THEN 1 ELSE 0 END) AS female
FROM person
  `.trim(),
};

async function ensureDefaultQuery(summaryType) {
  const sqlText = DEFAULT_QUERIES[summaryType];
  if (!sqlText) {
    return null;
  }

  const data = {
    summary_type: summaryType,
    sql_text: sqlText,
    is_active: 1,
    created_at: new Date(),
    updated_at: new Date(),
  };

  if (db.isMySql) {
    await db.query(
      `
        INSERT INTO central_queries (summary_type, sql_text, is_active, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          sql_text = VALUES(sql_text),
          is_active = VALUES(is_active),
          updated_at = VALUES(updated_at)
      `,
      [data.summary_type, data.sql_text, data.is_active, data.created_at, data.updated_at]
    );
  } else {
    await db.query(
      `
        INSERT INTO central_queries (summary_type, sql_text, is_active, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (summary_type)
        DO UPDATE SET
          sql_text = EXCLUDED.sql_text,
          is_active = EXCLUDED.is_active,
          updated_at = EXCLUDED.updated_at
      `,
      [data.summary_type, data.sql_text, data.is_active, data.created_at, data.updated_at]
    );
  }

  return sqlText;
}

async function getCentralQuery(req, res) {
  try {
    const summaryType = String(req.params.summaryType || '').toLowerCase();
    let result = await db.query(
      `
        SELECT summary_type, sql_text, updated_at
        FROM central_queries
        WHERE summary_type = $1 AND is_active = 1
        LIMIT 1
      `,
      [summaryType]
    );

    if (result.rows.length === 0) {
      const seeded = await ensureDefaultQuery(summaryType);
      if (seeded) {
        result = await db.query(
          `
            SELECT summary_type, sql_text, updated_at
            FROM central_queries
            WHERE summary_type = $1 AND is_active = 1
            LIMIT 1
          `,
          [summaryType]
        );
      }
    }

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'NOT_FOUND',
        message: `Central query not found for summary type: ${summaryType}`,
        statusCode: 404,
      });
    }

    const row = result.rows[0];
    if (!isSafeSelectQuery(row.sql_text)) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_QUERY',
        message: `Central query for ${summaryType} is not a safe SELECT statement`,
        statusCode: 400,
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        summaryType: row.summary_type,
        sql: row.sql_text,
        updatedAt: row.updated_at,
      },
      statusCode: 200,
    });
  } catch (error) {
    console.error('Get central query error:', error);
    return res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to fetch central query',
      statusCode: 500,
    });
  }
}

async function listCentralQueries(_req, res) {
  try {
    const result = await db.query(
      `
        SELECT summary_type, sql_text, is_active, updated_at
        FROM central_queries
        ORDER BY summary_type
      `
    );

    const data = result.rows.map((row) => ({
      summaryType: row.summary_type,
      sql: row.sql_text,
      isActive: Boolean(row.is_active),
      updatedAt: row.updated_at,
      isSafeSelect: isSafeSelectQuery(row.sql_text),
    }));

    return res.status(200).json({
      success: true,
      data,
      statusCode: 200,
    });
  } catch (error) {
    console.error('List central queries error:', error);
    return res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to list central queries',
      statusCode: 500,
    });
  }
}

async function upsertCentralQuery(req, res) {
  try {
    const summaryType = String(req.params.summaryType || '').toLowerCase();
    const sql = String(req.body?.sql || '').trim();
    const isActive = req.body?.isActive === false ? 0 : 1;

    if (!sql) {
      return res.status(400).json({
        success: false,
        error: 'BAD_REQUEST',
        message: 'sql is required',
        statusCode: 400,
      });
    }

    if (!isSafeSelectQuery(sql)) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_QUERY',
        message: 'Only a single SELECT statement is allowed',
        statusCode: 400,
      });
    }

    if (db.isMySql) {
      await db.query(
        `
          INSERT INTO central_queries (summary_type, sql_text, is_active, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            sql_text = VALUES(sql_text),
            is_active = VALUES(is_active),
            updated_at = VALUES(updated_at)
        `,
        [summaryType, sql, isActive, new Date(), new Date()]
      );
    } else {
      await db.query(
        `
          INSERT INTO central_queries (summary_type, sql_text, is_active, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5)
          ON CONFLICT (summary_type)
          DO UPDATE SET
            sql_text = EXCLUDED.sql_text,
            is_active = EXCLUDED.is_active,
            updated_at = EXCLUDED.updated_at
        `,
        [summaryType, sql, isActive, new Date(), new Date()]
      );
    }

    return res.status(200).json({
      success: true,
      message: 'Central query saved successfully',
      data: {
        summaryType,
        sql,
        isActive: Boolean(isActive),
      },
      statusCode: 200,
    });
  } catch (error) {
    console.error('Upsert central query error:', error);
    return res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to save central query',
      statusCode: 500,
    });
  }
}

module.exports = {
  DEFAULT_QUERIES,
  listCentralQueries,
  getCentralQuery,
  upsertCentralQuery,
};
