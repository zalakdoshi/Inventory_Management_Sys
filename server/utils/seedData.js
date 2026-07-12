/**
 * Vardhman Family ERP — Seed Script
 * Run: node utils/seedData.js
 * Creates admin, purchaser, salesman users + sample products + suppliers
 */
const path = require('path');
const fs = require('fs');

// Manually read .env to bypass dotenvx
const envPath = path.join(__dirname, '../.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
envContent.split('\n').forEach(line => {
  const [key, ...vals] = line.split('=');
  if (key && vals.length) process.env[key.trim()] = vals.join('=').trim();
});

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Product = require('../models/Product');
const Supplier = require('../models/Supplier');

const MONGO_URI = process.env.MONGO_URI;
console.log('🔗 URI:', MONGO_URI ? MONGO_URI.substring(0, 60) + '...' : '❌ NOT FOUND in .env');


const suppliers = [
  {
    name: 'Gujarat Biogas Equipments Pvt Ltd',
    contactPerson: 'Ramesh Patel',
    phone: '+91 9876543210',
    email: 'gujarat.biogas@example.com',
    gstin: '24AABCG1234A1Z5',
    address: { street: 'GIDC Estate', city: 'Anand', state: 'Gujarat', pincode: '388001' },
    categories: ['Biogas Components', 'Storage Equipment'],
  },
  {
    name: 'CNG Solutions India',
    contactPerson: 'Mahesh Shah',
    phone: '+91 9988776655',
    email: 'cngsolutions@example.com',
    gstin: '24AABCC5678A1Z3',
    address: { street: 'Industrial Area', city: 'Vadodara', state: 'Gujarat', pincode: '390001' },
    categories: ['CNG Equipment', 'Compressors'],
  },
  {
    name: 'Pipe & Valve Traders',
    contactPerson: 'Suresh Mehta',
    phone: '+91 9123456789',
    email: 'pipetrades@example.com',
    gstin: '24AABCP9012A1Z1',
    address: { street: 'Market Yard', city: 'Surat', state: 'Gujarat', pincode: '395001' },
    categories: ['Pipes', 'Valves', 'Fittings'],
  },
];

const getProducts = (supplierIds) => [
  // Biogas Components
  { name: 'Biogas Plant Inlet Tank 1000L', category: 'Biogas Components', sellingPrice: 28500, purchasePrice: 22000, quantity: 15, unit: 'Piece', gstPercentage: 18, hsnCode: '8419', reorderLevel: 5, supplier: supplierIds[0], description: 'Heavy duty HDPE inlet tank for 1000L biogas plants', barcode: 'BG001' },
  { name: 'Dome Gas Holder 500L', category: 'Biogas Components', sellingPrice: 18000, purchasePrice: 14000, quantity: 20, unit: 'Piece', gstPercentage: 18, hsnCode: '8419', reorderLevel: 8, supplier: supplierIds[0], description: 'Fixed dome gas holder for medium biogas plants', barcode: 'BG002' },
  { name: 'Biogas Burner Single Nozzle', category: 'Biogas Components', sellingPrice: 850, purchasePrice: 600, quantity: 120, unit: 'Piece', gstPercentage: 12, hsnCode: '8419', reorderLevel: 30, supplier: supplierIds[0], description: 'Cast iron single nozzle biogas burner', barcode: 'BG003' },
  { name: 'Biogas Slurry Mixer Paddle', category: 'Biogas Components', sellingPrice: 2200, purchasePrice: 1600, quantity: 45, unit: 'Piece', gstPercentage: 18, hsnCode: '8419', reorderLevel: 10, supplier: supplierIds[0], description: 'SS 304 slurry mixer paddle for digester', barcode: 'BG004' },
  { name: 'Gas Flow Meter Digital', category: 'Biogas Components', sellingPrice: 4500, purchasePrice: 3200, quantity: 30, unit: 'Piece', gstPercentage: 18, hsnCode: '8419', reorderLevel: 8, supplier: supplierIds[0], description: 'Digital gas flow meter 0-10 m³/hr', barcode: 'BG005' },
  
  // CNG Equipment
  { name: 'CNG Cylinder Type I 50L', category: 'CNG Equipment', sellingPrice: 12500, purchasePrice: 9500, quantity: 25, unit: 'Piece', gstPercentage: 18, hsnCode: '8412', reorderLevel: 5, supplier: supplierIds[1], description: 'BIS approved 50L CNG cylinder, 200 bar', barcode: 'CNG001' },
  { name: 'CNG Pressure Regulator 200bar', category: 'CNG Equipment', sellingPrice: 3800, purchasePrice: 2800, quantity: 40, unit: 'Piece', gstPercentage: 18, hsnCode: '8412', reorderLevel: 10, supplier: supplierIds[1], description: '200 bar to 4 bar CNG pressure regulator', barcode: 'CNG002' },
  { name: 'CNG Fueling Nozzle BS6', category: 'CNG Equipment', sellingPrice: 1850, purchasePrice: 1300, quantity: 60, unit: 'Piece', gstPercentage: 18, hsnCode: '8412', reorderLevel: 15, supplier: supplierIds[1], description: 'BS6 compliant CNG fueling nozzle', barcode: 'CNG003' },
  
  // Compressors
  { name: 'Biogas Compressor 5HP', category: 'Compressors', sellingPrice: 95000, purchasePrice: 75000, quantity: 5, unit: 'Piece', gstPercentage: 18, hsnCode: '8414', reorderLevel: 2, supplier: supplierIds[1], description: '5HP single stage biogas compressor', barcode: 'COMP001' },
  { name: 'CNG Booster Compressor 10HP', category: 'Compressors', sellingPrice: 185000, purchasePrice: 145000, quantity: 3, unit: 'Piece', gstPercentage: 18, hsnCode: '8414', reorderLevel: 1, supplier: supplierIds[1], description: '10HP CNG booster compressor for filling stations', barcode: 'COMP002' },
  
  // Pipes
  { name: 'HDPE Pipe 63mm OD (100m)', category: 'Pipes', sellingPrice: 4800, purchasePrice: 3600, quantity: 50, unit: 'Roll', gstPercentage: 18, hsnCode: '7304', reorderLevel: 10, supplier: supplierIds[2], description: 'HDPE pipe 63mm OD PN10 for biogas distribution', barcode: 'PIPE001' },
  { name: 'MS Seamless Pipe 1 inch (6m)', category: 'Pipes', sellingPrice: 1200, purchasePrice: 900, quantity: 200, unit: 'Piece', gstPercentage: 18, hsnCode: '7304', reorderLevel: 50, supplier: supplierIds[2], description: 'MS seamless pipe 1 inch schedule 40', barcode: 'PIPE002' },
  { name: 'GI Pipe 3/4 inch (6m)', category: 'Pipes', sellingPrice: 980, purchasePrice: 740, quantity: 150, unit: 'Piece', gstPercentage: 18, hsnCode: '7304', reorderLevel: 40, supplier: supplierIds[2], description: 'Galvanized iron pipe 3/4 inch medium class', barcode: 'PIPE003' },
  
  // Valves
  { name: 'Ball Valve 1 inch SS304', category: 'Valves', sellingPrice: 380, purchasePrice: 260, quantity: 300, unit: 'Piece', gstPercentage: 18, hsnCode: '8481', reorderLevel: 50, supplier: supplierIds[2], description: 'SS304 ball valve 1 inch full bore', barcode: 'VALVE001' },
  { name: 'Safety Relief Valve 15mm', category: 'Valves', sellingPrice: 850, purchasePrice: 620, quantity: 120, unit: 'Piece', gstPercentage: 18, hsnCode: '8481', reorderLevel: 30, supplier: supplierIds[2], description: 'Spring loaded safety relief valve 15mm', barcode: 'VALVE002' },
  { name: 'Solenoid Valve 24V DC', category: 'Valves', sellingPrice: 1200, purchasePrice: 880, quantity: 80, unit: 'Piece', gstPercentage: 18, hsnCode: '8481', reorderLevel: 20, supplier: supplierIds[2], description: '24V DC normally closed solenoid valve', barcode: 'VALVE003' },
  { name: 'Gate Valve 2 inch CI', category: 'Valves', sellingPrice: 680, purchasePrice: 480, quantity: 90, unit: 'Piece', gstPercentage: 12, hsnCode: '8481', reorderLevel: 25, supplier: supplierIds[2], description: 'Cast iron gate valve 2 inch rising stem', barcode: 'VALVE004' },
  
  // Storage Equipment
  { name: 'Gas Storage Balloon 10m³', category: 'Storage Equipment', sellingPrice: 35000, purchasePrice: 27000, quantity: 8, unit: 'Piece', gstPercentage: 18, hsnCode: '7311', reorderLevel: 2, supplier: supplierIds[0], description: 'Heavy duty PVC gas storage balloon 10 cubic meter', barcode: 'STOR001' },
  { name: 'Pressure Vessel 200L @10bar', category: 'Storage Equipment', sellingPrice: 22000, purchasePrice: 17000, quantity: 12, unit: 'Piece', gstPercentage: 18, hsnCode: '7311', reorderLevel: 3, supplier: supplierIds[0], description: 'ASME certified pressure vessel 200L at 10 bar', barcode: 'STOR002' },
  
  // Fittings
  { name: 'Compression Fitting 1/2 inch Set', category: 'Fittings', sellingPrice: 450, purchasePrice: 320, quantity: 500, unit: 'Set', gstPercentage: 18, hsnCode: '7307', reorderLevel: 100, supplier: supplierIds[2], description: 'Brass compression fitting set 1/2 inch', barcode: 'FIT001' },
  { name: 'Flange Set 2 inch 150# (4 bolt)', category: 'Fittings', sellingPrice: 1100, purchasePrice: 780, quantity: 150, unit: 'Set', gstPercentage: 18, hsnCode: '7307', reorderLevel: 30, supplier: supplierIds[2], description: 'CS raised face flange set 2 inch 150# class', barcode: 'FIT002' },
];

async function seedDatabase() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Drop collections entirely to reset indexes
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    const names = collections.map(c => c.name);
    for (const col of ['users', 'products', 'suppliers']) {
      if (names.includes(col)) { await db.collection(col).drop(); }
    }
    console.log('🗑️  Cleared existing data');

    // Create users
    const users = await User.create([
      { name: 'Admin User', email: 'admin@vardhman.com', password: 'admin123', role: 'admin', phone: '+91 9998160084' },
      { name: 'Ravi Patel', email: 'purchaser@vardhman.com', password: 'purchaser123', role: 'purchaser', phone: '+91 9876543210' },
      { name: 'Suresh Kumar', email: 'salesman@vardhman.com', password: 'salesman123', role: 'salesman', phone: '+91 9123456789' },
      { name: 'Priya Shah', email: 'salesman2@vardhman.com', password: 'salesman123', role: 'salesman', phone: '+91 9012345678' },
    ]);
    console.log(`👥 Created ${users.length} users`);

    // Create suppliers
    const createdSuppliers = await Supplier.create(suppliers.map(s => ({ ...s, createdBy: users[0]._id })));
    console.log(`🏭 Created ${createdSuppliers.length} suppliers`);

    // Create products
    const supplierIds = createdSuppliers.map(s => s._id);
    const productList = getProducts(supplierIds);
    const createdProducts = await Product.create(productList.map(p => ({ ...p, createdBy: users[0]._id })));
    console.log(`📦 Created ${createdProducts.length} products`);

    console.log('\n' + '='.repeat(50));
    console.log('🎉 Database seeded successfully!');
    console.log('='.repeat(50));
    console.log('\n📋 Login Credentials:');
    console.log('  Admin    → admin@vardhman.com     / admin123');
    console.log('  Purchaser→ purchaser@vardhman.com / purchaser123');
    console.log('  Salesman → salesman@vardhman.com  / salesman123');
    console.log('='.repeat(50));

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error.message);
    process.exit(1);
  }
}

seedDatabase();
