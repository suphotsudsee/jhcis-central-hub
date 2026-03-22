/**
 * Sync API Routes
 * Defines endpoints for summary data synchronization
 */

const express = require('express');
const validateApiKey = require('../middleware/auth');
const { getCentralQuery, listCentralQueries, upsertCentralQuery } = require('../controllers/queryController');
const { syncSummary, syncBatch } = require('../controllers/syncController');
const { getSupportedTypes } = require('../validators/summaryValidator');

const router = express.Router();

// Supported summary types
const SUPPORTED_TYPES = getSupportedTypes();

/**
 * POST /api/v1/sync/:summaryType
 * Sync single summary data
 * 
 * @route POST /api/v1/sync/:summaryType
 * @header X-API-Key - Facility API Key
 * @body Summary data payload (varies by type)
 */
router.post('/sync/:summaryType', validateApiKey, async (req, res) => {
  const { summaryType } = req.params;
  
  // Validate summary type
  if (!SUPPORTED_TYPES.includes(summaryType)) {
    return res.status(400).json({
      success: false,
      error: 'BAD_REQUEST',
      message: `Unsupported summary type: ${summaryType}. Supported types: ${SUPPORTED_TYPES.join(', ')}`,
      supportedTypes: SUPPORTED_TYPES,
      statusCode: 400,
    });
  }
  
  // Process sync
  await syncSummary(req, res);
});

/**
 * POST /api/v1/sync/batch
 * Sync multiple summary data in one request
 * 
 * @route POST /api/v1/sync/batch
 * @header X-API-Key - Facility API Key
 * @body Array of { summaryType, data } objects
 */
router.post('/sync/batch', validateApiKey, async (req, res) => {
  await syncBatch(req, res);
});

/**
 * GET /api/v1/queries
 * List all centrally managed SQL queries.
 */
router.get('/queries', validateApiKey, async (req, res) => {
  await listCentralQueries(req, res);
});

/**
 * GET /api/v1/queries/:summaryType
 * Get the centrally managed SQL query for a summary type.
 */
router.get('/queries/:summaryType', validateApiKey, async (req, res) => {
  await getCentralQuery(req, res);
});

/**
 * PUT /api/v1/queries/:summaryType
 * Create or update a centrally managed SQL query.
 */
router.put('/queries/:summaryType', validateApiKey, async (req, res) => {
  await upsertCentralQuery(req, res);
});

/**
 * GET /api/v1/sync/types
 * Get list of supported summary types
 * 
 * @route GET /api/v1/sync/types
 */
router.get('/sync/types', (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      supportedTypes: SUPPORTED_TYPES,
      descriptions: {
        op: 'Outpatient',
        pp: 'Preventive & Promotive',
        pharmacy: 'Pharmacy',
        lab: 'Laboratory',
        financial: 'Financial',
        resource: 'Resource',
        person: 'Person',
      },
    },
    statusCode: 200,
  });
});

/**
 * Health check endpoint
 * 
 * @route GET /api/v1/health
 */
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString(),
    statusCode: 200,
  });
});

module.exports = router;
