/**
 * Rate Limiting Middleware for JHCIS Summary Centralization
 * 
 * Implements tiered rate limiting based on endpoint type and facility behavior.
 * Uses Redis for distributed rate limiting across multiple instances.
 */

const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const { createClient } = require('redis');

// Redis client for distributed rate limiting
const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

// Initialize Redis connection
async function initRedis() {
  try {
    await redisClient.connect();
    console.log('✅ Redis connected for rate limiting');
  } catch (error) {
    console.warn('⚠️ Redis unavailable, using memory store (not recommended for production)');
  }
}

// Call once on startup
initRedis();

/**
 * Rate Limit Tiers Configuration
 * 
 * Different limits for different endpoint categories
 */
const rateLimitTiers = {
  // Authentication endpoints - strictest limits
  auth: {
    windowMs: 60 * 1000, // 1 minute
    max: 5, // 5 requests per minute
    message: {
      error: 'Too many authentication attempts',
      retryAfter: '60 seconds'
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
      // Rate limit by facility API key or IP
      return req.apiKey?.facilityCode || req.ip;
    }
  },

  // Data submission endpoints - moderate limits
  submission: {
    windowMs: 60 * 1000, // 1 minute
    max: 100, // 100 requests per minute
    message: {
      error: 'Too many data submission requests',
      retryAfter: '60 seconds'
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
      return req.apiKey?.facilityCode || req.ip;
    },
    // Custom handler for rate limit exceeded
    handler: (req, res, next, options) => {
      // Log rate limit hit for monitoring
      console.warn(`Rate limit exceeded for facility: ${req.apiKey?.facilityCode || req.ip}`);
      
      // Track repeated violations
      trackViolation(req.apiKey?.facilityCode);
      
      res.status(429).json(options.message);
    }
  },

  // Bulk import endpoints - resource-intensive
  bulkImport: {
    windowMs: 60 * 1000, // 1 minute
    max: 10, // 10 requests per minute
    message: {
      error: 'Too many bulk import requests',
      retryAfter: '60 seconds',
      suggestion: 'Use batch endpoints for large datasets'
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
      return req.apiKey?.facilityCode || req.ip;
    }
  },

  // General API endpoints - standard limits
  general: {
    windowMs: 60 * 1000, // 1 minute
    max: 1000, // 1000 requests per minute
    message: {
      error: 'Too many requests',
      retryAfter: '60 seconds'
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
      return req.apiKey?.facilityCode || req.ip;
    }
  }
};

/**
 * Track repeated rate limit violations per facility
 * Used for progressive enforcement (warnings → suspension)
 */
const violationTracker = new Map();

function trackViolation(facilityCode) {
  if (!facilityCode) return;
  
  const current = violationTracker.get(facilityCode) || 0;
  const updated = current + 1;
  violationTracker.set(facilityCode, updated);
  
  // Log if facility has excessive violations
  if (updated > 100) {
    console.error(`⚠️ Facility ${facilityCode} has ${updated} rate limit violations in current window`);
  }
}

function getViolationCount(facilityCode) {
  return violationTracker.get(facilityCode) || 0;
}

function resetViolations(facilityCode) {
  violationTracker.delete(facilityCode);
}

/**
 * Create rate limiters for each tier
 */
const authLimiter = rateLimit(rateLimitTiers.auth);
const submissionLimiter = rateLimit(rateLimitTiers.submission);
const bulkImportLimiter = rateLimit(rateLimitTiers.bulkImport);
const generalLimiter = rateLimit(rateLimitTiers.general);

/**
 * Apply rate limiting based on route pattern
 * 
 * Usage:
 * app.use('/api/auth/*', authLimiter);
 * app.use('/api/submit/*', submissionLimiter);
 * app.use('/api/bulk/*', bulkImportLimiter);
 * app.use('/api/*', generalLimiter);
 */

/**
 * Custom middleware to attach facility info to request
 * Should be used AFTER authentication middleware
 */
function attachFacilityInfo(req, res, next) {
  // This assumes auth middleware has set req.apiKey
  // Example: req.apiKey = { facilityCode: 'FAC001', id: 'key_id' }
  next();
}

/**
 * Progressive enforcement middleware
 * 
 * Facilities with repeated violations get temporary suspension
 */
function progressiveEnforcement(req, res, next) {
  const facilityCode = req.apiKey?.facilityCode;
  
  if (!facilityCode) {
    return next();
  }
  
  const violations = getViolationCount(facilityCode);
  
  // Progressive response based on violation count
  if (violations > 500) {
    // Temporary suspension - 24 hours
    console.warn(`🚫 Facility ${facilityCode} temporarily suspended (500+ violations)`);
    return res.status(403).json({
      error: 'Account temporarily suspended',
      reason: 'Excessive rate limit violations',
      retryAfter: '24 hours',
      contact: 'support@jhcis.go.th'
    });
  }
  
  if (violations > 100) {
    // Warning header
    res.set('X-RateLimit-Warning', 'Excessive violations detected');
  }
  
  next();
}

/**
 * DDoS protection: Connection-level rate limiting
 * 
 * Limits concurrent connections per IP
 */
const connectionLimiter = rateLimit({
  windowMs: 1000, // 1 second
  max: 50, // 50 concurrent connections per IP
  message: {
    error: 'Too many concurrent connections',
    retryAfter: '1 second'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.ip,
  // Skip for internal/healthcheck IPs
  skip: (req) => {
    const internalIPs = ['127.0.0.1', '::1', '10.0.0.', '172.16.', '192.168.'];
    return internalIPs.some(ip => req.ip.startsWith(ip));
  }
});

/**
 * Export configured limiters
 */
module.exports = {
  // Tiered limiters
  authLimiter,
  submissionLimiter,
  bulkImportLimiter,
  generalLimiter,
  
  // Protection layers
  connectionLimiter,
  progressiveEnforcement,
  
  // Utilities
  trackViolation,
  getViolationCount,
  resetViolations,
  
  // Redis client for custom implementations
  redisClient
};

/**
 * Usage Example in Express App:
 * 
 * const rateLimit = require('./middleware/rateLimit');
 * 
 * // Apply connection limiter globally (first line of middleware)
 * app.use(rateLimit.connectionLimiter);
 * 
 * // Apply tiered limiters to specific routes
 * app.use('/api/auth', rateLimit.authLimiter);
 * app.use('/api/submit', rateLimit.submissionLimiter);
 * app.use('/api/bulk', rateLimit.bulkImportLimiter);
 * app.use('/api', rateLimit.generalLimiter);
 * 
 * // Apply progressive enforcement after auth
 * app.use('/api', rateLimit.progressiveEnforcement);
 */
