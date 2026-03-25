/**
 * Import API Routes
 * Receive and process ZIP packages from JHCISyncDesktop
 */

const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const unzipper = require('unzipper');
const db = require('../db/database');
const validateApiKey = require('../middleware/auth');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    cb(null, `${timestamp}-${file.originalname}`);
  }
});

const upload = multer({
  storage,
  limits: { 
    fileSize: 100 * 1024 * 1024, // 100MB max
    fieldSize: 100 * 1024 * 1024, // 100MB max field size
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/zip' || file.originalname.endsWith('.zip')) {
      cb(null, true);
    } else {
      cb(new Error('Only ZIP files are allowed'));
    }
  }
});

/**
 * POST /api/v1/import/upload
 * Upload and process a ZIP package
 */
router.post('/upload', validateApiKey, upload.single('package'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'BAD_REQUEST',
        message: 'No file uploaded',
        statusCode: 400,
      });
    }

    const facility = req.facility;
    const zipPath = req.file.path;
    const extractDir = path.join(__dirname, '../../uploads', `extract_${Date.now()}`);

    // Create extraction directory
    fs.mkdirSync(extractDir, { recursive: true });

    // Extract ZIP
    await fs.createReadStream(zipPath)
      .pipe(unzipper.Extract({ path: extractDir }))
      .promise();

    // Read metadata
    const metadataPath = path.join(extractDir, 'metadata.json');
    if (!fs.existsSync(metadataPath)) {
      return res.status(400).json({
        success: false,
        error: 'BAD_REQUEST',
        message: 'Invalid package: missing metadata.json',
        statusCode: 400,
      });
    }

    const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));

    // Verify hcode matches
    if (metadata.hcode !== facility.hcode) {
      return res.status(403).json({
        success: false,
        error: 'FORBIDDEN',
        message: 'Package hcode does not match API key',
        statusCode: 403,
      });
    }

    // Find and read data file
    const dataFile = fs.readdirSync(extractDir)
      .find(f => f.endsWith('.json') || f.endsWith('.csv'));

    if (!dataFile) {
      return res.status(400).json({
        success: false,
        error: 'BAD_REQUEST',
        message: 'No data file found in package',
        statusCode: 400,
      });
    }

    const dataPath = path.join(extractDir, dataFile);
    let records = [];

    if (dataFile.endsWith('.json')) {
      records = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
    } else if (dataFile.endsWith('.csv')) {
      // Parse CSV
      const csvContent = fs.readFileSync(dataPath, 'utf-8');
      const lines = csvContent.trim().split('\n');
      const headers = lines[0].split(',');
      
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',');
        const record = {};
        headers.forEach((h, idx) => {
          let value = values[idx];
          if (h === 'data') {
            value = JSON.parse(value);
          }
          record[h] = value;
        });
        records.push(record);
      }
    }

    // Import to database
    const results = await importRecords(records);

    // Clean up
    fs.unlinkSync(zipPath);
    fs.rmSync(extractDir, { recursive: true, force: true });

    return res.status(200).json({
      success: true,
      message: 'Package imported successfully',
      summary: {
        hcode: metadata.hcode,
        facility_name: metadata.facility_name,
        total_records: records.length,
        imported: results.imported,
        failed: results.failed,
        date_range: metadata.date_range,
      },
      statusCode: 200,
    });

  } catch (error) {
    console.error('Import error:', error);
    
    // Clean up on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    return res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: error.message,
      statusCode: 500,
    });
  }
});

/**
 * Import records into database
 */
async function importRecords(records) {
  let imported = 0;
  let failed = 0;

  // Group by summary type
  const grouped = {};
  for (const record of records) {
    const type = record.summary_type?.toLowerCase() || 'op';
    if (!grouped[type]) {
      grouped[type] = [];
    }
    grouped[type].push(record);
  }

  // Import each group
  for (const [summaryType, typeRecords] of Object.entries(grouped)) {
    const tableName = `summary_${summaryType}`;
    
    // Bulk insert
    const columns = ['hcode', 'report_date', 'report_period', 'summary_type', 'data', 'created_at', 'updated_at'];
    const now = new Date();
    
    const values = typeRecords.flatMap(r => [
      r.hcode,
      r.report_date,
      r.report_period || r.report_date?.slice(0, 7),
      r.summary_type,
      JSON.stringify(r.data),
      now,
      now,
    ]);

    const placeholders = typeRecords.map(() => '(?, ?, ?, ?, ?, ?, ?)').join(', ');
    
    const updateFields = columns
      .filter(c => !['hcode', 'report_date'].includes(c))
      .map(c => `${c} = VALUES(${c})`)
      .join(', ');

    const sql = `
      INSERT INTO ${tableName} (${columns.join(', ')})
      VALUES ${placeholders}
      ON DUPLICATE KEY UPDATE ${updateFields}
    `;

    try {
      await db.query(sql, values);
      imported += typeRecords.length;
    } catch (err) {
      console.error(`Import error for ${summaryType}:`, err);
      failed += typeRecords.length;
    }
  }

  return { imported, failed };
}

/**
 * GET /api/v1/import/status
 * Get import status
 */
router.get('/status', validateApiKey, async (req, res) => {
  try {
    const facility = req.facility;
    
    // Get last import info
    const result = await db.query(`
      SELECT hcode, report_date, summary_type, updated_at
      FROM summary_op
      WHERE hcode = ?
      ORDER BY updated_at DESC
      LIMIT 10
    `, [facility.hcode]);
    
    const rows = result.rows || result[0] || result;

    return res.status(200).json({
      success: true,
      data: {
        hcode: facility.hcode,
        facility_name: facility.facility_name,
        last_imports: rows,
      },
      statusCode: 200,
    });
  } catch (error) {
    console.error('Status error:', error);
    return res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: error.message,
      statusCode: 500,
    });
  }
});

module.exports = router;