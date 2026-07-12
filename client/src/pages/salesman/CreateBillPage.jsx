import { useState, useEffect } from 'react';
import { Plus, Trash2, Save, FileText } from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { PAYMENT_MODES } from '../../constants';

export default function CreateBillPage() {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({ customer: { name: '', phone: '', address: '', gstin: '' }, discount: 0, paymentMode: 'cash', taxType: 'cgst_sgst' });
  const [items, setItems] = useState([{ product: '', productName: '', hsnCode: '', quantity: 1, unitPrice: '', gstPercentage: 18, unit: 'Piece' }]);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/products', { params: { limit: 200, status: 'active' } }).then(r => setProducts(r.data.data || [])).catch(() => {});
  }, []);

  const addItem = () => setItems([...items, { product: '', productName: '', hsnCode: '', quantity: 1, unitPrice: '', gstPercentage: 18, unit: 'Piece' }]);
  const removeItem = (i) => setItems(items.filter((_, idx) => idx !== i));

  const updateItem = (i, field, value) => {
    const updated = [...items];
    updated[i] = { ...updated[i], [field]: value };
    if (field === 'product') {
      const prod = products.find(p => p._id === value);
      if (prod) { updated[i].productName = prod.name; updated[i].unitPrice = prod.sellingPrice; updated[i].gstPercentage = prod.gstPercentage; updated[i].hsnCode = prod.hsnCode || ''; updated[i].unit = prod.unit; }
    }
    setItems(updated);
  };

  const calcTotals = () => {
    let subtotal = 0, cgst = 0, sgst = 0, igst = 0;
    items.forEach(it => {
      const base = (parseFloat(it.unitPrice) || 0) * (parseInt(it.quantity) || 0);
      const gstAmt = (base * (it.gstPercentage || 0)) / 100;
      subtotal += base;
      if (form.taxType === 'cgst_sgst') { cgst += gstAmt / 2; sgst += gstAmt / 2; }
      else igst += gstAmt;
    });
    const tax = cgst + sgst + igst;
    const disc = parseFloat(form.discount) || 0;
    const grand = Math.round(subtotal + tax - disc);
    return { subtotal, cgst, sgst, igst, tax, disc, grand };
  };

  const t = calcTotals();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.customer.name) { toast.error('Customer name is required.'); return; }
    if (items.some(i => !i.product || !i.unitPrice)) { toast.error('All items need a product and price.'); return; }
    setSubmitting(true);
    try {
      const billItems = items.map(i => ({ ...i, taxableAmount: (parseFloat(i.unitPrice)||0)*(parseInt(i.quantity)||0), totalAmount: (parseFloat(i.unitPrice)||0)*(parseInt(i.quantity)||0)*((100+i.gstPercentage)/100) }));
      const { data } = await api.post('/bills', { ...form, items: billItems });
      toast.success('Invoice created successfully!');
      navigate('/salesman/bills');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed.'); }
    setSubmitting(false);
  };

  return (
    <div className="space-y-6">
      <div><h1 className="page-title">Create GST Invoice</h1><p className="page-subtitle">Generate a GST-compliant tax invoice</p></div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Customer Details */}
        <div className="card p-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2"><FileText size={16} className="text-primary-600" /> Customer Details</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="form-group sm:col-span-2"><label className="label">Customer Name *</label><input className="input-field" value={form.customer.name} onChange={e => setForm({...form, customer: {...form.customer, name: e.target.value}})} required placeholder="Customer / Company name" /></div>
            <div className="form-group"><label className="label">Phone</label><input className="input-field" value={form.customer.phone} onChange={e => setForm({...form, customer: {...form.customer, phone: e.target.value}})} /></div>
            <div className="form-group"><label className="label">Customer GSTIN</label><input className="input-field font-mono" value={form.customer.gstin} onChange={e => setForm({...form, customer: {...form.customer, gstin: e.target.value.toUpperCase()}})} placeholder="Optional" /></div>
            <div className="form-group sm:col-span-2"><label className="label">Address</label><input className="input-field" value={form.customer.address} onChange={e => setForm({...form, customer: {...form.customer, address: e.target.value}})} /></div>
            <div className="form-group"><label className="label">Tax Type</label>
              <select className="select-field" value={form.taxType} onChange={e => setForm({...form, taxType: e.target.value})}>
                <option value="cgst_sgst">CGST + SGST (Intra-state)</option>
                <option value="igst">IGST (Inter-state)</option>
              </select>
            </div>
            <div className="form-group"><label className="label">Payment Mode</label>
              <select className="select-field" value={form.paymentMode} onChange={e => setForm({...form, paymentMode: e.target.value})}>
                {PAYMENT_MODES.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Line Items */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Invoice Items</h3>
            <button type="button" onClick={addItem} className="btn-secondary text-sm py-1.5 px-3 flex items-center gap-1"><Plus size={14} /> Add Item</button>
          </div>
          <div className="space-y-3">
            {items.map((item, i) => (
              <div key={i} className="p-3 bg-gray-50 rounded-xl grid grid-cols-12 gap-3">
                <div className="col-span-12 sm:col-span-4">
                  <label className="label text-xs">Product *</label>
                  <select className="select-field text-sm" value={item.product} onChange={e => updateItem(i, 'product', e.target.value)} required>
                    <option value="">Select product</option>
                    {products.map(p => <option key={p._id} value={p._id}>{p.name} (₹{p.sellingPrice})</option>)}
                  </select>
                </div>
                <div className="col-span-4 sm:col-span-2">
                  <label className="label text-xs">Qty *</label>
                  <input type="number" className="input-field text-sm" value={item.quantity} onChange={e => updateItem(i, 'quantity', e.target.value)} min="1" required />
                </div>
                <div className="col-span-4 sm:col-span-2">
                  <label className="label text-xs">Rate (₹) *</label>
                  <input type="number" className="input-field text-sm" value={item.unitPrice} onChange={e => updateItem(i, 'unitPrice', e.target.value)} min="0" step="0.01" required />
                </div>
                <div className="col-span-3 sm:col-span-2">
                  <label className="label text-xs">GST %</label>
                  <select className="select-field text-sm" value={item.gstPercentage} onChange={e => updateItem(i, 'gstPercentage', Number(e.target.value))}>
                    {[0,5,12,18,28].map(r => <option key={r} value={r}>{r}%</option>)}
                  </select>
                </div>
                <div className="col-span-6 sm:col-span-1 flex items-end">
                  <p className="text-xs font-bold text-primary-700 pb-2.5">₹{((parseFloat(item.unitPrice)||0)*(parseInt(item.quantity)||0)*(1+item.gstPercentage/100)).toFixed(0)}</p>
                </div>
                <div className="col-span-1 flex items-end justify-end">
                  <button type="button" onClick={() => removeItem(i)} disabled={items.length === 1} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-30"><Trash2 size={14} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Totals Summary */}
        <div className="card p-6">
          <div className="grid sm:grid-cols-2 gap-8">
            <div>
              <label className="label">Discount (₹)</label>
              <input type="number" className="input-field max-w-xs" value={form.discount} onChange={e => setForm({...form, discount: e.target.value})} min="0" step="0.01" />
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-600"><span>Subtotal:</span><span className="font-semibold">₹{t.subtotal.toFixed(2)}</span></div>
              {form.taxType === 'cgst_sgst' ? <>
                <div className="flex justify-between text-gray-600"><span>CGST:</span><span>₹{t.cgst.toFixed(2)}</span></div>
                <div className="flex justify-between text-gray-600"><span>SGST:</span><span>₹{t.sgst.toFixed(2)}</span></div>
              </> : <div className="flex justify-between text-gray-600"><span>IGST:</span><span>₹{t.igst.toFixed(2)}</span></div>}
              {t.disc > 0 && <div className="flex justify-between text-red-500"><span>Discount:</span><span>-₹{t.disc.toFixed(2)}</span></div>}
              <div className="flex justify-between text-xl font-bold text-primary-700 border-t pt-2"><span>Grand Total:</span><span>₹{t.grand.toLocaleString('en-IN')}</span></div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => navigate(-1)} className="btn-secondary">Cancel</button>
          <button type="submit" disabled={submitting} className="btn-primary flex items-center gap-2 py-3 px-6">
            {submitting ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save size={16} />}
            Generate Invoice
          </button>
        </div>
      </form>
    </div>
  );
}
