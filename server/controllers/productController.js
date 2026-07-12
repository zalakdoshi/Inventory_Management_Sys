const { Product } = require('../models/index');
const { createActivityLog } = require('../middleware/activityLog');
const logger = require('../utils/logger');
const path = require('path');
const fs = require('fs');

const getProducts = (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', category = '', status = '', lowStock = '', sortBy = 'created_at', sortOrder = 'desc' } = req.query;
    const { rows, total } = Product.find({ search, category, status, lowStock, page, limit, sortBy, sortOrder });
    res.status(200).json({ success: true, data: rows, pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) } });
  } catch (error) {
    logger.error('Get products error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching products.' });
  }
};

const getProduct = (req, res) => {
  const product = Product.findById(req.params.id);
  if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });
  res.status(200).json({ success: true, data: product });
};

const createProduct = async (req, res) => {
  try {
    const data = { ...req.body, createdBy: req.user._id };
    if (req.file) data.image = `/uploads/products/${req.file.filename}`;
    const product = Product.create(data);
    createActivityLog({ user: req.user, action: 'CREATE', module: 'Products', description: `Created product: ${product.name} (${product.productId})`, details: { productId: product.id }, req, severity: 'medium' });
    res.status(201).json({ success: true, message: 'Product created successfully.', data: product });
  } catch (error) {
    logger.error('Create product error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error.' });
  }
};

const updateProduct = async (req, res) => {
  try {
    const existing = Product.findById(req.params.id);
    if (!existing) return res.status(404).json({ success: false, message: 'Product not found.' });
    const data = { ...req.body, updatedBy: req.user._id };
    if (req.file) {
      if (existing.image) {
        const oldPath = path.join(__dirname, '..', existing.image);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      data.image = `/uploads/products/${req.file.filename}`;
    }
    const updated = Product.update(req.params.id, data);
    createActivityLog({ user: req.user, action: 'UPDATE', module: 'Products', description: `Updated product: ${existing.name}`, req, severity: 'medium' });
    res.status(200).json({ success: true, message: 'Product updated successfully.', data: updated });
  } catch (error) {
    logger.error('Update product error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error.' });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const product = Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });
    if (product.image) {
      const imgPath = path.join(__dirname, '..', product.image);
      if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
    }
    Product.delete(req.params.id);
    createActivityLog({ user: req.user, action: 'DELETE', module: 'Products', description: `Deleted product: ${product.name} (${product.productId})`, req, severity: 'high' });
    res.status(200).json({ success: true, message: 'Product deleted successfully.' });
  } catch (error) {
    logger.error('Delete product error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const getInventoryStats = (req, res) => {
  try {
    const total = Product.countDocuments({ status: 'active' });
    const lowStock = Product.countDocuments({ status: 'active', lowStock: true });
    const outOfStock = Product.countDocuments({ status: 'active', outOfStock: true });
    res.status(200).json({ success: true, data: { total, lowStock, outOfStock } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = { getProducts, getProduct, createProduct, updateProduct, deleteProduct, getInventoryStats };
