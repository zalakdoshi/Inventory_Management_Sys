const express = require('express');
const router = express.Router();
const { getUsers, createUser, updateUser, deleteUser, toggleUserStatus } = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');

router.get('/', protect, authorize('admin'), getUsers);
router.post('/', protect, authorize('admin'), createUser);
router.put('/:id', protect, authorize('admin'), updateUser);
router.delete('/:id', protect, authorize('admin'), deleteUser);
router.put('/:id/toggle-status', protect, authorize('admin'), toggleUserStatus);

module.exports = router;
