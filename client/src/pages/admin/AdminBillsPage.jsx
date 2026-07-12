import { useEffect, useState } from 'react';
import { Download } from 'lucide-react';
import api from '../../api/axios';
import StatusBadge from '../../components/ui/StatusBadge';
import SearchInput from '../../components/ui/SearchInput';
import toast from 'react-hot-toast';

export default function AdminBillsPage() {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

  const fetchBills = async (page = 1) => {
    setLoading(true);
    try {
      const { data } = await api.get('/bills', { params: { page, limit: 15, search } });
      setBills(data.data); setPagination(data.pagination);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchBills(1); }, [search]);

  const downloadPDF = async (id, billId) => {
    try {
      const res = await api.get(`/bills/${id}/pdf`, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      window.open(url, '_blank');
      toast.success('Invoice opened!');
    } catch { toast.error('PDF generation failed.'); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div><h1 className="page-title">All Invoices</h1><p className="page-subtitle">{pagination.total} total invoices</p></div>
      </div>
      <div className="card p-4"><SearchInput placeholder="Search by invoice ID or customer..." value={search} onChange={setSearch} className="max-w-sm" /></div>
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr>{['Invoice No','Date','Customer','GSTIN','Subtotal','Tax','Grand Total','Payment','Salesman','PDF'].map(h => <th key={h} className="table-th">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? Array(5).fill(0).map((_, i) => (
                <tr key={i} className="animate-pulse">{Array(10).fill(0).map((_, j) => <td key={j} className="table-td"><div className="h-3 bg-gray-100 rounded" /></td>)}</tr>
              )) : bills.map(b => (
                <tr key={b._id} className="table-row">
                  <td className="table-td font-mono text-xs text-primary-700 font-semibold">{b.billId}</td>
                  <td className="table-td text-xs text-gray-500">{new Date(b.billDate).toLocaleDateString('en-IN')}</td>
                  <td className="table-td"><p className="font-medium text-sm text-gray-900">{b.customer?.name}</p><p className="text-xs text-gray-400">{b.customer?.phone}</p></td>
                  <td className="table-td text-xs text-gray-500 font-mono">{b.customer?.gstin || '—'}</td>
                  <td className="table-td text-sm font-semibold">₹{b.subtotal?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 3 })}</td>
                  <td className="table-td text-sm text-orange-600">₹{b.taxTotal?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 3 })}</td>
                  <td className="table-td text-sm font-bold text-primary-700">₹{((b.subtotal || 0) + (b.taxTotal || 0) - (b.discount || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 3 })}</td>
                  <td className="table-td"><StatusBadge status={b.paymentStatus} /></td>
                  <td className="table-td text-sm text-gray-600">{b.createdBy?.name}</td>
                  <td className="table-td">
                    <button onClick={() => downloadPDF(b._id, b.billId)} className="p-2 rounded-lg text-primary-600 hover:bg-primary-50 transition-colors">
                      <Download size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
