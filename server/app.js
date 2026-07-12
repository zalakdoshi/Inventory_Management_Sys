const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const path = require('path');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const logger = require('./utils/logger');

// Route imports
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const purchaseRoutes = require('./routes/purchases');
const orderRoutes = require('./routes/orders');
const billRoutes = require('./routes/bills');
const userRoutes = require('./routes/users');
const reportRoutes = require('./routes/reports');
const passwordResetRoutes = require('./routes/passwordReset');

const app = express();

// ── CORS ────────────────────────────────────────────────────────
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:5000',
  process.env.FRONTEND_URL,
].filter(o => o && o !== 'undefined');

function isOriginAllowed(origin) {
  if (!origin) return true;
  if (allowedOrigins.includes(origin)) return true;
  if (process.env.NODE_ENV === 'development') return true;
  return false;
}

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (isOriginAllowed(origin)) {
    res.set('Access-Control-Allow-Origin', origin || '*');
    res.set('Access-Control-Allow-Credentials', 'true');
    res.set('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  }
  if (req.method === 'OPTIONS') return res.status(204).end();
  next();
});

// ── Middleware ───────────────────────────────────────────────────
app.use(compression());
app.use((req, res, next) => {
  if (req.method === 'GET' && !req.path.startsWith('/api/')) {
    res.set('Cache-Control', 'public, max-age=300');
  } else {
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
  }
  next();
});
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200, message: { success: false, message: 'Too many requests.' } });
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, message: { success: false, message: 'Too many login attempts.' } });
app.use('/api/', limiter);
app.use('/api/auth/login', authLimiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev', { skip: (req, res) => res.statusCode < 400, stream: { write: (msg) => logger.warn(msg.trim()) } }));
}

// ── Static Files ────────────────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/invoices', express.static(path.join(__dirname, 'invoices')));

// ── Health Check ────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true, message: 'Inventory Management System API is running.',
    timestamp: new Date().toISOString(), environment: process.env.NODE_ENV,
  });
});

app.get('/', (req, res) => {
  res.status(200).json({
    success: true, message: 'Inventory Management System API', version: '1.0.0',
    endpoints: { health: '/health', auth: '/api/auth', products: '/api/products', purchases: '/api/purchases', orders: '/api/orders', bills: '/api/bills', users: '/api/users', reports: '/api/reports', suppliers: '/api/suppliers' },
  });
});

// ── API Routes ──────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/purchases', purchaseRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/bills', billRoutes);
app.use('/api/users', userRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/password-reset', passwordResetRoutes);

// ── Suppliers Route (SQLite) ────────────────────────────────────
const { Supplier } = require('./models/index');
const { protect, authorize } = require('./middleware/auth');

app.get('/api/suppliers', protect, (req, res) => {
  const suppliers = Supplier.find({ isActive: true });
  res.json({ success: true, data: suppliers });
});

app.post('/api/suppliers', protect, authorize('admin', 'purchaser'), (req, res) => {
  try {
    const supplier = Supplier.create({ ...req.body, createdBy: req.user._id });
    res.status(201).json({ success: true, data: supplier, message: 'Supplier created.' });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

app.put('/api/suppliers/:id', protect, authorize('admin'), (req, res) => {
  const s = Supplier.update(req.params.id, req.body);
  res.json({ success: true, data: s });
});

app.delete('/api/suppliers/:id', protect, authorize('admin'), (req, res) => {
  Supplier.delete(req.params.id);
  res.json({ success: true, message: 'Supplier deleted.' });
});

// ── Contact Route ───────────────────────────────────────────────
const nodemailer = require('nodemailer');
app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, phone, message } = req.body;
    if (!name || !email || !message) return res.status(400).json({ success: false, message: 'Name, email, and message are required.' });
    const transporter = nodemailer.createTransport({ service: 'gmail', auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASSWORD } });
    await transporter.sendMail({
      from: `"Inventory Management System" <${process.env.EMAIL_USER}>`, to: process.env.EMAIL_USER, replyTo: email,
      subject: `New Inquiry: ${name}`,
      html: `<div style="font-family:Arial;padding:20px;"><h2>New Inquiry</h2><p><strong>Name:</strong> ${name}</p><p><strong>Email:</strong> ${email}</p><p><strong>Phone:</strong> ${phone || 'N/A'}</p><p><strong>Message:</strong></p><p style="background:#f0fdf4;padding:15px;border-radius:6px;">${message}</p></div>`,
    });
    res.status(200).json({ success: true, message: 'Message sent successfully.' });
  } catch (error) {
    logger.error('Contact email failed:', error);
    res.status(500).json({ success: false, message: 'Failed to send message.' });
  }
});

// ── 404 Handler ─────────────────────────────────────────────────
app.use('/{*path}', (req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found.` });
});

// ── Global Error Handler ─────────────────────────────────────────
app.use((err, req, res, next) => {
  logger.error('Global error:', err.message);
  res.status(err.statusCode || 500).json({
    success: false, message: err.message || 'Internal server error.',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

module.exports = app;
