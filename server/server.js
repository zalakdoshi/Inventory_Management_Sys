require('dotenv').config();
const app = require('./app');
const { connectDB } = require('./config/db');
const logger = require('./utils/logger');

const PORT = process.env.PORT || 5000;

// Connect to SQLite (synchronous — no async needed)
connectDB();

app.listen(PORT, '0.0.0.0', () => {
  logger.info(`🚀 Inventory Management System Server running on port ${PORT}`);
  logger.info(`📌 Environment: ${process.env.NODE_ENV}`);
  logger.info(`🌐 API Base: http://localhost:${PORT}/api`);
  logger.info(`💾 Database: SQLite (${process.env.DB_PATH || './database.db'})`);
});

process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Rejection:', err.message);
});

process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err.message);
});
