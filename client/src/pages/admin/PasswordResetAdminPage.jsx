import { useEffect, useState } from 'react';
import { Check, X, Clock, KeyRound } from 'lucide-react';
import api from '../../api/axios';
import StatusBadge from '../../components/ui/StatusBadge';
import Modal from '../../components/ui/Modal';
import toast from 'react-hot-toast';

export default function PasswordResetAdminPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionModal, setActionModal] = useState(null);
  const [adminNote, setAdminNote] = useState('');
  const [processing, setProcessing] = useState(false);
  const [statusFilter, setStatusFilter] = useState('pending');

  const fetchRequests = async () => {
    setLoading(true);
    try { const { data } = await api.get('/password-reset', { params: { status: statusFilter } }); setRequests(data.data); }
    catch { toast.error('Failed to load requests.'); }
    setLoading(false);
  };

  useEffect(() => { fetchRequests(); }, [statusFilter]);

  const handleAction = async (action) => {
    setProcessing(true);
    try {
      await api.put(`/password-reset/${actionModal._id}`, { action, adminNote });
      toast.success(action === 'approve' ? 'Approved! Reset email sent.' : 'Request rejected.');
      setActionModal(null);
      setAdminNote('');
      fetchRequests();
    } catch (err) { toast.error(err.response?.data?.message || 'Action failed.'); }
    setProcessing(false);
  };

  return (
    <div className="space-y-6">
      <div><h1 className="page-title">Password Reset Requests</h1><p className="page-subtitle">Manage user password reset approval workflow</p></div>

      <div className="card p-4 flex gap-3">
        {['pending','approved','rejected'].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition-all ${statusFilter === s ? 'bg-primary-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
            {s}
          </button>
        ))}
      </div>

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead><tr>{['User','Role','Email','Requested At','Status','Actions'].map(h => <th key={h} className="table-th">{h}</th>)}</tr></thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? Array(3).fill(0).map((_, i) => (
              <tr key={i} className="animate-pulse">{Array(6).fill(0).map((_, j) => <td key={j} className="table-td"><div className="h-4 bg-gray-100 rounded" /></td>)}</tr>
            )) : requests.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-12 text-gray-400">
                <KeyRound size={40} className="mx-auto mb-2 opacity-30" />
                <p>No {statusFilter} requests</p>
              </td></tr>
            ) : requests.map(req => (
              <tr key={req._id} className="table-row">
                <td className="table-td font-medium text-gray-900">{req.userName}</td>
                <td className="table-td"><StatusBadge status={req.userRole} /></td>
                <td className="table-td text-sm text-gray-600">{req.userEmail}</td>
                <td className="table-td text-xs text-gray-500">{new Date(req.requestedAt || req.createdAt).toLocaleString('en-IN')}</td>
                <td className="table-td"><StatusBadge status={req.status === 'pending' ? 'pending' : req.status} /></td>
                <td className="table-td">
                  {req.status === 'pending' && (
                    <button onClick={() => setActionModal(req)} className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1">
                      <Clock size={12} /> Review
                    </button>
                  )}
                  {req.adminNote && <p className="text-xs text-gray-400 mt-1">Note: {req.adminNote}</p>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={!!actionModal} onClose={() => setActionModal(null)} title="Review Reset Request" size="md"
        footer={
          <>
            <button onClick={() => setActionModal(null)} className="btn-secondary">Cancel</button>
            <button onClick={() => handleAction('reject')} disabled={processing} className="btn-danger flex items-center gap-2"><X size={15} /> Reject</button>
            <button onClick={() => handleAction('approve')} disabled={processing} className="btn-primary flex items-center gap-2"><Check size={15} /> Approve & Send Email</button>
          </>
        }
      >
        {actionModal && (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="font-semibold text-gray-900">{actionModal.userName}</p>
              <p className="text-sm text-gray-500">{actionModal.userEmail}</p>
              <p className="text-xs text-gray-400 mt-1">Role: {actionModal.userRole} · Requested: {new Date(actionModal.requestedAt || actionModal.createdAt).toLocaleString('en-IN')}</p>
            </div>
            <div>
              <label className="label">Admin Note (optional)</label>
              <textarea className="input-field" rows={3} placeholder="Reason for approval/rejection..." value={adminNote} onChange={e => setAdminNote(e.target.value)} />
            </div>
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-sm text-blue-700">
              ℹ️ Approving will generate a reset token and send an email to <strong>{actionModal.userEmail}</strong>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
