/**
 * JHCIS Summary Centralization API Server
 * Main Express application entry point
 */

require('dotenv').config();

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const syncRoutes = require('./routes/sync');
const dashboardRoutes = require('./routes/dashboard');
const adminRoutes = require('./routes/admin');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// ============================================
// Security Middleware
// ============================================

// Helmet - Set security HTTP headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
}));

// CORS - Configure Cross-Origin Resource Sharing
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
  credentials: false,
}));

// Rate Limiting - Prevent brute force attacks
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: 'TOO_MANY_REQUESTS',
    message: 'Too many requests, please try again later',
    statusCode: 429,
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// ============================================
// Body Parsing
// ============================================

// JSON body parser with size limit
app.use(express.json({
  limit: '1mb', // Adjust based on expected payload size
}));

// URL-encoded body parser
app.use(express.urlencoded({
  extended: true,
  limit: '1mb',
}));

// ============================================
// API Routes
// ============================================

// Mount sync routes
app.use('/api/v1', syncRoutes);
app.use('/api/v1', dashboardRoutes);
app.use('/api/v1', adminRoutes);

// ============================================
// Error Handling
// ============================================

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    error: 'NOT_FOUND',
    message: `Route ${req.method} ${req.path} not found`,
    statusCode: 404,
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  
  // Don't leak error details in production
  const message = process.env.NODE_ENV === 'production' 
    ? 'Internal server error' 
    : err.message;
  
  res.status(err.statusCode || 500).json({
    success: false,
    error: err.error || 'INTERNAL_ERROR',
    message,
    statusCode: err.statusCode || 500,
  });
});

// ============================================
// Server Startup
// ============================================

app.listen(PORT, () => {
  console.log('========================================');
  console.log('JHCIS Summary Centralization API Server');
  console.log('========================================');
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Port: ${PORT}`);
  console.log(`API Version: v1`);
  console.log(`Time: ${new Date().toISOString()}`);
  console.log('========================================');
  console.log('Supported endpoints:');
  console.log('  POST /api/v1/sync/:summaryType');
  console.log('  POST /api/v1/sync/batch');
  console.log('  GET  /api/v1/sync/types');
  console.log('  GET  /api/v1/queries');
  console.log('  GET  /api/v1/queries/:summaryType');
  console.log('  PUT  /api/v1/queries/:summaryType');
  console.log('  GET  /api/v1/health');
  console.log('  GET  /api/v1/dashboard/summary');
  console.log('  GET  /api/v1/dashboard/facilities');
  console.log('  GET  /api/v1/dashboard/op-stats');
  console.log('  GET  /api/v1/dashboard/facilities-stats');
  console.log('  GET  /api/v1/admin/facilities');
  console.log('  POST /api/v1/admin/facilities');
  console.log('  PUT  /api/v1/admin/facilities/:hcode');
  console.log('  POST /api/v1/admin/facilities/:hcode/regenerate-key');
  console.log('  GET  /api/v1/admin/queries');
  console.log('  GET  /api/v1/admin/queries/:summaryType');
  console.log('  PUT  /api/v1/admin/queries/:summaryType');
  console.log('========================================');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  process.exit(0);
});

module.exports = app;
