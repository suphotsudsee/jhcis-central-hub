/**
 * Sync Controller
 * Business logic for handling summary data synchronization
 */

const db = require('../db/database');
const { validateSummary } = require('../validators/summaryValidator');

/**
 * Handle summary data sync request
 * Performs UPSERT based on hcode + report_date
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function syncSummary(req, res) {
  try {
    const { summaryType } = req.params;
    const facility = req.facility; // From auth middleware
    const payload = req.body;
    
    // Validate payload
    const validation = validateSummary(payload, summaryType);
    
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: validation.error,
        message: 'Validation failed',
        details: validation.details,
        statusCode: 400,
      });
    }
    
    const data = validation.data;
    
    // Ensure hcode matches the authenticated facility
    if (data.hcode !== facility.hcode) {
      return res.status(403).json({
        success: false,
        error: 'FORBIDDEN',
        message: 'API Key does not match the provided hcode',
        statusCode: 403,
      });
    }
    
    // Determine the target table based on summary type
    const tableName = getTableName(summaryType);
    
    // Prepare data for database
    const reportDate = formatDateOnly(data.report_date);
    const dbData = {
      hcode: data.hcode,
      report_date: reportDate,
      report_period: data.report_period,
      summary_type: summaryType,
      data: JSON.stringify(data),
      created_at: new Date(),
      updated_at: new Date(),
    };
    
    // Perform UPSERT operation
    const conflictColumn = 'hcode_report_date'; // Composite unique constraint
    
    // For PostgreSQL, we need to handle composite keys
    const result = await upsertSummary(tableName, dbData, ['hcode', 'report_date']);
    
    return res.status(200).json({
      success: true,
      message: 'Summary data synced successfully',
      data: {
        hcode: result.hcode,
        report_date: formatDateOnly(result.report_date),
        summary_type: summaryType,
        updated_at: result.updated_at,
      },
      statusCode: 200,
    });
    
  } catch (error) {
    console.error('Sync controller error:', error);
    
    // Handle database errors
    if (error.code === '23505') {
      return res.status(409).json({
        success: false,
        error: 'CONFLICT',
        message: 'Duplicate entry',
        statusCode: 409,
      });
    }
    
    return res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to sync summary data',
      statusCode: 500,
    });
  }
}

/**
 * Handle batch sync request
 * Processes multiple summary records in a transaction
 * Optimized for high-volume concurrent requests
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function syncBatch(req, res) {
  try {
    const facility = req.facility;
    const batches = req.body;
    
    if (!Array.isArray(batches)) {
      return res.status(400).json({
        success: false,
        error: 'BAD_REQUEST',
        message: 'Request body must be an array',
        statusCode: 400,
      });
    }
    
    // Limit batch size to prevent timeout
    if (batches.length > 1000) {
      return res.status(400).json({
        success: false,
        error: 'BAD_REQUEST',
        message: 'Batch size exceeds limit (max 1000 records)',
        statusCode: 400,
      });
    }
    
    const results = [];
    const errors = [];
    
    // Group by table for bulk insert
    const groupedData = {};
    
    for (const item of batches) {
      const { summaryType, data } = item;
      
      // Validate
      const validation = validateSummary(data, summaryType);
      
      if (!validation.valid) {
        errors.push({
          summaryType,
          error: validation.error,
          details: validation.details,
        });
        continue;
      }
      
      // Check hcode match
      if (validation.data.hcode !== facility.hcode) {
        errors.push({
          summaryType,
          error: 'FORBIDDEN',
          message: 'API Key does not match the provided hcode',
        });
        continue;
      }
      
      const tableName = getTableName(summaryType);
      
      if (!groupedData[tableName]) {
        groupedData[tableName] = [];
      }
      
      groupedData[tableName].push({
        hcode: validation.data.hcode,
        report_date: formatDateOnly(validation.data.report_date),
        report_period: validation.data.report_period,
        summary_type: summaryType,
        data: JSON.stringify(validation.data),
      });
    }
    
    // Bulk insert for each table
    for (const [tableName, records] of Object.entries(groupedData)) {
      try {
        await bulkUpsert(tableName, records);
        for (const record of records) {
          results.push({
            summaryType: record.summary_type,
            hcode: record.hcode,
            report_date: record.report_date,
            status: 'success',
          });
        }
      } catch (err) {
        for (const record of records) {
          errors.push({
            summaryType: record.summary_type,
            hcode: record.hcode,
            error: 'DB_ERROR',
            message: err.message,
          });
        }
      }
    }
    
    return res.status(200).json({
      success: true,
      message: 'Batch sync completed',
      summary: {
        total: batches.length,
        success: results.length,
        failed: errors.length,
      },
      results,
      errors: errors.length > 0 ? errors : undefined,
      statusCode: 200,
    });
    
  } catch (error) {
    console.error('Batch sync error:', error);
    return res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to process batch sync',
      statusCode: 500,
    });
  }
}

/**
 * Bulk upsert for multiple records
 * Uses a single INSERT ... ON DUPLICATE KEY UPDATE
 * 
 * @param {string} table - Table name
 * @param {Array} records - Array of data objects
 * @returns {Promise<void>}
 */
async function bulkUpsert(table, records) {
  if (records.length === 0) return;
  
  const columns = ['hcode', 'report_date', 'report_period', 'summary_type', 'data', 'created_at', 'updated_at'];
  const now = new Date();
  
  const values = records.map((record, index) => {
    const offset = index * columns.length;
    return columns.map((col, colIndex) => {
      if (col === 'created_at' || col === 'updated_at') {
        return `NOW()`;
      }
      return `?`;
    }).join(', ');
  });
  
  const placeholders = records.map((_, index) => `(${columns.map((col, colIndex) => {
    if (col === 'created_at' || col === 'updated_at') {
      return 'NOW()';
    }
    return '?';
  }).join(', ')})`).join(', ');
  
  const flatValues = records.flatMap(record => [
    record.hcode,
    record.report_date,
    record.report_period,
    record.summary_type,
    record.data,
  ]);
  
  const updateFields = columns
    .filter(col => !['hcode', 'report_date'].includes(col))
    .map(col => `${col} = VALUES(${col})`)
    .join(', ');
  
  const text = `
    INSERT INTO ${table} (${columns.join(', ')})
    VALUES ${placeholders}
    ON DUPLICATE KEY UPDATE ${updateFields}
  `;
  
  await db.query(text, flatValues);
}

/**
 * Get table name based on summary type
 * @param {string} summaryType - Summary type
 * @returns {string} Table name
 */
function getTableName(summaryType) {
  const tableMap = {
    op: 'summary_op',
    er: 'summary_er',
    pp: 'summary_pp',
    pharmacy: 'summary_pharmacy',
    lab: 'summary_lab',
    financial: 'summary_financial',
    resource: 'summary_resource',
    person: 'summary_person',
    ip: 'summary_ip',
    radiology: 'summary_radiology',
    general: 'summary_general',
  };
  
  return tableMap[summaryType] || 'summary_general';
}

function formatDateOnly(value) {
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  const date = value instanceof Date ? value : new Date(value);
  return date.toISOString().slice(0, 10);
}

/**
 * Perform UPSERT with composite key
 * @param {string} table - Table name
 * @param {Object} data - Data object
 * @param {Array} conflictColumns - Array of columns for conflict detection
 * @returns {Promise<Object>} Upsert result
 */
async function upsertSummary(table, data, conflictColumns) {
  const columns = Object.keys(data);
  const values = Object.values(data);
  const placeholders = values
    .map((_, index) => (db.isMySql ? '?' : `$${index + 1}`))
    .join(', ');

  if (db.isMySql) {
    const updateColumns = columns.filter((col) => !conflictColumns.includes(col));
    const updateFields = updateColumns
      .map((col) => `${col} = VALUES(${col})`)
      .join(', ');

    const text = `
      INSERT INTO ${table} (${columns.join(', ')})
      VALUES (${placeholders})
      ON DUPLICATE KEY UPDATE ${updateFields}
    `;

    await db.query(text, values);

    const whereClause = conflictColumns
      .map((col) => `${col} = ?`)
      .join(' AND ');
    const selectValues = conflictColumns.map((col) => data[col]);
    const result = await db.query(
      `SELECT * FROM ${table} WHERE ${whereClause} LIMIT 1`,
      selectValues
    );

    return result.rows[0];
  }

  const updateColumns = columns.filter((col) => !conflictColumns.includes(col));
  const updateFields = updateColumns
    .map((col) => `${col} = EXCLUDED.${col}`)
    .join(', ');
  const conflictClause = conflictColumns.join(', ');

  const text = `
    INSERT INTO ${table} (${columns.join(', ')})
    VALUES (${placeholders})
    ON CONFLICT (${conflictClause})
    DO UPDATE SET ${updateFields}
    RETURNING *
  `;

  const result = await db.query(text, values);
  return result.rows[0];
}

module.exports = {
  syncSummary,
  syncBatch,
  getTableName,
};
