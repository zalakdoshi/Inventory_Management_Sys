const express = require('express');
const router = express.Router();
const {
  requestPasswordReset,
  getResetRequests,
  handleResetRequest,
  confirmPasswordReset,
} = require('../controllers/passwordResetController');
const { protect, authorize } = require('../middleware/auth');

router.post('/request', requestPasswordReset); // Public - users can request without login
router.get('/', protect, authorize('admin'), getResetRequests);
router.put('/:id', protect, authorize('admin'), handleResetRequest);
router.post('/confirm', confirmPasswordReset); // public — token-based

module.exports = router;
