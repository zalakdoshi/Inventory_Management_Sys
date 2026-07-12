import { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, Save, User } from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function CreatePurchasePage() {
  const { user } = useAuth();
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [supplierInput, setSupplierInput] = useState('');
  const [filteredSuppliers, setFilteredSuppliers] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [newSupplierDetails, setNewSupplierDetails] = useState({ phone: '', email: '', gstin: '' });

  const isNewSupplier = supplierInput.trim() && !selectedSupplierId && !suppliers.some(s => s.name.toLowerCase() === supplierInput.trim().toLowerCase());
  const [form, setForm] = useState({
    invoiceNumber: '',
    purchaseDate: new Date().toISOString().split('T')[0],
    notes: '',
  });
  const [items, setItems] = useState([{ product: '', productName: '', quantity: 1, unitPrice: '', gstPercentage: 18 }]);
  const [submitting, setSubmitting] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/suppliers').then(r => setSuppliers(r.data.data || [])).catch(() => {});
    api.get('/products', { params: { limit: 200, status: 'active' } }).then(r => setProducts(r.data.data || [])).catch(() => {});
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleSupplierInputChange = (val) => {
    setSupplierInput(val);
    setSelectedSupplierId('');
    if (val.trim().length > 0) {
      const filtered = suppliers.filter(s =>
        s.name.toLowerCase().includes(val.toLowerCase())
      );
      setFilteredSuppliers(filtered);
      setShowDropdown(true);
    } else {
      setShowDropdown(false);
    }
  };

  const selectSupplier = (s) => {
    setSupplierInput(s.name);
    setSelectedSupplierId(s._id);
    setShowDropdown(false);
  };

  // Resolve supplier: use existing or auto-create a new one
  const resolveSupplier = async () => {
    const name = supplierInput.trim();
    if (!name) return { supplierId: '', supplierName: '' };

    if (selectedSupplierId) {
      return { supplierId: selectedSupplierId, supplierName: name };
    }

    // Check if exact name already exists
    const existing = suppliers.find(s => s.name.toLowerCase() === name.toLowerCase());
    if (existing) {
      return { supplierId: existing._id, supplierName: existing.name };
    }

    // Auto-create new supplier
    try {
      const { data } = await api.post('/suppliers', {
        name,
        phone: newSupplierDetails.phone,
        email: newSupplierDetails.email,
        gstin: newSupplierDetails.gstin,
      });
      toast.success(`New purchaser "${name}" added automatically!`);
      return { supplierId: data.data._id, supplierName: data.data.name };
    } catch {
      return { supplierId: '', supplierName: name };
    }
  };

  const addItem = () => setItems([...items, { product: '', productName: '', quantity: 1, unitPrice: '', gstPercentage: 18 }]);
  const removeItem = (i) => setItems(items.filter((_, idx) => idx !== i));

  const updateItem = (i, field, value) => {
    const updated = [...items];
    updated[i] = { ...updated[i], [field]: value };
    if (field === 'product') {
      const prod = products.find(p => p._id === value);
      if (prod) {
        updated[i].productName = prod.name;
        updated[i].unitPrice = prod.purchasePrice;
        updated[i].gstPercentage = prod.gstPercentage;
      }
    }
    setItems(updated);
  };

  const calcTotals = () => {
    let subtotal = 0, tax = 0;
    items.forEach(item => {
      const base = (parseFloat(item.unitPrice) || 0) * (parseInt(item.quantity) || 0);
      subtotal += base;
      tax += (base * (item.gstPercentage || 0)) / 100;
    });
    return { subtotal, tax, total: subtotal + tax };
  };

  const { subtotal, tax, total } = calcTotals();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (items.some(i => !i.product || !i.unitPrice)) {
      toast.error('All items need a product and price.');
      return;
    }
    if (!supplierInput.trim()) {
      toast.error('Purchaser name is required.');
      return;
    }
    setSubmitting(true);
    try {
      const { supplierId, supplierName } = await resolveSupplier();
      await api.post('/purchases', {
        ...form,
        supplier: supplierId || undefined,
        supplierName: supplierName || undefined,
        items,
      });
      toast.success('Purchase order created! Inventory updated.');
      navigate('/purchaser/purchases');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed.');
    }
    setSubmitting(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Create Purchase Order</h1>
        <p className="page-subtitle">Add new stock to inventory</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Purchase Details */}
        <div className="card p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Purchase Details</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">

            {/* Employee Name (auto-filled, read-only) */}
            <div className="form-group sm:col-span-2">
              <label className="label flex items-center gap-1.5">
                <User size={13} className="text-primary-600" /> Employee Name
              </label>
              <div className="input-field bg-gray-50 text-gray-700 font-semibold flex items-center gap-2 cursor-not-allowed">
                <span className="w-7 h-7 rounded-full bg-primary-100 text-primary-700 text-xs font-bold flex items-center justify-center flex-shrink-0">
                  {user?.name?.charAt(0)?.toUpperCase()}
                </span>
                {user?.name}
              </div>
            </div>

            {/* Purchaser Name (autocomplete) */}
            <div className="form-group sm:col-span-2" ref={dropdownRef}>
              <label className="label">
                Purchaser Name *
              </label>
              <div className="relative">
                <input
                  className="input-field"
                  value={supplierInput}
                  onChange={e => handleSupplierInputChange(e.target.value)}
                  onFocus={() => supplierInput && setShowDropdown(true)}
                  placeholder="Type purchaser name (auto-saves if new)"
                  autoComplete="off"
                />
                {showDropdown && (
                  <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                    {filteredSuppliers.length > 0 ? (
                      filteredSuppliers.map(s => (
                        <button
                          key={s._id}
                          type="button"
                          onClick={() => selectSupplier(s)}
                          className="w-full text-left px-4 py-2.5 text-sm hover:bg-primary-50 hover:text-primary-700 transition-colors"
                        >
                          <span className="font-semibold">{s.name}</span>
                          {s.phone && <span className="text-gray-400 ml-2 text-xs">{s.phone}</span>}
                        </button>
                      ))
                    ) : (
                      <div className="px-4 py-3 text-sm text-gray-500">
                        <span className="font-semibold text-primary-600">"{supplierInput}"</span> — will be auto-created as new purchaser
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {isNewSupplier && (
              <div className="col-span-full bg-primary-50/30 border border-primary-100/50 rounded-2xl p-4 mt-2 space-y-3">
                <h4 className="text-xs font-bold text-primary-800 uppercase tracking-wider">New Purchaser Details</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="form-group">
                    <label className="label text-xs">Phone Number</label>
                    <input
                      className="input-field text-xs bg-white"
                      placeholder="e.g. +91 9998160084"
                      value={newSupplierDetails.phone}
                      onChange={e => setNewSupplierDetails({ ...newSupplierDetails, phone: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="label text-xs">Email Address</label>
                    <input
                      type="email"
                      className="input-field text-xs bg-white"
                      placeholder="e.g. contact@company.com"
                      value={newSupplierDetails.email}
                      onChange={e => setNewSupplierDetails({ ...newSupplierDetails, email: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="label text-xs">GSTIN</label>
                    <input
                      className="input-field text-xs font-mono bg-white uppercase"
                      placeholder="e.g. 24AABCV1234A1Z5"
                      value={newSupplierDetails.gstin}
                      onChange={e => setNewSupplierDetails({ ...newSupplierDetails, gstin: e.target.value.toUpperCase() })}
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="form-group">
              <label className="label">Invoice Number</label>
              <input className="input-field" value={form.invoiceNumber} onChange={e => setForm({ ...form, invoiceNumber: e.target.value })} placeholder="Supplier invoice #" />
            </div>
            <div className="form-group">
              <label className="label">Purchase Date</label>
              <input type="date" className="input-field" value={form.purchaseDate} onChange={e => setForm({ ...form, purchaseDate: e.target.value })} />
            </div>
          </div>
        </div>

        {/* Items */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Purchase Items</h3>
            <button type="button" onClick={addItem} className="btn-secondary text-sm py-1.5 px-3 flex items-center gap-2">
              <Plus size={14} /> Add Item
            </button>
          </div>
          <div className="space-y-3">
            {items.map((item, i) => (
              <div key={i} className="grid grid-cols-12 gap-3 p-3 bg-gray-50 rounded-xl">
                <div className="col-span-12 sm:col-span-4">
                  <label className="label text-xs">Product *</label>
                  <select className="select-field text-sm" value={item.product} onChange={e => updateItem(i, 'product', e.target.value)} required>
                    <option value="">Select product</option>
                    {products.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                  </select>
                </div>
                <div className="col-span-4 sm:col-span-2">
                  <label className="label text-xs">Qty *</label>
                  <input type="number" className="input-field text-sm" value={item.quantity} onChange={e => updateItem(i, 'quantity', e.target.value)} min="1" required />
                </div>
                <div className="col-span-4 sm:col-span-2">
                  <label className="label text-xs">Unit Price (₹) *</label>
                  <input type="number" className="input-field text-sm" value={item.unitPrice} onChange={e => updateItem(i, 'unitPrice', e.target.value)} min="0" step="0.01" required />
                </div>
                <div className="col-span-3 sm:col-span-2">
                  <label className="label text-xs">GST %</label>
                  <select className="select-field text-sm" value={item.gstPercentage} onChange={e => updateItem(i, 'gstPercentage', Number(e.target.value))}>
                    {[0, 5, 12, 18, 28].map(r => <option key={r} value={r}>{r}%</option>)}
                  </select>
                </div>
                <div className="col-span-3 sm:col-span-1 flex items-end">
                  <p className="text-sm font-semibold text-gray-900 pb-2.5">
                    ₹{((parseFloat(item.unitPrice) || 0) * (parseInt(item.quantity) || 0) * ((100 + item.gstPercentage) / 100)).toFixed(0)}
                  </p>
                </div>
                <div className="col-span-2 sm:col-span-1 flex items-end justify-end">
                  <button type="button" onClick={() => removeItem(i)} disabled={items.length === 1} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-30">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Totals */}
        <div className="card p-6">
          <div className="flex flex-col items-end space-y-2">
            <div className="w-full sm:w-72 space-y-2 text-sm">
              <div className="flex justify-between text-gray-600"><span>Subtotal:</span><span className="font-semibold">₹{subtotal.toFixed(2)}</span></div>
              <div className="flex justify-between text-orange-600"><span>GST Tax:</span><span className="font-semibold">₹{tax.toFixed(2)}</span></div>
              <div className="flex justify-between text-lg font-bold text-primary-700 border-t pt-2"><span>Total:</span><span>₹{total.toFixed(2)}</span></div>
            </div>
          </div>
          <div className="mt-4">
            <label className="label">Notes</label>
            <textarea className="input-field" rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Additional notes..." />
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => navigate(-1)} className="btn-secondary">Cancel</button>
          <button type="submit" disabled={submitting} className="btn-primary flex items-center gap-2">
            {submitting ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save size={16} />}
            Create Purchase Order
          </button>
        </div>
      </form>
    </div>
  );
}
