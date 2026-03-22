const express = require('express');
const {
  getDashboardSummary,
  getFacilitiesList,
  getOpStats,
  getFacilitiesStats,
} = require('../controllers/dashboardController');

const router = express.Router();

router.get('/dashboard/summary', getDashboardSummary);
router.get('/dashboard/facilities', getFacilitiesList);
router.get('/dashboard/op-stats', getOpStats);
router.get('/dashboard/facilities-stats', getFacilitiesStats);

module.exports = router;
