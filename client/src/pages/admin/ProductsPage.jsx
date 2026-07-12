import { useState, useEffect, useRef } from 'react';
import { Plus, Edit, Trash2, Upload, Search, Filter, ChevronLeft, ChevronRight, Package, AlertTriangle } from 'lucide-react';
import api from '../../api/axios';
import Modal from '../../components/ui/Modal';
import StatusBadge from '../../components/ui/StatusBadge';
import SearchInput from '../../components/ui/SearchInput';
import toast from 'react-hot-toast';
import { PRODUCT_CATEGORIES, GST_RATES, UNITS } from '../../constants';

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

const EMPTY_FORM = {
  name: '', category: 'Biogas Components', sellingPrice: '', purchasePrice: '',
  quantity: '', unit: 'Piece', gstPercentage: 18, hsnCode: '', barcode: '',
  reorderLevel: 10, description: '', status: 'active', supplier: '',
};

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [viewProduct, setViewProduct] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [suppliers, setSuppliers] = useState([]);
  const fileRef = useRef();

  const fetchProducts = async (page = 1) => {
    setLoading(true);
    try {
      const { data } = await api.get('/products', {
        params: { page, limit: 10, search, category: categoryFilter, status: statusFilter },
      });
      setProducts(data.data);
      setPagination(data.pagination);
    } catch (err) {
      console.error('fetchProducts error:', err?.response?.status, err?.response?.data, err?.message);
      toast.error(err?.response?.data?.message || 'Failed to fetch products.');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProducts(1);
    api.get('/suppliers').then(r => setSuppliers(r.data.data || [])).catch(() => {});
  }, [search, categoryFilter, statusFilter]);

  const openCreate = () => { setEditProduct(null); setForm(EMPTY_FORM); setImageFile(null); setImagePreview(''); setModalOpen(true); };
  const openEdit = (p) => {
    setEditProduct(p);
    setForm({ name: p.name, category: p.category, sellingPrice: p.sellingPrice, purchasePrice: p.purchasePrice, quantity: p.quantity, unit: p.unit, gstPercentage: p.gstPercentage, hsnCode: p.hsnCode || '', barcode: p.barcode || '', reorderLevel: p.reorderLevel, description: p.description || '', status: p.status, supplier: p.supplier?._id || '' });
    setImagePreview(p.image ? `${API_BASE}${p.image}` : '');
    setImageFile(null);
    setModalOpen(true);
  };

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([k, v]) => { if (v !== '') formData.append(k, v); });
      if (imageFile) formData.append('image', imageFile);

      if (editProduct) {
        await api.put(`/products/${editProduct._id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Product updated!');
      } else {
        await api.post('/products', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Product created!');
      }
      setModalOpen(false);
      fetchProducts(pagination.page);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed.');
    }
    setSubmitting(false);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this product? This cannot be undone.')) return;
    try {
      await api.delete(`/products/${id}`);
      toast.success('Product deleted.');
      fetchProducts(pagination.page);
    } catch { toast.error('Delete failed.'); }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Products</h1>
          <p className="page-subtitle">{pagination.total} total products</p>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2"><Plus size={16} /> Add Product</button>
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-wrap gap-3 items-center">
        <SearchInput placeholder="Search by name, ID, barcode..." value={search} onChange={setSearch} className="flex-1 min-w-48" />
        <select className="select-field w-44" value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
          <option value="">All Categories</option>
          {PRODUCT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select className="select-field w-32" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="discontinued">Discontinued</option>
        </select>
      </div>

      {/* Product Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                {['Product', 'Category', 'Price', 'Stock', 'GST', 'Status', 'Actions'].map(h => (
                  <th key={h} className="table-th">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {Array(7).fill(0).map((_, j) => <td key={j} className="table-td"><div className="h-4 bg-gray-100 rounded" /></td>)}
                  </tr>
                ))
              ) : products.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-gray-400">
                  <Package size={40} className="mx-auto mb-2 opacity-40" />
                  <p>No products found</p>
                </td></tr>
              ) : products.map(product => (
                <tr key={product._id} className="table-row cursor-pointer" onClick={() => setViewProduct(product)}>
                  <td className="table-td">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                        {product.image ? (
                          <img
                            src={`${API_BASE}${product.image}`}
                            alt={product.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const localPath = `${window.location.origin}${product.image}`;
                              if (e.target.src !== localPath) {
                                e.target.src = product.image;
                              } else {
                                e.target.src = '';
                              }
                            }}
                          />
                        ) : <Package size={20} className="m-2.5 text-gray-400" />}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">{product.name}</p>
                        <p className="text-xs text-gray-400">{product.productId}</p>
                      </div>
                    </div>
                  </td>
                  <td className="table-td"><span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">{product.category}</span></td>
                  <td className="table-td">
                    <p className="font-semibold text-gray-900">₹{product.sellingPrice?.toLocaleString('en-IN')}</p>
                    <p className="text-xs text-gray-400">Cost: ₹{product.purchasePrice?.toLocaleString('en-IN')}</p>
                  </td>
                  <td className="table-td">
                    <div className="flex items-center gap-2">
                      {product.quantity <= product.reorderLevel && <AlertTriangle size={14} className="text-orange-500" />}
                      <span className={`font-semibold ${product.quantity <= product.reorderLevel ? 'text-orange-600' : 'text-gray-900'}`}>
                        {product.quantity} {product.unit}
                      </span>
                    </div>
                    {product.quantity <= product.reorderLevel && <p className="text-xs text-orange-500">Low stock!</p>}
                  </td>
                  <td className="table-td text-sm">{product.gstPercentage}%</td>
                  <td className="table-td"><StatusBadge status={product.status} /></td>
                  <td className="table-td" onClick={e => e.stopPropagation()}>
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(product)} className="p-2 rounded-lg text-gray-400 hover:bg-blue-50 hover:text-blue-600 transition-colors"><Edit size={15} /></button>
                      <button onClick={() => handleDelete(product._id)} className="p-2 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="px-4 py-3 border-t border-gray-50 flex items-center justify-between">
            <p className="text-sm text-gray-500">Page {pagination.page} of {pagination.pages} · {pagination.total} items</p>
            <div className="flex gap-2">
              <button onClick={() => fetchProducts(pagination.page - 1)} disabled={pagination.page === 1} className="btn-ghost py-1.5 px-3 flex items-center gap-1 text-sm disabled:opacity-40"><ChevronLeft size={15} /> Prev</button>
              <button onClick={() => fetchProducts(pagination.page + 1)} disabled={pagination.page === pagination.pages} className="btn-ghost py-1.5 px-3 flex items-center gap-1 text-sm disabled:opacity-40">Next <ChevronRight size={15} /></button>
            </div>
          </div>
        )}
      </div>

      {/* Product View Modal — card layout with large image */}
      <Modal isOpen={!!viewProduct} onClose={() => setViewProduct(null)} title="Product Details" size="xl">
        {viewProduct && (
          <div className="grid md:grid-cols-2 gap-8">
            {/* Left: Large Image */}
            <div className="space-y-4">
              <div className="aspect-square bg-gray-50 rounded-2xl overflow-hidden border border-gray-100 flex items-center justify-center">
                {viewProduct.image ? (
                  <img
                    src={`${API_BASE}${viewProduct.image}`}
                    alt={viewProduct.name}
                    className="w-full h-full object-contain p-4"
                    onError={(e) => {
                      const localPath = `${window.location.origin}${viewProduct.image}`;
                      if (e.target.src !== localPath) {
                        e.target.src = viewProduct.image;
                      } else {
                        e.target.src = '';
                      }
                    }}
                  />
                ) : (
                  <div className="text-center text-gray-300">
                    <Package size={80} className="mx-auto mb-2" />
                    <p className="text-sm">No image</p>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                {['ID', 'Barcode', 'HSN Code', 'Unit'].map((label, i) => {
                  const values = [viewProduct.productId, viewProduct.barcode || '—', viewProduct.hsnCode, viewProduct.unit];
                  return (
                    <div key={label} className="bg-gray-50 rounded-xl p-3">
                      <p className="text-xs text-gray-400 font-medium">{label}</p>
                      <p className="text-sm font-semibold text-gray-800 mt-0.5 truncate">{values[i]}</p>
                    </div>
                  );
                })}
              </div>
            </div>
            {/* Right: Product Details */}
            <div className="space-y-4">
              <div>
                <h2 className="text-2xl font-heading font-bold text-gray-900">{viewProduct.name}</h2>
                <p className="text-gray-500 text-sm mt-1">{viewProduct.category}</p>
              </div>
              {viewProduct.description && <p className="text-gray-600 text-sm leading-relaxed border-l-2 border-primary-400 pl-3">{viewProduct.description}</p>}
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-gray-50">
                  <span className="text-gray-500 text-sm">Selling Price</span>
                  <span className="text-xl font-bold text-primary-600">₹{viewProduct.sellingPrice?.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-50">
                  <span className="text-gray-500 text-sm">Purchase Price</span>
                  <span className="font-semibold text-gray-800">₹{viewProduct.purchasePrice?.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-50">
                  <span className="text-gray-500 text-sm">Current Stock</span>
                  <div className="flex items-center gap-2">
                    {viewProduct.quantity <= viewProduct.reorderLevel && <AlertTriangle size={14} className="text-orange-500" />}
                    <span className={`font-bold ${viewProduct.quantity <= viewProduct.reorderLevel ? 'text-orange-600' : 'text-gray-900'}`}>
                      {viewProduct.quantity} {viewProduct.unit}
                    </span>
                  </div>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-50">
                  <span className="text-gray-500 text-sm">Reorder Level</span>
                  <span className="font-semibold text-gray-800">{viewProduct.reorderLevel} {viewProduct.unit}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-50">
                  <span className="text-gray-500 text-sm">GST Rate</span>
                  <span className="font-semibold text-gray-800">{viewProduct.gstPercentage}%</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-500 text-sm">Status</span>
                  <StatusBadge status={viewProduct.status} />
                </div>
              </div>
              {viewProduct.supplier && (
                <div className="bg-primary-50 rounded-xl p-3 border border-primary-100">
                  <p className="text-xs text-primary-600 font-semibold mb-1">Supplier</p>
                  <p className="font-semibold text-gray-800">{viewProduct.supplier.name}</p>
                  {viewProduct.supplier.phone && <p className="text-xs text-gray-500">{viewProduct.supplier.phone}</p>}
                </div>
              )}
              <button onClick={() => { setViewProduct(null); openEdit(viewProduct); }} className="btn-primary w-full flex items-center justify-center gap-2">
                <Edit size={15} /> Edit Product
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Create/Edit Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editProduct ? 'Edit Product' : 'Add New Product'} size="2xl"
        footer={<>
          <button onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
          <button form="product-form" type="submit" disabled={submitting} className="btn-primary">
            {submitting ? 'Saving...' : editProduct ? 'Update Product' : 'Create Product'}
          </button>
        </>}
      >
        <form id="product-form" onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-4">
          {/* Image Upload */}
          <div className="md:col-span-2">
            <label className="label">Product Image</label>
            <div
              onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center cursor-pointer hover:border-primary-400 hover:bg-primary-50/30 transition-all"
            >
              {imagePreview ? (
                <img src={imagePreview} alt="Preview" className="max-h-40 mx-auto object-contain rounded-lg" />
              ) : (
                <div className="text-gray-400"><Upload size={32} className="mx-auto mb-2" /><p className="text-sm">Click to upload image</p></div>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleImage} className="hidden" />
          </div>
          <div className="form-group">
            <label className="label">Product Name *</label>
            <input className="input-field" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
          </div>
          <div className="form-group">
            <label className="label">Category *</label>
            <select className="select-field" value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
              {PRODUCT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="label">Selling Price (₹) *</label>
            <input type="number" className="input-field" value={form.sellingPrice} onChange={e => setForm({...form, sellingPrice: e.target.value})} required min="0" step="0.01" />
          </div>
          <div className="form-group">
            <label className="label">Purchase Price (₹) *</label>
            <input type="number" className="input-field" value={form.purchasePrice} onChange={e => setForm({...form, purchasePrice: e.target.value})} required min="0" step="0.01" />
          </div>
          <div className="form-group">
            <label className="label">Quantity</label>
            <input type="number" className="input-field" value={form.quantity} onChange={e => setForm({...form, quantity: e.target.value})} min="0" />
          </div>
          <div className="form-group">
            <label className="label">Unit</label>
            <select className="select-field" value={form.unit} onChange={e => setForm({...form, unit: e.target.value})}>
              {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="label">GST %</label>
            <select className="select-field" value={form.gstPercentage} onChange={e => setForm({...form, gstPercentage: Number(e.target.value)})}>
              {GST_RATES.map(r => <option key={r} value={r}>{r}%</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="label">HSN Code</label>
            <input className="input-field" value={form.hsnCode} onChange={e => setForm({...form, hsnCode: e.target.value})} placeholder="e.g. 8419" />
          </div>
          <div className="form-group">
            <label className="label">Barcode</label>
            <input className="input-field" value={form.barcode} onChange={e => setForm({...form, barcode: e.target.value})} />
          </div>
          <div className="form-group">
            <label className="label">Reorder Level</label>
            <input type="number" className="input-field" value={form.reorderLevel} onChange={e => setForm({...form, reorderLevel: e.target.value})} min="0" />
          </div>
          <div className="form-group">
            <label className="label">Supplier</label>
            <select className="select-field" value={form.supplier} onChange={e => setForm({...form, supplier: e.target.value})}>
              <option value="">No Supplier</option>
              {suppliers.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="label">Status</label>
            <select className="select-field" value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="discontinued">Discontinued</option>
            </select>
          </div>
          <div className="form-group md:col-span-2">
            <label className="label">Description</label>
            <textarea className="input-field" rows={3} value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
          </div>
        </form>
      </Modal>
    </div>
  );
}
