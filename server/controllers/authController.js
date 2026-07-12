const jwt = require('jsonwebtoken');
const { User } = require('../models/index');
const { createActivityLog } = require('../middleware/activityLog');
const logger = require('../utils/logger');

const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

const register = async (req, res) => {
  try {
    const { name, email, password, phone, role } = req.body;
    if (!name || !email || !password) return res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
    if (User.findOne({ email })) return res.status(400).json({ success: false, message: 'Email already registered.' });
    const user = await User.create({ name, email, password, phone, role: role || 'salesman' });
    const token = generateToken(user.id);
    createActivityLog({ user, action: 'REGISTER', module: 'Auth', description: `New user ${user.name} registered as ${user.role}`, req, severity: 'low' });
    res.status(201).json({ success: true, message: 'Registration successful.', token, user: { _id: user.id, name: user.name, email: user.email, role: user.role, phone: user.phone } });
  } catch (error) {
    logger.error('Register error:', error);
    res.status(500).json({ success: false, message: 'Server error during registration.' });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: 'Email and password are required.' });

    const user = User.findOneWithPassword(email);
    if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    if (!user.is_active) return res.status(401).json({ success: false, message: 'Account deactivated. Contact admin.' });

    const isMatch = await User.comparePassword(password, user.password);
    if (!isMatch) return res.status(401).json({ success: false, message: 'Invalid credentials.' });

    User.update(user.id, { last_login: new Date().toISOString() });

    const token = generateToken(user.id);
    createActivityLog({ user, action: 'LOGIN', module: 'Auth', description: `${user.name} logged in as ${user.role}`, req, severity: 'low' });

    res.status(200).json({
      success: true, message: 'Login successful.', token,
      user: { _id: user.id, name: user.name, email: user.email, role: user.role, phone: user.phone, avatar: user.avatar, lastLogin: user.last_login },
    });
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error during login.' });
  }
};

const getMe = (req, res) => {
  const user = User.findById(req.user._id);
  res.status(200).json({ success: true, user });
};

const logout = async (req, res) => {
  createActivityLog({ user: req.user, action: 'LOGOUT', module: 'Auth', description: `${req.user.name} logged out`, req });
  res.status(200).json({ success: true, message: 'Logged out successfully.' });
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = User.findByIdWithPassword(req.user._id);
    const isMatch = await User.comparePassword(currentPassword, user.password);
    if (!isMatch) return res.status(400).json({ success: false, message: 'Current password is incorrect.' });
    await User.updatePassword(user.id, newPassword);
    createActivityLog({ user: req.user, action: 'PASSWORD_RESET', module: 'Auth', description: `${req.user.name} changed their password`, req, severity: 'medium' });
    res.status(200).json({ success: true, message: 'Password changed successfully.' });
  } catch (error) {
    logger.error('Change password error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = { register, login, getMe, logout, changePassword };
