const express = require('express');
const router = express.Router();
const { getDashboardStats, exportReport, getActivityLogs } = require('../controllers/reportController');
const { protect, authorize } = require('../middleware/auth');

router.get('/dashboard', protect, getDashboardStats);
router.get('/export', protect, authorize('admin'), exportReport);
router.get('/activity-logs', protect, authorize('admin'), getActivityLogs);

module.exports = router;
