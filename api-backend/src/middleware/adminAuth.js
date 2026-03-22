const { verifyAdminToken } = require('../utils/adminToken');

function requireAdminAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const match = header.match(/^Bearer\s+(.+)$/i);

  if (!match) {
    return res.status(401).json({
      success: false,
      error: 'UNAUTHORIZED',
      message: 'Admin token is required',
      statusCode: 401,
    });
  }

  const payload = verifyAdminToken(match[1]);

  if (!payload) {
    return res.status(401).json({
      success: false,
      error: 'UNAUTHORIZED',
      message: 'Invalid or expired admin token',
      statusCode: 401,
    });
  }

  req.admin = {
    email: payload.sub,
    role: payload.role,
  };

  next();
}

module.exports = requireAdminAuth;
