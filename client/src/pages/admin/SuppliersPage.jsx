import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Calendar, ClipboardList } from 'lucide-react';
import api from '../../api/axios';
import Modal from '../../components/ui/Modal';
import StatusBadge from '../../components/ui/StatusBadge';
import SearchInput from '../../components/ui/SearchInput';
import toast from 'react-hot-toast';

const EMPTY = { name: '', contactPerson: '', phone: '', email: '', gstin: '', address: { street: '', city: '', state: 'Gujarat', pincode: '' }, notes: '' };

export default function SuppliersPage({ readOnly }) {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editSupplier, setEditSupplier] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [submitting, setSubmitting] = useState(false);

  // Purchaser tracking modal states
  const [trackingModalOpen, setTrackingModalOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [supplierPurchases, setSupplierPurchases] = useState([]);
  const [loadingPurchases, setLoadingPurchases] = useState(false);
  const [modalSearch, setModalSearch] = useState('');

  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/suppliers');
      setSuppliers(data.data || []);
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const handleOpenTracking = async (supplier) => {
    setSelectedSupplier(supplier);
    setModalSearch('');
    setTrackingModalOpen(true);
    setLoadingPurchases(true);
    setSupplierPurchases([]);
    try {
      const { data } = await api.get('/purchases', { params: { supplier: supplier._id, limit: 100 } }); // Fetch up to 100 purchases
      setSupplierPurchases(data.data || []);
    } catch (err) {
      toast.error('Failed to load purchase history.');
    }
    setLoadingPurchases(false);
  };

  const openCreate = () => { setEditSupplier(null); setForm(EMPTY); setModalOpen(true); };
  const openEdit = (s) => { setEditSupplier(s); setForm({ name: s.name, contactPerson: s.contactPerson || '', phone: s.phone || '', email: s.email || '', gstin: s.gstin || '', address: s.address || EMPTY.address, notes: s.notes || '' }); setModalOpen(true); };

  const handleSubmit = async (e) => {
    e.preventDefault(); setSubmitting(true);
    try {
      if (editSupplier) { await api.put(`/suppliers/${editSupplier._id}`, form); toast.success('Purchaser updated!'); }
      else { await api.post('/suppliers', form); toast.success('Purchaser created!'); }
      setModalOpen(false); fetchSuppliers();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed.'); }
    setSubmitting(false);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete purchaser?')) return;
    try { await api.delete(`/suppliers/${id}`); toast.success('Deleted.'); fetchSuppliers(); }
    catch { toast.error('Delete failed.'); }
  };

  // Filter purchases locally inside modal
  const filteredModalPurchases = supplierPurchases.filter(p => {
    if (!modalSearch.trim()) return true;
    const term = modalSearch.toLowerCase().trim();
    const matchPO = p.purchaseId?.toLowerCase().includes(term);
    const matchInv = p.invoiceNumber?.toLowerCase().includes(term);
    const formattedDate = new Date(p.createdAt).toLocaleDateString('en-IN');
    const matchDate = formattedDate.includes(term);
    return matchPO || matchInv || matchDate;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div><h1 className="page-title">Purchasers</h1><p className="page-subtitle">{suppliers.length} purchasers</p></div>
        {!readOnly && <button onClick={openCreate} className="btn-primary flex items-center gap-2"><Plus size={16} /> Add Purchaser</button>}
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? Array(3).fill(0).map((_, i) => <div key={i} className="card p-5 animate-pulse space-y-3"><div className="h-4 bg-gray-100 rounded w-2/3" /><div className="h-3 bg-gray-100 rounded w-1/2" /></div>) :
          suppliers.map(s => (
            <div key={s._id} className="card p-5 hover:shadow-card-hover transition-all flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">{s.name}</h3>
                    {s.contactPerson && <p className="text-xs text-gray-400 font-medium">Contact: {s.contactPerson}</p>}
                  </div>
                  {!readOnly && (
                    <div className="flex gap-1 flex-shrink-0">
                      <button onClick={() => openEdit(s)} className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"><Edit size={14} /></button>
                      <button onClick={() => handleDelete(s._id)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"><Trash2 size={14} /></button>
                    </div>
                  )}
                </div>
                <div className="space-y-1.5 text-sm text-gray-500 mb-4">
                  {s.phone && <p className="flex items-center gap-1.5">📞 {s.phone}</p>}
                  {s.email && <p className="flex items-center gap-1.5">✉️ {s.email}</p>}
                  {s.gstin && <p className="font-mono text-xs flex items-center gap-1.5">🏷️ {s.gstin}</p>}
                </div>
              </div>

              <div className="border-t border-gray-100 pt-3 mt-auto">
                <button
                  onClick={() => handleOpenTracking(s)}
                  className="w-full flex items-center justify-center gap-1.5 text-xs font-semibold text-primary-600 hover:text-primary-700 bg-primary-50 hover:bg-primary-100 px-3 py-2.5 rounded-xl transition-colors"
                >
                  <ClipboardList size={14} />
                  <span>View Purchases & Tracking</span>
                </button>
              </div>
            </div>
          ))
        }
      </div>

      {/* Edit/Add Purchaser Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editSupplier ? 'Edit Purchaser' : 'Add Purchaser'} size="lg"
        footer={<><button onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
          <button form="sup-form" type="submit" disabled={submitting} className="btn-primary">{submitting ? 'Saving...' : 'Save'}</button></>}>
        <form id="sup-form" onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
          <div className="col-span-2 form-group"><label className="label">Company Name *</label><input className="input-field" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required /></div>
          <div className="form-group"><label className="label">Contact Person</label><input className="input-field" value={form.contactPerson} onChange={e => setForm({...form, contactPerson: e.target.value})} /></div>
          <div className="form-group"><label className="label">Phone</label><input className="input-field" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} /></div>
          <div className="form-group"><label className="label">Email</label><input type="email" className="input-field" value={form.email} onChange={e => setForm({...form, email: e.target.value})} /></div>
          <div className="form-group"><label className="label">GSTIN</label><input className="input-field font-mono" value={form.gstin} onChange={e => setForm({...form, gstin: e.target.value.toUpperCase()})} /></div>
          <div className="form-group"><label className="label">City</label><input className="input-field" value={form.address?.city} onChange={e => setForm({...form, address: {...form.address, city: e.target.value}})} /></div>
          <div className="form-group"><label className="label">Pincode</label><input className="input-field" value={form.address?.pincode} onChange={e => setForm({...form, address: {...form.address, pincode: e.target.value}})} /></div>
          <div className="col-span-2 form-group"><label className="label">Notes</label><textarea className="input-field" rows={2} value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} /></div>
        </form>
      </Modal>

      {/* Purchases & Tracking Modal */}
      <Modal
        isOpen={trackingModalOpen}
        onClose={() => setTrackingModalOpen(false)}
        title={`Purchase History & Tracking — ${selectedSupplier?.name || ''}`}
        size="lg"
        footer={<button onClick={() => setTrackingModalOpen(false)} className="btn-primary">Close</button>}
      >
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="bg-gray-50 p-3 rounded-xl text-xs space-y-1 text-gray-500 border border-gray-100 flex-1">
              {selectedSupplier?.contactPerson && <p><strong>Contact Person:</strong> {selectedSupplier.contactPerson}</p>}
              {selectedSupplier?.phone && <p><strong>Phone:</strong> {selectedSupplier.phone}</p>}
              {selectedSupplier?.email && <p><strong>Email:</strong> {selectedSupplier.email}</p>}
              {selectedSupplier?.gstin && <p><strong>GSTIN:</strong> <span className="font-mono">{selectedSupplier.gstin}</span></p>}
            </div>
            <div className="flex items-center flex-1">
              <SearchInput
                placeholder="Search PO ID, Invoice #, or Date (DD/MM/YYYY)..."
                value={modalSearch}
                onChange={setModalSearch}
                className="w-full text-xs shadow-none border-gray-200"
              />
            </div>
          </div>

          <div className="overflow-y-auto max-h-[55vh] pr-1 space-y-3">
            {loadingPurchases ? (
              <div className="space-y-2 py-4">
                <div className="h-16 bg-gray-50 rounded-xl animate-pulse" />
                <div className="h-16 bg-gray-50 rounded-xl animate-pulse" />
                <div className="h-16 bg-gray-50 rounded-xl animate-pulse" />
              </div>
            ) : filteredModalPurchases.length === 0 ? (
              <div className="text-center py-8 text-gray-400 italic text-sm">
                No matching purchase orders found.
              </div>
            ) : (
              filteredModalPurchases.map(p => (
                <div key={p._id} className="p-4 bg-white rounded-xl border border-gray-100 shadow-sm space-y-3">
                  <div className="flex justify-between items-center flex-wrap gap-2">
                    <div>
                      <span className="font-mono font-bold text-primary-700 text-sm">{p.purchaseId}</span>
                      {p.invoiceNumber && <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded ml-2 font-mono">Inv: {p.invoiceNumber}</span>}
                    </div>
                    <select
                      value={p.status}
                      onChange={async (e) => {
                        const val = e.target.value;
                        if (val === p.status) return;
                        try {
                          await api.put(`/purchases/${p._id}`, { status: val });
                          toast.success(`Purchase status updated to ${val}`);
                          // Reload modal purchases list
                          const { data } = await api.get('/purchases', { params: { supplier: selectedSupplier._id, limit: 100 } });
                          setSupplierPurchases(data.data || []);
                        } catch (err) {
                          toast.error(err.response?.data?.message || 'Update failed.');
                        }
                      }}
                      className="border border-gray-200 rounded-xl px-2.5 py-1 text-xs font-semibold bg-white cursor-pointer select-field outline-none focus:ring-1 focus:ring-primary-500"
                    >
                      <option value="ordered">Ordered</option>
                      <option value="received">Received (Adds to stock)</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs text-gray-600">
                    <div>
                      <p className="text-gray-400 font-medium">Date</p>
                      <p className="font-semibold flex items-center gap-1"><Calendar size={12} /> {new Date(p.createdAt).toLocaleDateString('en-IN')}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 font-medium">Items</p>
                      <p className="font-semibold">{p.items?.length || 0} product(s)</p>
                    </div>
                    <div>
                      <p className="text-gray-400 font-medium">Grand Total</p>
                      <p className="font-bold text-primary-600">₹{p.totalAmount?.toLocaleString('en-IN')}</p>
                    </div>
                  </div>

                  {/* Visual tracking timeline */}
                  <div className="pt-2 border-t border-gray-50">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Tracking Status</p>
                    <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-xl justify-around border border-gray-100">
                      {['ordered', 'received'].map((st) => {
                        const isDone = st === 'received' ? p.status === 'received' : ['ordered', 'received'].includes(p.status);
                        return (
                          <div key={st} className="flex items-center gap-1.5">
                            <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center transition-colors ${isDone ? 'bg-green-500' : 'bg-gray-200'}`}>
                              {isDone && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                            </div>
                            <span className={`text-xs capitalize font-semibold ${isDone ? 'text-gray-700' : 'text-gray-400'}`}>{st}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
