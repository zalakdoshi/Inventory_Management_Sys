const { ActivityLog } = require('../models/index');
const logger = require('../utils/logger');

/**
 * Create an activity log entry (SQLite)
 */
const createActivityLog = async ({ user, action, module, description, details = null, req = null, severity = 'low' }) => {
  try {
    ActivityLog.create({
      userId: user?._id || user?.id || null,
      userName: user?.name || 'System',
      userRole: user?.role || 'system',
      action,
      module,
      description,
      details,
      severity,
      ipAddress: req ? (req.ip || req.headers['x-forwarded-for'] || 'unknown') : 'system',
      userAgent: req ? req.headers['user-agent'] : 'system',
    });
  } catch (error) {
    logger.error('Failed to create activity log:', error.message);
  }
};

const activityLogger = (module) => (action) => async (req, res, next) => {
  res.on('finish', () => {
    if (res.statusCode < 400 && req.user) {
      createActivityLog({ user: req.user, action, module, description: `${req.user.name} performed ${action} on ${module}`, req });
    }
  });
  next();
};

module.exports = { createActivityLog, activityLogger };
