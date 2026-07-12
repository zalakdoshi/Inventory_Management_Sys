import { useEffect, useState } from 'react';
import { Download, FileText } from 'lucide-react';
import api from '../../api/axios';
import SearchInput from '../../components/ui/SearchInput';
import toast from 'react-hot-toast';

export default function SalesmanBillsPage() {
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

  const downloadPDF = async (id) => {
    try {
      const res = await api.get(`/bills/${id}/pdf`, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      window.open(url, '_blank');
    } catch { toast.error('Failed to generate PDF.'); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div><h1 className="page-title">My Invoices</h1><p className="page-subtitle">{pagination.total} invoices created</p></div>
      </div>
      <div className="card p-4"><SearchInput placeholder="Search invoice or customer..." value={search} onChange={setSearch} className="max-w-sm" /></div>
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr>{['Invoice No','Date','Customer','GSTIN','Grand Total','Payment Mode','PDF'].map(h => <th key={h} className="table-th">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? Array(5).fill(0).map((_, i) => <tr key={i} className="animate-pulse">{Array(7).fill(0).map((_, j) => <td key={j} className="table-td"><div className="h-3 bg-gray-100 rounded" /></td>)}</tr>) :
                bills.length === 0 ? <tr><td colSpan={7} className="text-center py-12 text-gray-400"><FileText size={36} className="mx-auto mb-2 opacity-30" /><p>No invoices yet. <a href="/salesman/create-bill" className="text-primary-600 hover:underline">Create one!</a></p></td></tr> :
                bills.map(b => (
                  <tr key={b._id} className="table-row">
                    <td className="table-td font-mono text-xs text-primary-700 font-semibold">{b.billId}</td>
                    <td className="table-td text-xs text-gray-500">{new Date(b.billDate).toLocaleDateString('en-IN')}</td>
                    <td className="table-td"><p className="font-medium text-sm text-gray-900">{b.customer?.name}</p><p className="text-xs text-gray-400">{b.customer?.phone}</p></td>
                    <td className="table-td text-xs font-mono text-gray-500">{b.customer?.gstin || '—'}</td>
                    <td className="table-td text-base font-bold text-primary-700">₹{((b.subtotal || 0) + (b.taxTotal || 0) - (b.discount || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 3 })}</td>
                    <td className="table-td text-sm text-gray-600 capitalize">{b.paymentMode?.replace('_', ' ')}</td>
                    <td className="table-td">
                      {b.order && !['approved', 'packed', 'dispatched', 'delivered'].includes(b.order.status) ? (
                        <span className="inline-flex items-center gap-1 text-xs text-gray-400 bg-gray-50 border border-gray-200 px-2 py-1.5 rounded-lg select-none cursor-not-allowed" title="Invoice is locked until order is approved.">
                          Awaiting Approval
                        </span>
                      ) : (
                        <button onClick={() => downloadPDF(b._id)} className="flex items-center gap-1.5 text-sm text-primary-600 hover:text-primary-700 font-medium hover:bg-primary-50 px-2 py-1.5 rounded-lg transition-colors">
                          <Download size={15} /> PDF
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
