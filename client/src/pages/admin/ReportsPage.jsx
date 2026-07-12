import { useEffect, useState } from 'react';
import { Download, FileText, BarChart3, ShoppingCart, Package } from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function ReportsPage() {
  const [exporting, setExporting] = useState('');
  const [stats, setStats] = useState(null);

  useEffect(() => { api.get('/reports/dashboard').then(r => setStats(r.data.data)).catch(() => {}); }, []);

  const exportReport = async (type) => {
    setExporting(type);
    try {
      const response = await api.get('/reports/export', { params: { type }, responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([response.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `vardhman_${type}_report_${Date.now()}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`${type} report downloaded!`);
    } catch { toast.error('Export failed.'); }
    setExporting('');
  };

  const revenueData = stats?.revenueByMonth?.map(d => ({
    month: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][d._id.month-1],
    revenue: d.revenue
  })) || [];

  return (
    <div className="space-y-6">
      <div><h1 className="page-title">Reports & Analytics</h1><p className="page-subtitle">Export data and view business insights</p></div>

      {/* Export Cards */}
      <div className="grid sm:grid-cols-3 gap-4">
        {[
          { type: 'sales', label: 'Sales Report', icon: FileText, desc: 'All invoices with GST breakdown', color: 'green' },
          { type: 'purchases', label: 'Purchase Report', icon: ShoppingCart, desc: 'All purchase orders by supplier', color: 'blue' },
          { type: 'inventory', label: 'Inventory Report', icon: Package, desc: 'Full stock levels with values', color: 'orange' },
        ].map(r => (
          <div key={r.type} className="card p-6 flex flex-col gap-4">
            <div className="flex items-start gap-3">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${r.color === 'green' ? 'bg-green-100' : r.color === 'blue' ? 'bg-blue-100' : 'bg-orange-100'}`}>
                <r.icon size={22} className={r.color === 'green' ? 'text-green-600' : r.color === 'blue' ? 'text-blue-600' : 'text-orange-600'} />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{r.label}</h3>
                <p className="text-xs text-gray-500 mt-0.5">{r.desc}</p>
              </div>
            </div>
            <button onClick={() => exportReport(r.type)} disabled={exporting === r.type} className="btn-primary flex items-center justify-center gap-2 text-sm py-2">
              {exporting === r.type ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Download size={15} />}
              Export Excel
            </button>
          </div>
        ))}
      </div>

      {/* Revenue Chart */}
      {revenueData.length > 0 && (
        <div className="card p-6">
          <h3 className="font-heading font-bold text-gray-900 mb-4 flex items-center gap-2"><BarChart3 size={20} className="text-primary-600" /> Monthly Revenue</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={v => `₹${(v/1000).toFixed(0)}K`} />
              <Tooltip formatter={v => [`₹${v.toLocaleString('en-IN')}`, 'Revenue']} />
              <Bar dataKey="revenue" fill="#16a34a" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
