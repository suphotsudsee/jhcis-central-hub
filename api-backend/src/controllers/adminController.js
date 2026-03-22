const crypto = require('crypto');
const db = require('../db/database');
const { createAdminToken } = require('../utils/adminToken');

function generateApiKey() {
  return `jhcis_${crypto.randomBytes(24).toString('base64url')}`;
}

function normalizeFacility(row) {
  return {
    hcode: row.hcode,
    facility_name: row.facility_name,
    api_key: row.api_key,
    status: row.status,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

async function loginAdmin(req, res) {
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  const adminEmail = String(process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const adminPassword = String(process.env.ADMIN_PASSWORD || '');

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      error: 'VALIDATION_ERROR',
      message: 'email and password are required',
      statusCode: 400,
    });
  }

  if (email !== adminEmail || password !== adminPassword) {
    return res.status(401).json({
      success: false,
      error: 'UNAUTHORIZED',
      message: 'Invalid admin credentials',
      statusCode: 401,
    });
  }

  const token = createAdminToken(email);

  return res.status(200).json({
    success: true,
    data: {
      token,
      admin: {
        email,
      },
    },
    statusCode: 200,
  });
}

async function listFacilities(req, res) {
  try {
    const result = await db.query(`
      SELECT hcode, facility_name, api_key, status, created_at, updated_at
      FROM health_facilities
      ORDER BY facility_name ASC, hcode ASC
    `);

    return res.status(200).json({
      success: true,
      data: result.rows.map(normalizeFacility),
      statusCode: 200,
    });
  } catch (error) {
    console.error('List facilities error:', error);
    return res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to load facilities',
      statusCode: 500,
    });
  }
}

async function createFacility(req, res) {
  try {
    const hcode = String(req.body.hcode || '').trim();
    const facilityName = String(req.body.facility_name || '').trim();
    const status = req.body.status === 'inactive' ? 'inactive' : 'active';
    const apiKey = String(req.body.api_key || '').trim() || generateApiKey();

    if (!/^\d{5,11}$/.test(hcode)) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'hcode must be 5 to 11 digits',
        statusCode: 400,
      });
    }

    if (!facilityName) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'facility_name is required',
        statusCode: 400,
      });
    }

    await db.query(
      `
        INSERT INTO health_facilities (hcode, facility_name, api_key, status)
        VALUES (?, ?, ?, ?)
      `,
      [hcode, facilityName, apiKey, status]
    );

    const result = await db.query(
      `
        SELECT hcode, facility_name, api_key, status, created_at, updated_at
        FROM health_facilities
        WHERE hcode = ?
        LIMIT 1
      `,
      [hcode]
    );

    return res.status(201).json({
      success: true,
      data: normalizeFacility(result.rows[0]),
      statusCode: 201,
    });
  } catch (error) {
    console.error('Create facility error:', error);

    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        success: false,
        error: 'CONFLICT',
        message: 'hcode or api_key already exists',
        statusCode: 409,
      });
    }

    return res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to create facility',
      statusCode: 500,
    });
  }
}

async function updateFacility(req, res) {
  try {
    const hcode = String(req.params.hcode || '').trim();
    const facilityName = String(req.body.facility_name || '').trim();
    const status = req.body.status === 'inactive' ? 'inactive' : 'active';

    if (!facilityName) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'facility_name is required',
        statusCode: 400,
      });
    }

    const result = await db.query(
      `
        UPDATE health_facilities
        SET facility_name = ?, status = ?, updated_at = CURRENT_TIMESTAMP
        WHERE hcode = ?
      `,
      [facilityName, status, hcode]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        error: 'NOT_FOUND',
        message: 'Facility not found',
        statusCode: 404,
      });
    }

    const updated = await db.query(
      `
        SELECT hcode, facility_name, api_key, status, created_at, updated_at
        FROM health_facilities
        WHERE hcode = ?
        LIMIT 1
      `,
      [hcode]
    );

    return res.status(200).json({
      success: true,
      data: normalizeFacility(updated.rows[0]),
      statusCode: 200,
    });
  } catch (error) {
    console.error('Update facility error:', error);
    return res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to update facility',
      statusCode: 500,
    });
  }
}

async function regenerateFacilityKey(req, res) {
  try {
    const hcode = String(req.params.hcode || '').trim();
    const apiKey = generateApiKey();

    const result = await db.query(
      `
        UPDATE health_facilities
        SET api_key = ?, updated_at = CURRENT_TIMESTAMP
        WHERE hcode = ?
      `,
      [apiKey, hcode]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        error: 'NOT_FOUND',
        message: 'Facility not found',
        statusCode: 404,
      });
    }

    const updated = await db.query(
      `
        SELECT hcode, facility_name, api_key, status, created_at, updated_at
        FROM health_facilities
        WHERE hcode = ?
        LIMIT 1
      `,
      [hcode]
    );

    return res.status(200).json({
      success: true,
      data: normalizeFacility(updated.rows[0]),
      statusCode: 200,
    });
  } catch (error) {
    console.error('Regenerate API key error:', error);
    return res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to regenerate API key',
      statusCode: 500,
    });
  }
}

module.exports = {
  loginAdmin,
  listFacilities,
  createFacility,
  updateFacility,
  regenerateFacilityKey,
};
