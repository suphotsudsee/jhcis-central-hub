/**
 * API Key Authentication Middleware
 * Validates X-API-Key header against health_facilities table
 */

const db = require('../db/database');

/**
 * Validate API Key from request header
 * Checks against health_facilities table
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
async function validateApiKey(req, res, next) {
  const apiKey = req.headers['x-api-key'];
  
  // Check if API key is provided
  if (!apiKey) {
    return res.status(401).json({
      success: false,
      error: 'UNAUTHORIZED',
      message: 'API Key is required',
      statusCode: 401,
    });
  }
  
  try {
    // Query health_facilities table to validate API key
    const queryText = `
      SELECT hcode, facility_name, api_key, status 
      FROM health_facilities 
      WHERE api_key = $1 AND status = 'active'
      LIMIT 1
    `;
    
    const result = await db.query(queryText, [apiKey]);
    
    if (result.rows.length === 0) {
      return res.status(403).json({
        success: false,
        error: 'FORBIDDEN',
        message: 'Invalid or inactive API Key',
        statusCode: 403,
      });
    }
    
    // Attach facility info to request for downstream use
    req.facility = {
      hcode: result.rows[0].hcode,
      facilityName: result.rows[0].facility_name,
    };
    
    next();
  } catch (error) {
    console.error('API Key validation error:', error);
    return res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to validate API Key',
      statusCode: 500,
    });
  }
}

module.exports = validateApiKey;
