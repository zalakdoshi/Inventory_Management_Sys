const express = require('express');
const router = express.Router();
const { getPurchases, createPurchase, updatePurchase, deletePurchase } = require('../controllers/purchaseController');
const { protect, authorize } = require('../middleware/auth');

router.get('/', protect, authorize('admin', 'purchaser'), getPurchases);
router.post('/', protect, authorize('purchaser', 'admin'), createPurchase);
router.put('/:id', protect, authorize('purchaser', 'admin'), updatePurchase);
router.delete('/:id', protect, authorize('purchaser', 'admin'), deletePurchase);

module.exports = router;
