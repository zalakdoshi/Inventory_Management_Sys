/**
 * StatusBadge — colored pill badge
 * Usage: <StatusBadge status="active" />  or  <StatusBadge status="pending" />
 */
const STATUS_STYLES = {
  // Order statuses
  created: 'bg-gray-100 text-gray-700 border-gray-200',
  pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  approved: 'bg-blue-100 text-blue-700 border-blue-200',
  packed: 'bg-purple-100 text-purple-700 border-purple-200',
  dispatched: 'bg-orange-100 text-orange-700 border-orange-200',
  delivered: 'bg-green-100 text-green-700 border-green-200',
  cancelled: 'bg-red-100 text-red-700 border-red-200',
  // User/Product statuses
  active: 'bg-green-100 text-green-700 border-green-200',
  inactive: 'bg-gray-100 text-gray-500 border-gray-200',
  discontinued: 'bg-red-100 text-red-700 border-red-200',
  // Purchase
  ordered: 'bg-blue-100 text-blue-700 border-blue-200',
  received: 'bg-green-100 text-green-700 border-green-200',
  draft: 'bg-gray-100 text-gray-600 border-gray-200',
  // Payment
  paid: 'bg-green-100 text-green-700 border-green-200',
  unpaid: 'bg-red-100 text-red-700 border-red-200',
  partial: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  // Reset requests
  'pending-reset': 'bg-yellow-100 text-yellow-700 border-yellow-200',
  rejected: 'bg-red-100 text-red-700 border-red-200',
  // Roles
  admin: 'bg-red-100 text-red-700 border-red-200',
  purchaser: 'bg-blue-100 text-blue-700 border-blue-200',
  salesman: 'bg-green-100 text-green-700 border-green-200',
  // Stock
  'low-stock': 'bg-orange-100 text-orange-700 border-orange-200',
  'out-of-stock': 'bg-red-100 text-red-700 border-red-200',
};

const STATUS_LABELS = {
  'pending-reset': 'Pending',
  'low-stock': 'Low Stock',
  'out-of-stock': 'Out of Stock',
};

export default function StatusBadge({ status, size = 'sm' }) {
  const styles = STATUS_STYLES[status] || 'bg-gray-100 text-gray-600 border-gray-200';
  const label = STATUS_LABELS[status] || status?.replace(/_/g, ' ')?.replace(/\b\w/g, l => l.toUpperCase());
  const sizeClass = size === 'xs' ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2 py-0.5';

  return (
    <span className={`inline-flex items-center border font-medium rounded-full capitalize ${styles} ${sizeClass}`}>
      {label}
    </span>
  );
}
