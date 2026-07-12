const express = require('express');
const router = express.Router();
const { getBills, createBill, generateBillPDF } = require('../controllers/billController');
const { protect, authorize } = require('../middleware/auth');

router.get('/', protect, getBills);
router.post('/', protect, authorize('salesman', 'admin'), createBill);
router.get('/:id/pdf', protect, generateBillPDF);

module.exports = router;
