import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, UserPlus, Mail, Lock, User, Phone, Briefcase } from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', role: 'salesman', password: '', confirmPassword: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) { toast.error('Passwords do not match!'); return; }
    if (form.password.length < 6) { toast.error('Password must be at least 6 characters.'); return; }
    setLoading(true);
    try {
      await api.post('/auth/register', { name: form.name, email: form.email, phone: form.phone, role: form.role, password: form.password });
      toast.success('Account created! You can now log in.');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1a2e1a 50%, #0f172a 100%)' }}>

      {/* Decorative blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full opacity-10 blur-3xl" style={{ background: '#16a34a' }}/>
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full opacity-10 blur-3xl" style={{ background: '#22c55e' }}/>
      </div>

      <div className="relative w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-2xl p-8">
          {/* Branding Text */}
          <div className="text-center mb-6">
            <h1 className="text-2xl font-black text-gray-900">Vardhman Family</h1>
            <p className="text-primary-600 text-base font-semibold">ERP Management System</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Full Name *</label>
              <div className="relative">
                <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"/>
                <input className="input-field pl-9" type="text" value={form.name}
                  onChange={e => set('name', e.target.value)} placeholder="Your full name" required/>
              </div>
            </div>

            <div>
              <label className="label">Email *</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"/>
                <input className="input-field pl-9" type="email" value={form.email}
                  onChange={e => set('email', e.target.value)} placeholder="you@vardhman.com" required/>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Phone</label>
                <div className="relative">
                  <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"/>
                  <input className="input-field pl-9" type="tel" value={form.phone}
                    onChange={e => set('phone', e.target.value)} placeholder="+91 98765..."/>
                </div>
              </div>
              <div>
                <label className="label">Role *</label>
                <div className="relative">
                  <Briefcase size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"/>
                  <select className="select-field pl-9" value={form.role} onChange={e => set('role', e.target.value)}>
                    <option value="salesman">Salesman</option>
                    <option value="purchaser">Purchaser</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>
            </div>

            <div>
              <label className="label">Password *</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"/>
                <input className="input-field pl-9 pr-10" type={showPass ? 'text' : 'password'}
                  value={form.password} onChange={e => set('password', e.target.value)} placeholder="Min. 6 characters" required/>
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700">
                  {showPass ? <EyeOff size={15}/> : <Eye size={15}/>}
                </button>
              </div>
            </div>

            <div>
              <label className="label">Confirm Password *</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"/>
                <input className="input-field pl-9" type={showPass ? 'text' : 'password'}
                  value={form.confirmPassword} onChange={e => set('confirmPassword', e.target.value)}
                  placeholder="Re-enter password" required/>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="btn-primary w-full py-3 flex items-center justify-center gap-2 mt-1">
              {loading
                ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"/>
                : <><UserPlus size={16}/> Create Account</>}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-5">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-600 font-semibold hover:underline">Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
