import { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, UserCheck, UserX } from 'lucide-react';
import api from '../../api/axios';
import Modal from '../../components/ui/Modal';
import StatusBadge from '../../components/ui/StatusBadge';
import SearchInput from '../../components/ui/SearchInput';
import toast from 'react-hot-toast';

const EMPTY = { name: '', email: '', password: '', role: 'salesman', phone: '', isActive: true };

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [submitting, setSubmitting] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/users', { params: { search, role: roleFilter, limit: 50 } });
      setUsers(data.data);
    } catch { toast.error('Failed to fetch users.'); }
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, [search, roleFilter]);

  const openCreate = () => { setEditUser(null); setForm(EMPTY); setModalOpen(true); };
  const openEdit = (u) => { setEditUser(u); setForm({ name: u.name, email: u.email, password: '', role: u.role, phone: u.phone || '', isActive: u.isActive }); setModalOpen(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = { ...form };
      if (!payload.password) delete payload.password;
      if (editUser) {
        await api.put(`/users/${editUser._id}`, payload);
        toast.success('User updated!');
      } else {
        await api.post('/users', payload);
        toast.success('User created!');
      }
      setModalOpen(false);
      fetchUsers();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed.'); }
    setSubmitting(false);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this user?')) return;
    try { await api.delete(`/users/${id}`); toast.success('User deleted.'); fetchUsers(); }
    catch (err) { toast.error(err.response?.data?.message || 'Delete failed.'); }
  };

  const toggleStatus = async (id) => {
    try { await api.put(`/users/${id}/toggle-status`); toast.success('Status updated.'); fetchUsers(); }
    catch { toast.error('Failed.'); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div><h1 className="page-title">User Management</h1><p className="page-subtitle">{users.length} users registered</p></div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2"><Plus size={16} /> Add User</button>
      </div>

      <div className="card p-4 flex flex-wrap gap-3">
        <SearchInput placeholder="Search by name or email..." value={search} onChange={setSearch} className="flex-1 min-w-48" />
        <select className="select-field w-36" value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
          <option value="">All Roles</option>
          <option value="admin">Admin</option>
          <option value="purchaser">Purchaser</option>
          <option value="salesman">Salesman</option>
        </select>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead><tr>{['User','Role','Phone','Status','Last Login','Actions'].map(h => <th key={h} className="table-th">{h}</th>)}</tr></thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? Array(4).fill(0).map((_, i) => (
              <tr key={i} className="animate-pulse">{Array(6).fill(0).map((_, j) => <td key={j} className="table-td"><div className="h-4 bg-gray-100 rounded" /></td>)}</tr>
            )) : users.map(u => (
              <tr key={u._id} className="table-row">
                <td className="table-td">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-primary-600 rounded-full flex items-center justify-center text-white font-bold text-sm">{u.name.charAt(0).toUpperCase()}</div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{u.name}</p>
                      <p className="text-xs text-gray-400">{u.email}</p>
                    </div>
                  </div>
                </td>
                <td className="table-td"><StatusBadge status={u.role} /></td>
                <td className="table-td text-sm text-gray-600">{u.phone || '—'}</td>
                <td className="table-td"><StatusBadge status={u.isActive ? 'active' : 'inactive'} /></td>
                <td className="table-td text-xs text-gray-500">{u.lastLogin ? new Date(u.lastLogin).toLocaleDateString('en-IN') : 'Never'}</td>
                <td className="table-td">
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(u)} className="p-2 rounded-lg text-gray-400 hover:bg-blue-50 hover:text-blue-600 transition-colors"><Edit size={14} /></button>
                    <button onClick={() => toggleStatus(u._id)} className={`p-2 rounded-lg transition-colors ${u.isActive ? 'text-gray-400 hover:bg-orange-50 hover:text-orange-600' : 'text-gray-400 hover:bg-green-50 hover:text-green-600'}`}>
                      {u.isActive ? <UserX size={14} /> : <UserCheck size={14} />}
                    </button>
                    <button onClick={() => handleDelete(u._id)} className="p-2 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editUser ? 'Edit User' : 'Create User'} size="md"
        footer={<><button onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
          <button form="user-form" type="submit" disabled={submitting} className="btn-primary">{submitting ? 'Saving...' : editUser ? 'Update' : 'Create'}</button></>}>
        <form id="user-form" onSubmit={handleSubmit} className="space-y-4">
          <div className="form-group"><label className="label">Full Name *</label><input className="input-field" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required /></div>
          <div className="form-group"><label className="label">Email *</label><input type="email" className="input-field" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required /></div>
          <div className="form-group"><label className="label">{editUser ? 'New Password (leave blank to keep)' : 'Password *'}</label><input type="password" className="input-field" value={form.password} onChange={e => setForm({...form, password: e.target.value})} required={!editUser} minLength={6} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="form-group"><label className="label">Role</label>
              <select className="select-field" value={form.role} onChange={e => setForm({...form, role: e.target.value})}>
                <option value="admin">Admin</option>
                <option value="purchaser">Purchaser</option>
                <option value="salesman">Salesman</option>
              </select>
            </div>
            <div className="form-group"><label className="label">Phone</label><input className="input-field" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} /></div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
