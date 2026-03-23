const express = require('express');
const {
  loginAdmin,
  listFacilities,
  createFacility,
  updateFacility,
  regenerateFacilityKey,
  deleteFacility,
} = require('../controllers/adminController');
const {
  listCentralQueries,
  getCentralQuery,
  upsertCentralQuery,
} = require('../controllers/queryController');
const requireAdminAuth = require('../middleware/adminAuth');

const router = express.Router();

router.post('/admin/login', loginAdmin);
router.get('/admin/facilities', requireAdminAuth, listFacilities);
router.post('/admin/facilities', requireAdminAuth, createFacility);
router.put('/admin/facilities/:hcode', requireAdminAuth, updateFacility);
router.delete('/admin/facilities/:hcode', requireAdminAuth, deleteFacility);
router.post('/admin/facilities/:hcode/regenerate-key', requireAdminAuth, regenerateFacilityKey);
router.get('/admin/queries', requireAdminAuth, listCentralQueries);
router.get('/admin/queries/:summaryType', requireAdminAuth, getCentralQuery);
router.put('/admin/queries/:summaryType', requireAdminAuth, upsertCentralQuery);

module.exports = router;
