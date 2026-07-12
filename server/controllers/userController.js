const { User } = require('../models/index');
const { createActivityLog } = require('../middleware/activityLog');
const logger = require('../utils/logger');

const getUsers = (req, res) => {
  try {
    const { page = 1, limit = 10, role = '', search = '' } = req.query;
    const { rows, total } = User.find({ role, search, page, limit });
    res.status(200).json({ success: true, data: rows, pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const createUser = async (req, res) => {
  try {
    const { name, email, password, role, phone } = req.body;
    const existing = User.findOne({ email });
    if (existing) return res.status(400).json({ success: false, message: 'Email already registered.' });
    const user = await User.create({ name, email, password, role, phone, createdBy: req.user._id });
    createActivityLog({ user: req.user, action: 'CREATE', module: 'Users', description: `Admin created user: ${name} (${role})`, details: { userId: user.id, email, role }, req, severity: 'high' });
    res.status(201).json({ success: true, message: 'User created successfully.', data: user });
  } catch (error) {
    logger.error('Create user error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error.' });
  }
};

const updateUser = async (req, res) => {
  try {
    const { password, ...updateData } = req.body;
    const existing = User.findById(req.params.id);
    if (!existing) return res.status(404).json({ success: false, message: 'User not found.' });

    const fields = {};
    if (updateData.name !== undefined) fields.name = updateData.name;
    if (updateData.email !== undefined) fields.email = updateData.email;
    if (updateData.role !== undefined) fields.role = updateData.role;
    if (updateData.phone !== undefined) fields.phone = updateData.phone;
    if (updateData.isActive !== undefined) fields.is_active = updateData.isActive ? 1 : 0;

    const user = Object.keys(fields).length ? User.update(req.params.id, fields) : existing;
    if (password) await User.updatePassword(req.params.id, password);

    createActivityLog({ user: req.user, action: 'UPDATE', module: 'Users', description: `Admin updated user: ${user.name}`, req, severity: 'high' });
    res.status(200).json({ success: true, message: 'User updated.', data: User.findById(req.params.id) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const deleteUser = async (req, res) => {
  try {
    if (req.params.id === req.user._id) return res.status(400).json({ success: false, message: 'Cannot delete your own account.' });
    const user = User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    User.delete(req.params.id);
    createActivityLog({ user: req.user, action: 'DELETE', module: 'Users', description: `Admin deleted user: ${user.name} (${user.email})`, req, severity: 'high' });
    res.status(200).json({ success: true, message: 'User deleted.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const toggleUserStatus = async (req, res) => {
  try {
    const user = User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    const newActive = user.is_active ? 0 : 1;
    User.update(req.params.id, { is_active: newActive });
    const updated = User.findById(req.params.id);
    createActivityLog({ user: req.user, action: 'UPDATE', module: 'Users', description: `Admin ${newActive ? 'activated' : 'deactivated'} user: ${user.name}`, req, severity: 'high' });
    res.status(200).json({ success: true, message: `User ${newActive ? 'activated' : 'deactivated'}.`, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = { getUsers, createUser, updateUser, deleteUser, toggleUserStatus };
