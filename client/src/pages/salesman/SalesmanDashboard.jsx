import { useEffect, useState } from 'react';
import { FileText, TrendingUp, Package, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import StatsCard from '../../components/ui/StatsCard';
import StatusBadge from '../../components/ui/StatusBadge';
import { useAuth } from '../../context/AuthContext';

export default function SalesmanDashboard() {
  const [bills, setBills] = useState([]);
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    Promise.allSettled([
      api.get('/reports/dashboard'),
      api.get('/bills', { params: { limit: 5 } }),
      api.get('/orders', { params: { limit: 5 } }),
    ]).then(([sRes, bRes, oRes]) => {
      if (sRes.status === 'fulfilled') setStats(sRes.value.data?.data || null);
      if (bRes.status === 'fulfilled') setBills(Array.isArray(bRes.value.data?.data) ? bRes.value.data.data : []);
      if (oRes.status === 'fulfilled') setOrders(Array.isArray(oRes.value.data?.data) ? oRes.value.data.data : []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div><h1 className="page-title">Salesman Dashboard</h1><p className="page-subtitle">Welcome, {user?.name}! Create invoices and track orders.</p></div>
        <Link to="/salesman/create-bill" className="btn-primary flex items-center gap-2"><Plus size={16} /> New Invoice</Link>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <StatsCard title="My Orders" value={stats?.monthOrders || 0} icon={Package} color="blue" loading={loading} />
        <StatsCard title="Month Revenue" value={`₹${((stats?.monthRevenue || 0)/1000).toFixed(0)}K`} icon={TrendingUp} color="green" loading={loading} />
        <StatsCard title="Total Invoices" value={bills.length} icon={FileText} color="purple" loading={loading} />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h3 className="font-heading font-bold text-gray-900 mb-4">Recent Invoices</h3>
          <div className="space-y-3">
            {loading ? Array(4).fill(0).map((_, i) => <div key={i} className="animate-pulse h-12 bg-gray-50 rounded-xl" />) :
              bills.length === 0 ? <p className="text-gray-400 text-sm text-center py-6">No invoices yet</p> :
              bills.map(b => (
                <div key={b._id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="font-mono text-xs text-primary-700 font-semibold">{b.billId}</p>
                    <p className="text-sm text-gray-600">{b.customer?.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">₹{b.grandTotal?.toLocaleString('en-IN')}</p>
                    <p className="text-xs text-gray-400">{new Date(b.billDate).toLocaleDateString('en-IN')}</p>
                  </div>
                </div>
              ))
            }
          </div>
          <Link to="/salesman/bills" className="text-primary-600 text-sm font-medium mt-3 block hover:underline">View all →</Link>
        </div>

        <div className="card p-6">
          <h3 className="font-heading font-bold text-gray-900 mb-4">Recent Orders</h3>
          <div className="space-y-3">
            {loading ? Array(4).fill(0).map((_, i) => <div key={i} className="animate-pulse h-12 bg-gray-50 rounded-xl" />) :
              orders.length === 0 ? <p className="text-gray-400 text-sm text-center py-6">No orders yet</p> :
              orders.map(o => (
                <div key={o._id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="font-mono text-xs text-primary-700 font-semibold">{o.orderId}</p>
                    <p className="text-sm text-gray-600">{o.customer?.name}</p>
                  </div>
                  <StatusBadge status={o.status} />
                </div>
              ))
            }
          </div>
          <Link to="/salesman/orders" className="text-primary-600 text-sm font-medium mt-3 block hover:underline">View all →</Link>
        </div>
      </div>
    </div>
  );
}
