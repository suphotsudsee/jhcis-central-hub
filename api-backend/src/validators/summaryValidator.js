/**
 * Summary Data Validator
 * Validates incoming JSON payload against Data Dictionary
 */

const Joi = require('joi');

// Common fields validation schema
const commonFields = {
  hcode: Joi.string().pattern(/^\d{5,11}$/).required().description('Health Facility Code (5-11 digits)'),
  report_date: Joi.date().iso().required().description('Report date in ISO format'),
  report_period: Joi.string().required().description('Report period identifier'),
};

// Summary type-specific schemas
const summarySchemas = {
  // OP (Outpatient)
  op: Joi.object({
    ...commonFields,
    total_visits: Joi.number().integer().min(0).required().description('Total outpatient visits'),
  }),
  
  // ER (Emergency)
  er: Joi.object({
    ...commonFields,
    total_visits: Joi.number().integer().min(0).required().description('Total emergency visits'),
  }),
  
  // PP (Preventive & Promotive)
  pp: Joi.object({
    ...commonFields,
    service_type: Joi.string().required().description('PP service type'),
    total_services: Joi.number().integer().min(0).required().description('Total PP services'),
  }),
  
  // Pharmacy
  pharmacy: Joi.object({
    ...commonFields,
    total_prescriptions: Joi.number().integer().min(0).required().description('Total prescriptions'),
    drug_categories: Joi.object().default({}).description('Drug category breakdown'),
  }),
  
  // Laboratory
  lab: Joi.object({
    ...commonFields,
    total_tests: Joi.number().integer().min(0).required().description('Total lab tests'),
    test_categories: Joi.object().default({}).description('Lab test category breakdown'),
  }),
  
  // Financial
  financial: Joi.object({
    ...commonFields,
    total_revenue: Joi.number().min(0).required().description('Total revenue'),
    total_expense: Joi.number().min(0).required().description('Total expense'),
    revenue_categories: Joi.object().default({}).description('Revenue category breakdown'),
  }),
  
  // Resource
  resource: Joi.object({
    ...commonFields,
    staff_count: Joi.number().integer().min(0).required().description('Total staff count'),
    bed_capacity: Joi.number().integer().min(0).required().description('Bed capacity'),
    equipment_count: Joi.number().integer().min(0).required().description('Equipment count'),
  }),

  person: Joi.object({
    ...commonFields,
    total_person: Joi.number().integer().min(0).required().description('Total registered persons'),
    male: Joi.number().integer().min(0).required().description('Total male persons'),
    female: Joi.number().integer().min(0).required().description('Total female persons'),
  }),
};

/**
 * Validate summary data based on type
 * @param {Object} data - Request body data
 * @param {string} summaryType - Type of summary (op, pp, pharmacy, etc.)
 * @returns {Object} Validation result
 */
function validateSummary(data, summaryType) {
  const schema = summarySchemas[summaryType];
  
  if (!schema) {
    return {
      valid: false,
      error: `Invalid summary type: ${summaryType}`,
    };
  }
  
  const { error, value } = schema.validate(data, {
    abortEarly: false, // Report all errors
    stripUnknown: true, // Remove unknown fields
  });
  
  if (error) {
    const errorDetails = error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message,
      type: detail.type,
    }));
    
    return {
      valid: false,
      error: 'VALIDATION_ERROR',
      details: errorDetails,
    };
  }
  
  return {
    valid: true,
    data: value,
  };
}

/**
 * Get supported summary types
 * @returns {Array} List of supported summary types
 */
function getSupportedTypes() {
  return Object.keys(summarySchemas);
}

module.exports = {
  validateSummary,
  getSupportedTypes,
  summarySchemas,
};
