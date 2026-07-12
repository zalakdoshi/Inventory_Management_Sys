import { useEffect, useState } from 'react';
import { CheckCircle, Clock, Package, Truck, MapPin, Plus, Download } from 'lucide-react';
import api from '../../api/axios';
import StatusBadge from '../../components/ui/StatusBadge';
import SearchInput from '../../components/ui/SearchInput';
import Modal from '../../components/ui/Modal';
import toast from 'react-hot-toast';

const TIMELINE_STEPS = [
  { status: 'created', label: 'Created', icon: Plus },
  { status: 'pending', label: 'Pending', icon: Clock },
  { status: 'approved', label: 'Approved', icon: CheckCircle },
  { status: 'packed', label: 'Packed', icon: Package },
  { status: 'dispatched', label: 'Dispatched', icon: Truck },
  { status: 'delivered', label: 'Delivered', icon: MapPin },
];

function OrderTimeline({ currentStatus }) {
  const currentIdx = TIMELINE_STEPS.findIndex(s => s.status === currentStatus);
  return (
    <div className="flex items-center justify-between w-full">
      {TIMELINE_STEPS.map((step, i) => {
        const Icon = step.icon;
        const isDone = i <= currentIdx;
        const isCurrent = i === currentIdx;
        return (
          <div key={step.status} className="flex-1 flex flex-col items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${isCurrent ? 'border-primary-600 bg-primary-600 text-white scale-110' : isDone ? 'border-primary-400 bg-primary-100 text-primary-600' : 'border-gray-200 bg-white text-gray-300'}`}>
              <Icon size={14} />
            </div>
            {i < TIMELINE_STEPS.length - 1 && (
              <div className={`absolute top-4 left-1/2 w-full h-0.5 ${isDone && i < currentIdx ? 'bg-primary-400' : 'bg-gray-200'}`} style={{ display: 'none' }} />
            )}
            <p className={`text-xs mt-1 font-medium ${isCurrent ? 'text-primary-600' : isDone ? 'text-gray-700' : 'text-gray-300'}`}>{step.label}</p>
          </div>
        );
      })}
    </div>
  );
}

export default function OrderTrackingPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [statusModal, setStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [note, setNote] = useState('');
  const [updating, setUpdating] = useState(false);
  const [search, setSearch] = useState('');

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/orders', { params: { limit: 50, search } });
      setOrders(data.data);
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();
  }, [search]);

  const downloadPDF = async (id) => {
    try {
      const res = await api.get(`/bills/${id}/pdf`, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      window.open(url, '_blank');
    } catch { toast.error('Failed to generate PDF.'); }
  };

  const handleStatusUpdate = async () => {
    if (!newStatus) return;
    setUpdating(true);
    try {
      await api.put(`/orders/${selectedOrder._id}/status`, { status: newStatus, note });
      toast.success(`Order status updated to ${newStatus}`);
      setStatusModal(false); setNote(''); setNewStatus('');
      fetchOrders();
    } catch (err) { toast.error(err.response?.data?.message || 'Update failed.'); }
    setUpdating(false);
  };

  const NEXT_STATUSES = {
    created: ['pending', 'cancelled'],
    pending: ['approved', 'cancelled'],
    approved: ['packed', 'cancelled'],
    packed: ['dispatched'],
    dispatched: ['delivered'],
  };

  return (
    <div className="space-y-6">
      <div><h1 className="page-title">Order Tracking</h1><p className="page-subtitle">Track and update order lifecycle</p></div>

      <div className="card p-4">
        <SearchInput
          placeholder="Search order ID or customer..."
          value={search}
          onChange={setSearch}
          className="max-w-sm"
        />
      </div>

      <div className="space-y-4">
        {loading ? Array(4).fill(0).map((_, i) => <div key={i} className="card p-5 animate-pulse space-y-3"><div className="h-4 bg-gray-100 rounded w-1/3" /><div className="h-3 bg-gray-100 rounded w-full" /></div>) :
          orders.length === 0 ? <div className="card p-12 text-center text-gray-400"><p>No orders yet</p></div> :
          orders.map(order => {
            const currentIdx = TIMELINE_STEPS.findIndex(s => s.status === order.status);
            const nextOptions = NEXT_STATUSES[order.status] || [];
            return (
              <div key={order._id} className="card p-5 hover:shadow-card-hover transition-all">
                <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-mono text-sm text-primary-700 font-bold">{order.orderId}</span>
                      <StatusBadge status={order.status} />
                    </div>
                    <p className="font-semibold text-gray-900">{order.customer?.name}</p>
                    <p className="text-sm text-gray-500">{order.customer?.phone} · {order.items?.length} items · ₹{order.totalAmount?.toLocaleString('en-IN')}</p>
                  </div>
                  <div className="flex gap-2 items-center">
                    {order.bill && (
                      ['approved', 'packed', 'dispatched', 'delivered'].includes(order.status) ? (
                        <button
                          onClick={() => downloadPDF(order.bill._id || order.bill)}
                          className="flex items-center gap-1.5 text-xs text-primary-600 hover:text-primary-700 bg-primary-50 hover:bg-primary-100 px-3 py-2 rounded-xl font-semibold transition-colors"
                        >
                          <Download size={13} /> Download Invoice
                        </button>
                      ) : (
                        <span
                          className="inline-flex items-center gap-1 text-xs text-gray-400 bg-gray-50 border border-gray-200 px-3 py-2 rounded-xl select-none cursor-not-allowed"
                          title="Invoice is locked until order is approved."
                        >
                          <Download size={13} /> Awaiting Approval
                        </span>
                      )
                    )}
                    {nextOptions.length > 0 && (
                      <button onClick={() => { setSelectedOrder(order); setStatusModal(true); setNewStatus(nextOptions[0]); }}
                        className="btn-primary text-sm py-1.5 px-4">Update Status</button>
                    )}
                  </div>
                </div>

                {/* Timeline */}
                <div className="mt-4 pt-4 border-t border-gray-50">
                  <div className="flex items-start justify-between px-2">
                    {TIMELINE_STEPS.map((step, i) => {
                      const Icon = step.icon;
                      const done = i <= currentIdx;
                      const current = i === currentIdx;
                      return (
                        <div key={step.status} className="flex flex-col items-center flex-1">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center border-2 transition-all ${current ? 'border-primary-600 bg-primary-600 text-white' : done ? 'border-primary-300 bg-primary-50 text-primary-500' : 'border-gray-200 bg-white text-gray-300'}`}>
                            <Icon size={12} />
                          </div>
                          <p className={`text-[9px] mt-1 text-center font-medium ${current ? 'text-primary-600' : done ? 'text-gray-600' : 'text-gray-300'}`}>{step.label}</p>
                        </div>
                      );
                    })}
                  </div>
                  {/* connector line */}
                  <div className="relative mt-0" style={{ marginTop: '-28px', marginBottom: '28px', paddingLeft: '16px', paddingRight: '16px' }}>
                    <div className="h-0.5 bg-gray-200 rounded-full">
                      <div className="h-0.5 bg-primary-400 rounded-full transition-all duration-500" style={{ width: `${Math.max(0, (currentIdx / (TIMELINE_STEPS.length - 1)) * 100)}%` }} />
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        }
      </div>

      <Modal isOpen={statusModal} onClose={() => setStatusModal(false)} title="Update Order Status" size="sm"
        footer={<><button onClick={() => setStatusModal(false)} className="btn-secondary">Cancel</button>
          <button onClick={handleStatusUpdate} disabled={updating} className="btn-primary">{updating ? 'Updating...' : 'Update'}</button></>}>
        {selectedOrder && (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">Order: <span className="font-mono font-semibold text-primary-700">{selectedOrder.orderId}</span></p>
            <div className="form-group">
              <label className="label">New Status</label>
              <select className="select-field" value={newStatus} onChange={e => setNewStatus(e.target.value)}>
                {(NEXT_STATUSES[selectedOrder.status] || []).map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="label">Note (optional)</label>
              <textarea className="input-field" rows={2} value={note} onChange={e => setNote(e.target.value)} placeholder="Add a note..." />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
