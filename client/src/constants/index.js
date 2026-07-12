// Company Info
export const COMPANY = {
  name: 'Vardhman Family',
  tagline: 'All About Bio-Gas Machinery Manufacturer (In House)',
  gstin: '24AABCV1234A1Z5',
  address: 'Behind Piplav Dairy, At Piplav, Ta: Sojitra, Di: Anand, 388460',
  phone: '+91 9998160084',
  supportPhone: '+91 90168 22495',
  email: 'vardhmanfamily.corporate@gmail.com',
  state: 'Gujarat',
  stateCode: '24',
};

// Product Categories
export const PRODUCT_CATEGORIES = [
  'Electrical',
  'Hydraulic',
  'Bearing',
  'Consumable',
];

// HSN Codes mapping
export const HSN_CODES = {
  'Electrical': '8536',
  'Hydraulic': '8412',
  'Bearing': '8482',
  'Consumable': '3824',
};

// GST Rates
export const GST_RATES = [0, 5, 12, 18, 28];

// Units
export const UNITS = ['Piece', 'Meter', 'KG', 'Liter', 'Set', 'Box', 'Roll', 'Pair'];

// Order Statuses
export const ORDER_STATUSES = [
  { value: 'created', label: 'Created', color: 'bg-gray-100 text-gray-700', step: 0 },
  { value: 'pending', label: 'Pending', color: 'bg-yellow-100 text-yellow-700', step: 1 },
  { value: 'approved', label: 'Approved', color: 'bg-blue-100 text-blue-700', step: 2 },
  { value: 'packed', label: 'Packed', color: 'bg-purple-100 text-purple-700', step: 3 },
  { value: 'dispatched', label: 'Dispatched', color: 'bg-orange-100 text-orange-700', step: 4 },
  { value: 'delivered', label: 'Delivered', color: 'bg-green-100 text-green-700', step: 5 },
  { value: 'cancelled', label: 'Cancelled', color: 'bg-red-100 text-red-700', step: -1 },
];

// Payment Modes
export const PAYMENT_MODES = [
  { value: 'cash', label: 'Cash' },
  { value: 'upi', label: 'UPI' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'cheque', label: 'Cheque' },
  { value: 'credit', label: 'Credit' },
];

// User Roles
export const ROLES = [
  { value: 'admin', label: 'Admin', color: 'bg-red-100 text-red-700' },
  { value: 'purchaser', label: 'Purchaser', color: 'bg-blue-100 text-blue-700' },
  { value: 'salesman', label: 'Salesman', color: 'bg-green-100 text-green-700' },
];

// Sidebar nav items per role
export const ADMIN_NAV = [
  { path: '/admin/dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
  { path: '/admin/products', label: 'Products', icon: 'Package' },
  { path: '/admin/inventory', label: 'Inventory', icon: 'Warehouse' },
  { path: '/admin/purchases', label: 'Purchases', icon: 'ShoppingCart' },
  { path: '/admin/orders', label: 'Orders', icon: 'ClipboardList' },
  { path: '/admin/bills', label: 'Invoices', icon: 'FileText' },
  { path: '/admin/suppliers', label: 'Purchasers', icon: 'Truck' },
  { path: '/admin/reports', label: 'Reports', icon: 'BarChart3' },
  { path: '/admin/users', label: 'Users', icon: 'Users' },
  { path: '/admin/activity-logs', label: 'Activity Logs', icon: 'Activity' },
  { path: '/admin/password-reset', label: 'Reset Requests', icon: 'KeyRound' },
];

export const PURCHASER_NAV = [
  { path: '/purchaser/dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
  { path: '/purchaser/create-purchase', label: 'New Purchase', icon: 'Plus' },
  { path: '/purchaser/purchases', label: 'Purchase History', icon: 'ShoppingCart' },
  { path: '/purchaser/suppliers', label: 'Purchasers', icon: 'Truck' },
];

export const SALESMAN_NAV = [
  { path: '/salesman/dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
  { path: '/salesman/inventory', label: 'Inventory', icon: 'Package' },
  { path: '/salesman/create-bill', label: 'New Invoice', icon: 'Plus' },
  { path: '/salesman/bills', label: 'My Invoices', icon: 'FileText' },
  { path: '/salesman/orders', label: 'Track Orders', icon: 'MapPin' },
];
