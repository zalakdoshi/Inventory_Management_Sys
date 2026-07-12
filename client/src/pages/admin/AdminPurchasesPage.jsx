import { useEffect, useState } from 'react';
import api from '../../api/axios';
import StatusBadge from '../../components/ui/StatusBadge';

export default function AdminPurchasesPage() {
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, pages: 1 });

  const fetchPurchases = async (page = 1) => {
    setLoading(true);
    try {
      const { data } = await api.get('/purchases', { params: { page, limit: 15 } });
      setPurchases(data.data); setPagination(data.pagination);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchPurchases(1); }, []);

  return (
    <div className="space-y-6">
      <div><h1 className="page-title">All Purchases</h1><p className="page-subtitle">Monitor all purchase orders</p></div>
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr>{['PO ID','Purchaser Name','Items','Subtotal','Tax','Total','Status','Employee','Date'].map(h => <th key={h} className="table-th">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? Array(5).fill(0).map((_, i) => (
                <tr key={i} className="animate-pulse">{Array(9).fill(0).map((_, j) => <td key={j} className="table-td"><div className="h-3 bg-gray-100 rounded" /></td>)}</tr>
              )) : purchases.map(p => (
                <tr key={p._id} className="table-row">
                  <td className="table-td font-mono text-xs text-primary-700 font-semibold">{p.purchaseId}</td>
                  <td className="table-td text-sm font-medium text-gray-900">{p.supplierName || p.supplier?.name || '—'}</td>
                  <td className="table-td text-sm">{p.items?.length}</td>
                  <td className="table-td text-sm">₹{p.subtotal?.toLocaleString('en-IN')}</td>
                  <td className="table-td text-sm text-orange-600">₹{p.taxAmount?.toLocaleString('en-IN')}</td>
                  <td className="table-td font-bold text-primary-700">₹{p.totalAmount?.toLocaleString('en-IN')}</td>
                  <td className="table-td"><StatusBadge status={p.status} /></td>
                  <td className="table-td text-sm text-gray-600">{p.purchasedBy?.name}</td>
                  <td className="table-td text-xs text-gray-400">{new Date(p.createdAt).toLocaleDateString('en-IN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
