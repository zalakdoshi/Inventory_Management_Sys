import { useEffect, useState } from 'react';
import { Package, ShoppingCart, TrendingUp, Users, AlertTriangle, FileText, BarChart3, Activity } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import api from '../../api/axios';
import StatsCard from '../../components/ui/StatsCard';
import StatusBadge from '../../components/ui/StatusBadge';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const COLORS = ['#16a34a','#22c55e','#4ade80','#86efac','#bbf7d0'];

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/reports/dashboard').then(r => { setStats(r.data.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const revenueData = stats?.revenueByMonth?.map(d => ({
    month: MONTHS[d._id.month - 1],
    revenue: d.revenue,
    orders: d.count,
  })) || [];

  const orderPieData = stats?.ordersByStatus?.map(s => ({ name: s._id, value: s.count })) || [];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Admin Dashboard</h1>
        <p className="page-subtitle">Welcome back! Here's your business overview.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatsCard title="Total Products" value={loading ? '...' : stats?.totalProducts || 0} icon={Package} color="green" loading={loading} />
        <StatsCard title="Low Stock Items" value={loading ? '...' : stats?.lowStockProducts || 0} icon={AlertTriangle} color="orange" loading={loading} />
        <StatsCard title="Total Orders" value={loading ? '...' : stats?.totalOrders || 0} icon={ShoppingCart} color="blue" loading={loading} subtitle={`${stats?.monthOrders || 0} this month`} />
        <StatsCard title="Total Revenue" value={loading ? '...' : `₹${((stats?.totalRevenue || 0)/100000).toFixed(1)}L`} icon={TrendingUp} color="green" loading={loading} subtitle={`₹${((stats?.monthRevenue || 0)/1000).toFixed(0)}K this month`} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatsCard title="Total Users" value={loading ? '...' : stats?.totalUsers || 0} icon={Users} color="purple" loading={loading} />
        <StatsCard title="Total Purchases" value={loading ? '...' : `₹${((stats?.totalPurchases || 0)/100000).toFixed(1)}L`} icon={BarChart3} color="blue" loading={loading} />
        <StatsCard title="Month Purchases" value={loading ? '...' : `₹${((stats?.monthPurchases || 0)/1000).toFixed(0)}K`} icon={FileText} color="orange" loading={loading} />
        <StatsCard title="Active Orders" value={loading ? '...' : (stats?.ordersByStatus?.find(s => s._id === 'pending')?.count || 0)} icon={Activity} color="red" loading={loading} />
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Revenue Area Chart */}
        <div className="lg:col-span-2 card p-6">
          <h3 className="font-heading font-bold text-gray-900 mb-4">Revenue This Year</h3>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={revenueData}>
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#16a34a" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={v => `₹${(v/1000).toFixed(0)}K`} />
              <Tooltip formatter={v => [`₹${v.toLocaleString('en-IN')}`, 'Revenue']} />
              <Area type="monotone" dataKey="revenue" stroke="#16a34a" fill="url(#revenueGradient)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Order Status Pie */}
        <div className="card p-6">
          <h3 className="font-heading font-bold text-gray-900 mb-4">Orders by Status</h3>
          {orderPieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={orderPieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={3} dataKey="value">
                  {orderPieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : <div className="h-48 flex items-center justify-center text-gray-400 text-sm">No order data yet</div>}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card p-6">
        <h3 className="font-heading font-bold text-gray-900 mb-4">Recent Activity</h3>
        <div className="space-y-3">
          {loading ? (
            Array(5).fill(0).map((_, i) => (
              <div key={i} className="animate-pulse flex gap-3 items-center">
                <div className="w-8 h-8 bg-gray-200 rounded-full" />
                <div className="flex-1 space-y-1">
                  <div className="h-3 bg-gray-200 rounded w-2/3" />
                  <div className="h-2 bg-gray-200 rounded w-1/3" />
                </div>
              </div>
            ))
          ) : stats?.recentActivities?.length > 0 ? (
            stats.recentActivities.map((log, i) => (
              <div key={i} className="flex items-start gap-3 py-2 border-b border-gray-50 last:border-0">
                <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold text-primary-700">
                  {log.userName?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-800 truncate">{log.description}</p>
                  <p className="text-xs text-gray-400">{new Date(log.createdAt).toLocaleString('en-IN')}</p>
                </div>
                <StatusBadge status={log.module?.toLowerCase()} size="xs" />
              </div>
            ))
          ) : (
            <p className="text-gray-400 text-sm text-center py-8">No recent activity</p>
          )}
        </div>
      </div>
    </div>
  );
}
