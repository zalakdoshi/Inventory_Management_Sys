import { TrendingUp, TrendingDown } from 'lucide-react';

export default function StatsCard({ title, value, icon: Icon, color = 'green', trend, trendValue, subtitle, loading }) {
  const colorMap = {
    green: { bg: 'bg-primary-50', icon: 'bg-primary-100 text-primary-700', border: 'border-primary-100', text: 'text-primary-700' },
    blue: { bg: 'bg-blue-50', icon: 'bg-blue-100 text-blue-700', border: 'border-blue-100', text: 'text-blue-700' },
    orange: { bg: 'bg-orange-50', icon: 'bg-orange-100 text-orange-700', border: 'border-orange-100', text: 'text-orange-700' },
    red: { bg: 'bg-red-50', icon: 'bg-red-100 text-red-700', border: 'border-red-100', text: 'text-red-700' },
    purple: { bg: 'bg-purple-50', icon: 'bg-purple-100 text-purple-700', border: 'border-purple-100', text: 'text-purple-700' },
  };
  const c = colorMap[color] || colorMap.green;

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-card animate-pulse">
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <div className="h-3 bg-gray-200 rounded w-24" />
            <div className="h-7 bg-gray-200 rounded w-32" />
            <div className="h-3 bg-gray-200 rounded w-20" />
          </div>
          <div className="w-12 h-12 bg-gray-200 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-2xl border ${c.border} p-5 shadow-card hover:shadow-card-hover transition-all duration-300 group`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-500 font-medium">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1 font-heading">{value}</p>
          {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
          {trend !== undefined && (
            <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${trend >= 0 ? 'text-green-600' : 'text-red-500'}`}>
              {trend >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              <span>{Math.abs(trendValue || trend)}% this month</span>
            </div>
          )}
        </div>
        <div className={`${c.icon} p-3 rounded-xl group-hover:scale-110 transition-transform duration-300`}>
          <Icon size={22} />
        </div>
      </div>
    </div>
  );
}
