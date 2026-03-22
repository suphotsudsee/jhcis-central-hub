/**
 * API Key Generator Utility for JHCIS Summary Centralization
 * 
 * Generates cryptographically secure API keys for health facilities.
 * Implements secure hashing, rotation, and revocation workflows.
 */

const crypto = require('crypto');
const argon2 = require('argon2');
const { v4: uuidv4 } = require('uuid');

/**
 * Configuration Constants
 */
const CONFIG = {
  // Key length in bytes (32 bytes = 256 bits of entropy)
  KEY_LENGTH_BYTES: 32,
  
  // Argon2id parameters (OWASP recommended for password hashing)
  ARGON2_OPTIONS: {
    type: argon2.argon2id,
    memoryCost: 65536, // 64 MB
    timeCost: 3,       // 3 iterations
    parallelism: 4     // 4 parallel threads
  },
  
  // Key rotation policy
  ROTATION_INTERVAL_DAYS: 90,
  GRACE_PERIOD_HOURS: 24,
  
  // Key prefix for identification (not secret)
  KEY_PREFIX: 'jhcis_',
  
  // Encoding format
  ENCODING: 'base64url' // URL-safe base64
};

/**
 * Generate Cryptographically Secure API Key
 * 
 * @returns {string} Plaintext API key (return ONCE to facility admin)
 */
function generateApiKey() {
  // Generate secure random bytes
  const randomBytes = crypto.randomBytes(CONFIG.KEY_LENGTH_BYTES);
  
  // Convert to URL-safe base64
  const key = randomBytes.toString(CONFIG.ENCODING);
  
  // Add prefix for identification
  const prefixedKey = `${CONFIG.KEY_PREFIX}${key}`;
  
  return prefixedKey;
}

/**
 * Hash API Key for Secure Storage
 * 
 * @param {string} apiKey - Plaintext API key
 * @returns {Promise<string>} Argon2id hash
 */
async function hashApiKey(apiKey) {
  try {
    const hash = await argon2.hash(apiKey, CONFIG.ARGON2_OPTIONS);
    return hash;
  } catch (error) {
    console.error('Failed to hash API key:', error.message);
    throw new Error('Key hashing failed');
  }
}

/**
 * Verify API Key Against Hash
 * 
 * @param {string} hash - Stored hash from database
 * @param {string} apiKey - Plaintext key provided by client
 * @returns {Promise<boolean>} True if key matches
 */
async function verifyApiKey(hash, apiKey) {
  try {
    const valid = await argon2.verify(hash, apiKey);
    return valid;
  } catch (error) {
    console.error('Failed to verify API key:', error.message);
    return false;
  }
}

/**
 * Generate API Key for New Facility
 * 
 * Complete workflow: generate → hash → return (once)
 * 
 * @param {string} facilityCode - Unique facility identifier
 * @returns {Promise<Object>} Key details (return plaintext ONCE)
 */
async function provisionApiKey(facilityCode) {
  const apiKey = generateApiKey();
  const hash = await hashApiKey(apiKey);
  const keyId = uuidv4();
  
  const now = new Date();
  const expiresAt = new Date(now.getTime() + (CONFIG.ROTATION_INTERVAL_DAYS * 24 * 60 * 60 * 1000));
  
  return {
    facilityCode,
    keyId,
    apiKey, // ⚠️ Return this ONCE to facility admin
    hash,   // Store this in database
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    lastRotatedAt: null,
    revokedAt: null,
    isActive: true
  };
}

/**
 * Rotate API Key
 * 
 * Grace period: both old and new keys valid for 24 hours
 * 
 * @param {string} facilityCode - Facility identifier
 * @param {string} oldKeyHash - Current key hash from database
 * @returns {Promise<Object>} New key details
 */
async function rotateApiKey(facilityCode, oldKeyHash) {
  const newApiKey = generateApiKey();
  const newHash = await hashApiKey(newApiKey);
  const keyId = uuidv4();
  
  const now = new Date();
  const expiresAt = new Date(now.getTime() + (CONFIG.ROTATION_INTERVAL_DAYS * 24 * 60 * 60 * 1000));
  const gracePeriodEnd = new Date(now.getTime() + (CONFIG.GRACE_PERIOD_HOURS * 60 * 60 * 1000));
  
  return {
    facilityCode,
    keyId,
    newApiKey, // ⚠️ Return this ONCE to facility admin
    newHash,
    oldKeyHash, // Keep old hash for grace period validation
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    gracePeriodEnd: gracePeriodEnd.toISOString(),
    lastRotatedAt: now.toISOString(),
    isActive: true
  };
}

/**
 * Revoke API Key
 * 
 * Immediately invalidate key, log revocation
 * 
 * @param {string} facilityCode - Facility identifier
 * @param {string} keyHash - Current key hash
 * @param {string} reason - Revocation reason
 * @returns {Promise<Object>} Revocation details
 */
async function revokeApiKey(facilityCode, keyHash, reason = 'unspecified') {
  const now = new Date();
  
  return {
    facilityCode,
    keyHash,
    revokedAt: now.toISOString(),
    reason,
    isActive: false,
    revokedBy: 'system', // Should be set by auth middleware
    auditLogId: uuidv4()
  };
}

/**
 * Check if Key is Within Grace Period
 * 
 * Used during rotation to accept both old and new keys
 * 
 * @param {string} gracePeriodEnd - ISO timestamp
 * @returns {boolean} True if within grace period
 */
function isWithinGracePeriod(gracePeriodEnd) {
  const now = new Date();
  const graceEnd = new Date(gracePeriodEnd);
  return now <= graceEnd;
}

/**
 * Check if Key is Expired
 * 
 * @param {string} expiresAt - ISO timestamp
 * @returns {boolean} True if expired
 */
function isKeyExpired(expiresAt) {
  const now = new Date();
  const expires = new Date(expiresAt);
  return now > expires;
}

/**
 * Validate Key Format
 * 
 * Quick validation before expensive hash verification
 * 
 * @param {string} apiKey - Key to validate
 * @returns {boolean} True if format is valid
 */
function isValidKeyFormat(apiKey) {
  if (!apiKey || typeof apiKey !== 'string') {
    return false;
  }
  
  // Check prefix
  if (!apiKey.startsWith(CONFIG.KEY_PREFIX)) {
    return false;
  }
  
  // Check length (prefix + 32 bytes base64url ≈ 43 chars)
  const expectedLength = CONFIG.KEY_PREFIX.length + 43;
  if (apiKey.length < expectedLength - 5 || apiKey.length > expectedLength + 5) {
    return false;
  }
  
  // Check base64url characters
  const base64urlRegex = /^[A-Za-z0-9_-]+$/;
  const keyPart = apiKey.slice(CONFIG.KEY_PREFIX.length);
  return base64urlRegex.test(keyPart);
}

/**
 * Get Key Metadata for Audit
 * 
 * @param {string} apiKey - Plaintext key
 * @returns {Object} Non-sensitive metadata
 */
function getKeyMetadata(apiKey) {
  return {
    keyPrefix: CONFIG.KEY_PREFIX,
    keyLength: apiKey.length,
    keyIdHash: crypto.createHash('sha256').update(apiKey).digest('hex').slice(0, 8), // First 8 chars for identification
    createdAt: new Date().toISOString()
  };
}

/**
 * Batch Generate Keys for Multiple Facilities
 * 
 * @param {Array<string>} facilityCodes - List of facility codes
 * @returns {Promise<Array<Object>} Array of key provisioning results
 */
async function batchProvisionApiKeys(facilityCodes) {
  const results = [];
  
  for (const facilityCode of facilityCodes) {
    try {
      const provision = await provisionApiKey(facilityCode);
      results.push({
        facilityCode,
        success: true,
        data: provision
      });
    } catch (error) {
      results.push({
        facilityCode,
        success: false,
        error: error.message
      });
    }
  }
  
  return results;
}

/**
 * Export Public Functions
 */
module.exports = {
  // Core functions
  generateApiKey,
  hashApiKey,
  verifyApiKey,
  provisionApiKey,
  rotateApiKey,
  revokeApiKey,
  
  // Validation functions
  isValidKeyFormat,
  isWithinGracePeriod,
  isKeyExpired,
  
  // Utilities
  getKeyMetadata,
  batchProvisionApiKeys,
  
  // Configuration
  CONFIG
};

/**
 * Usage Examples:
 * 
 * // 1. Provision new facility
 * const keyData = await apiKeyGenerator.provisionApiKey('FAC001');
 * // Return keyData.apiKey to admin ONCE, store keyData.hash in DB
 * 
 * // 2. Verify incoming request
 * const isValid = await apiKeyGenerator.verifyApiKey(storedHash, providedKey);
 * 
 * // 3. Rotate key (scheduled or emergency)
 * const rotationData = await apiKeyGenerator.rotateApiKey('FAC001', currentHash);
 * 
 * // 4. Revoke compromised key
 * const revocationData = await apiKeyGenerator.revokeApiKey('FAC001', hash, 'suspected_compromise');
 * 
 * // 5. Batch provision for 80 facilities
 * const facilityCodes = Array.from({length: 80}, (_, i) => `FAC${String(i+1).padStart(3, '0')}`);
 * const results = await apiKeyGenerator.batchProvisionApiKeys(facilityCodes);
 */
