const { Order, Purchase, Product, Bill, User, ActivityLog } = require('../models/index');
const ExcelJS = require('exceljs');
const logger = require('../utils/logger');
const { getDb } = require('../config/db');

const COMPANY = {
  name: 'Vardhman Family',
  gstin: '24AABCV1234A1Z5',
  address: 'Behind Piplav Dairy, At Piplav, Ta: Sojitra, Di: Anand, 388460',
};

const getDashboardStats = (req, res) => {
  try {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();
    const startOfYear = new Date(today.getFullYear(), 0, 1).toISOString();

    const db = getDb();

    const totalProducts = Product.countDocuments({ status: 'active' });
    const lowStockProducts = db.prepare('SELECT COUNT(*) as c FROM products WHERE quantity <= reorder_level AND status = ?').get('active').c;
    const totalUsers = User.countDocuments({ isActive: true });
    const totalOrders = db.prepare('SELECT COUNT(*) as c FROM orders').get().c;
    const monthOrders = db.prepare('SELECT COUNT(*) as c FROM orders WHERE created_at >= ?').get(startOfMonth).c;
    const totalRevenue = Bill.aggregate_total();
    const monthRevenue = Bill.aggregate_total({ createdAt_gte: startOfMonth });
    const totalPurchases = Purchase.aggregate_total();
    const monthPurchases = Purchase.aggregate_total({ createdAt_gte: startOfMonth });
    const recentActivities = ActivityLog.findRecent(10);

    const ordersByStatus = db.prepare('SELECT status as _id, COUNT(*) as count FROM orders GROUP BY status').all();
    const revenueByMonth = Bill.revenueByMonth(String(today.getFullYear())).map(r => ({
      _id: { month: parseInt(r.month) },
      revenue: r.revenue,
      count: r.count,
    }));

    res.status(200).json({
      success: true,
      data: {
        totalProducts, lowStockProducts, totalUsers, totalOrders, monthOrders,
        totalRevenue, monthRevenue, totalPurchases, monthPurchases,
        recentActivities, ordersByStatus, revenueByMonth,
      },
    });
  } catch (error) {
    logger.error('Dashboard stats error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const exportReport = async (req, res) => {
  try {
    const { type = 'sales' } = req.query;
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Inventory Management System';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet(type.toUpperCase(), {
      headerFooter: { firstHeader: 'Inventory Management System Report' },
    });

    const headerStyle = {
      font: { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF166534' } },
      alignment: { horizontal: 'center' },
      border: { bottom: { style: 'thin' } },
    };

    if (type === 'sales') {
      const bills = Bill.findAll();
      sheet.columns = [
        { header: 'Invoice No', key: 'billId', width: 18 },
        { header: 'Date', key: 'date', width: 15 },
        { header: 'Customer', key: 'customer', width: 25 },
        { header: 'Customer GSTIN', key: 'gstin', width: 20 },
        { header: 'Subtotal (₹)', key: 'subtotal', width: 15 },
        { header: 'Tax (₹)', key: 'tax', width: 12 },
        { header: 'Grand Total (₹)', key: 'grandTotal', width: 17 },
        { header: 'Payment Mode', key: 'paymentMode', width: 15 },
        { header: 'Created By', key: 'createdBy', width: 18 },
      ];
      sheet.getRow(1).eachCell((cell) => Object.assign(cell, headerStyle));
      bills.forEach((b) => {
        sheet.addRow({
          billId: b.billId, date: new Date(b.billDate).toLocaleDateString('en-IN'),
          customer: b.customer?.name || '-', gstin: b.customer?.gstin || '-',
          subtotal: b.subtotal, tax: b.taxTotal, grandTotal: b.grandTotal,
          paymentMode: b.paymentMode, createdBy: b.createdBy?.name || b.creator_name || '-',
        });
      });
    } else if (type === 'purchases') {
      const purchases = Purchase.findAll();
      sheet.columns = [
        { header: 'Purchase ID', key: 'purchaseId', width: 18 },
        { header: 'Date', key: 'date', width: 15 },
        { header: 'Supplier', key: 'supplier', width: 25 },
        { header: 'Items Count', key: 'items', width: 12 },
        { header: 'Subtotal (₹)', key: 'subtotal', width: 15 },
        { header: 'Tax (₹)', key: 'tax', width: 12 },
        { header: 'Total (₹)', key: 'total', width: 15 },
        { header: 'Status', key: 'status', width: 12 },
        { header: 'Purchased By', key: 'purchasedBy', width: 18 },
      ];
      sheet.getRow(1).eachCell((cell) => Object.assign(cell, headerStyle));
      purchases.forEach((p) => {
        sheet.addRow({
          purchaseId: p.purchaseId, date: new Date(p.purchaseDate).toLocaleDateString('en-IN'),
          supplier: p.supplierName || p.supplier?.name || '-', items: (p.items || []).length,
          subtotal: p.subtotal, tax: p.taxAmount, total: p.totalAmount,
          status: p.status, purchasedBy: p.purchasedBy?.name || p.purchaser_name || '-',
        });
      });
    } else if (type === 'inventory') {
      const { rows: products } = Product.find({ page: 1, limit: 100000, sortBy: 'quantity', sortOrder: 'asc' });
      sheet.columns = [
        { header: 'Product ID', key: 'productId', width: 15 },
        { header: 'Name', key: 'name', width: 30 },
        { header: 'Category', key: 'category', width: 20 },
        { header: 'HSN Code', key: 'hsn', width: 12 },
        { header: 'Quantity', key: 'quantity', width: 12 },
        { header: 'Unit', key: 'unit', width: 10 },
        { header: 'Reorder Level', key: 'reorder', width: 15 },
        { header: 'Purchase Price (₹)', key: 'purchasePrice', width: 18 },
        { header: 'Selling Price (₹)', key: 'sellingPrice', width: 18 },
        { header: 'Stock Value (₹)', key: 'stockValue', width: 17 },
        { header: 'GST %', key: 'gst', width: 10 },
        { header: 'Status', key: 'status', width: 12 },
        { header: 'Supplier', key: 'supplier', width: 20 },
      ];
      sheet.getRow(1).eachCell((cell) => Object.assign(cell, headerStyle));
      products.forEach((p) => {
        const row = sheet.addRow({
          productId: p.productId, name: p.name, category: p.category,
          hsn: p.hsnCode, quantity: p.quantity, unit: p.unit,
          reorder: p.reorderLevel, purchasePrice: p.purchasePrice,
          sellingPrice: p.sellingPrice, stockValue: p.quantity * p.sellingPrice,
          gst: `${p.gstPercentage}%`, status: p.status,
          supplier: p.supplier?.name || '-',
        });
        if (p.quantity <= p.reorderLevel) {
          row.getCell('quantity').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } };
        }
      });
    }

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="inventory_${type}_report_${Date.now()}.xlsx"`);
    const buffer = await workbook.xlsx.writeBuffer();
    res.send(buffer);
  } catch (error) {
    logger.error('Export error:', error);
    res.status(500).json({ success: false, message: 'Export failed.' });
  }
};

const getActivityLogs = (req, res) => {
  try {
    const { page = 1, limit = 20, module: mod = '', action = '' } = req.query;
    const { rows, total } = ActivityLog.find({ module: mod, action, page, limit });
    res.status(200).json({ success: true, data: rows, pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = { getDashboardStats, exportReport, getActivityLogs };
