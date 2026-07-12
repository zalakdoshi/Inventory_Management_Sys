import { useEffect, useState } from 'react';
import { ShoppingCart, TrendingUp, AlertTriangle, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import StatsCard from '../../components/ui/StatsCard';
import StatusBadge from '../../components/ui/StatusBadge';
import { useAuth } from '../../context/AuthContext';

export default function PurchaserDashboard() {
  const [stats, setStats] = useState(null);
  const [recentPurchases, setRecentPurchases] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    Promise.allSettled([
      api.get('/reports/dashboard'),
      api.get('/purchases', { params: { limit: 5 } }),
      api.get('/products', { params: { lowStock: 'true', limit: 8 } }),
    ]).then(([sRes, pRes, lRes]) => {
      if (sRes.status === 'fulfilled') setStats(sRes.value.data.data);
      if (pRes.status === 'fulfilled') setRecentPurchases(pRes.value.data.data);
      if (lRes.status === 'fulfilled') setLowStock(lRes.value.data.data);
      setLoading(false);
    });
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div><h1 className="page-title">Purchaser Dashboard</h1><p className="page-subtitle">Welcome, {user?.name}! Manage purchases and inventory.</p></div>
        <Link to="/purchaser/create-purchase" className="btn-primary flex items-center gap-2"><Plus size={16} /> New Purchase Order</Link>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <StatsCard title="This Month Purchases" value={`₹${((stats?.monthPurchases || 0)/1000).toFixed(0)}K`} icon={TrendingUp} color="blue" loading={loading} />
        <StatsCard title="Low Stock Items" value={stats?.lowStockProducts || 0} icon={AlertTriangle} color="orange" loading={loading} />
        <StatsCard title="Total Products" value={stats?.totalProducts || 0} icon={ShoppingCart} color="green" loading={loading} />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h3 className="font-heading font-bold text-gray-900 mb-4">Recent Purchases</h3>
          <div className="space-y-3">
            {loading ? Array(4).fill(0).map((_, i) => <div key={i} className="animate-pulse h-12 bg-gray-50 rounded-xl" />) :
              recentPurchases.length === 0 ? <p className="text-gray-400 text-sm text-center py-6">No purchases yet</p> :
              recentPurchases.map(p => (
                <div key={p._id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="font-mono text-xs text-primary-700 font-semibold">{p.purchaseId}</p>
                    <p className="text-sm text-gray-600">{p.supplierName || p.supplier?.name || 'No purchaser name'} · {p.items?.length} items</p>
                    <p className="text-xs text-gray-400">Employee: {p.purchasedBy?.name || user?.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">₹{p.totalAmount?.toLocaleString('en-IN')}</p>
                    <StatusBadge status={p.status} size="xs" />
                  </div>
                </div>
              ))
            }
          </div>
          <Link to="/purchaser/purchases" className="text-primary-600 text-sm font-medium mt-3 block hover:underline">View all →</Link>
        </div>

        <div className="card p-6">
          <h3 className="font-heading font-bold text-gray-900 mb-4 flex items-center gap-2"><AlertTriangle size={18} className="text-orange-500" /> Low Stock Alerts</h3>
          <div className="space-y-2">
            {loading ? Array(4).fill(0).map((_, i) => <div key={i} className="animate-pulse h-10 bg-gray-50 rounded-xl" />) :
              lowStock.length === 0 ? <p className="text-gray-400 text-sm text-center py-6">All stocks are healthy ✅</p> :
              lowStock.map(p => (
                <div key={p._id} className={`flex items-center justify-between px-3 py-2 rounded-xl ${p.quantity === 0 ? 'bg-red-50 border border-red-100' : 'bg-orange-50 border border-orange-100'}`}>
                  <p className="text-sm font-medium text-gray-900 truncate">{p.name}</p>
                  <span className={`text-xs font-bold ml-2 flex-shrink-0 ${p.quantity === 0 ? 'text-red-600' : 'text-orange-600'}`}>
                    {p.quantity} {p.unit}
                  </span>
                </div>
              ))
            }
          </div>
        </div>
      </div>
    </div>
  );
}
