import { useEffect, useState } from 'react';
import { Activity, Filter } from 'lucide-react';
import api from '../../api/axios';
import StatusBadge from '../../components/ui/StatusBadge';

export default function ActivityLogsPage() {
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [moduleFilter, setModuleFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');

  const fetchLogs = async (page = 1) => {
    setLoading(true);
    try {
      const { data } = await api.get('/reports/activity-logs', { params: { page, limit: 20, module: moduleFilter, action: actionFilter } });
      setLogs(data.data);
      setPagination(data.pagination);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchLogs(1); }, [moduleFilter, actionFilter]);

  const severityColor = { low: 'bg-gray-100 text-gray-600', medium: 'bg-blue-100 text-blue-600', high: 'bg-red-100 text-red-600' };
  const actionIcon = { CREATE: '➕', UPDATE: '✏️', DELETE: '🗑️', LOGIN: '🔐', LOGOUT: '🚪', APPROVE: '✅', REJECT: '❌', EXPORT: '📤', STATUS_CHANGE: '🔄', PASSWORD_RESET: '🔑' };

  return (
    <div className="space-y-6">
      <div><h1 className="page-title">Activity Logs</h1><p className="page-subtitle">Complete audit trail of all ERP actions</p></div>

      <div className="card p-4 flex flex-wrap gap-3">
        <select className="select-field w-40" value={moduleFilter} onChange={e => setModuleFilter(e.target.value)}>
          <option value="">All Modules</option>
          {['Auth','Products','Purchases','Orders','Bills','Users','Reports','PasswordReset'].map(m => <option key={m} value={m}>{m}</option>)}
        </select>
        <select className="select-field w-40" value={actionFilter} onChange={e => setActionFilter(e.target.value)}>
          <option value="">All Actions</option>
          {['CREATE','UPDATE','DELETE','LOGIN','LOGOUT','APPROVE','REJECT','EXPORT','STATUS_CHANGE'].map(a => <option key={a} value={a}>{a}</option>)}
        </select>
        <p className="text-sm text-gray-500 self-center ml-auto">{pagination.total} total records</p>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead><tr>{['Action','User','Module','Description','Severity','Time'].map(h => <th key={h} className="table-th">{h}</th>)}</tr></thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? Array(8).fill(0).map((_, i) => (
              <tr key={i} className="animate-pulse">{Array(6).fill(0).map((_, j) => <td key={j} className="table-td"><div className="h-3 bg-gray-100 rounded" /></td>)}</tr>
            )) : logs.map(log => (
              <tr key={log._id} className="table-row">
                <td className="table-td"><span className="text-base">{actionIcon[log.action] || '📋'}</span> <span className="text-xs font-semibold text-gray-700 ml-1">{log.action}</span></td>
                <td className="table-td">
                  <p className="text-sm font-medium text-gray-900">{log.userName}</p>
                  <p className="text-xs text-gray-400 capitalize">{log.userRole}</p>
                </td>
                <td className="table-td"><span className="text-xs bg-primary-50 text-primary-700 px-2 py-0.5 rounded-full">{log.module}</span></td>
                <td className="table-td text-sm text-gray-600 max-w-xs truncate">{log.description}</td>
                <td className="table-td"><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${severityColor[log.severity]}`}>{log.severity}</span></td>
                <td className="table-td text-xs text-gray-400">{new Date(log.createdAt).toLocaleString('en-IN')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pagination.pages > 1 && (
        <div className="flex justify-center gap-2">
          <button onClick={() => fetchLogs(pagination.page - 1)} disabled={pagination.page === 1} className="btn-secondary text-sm py-1.5 px-3 disabled:opacity-40">← Prev</button>
          <span className="text-sm text-gray-500 self-center">Page {pagination.page} of {pagination.pages}</span>
          <button onClick={() => fetchLogs(pagination.page + 1)} disabled={pagination.page === pagination.pages} className="btn-secondary text-sm py-1.5 px-3 disabled:opacity-40">Next →</button>
        </div>
      )}
    </div>
  );
}
