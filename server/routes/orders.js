const express = require('express');
const router = express.Router();
const { getOrders, getOrder, createOrder, updateOrderStatus } = require('../controllers/orderController');
const { protect, authorize } = require('../middleware/auth');

router.get('/', protect, getOrders);
router.get('/:id', protect, getOrder);
router.post('/', protect, authorize('salesman', 'admin'), createOrder);
router.put('/:id/status', protect, authorize('admin', 'salesman'), updateOrderStatus);

module.exports = router;
