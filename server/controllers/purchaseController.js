const { Purchase, Product } = require('../models/index');
const { createActivityLog } = require('../middleware/activityLog');
const logger = require('../utils/logger');

const getPurchases = (req, res) => {
  try {
    const { page = 1, limit = 10, status = '', search = '', supplier = '' } = req.query;
    const purchasedBy = req.user.role === 'purchaser' ? req.user._id : '';
    const { rows, total } = Purchase.find({ status, search, supplierId: supplier, purchasedBy, page, limit });
    res.status(200).json({ success: true, data: rows, pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) } });
  } catch (error) {
    logger.error('Get purchases error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const createPurchase = async (req, res) => {
  try {
    const { supplier, supplierName, items, notes, invoiceNumber, purchaseDate } = req.body;
    if (!items || items.length === 0) return res.status(400).json({ success: false, message: 'Purchase must have at least one item.' });

    let subtotal = 0, taxAmount = 0;
    const processedItems = [];

    for (const item of items) {
      const product = Product.findById(item.product);
      if (!product) return res.status(404).json({ success: false, message: `Product ${item.product} not found.` });
      const itemTotal = item.unitPrice * item.quantity;
      const gstAmt = (itemTotal * (item.gstPercentage || product.gst_percentage)) / 100;
      subtotal += itemTotal; taxAmount += gstAmt;
      processedItems.push({ product: product.id, productName: product.name, quantity: item.quantity, unitPrice: item.unitPrice, gstPercentage: item.gstPercentage || product.gst_percentage, totalPrice: itemTotal + gstAmt });
    }

    const purchase = Purchase.create({
      supplier: supplier || null, supplierName: supplierName || null,
      items: processedItems, subtotal, taxAmount, totalAmount: subtotal + taxAmount,
      purchasedBy: req.user._id, notes, invoiceNumber,
      purchaseDate: purchaseDate || new Date().toISOString(), status: 'ordered',
    });

    createActivityLog({ user: req.user, action: 'CREATE', module: 'Purchases', description: `Created purchase order ${purchase.purchaseId} — ₹${purchase.totalAmount?.toFixed(2)}`, req, severity: 'medium' });
    res.status(201).json({ success: true, message: 'Purchase order created.', data: purchase });
  } catch (error) {
    logger.error('Create purchase error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error.' });
  }
};

const updatePurchase = async (req, res) => {
  try {
    const purchase = Purchase.findById(req.params.id);
    if (!purchase) return res.status(404).json({ success: false, message: 'Purchase not found.' });
    if (req.user.role !== 'admin' && purchase.purchased_by !== req.user._id) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this purchase.' });
    }

    const { status } = req.body;
    if (status && status !== purchase.status) {
      if (status === 'received' && purchase.status !== 'received') {
        for (const item of purchase.items) Product.incrementQuantity(item.product, item.quantity);
      }
      if (purchase.status === 'received' && status !== 'received') {
        for (const item of purchase.items) Product.incrementQuantity(item.product, -item.quantity);
      }
    }

    const updated = Purchase.update(req.params.id, req.body);
    createActivityLog({ user: req.user, action: 'UPDATE', module: 'Purchases', description: `Updated purchase ${purchase.purchaseId}`, req, severity: 'medium' });
    res.status(200).json({ success: true, message: 'Purchase updated.', data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const deletePurchase = async (req, res) => {
  try {
    const purchase = Purchase.findById(req.params.id);
    if (!purchase) return res.status(404).json({ success: false, message: 'Purchase not found.' });
    if (req.user.role !== 'admin' && purchase.purchased_by !== req.user._id) {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }
    if (purchase.status === 'received') {
      for (const item of purchase.items) Product.incrementQuantity(item.product, -item.quantity);
    }
    Purchase.delete(req.params.id);
    createActivityLog({ user: req.user, action: 'DELETE', module: 'Purchases', description: `Deleted purchase ${purchase.purchaseId}`, req, severity: 'high' });
    res.status(200).json({ success: true, message: 'Purchase deleted and inventory adjusted.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = { getPurchases, createPurchase, updatePurchase, deletePurchase };
