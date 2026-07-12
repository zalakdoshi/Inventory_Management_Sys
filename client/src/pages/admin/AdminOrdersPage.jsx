import { useEffect, useState } from 'react';
import api from '../../api/axios';
import StatusBadge from '../../components/ui/StatusBadge';
import SearchInput from '../../components/ui/SearchInput';

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [pagination, setPagination] = useState({ page: 1, pages: 1 });

  const fetchOrders = async (page = 1) => {
    setLoading(true);
    try {
      const { data } = await api.get('/orders', { params: { page, limit: 15, search, status: statusFilter } });
      setOrders(data.data); setPagination(data.pagination);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchOrders(1); }, [search, statusFilter]);

  const STATUSES = ['created','pending','approved','packed','dispatched','delivered','cancelled'];

  return (
    <div className="space-y-6">
      <div><h1 className="page-title">All Orders</h1><p className="page-subtitle">Monitor complete ERP order lifecycle</p></div>
      <div className="card p-4 flex flex-wrap gap-3">
        <SearchInput placeholder="Search order ID or customer..." value={search} onChange={setSearch} className="flex-1 min-w-48" />
        <select className="select-field w-40" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All Status</option>
          {STATUSES.map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
        </select>
      </div>
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr>{['Order ID','Customer','Items','Total','Status','Payment','Salesman','Date'].map(h => <th key={h} className="table-th">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? Array(6).fill(0).map((_, i) => (
                <tr key={i} className="animate-pulse">{Array(8).fill(0).map((_, j) => <td key={j} className="table-td"><div className="h-3 bg-gray-100 rounded" /></td>)}</tr>
              )) : orders.map(o => (
                <tr key={o._id} className="table-row">
                  <td className="table-td font-mono text-xs text-primary-700 font-semibold">{o.orderId}</td>
                  <td className="table-td"><p className="font-medium text-gray-900 text-sm">{o.customer?.name}</p><p className="text-xs text-gray-400">{o.customer?.phone}</p></td>
                  <td className="table-td text-sm">{o.items?.length} items</td>
                  <td className="table-td font-semibold text-gray-900">₹{o.totalAmount?.toLocaleString('en-IN')}</td>
                  <td className="table-td"><StatusBadge status={o.status} /></td>
                  <td className="table-td"><StatusBadge status={o.paymentStatus} /></td>
                  <td className="table-td text-sm text-gray-600">{o.createdBy?.name}</td>
                  <td className="table-td text-xs text-gray-400">{new Date(o.createdAt).toLocaleDateString('en-IN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
