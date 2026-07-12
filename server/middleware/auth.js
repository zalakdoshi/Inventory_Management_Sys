const jwt = require('jsonwebtoken');
const { User } = require('../models/index');
const logger = require('../utils/logger');

const protect = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    if (!token) return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = User.findById(decoded.id);
    if (!user) return res.status(401).json({ success: false, message: 'User no longer exists.' });
    if (!user.is_active) return res.status(401).json({ success: false, message: 'Account is deactivated. Contact admin.' });

    // Normalise for controllers
    req.user = { ...user, _id: user.id, isActive: !!user.is_active };
    next();
  } catch (error) {
    logger.error('Auth middleware error:', error.message);
    if (error.name === 'JsonWebTokenError') return res.status(401).json({ success: false, message: 'Invalid token.' });
    if (error.name === 'TokenExpiredError') return res.status(401).json({ success: false, message: 'Token expired. Please login again.' });
    return res.status(500).json({ success: false, message: 'Server error during authentication.' });
  }
};

const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ success: false, message: `Access denied. Required: ${roles.join(' or ')}. Your role: ${req.user.role}` });
  }
  next();
};

module.exports = { protect, authorize };
