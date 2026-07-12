const { Order, Product } = require('../models/index');
const { createActivityLog } = require('../middleware/activityLog');
const logger = require('../utils/logger');

const getOrders = (req, res) => {
  try {
    const { page = 1, limit = 10, status = '', search = '' } = req.query;
    const createdBy = req.user.role === 'salesman' ? req.user._id : '';
    const { rows, total } = Order.find({ status, search, createdBy, page, limit });
    res.status(200).json({ success: true, data: rows, pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) } });
  } catch (error) {
    logger.error('Get orders error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const getOrder = (req, res) => {
  const order = Order.findById(req.params.id);
  if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });
  res.status(200).json({ success: true, data: order });
};

const createOrder = async (req, res) => {
  try {
    const { customer, items, discount = 0, paymentMode, taxType = 'cgst_sgst' } = req.body;
    if (!items || items.length === 0) return res.status(400).json({ success: false, message: 'Order must have at least one item.' });

    let subtotal = 0, taxAmount = 0;
    const processedItems = [];

    for (const item of items) {
      const product = Product.findById(item.product);
      if (!product) return res.status(404).json({ success: false, message: `Product ${item.product} not found.` });
      if (product.quantity < item.quantity) return res.status(400).json({ success: false, message: `Insufficient stock for ${product.name}. Available: ${product.quantity}` });
      const taxableAmt = item.unitPrice * item.quantity;
      const gstAmt = (taxableAmt * product.gst_percentage) / 100;
      let cgst = 0, sgst = 0, igst = 0;
      if (taxType === 'cgst_sgst') { cgst = gstAmt / 2; sgst = gstAmt / 2; } else { igst = gstAmt; }
      subtotal += taxableAmt; taxAmount += gstAmt;
      processedItems.push({ product: product.id, productName: product.name, hsnCode: product.hsn_code, quantity: item.quantity, unitPrice: item.unitPrice || product.selling_price, gstPercentage: product.gst_percentage, cgst, sgst, igst, totalPrice: taxableAmt + gstAmt });
    }

    const order = Order.create({
      customer, items: processedItems, subtotal, discount, taxAmount,
      totalAmount: subtotal + taxAmount - discount, paymentMode, taxType,
      createdBy: req.user._id,
      timeline: [{ status: 'created', updatedBy: req.user._id, note: 'Order created by salesman', timestamp: new Date().toISOString() }],
    });

    createActivityLog({ user: req.user, action: 'CREATE', module: 'Orders', description: `Created order ${order.orderId} for ${customer.name} — ₹${order.totalAmount?.toFixed(2)}`, req, severity: 'medium' });
    res.status(201).json({ success: true, message: 'Order created successfully.', data: order });
  } catch (error) {
    logger.error('Create order error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error.' });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const { status, note } = req.body;
    const order = Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });

    const deductedStatuses = ['approved', 'packed', 'dispatched', 'delivered'];
    const oldDeducted = deductedStatuses.includes(order.status);
    const newDeducted = deductedStatuses.includes(status);

    if (!oldDeducted && newDeducted) {
      for (const item of order.items) {
        const product = Product.findById(item.product);
        if (!product || product.quantity < item.quantity) {
          return res.status(400).json({ success: false, message: `Insufficient stock for ${item.productName}. Available: ${product ? product.quantity : 0}` });
        }
      }
      for (const item of order.items) Product.incrementQuantity(item.product, -item.quantity);
    } else if (oldDeducted && !newDeducted) {
      for (const item of order.items) Product.incrementQuantity(item.product, item.quantity);
    }

    const timeline = [...(order.timeline || []), { status, updatedBy: req.user._id, note: note || '', timestamp: new Date().toISOString() }];
    const updated = Order.update(order.id, { status, timeline, ...(status === 'delivered' ? { paymentStatus: 'paid' } : {}) });

    createActivityLog({ user: req.user, action: 'STATUS_CHANGE', module: 'Orders', description: `Order ${order.orderId} status changed to ${status}`, req, severity: 'medium' });
    res.status(200).json({ success: true, message: `Order status updated to ${status}.`, data: updated });
  } catch (error) {
    logger.error('Update order status error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = { getOrders, getOrder, createOrder, updateOrderStatus };
