import { useEffect, useState } from 'react';
import { AlertTriangle, Package, RefreshCw, TrendingDown } from 'lucide-react';
import api from '../../api/axios';
import StatusBadge from '../../components/ui/StatusBadge';
import toast from 'react-hot-toast';

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

export default function InventoryPage() {
  const [products, setProducts] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all' | 'low' | 'out'

  const fetchData = async () => {
    setLoading(true);
    try {
      const [prodRes, statsRes] = await Promise.allSettled([
        api.get('/products', { params: { limit: 100, lowStock: filter === 'low' || filter === 'out' ? 'true' : '' } }),
        api.get('/products/stats'),
      ]);
      
      if (prodRes.status === 'fulfilled') {
        let data = prodRes.value.data?.data || [];
        if (!Array.isArray(data)) data = [];
        if (filter === 'out') data = data.filter(p => p && p.quantity === 0);
        setProducts(data);
      } else {
        setProducts([]);
      }
      
      if (statsRes.status === 'fulfilled') {
        setStats(statsRes.value.data?.data || null);
      }
    } catch (err) {
      setProducts([]);
      setStats(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [filter]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div><h1 className="page-title">Inventory Management</h1><p className="page-subtitle">Monitor stock levels and reorder alerts</p></div>
        <button onClick={fetchData} className="btn-secondary flex items-center gap-2 text-sm"><RefreshCw size={15} /> Refresh</button>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="card p-5 flex items-center gap-4">
          <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center"><Package size={22} className="text-green-600" /></div>
          <div><p className="text-sm text-gray-500">Total Active</p><p className="text-2xl font-bold text-gray-900">{stats?.total || 0}</p></div>
        </div>
        <div className="card p-5 flex items-center gap-4 border-orange-100">
          <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center"><AlertTriangle size={22} className="text-orange-600" /></div>
          <div><p className="text-sm text-gray-500">Low Stock</p><p className="text-2xl font-bold text-orange-600">{stats?.lowStock || 0}</p></div>
        </div>
        <div className="card p-5 flex items-center gap-4 border-red-100">
          <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center"><TrendingDown size={22} className="text-red-600" /></div>
          <div><p className="text-sm text-gray-500">Out of Stock</p><p className="text-2xl font-bold text-red-600">{stats?.outOfStock || 0}</p></div>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="card p-4">
        <div className="flex gap-2">
          {[['all','All Products'],['low','Low Stock'],['out','Out of Stock']].map(([val, label]) => (
            <button key={val} onClick={() => setFilter(val)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${filter === val ? 'bg-primary-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Inventory Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr>
              {['Product','Category','Current Qty','Reorder Level','Status','Unit Price'].map(h => <th key={h} className="table-th">{h}</th>)}
            </tr></thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? Array(8).fill(0).map((_, i) => (
                <tr key={i} className="animate-pulse">{Array(6).fill(0).map((_, j) => <td key={j} className="table-td"><div className="h-4 bg-gray-100 rounded" /></td>)}</tr>
              )) : products.map(p => {
                if (!p) return null;
                const isLow = (p.quantity || 0) <= (p.reorderLevel || 0);
                const isOut = (p.quantity || 0) === 0;
                return (
                  <tr key={p._id} className={`table-row ${isOut ? 'bg-red-50/30' : isLow ? 'bg-orange-50/30' : ''}`}>
                    <td className="table-td">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                          {p.image ? (
                            <img
                              src={`${API_BASE}${p.image}`}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const localPath = `${window.location.origin}${p.image}`;
                                if (e.target.src !== localPath) {
                                  e.target.src = p.image;
                                } else {
                                  e.target.src = '';
                                }
                              }}
                            />
                          ) : (
                            <Package size={16} className="m-1.5 text-gray-400" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 text-sm">{p.name}</p>
                          <p className="text-xs text-gray-400">{p.productId}</p>
                        </div>
                      </div>
                    </td>
                    <td className="table-td"><span className="text-xs bg-gray-100 px-2 py-1 rounded-full text-gray-600">{p.category}</span></td>
                    <td className="table-td">
                      <div className="flex items-center gap-2">
                        {isLow && !isOut && <AlertTriangle size={14} className="text-orange-500" />}
                        {isOut && <AlertTriangle size={14} className="text-red-500" />}
                        <span className={`font-bold ${isOut ? 'text-red-600' : isLow ? 'text-orange-600' : 'text-gray-900'}`}>{p.quantity || 0} {p.unit || 'Piece'}</span>
                      </div>
                    </td>
                    <td className="table-td text-sm text-gray-600">{p.reorderLevel || 0} {p.unit || 'Piece'}</td>
                    <td className="table-td">
                      {isOut ? <StatusBadge status="out-of-stock" /> : isLow ? <StatusBadge status="low-stock" /> : <StatusBadge status="active" />}
                    </td>
                    <td className="table-td font-semibold text-gray-900">₹{(p.sellingPrice || 0).toLocaleString('en-IN')}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
