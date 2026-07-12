import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, Shield, Lock, Mail, X, Send } from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const ROLE_DEMO = [
  { label: 'Purchaser', email: 'purchaser@vardhman.com', pass: 'purchaser123'},
  { label: 'Salesman',  email: 'salesman@vardhman.com',  pass: 'salesman123' },
];
const ROLE_HOME = { admin: '/admin/dashboard', purchaser: '/purchaser/dashboard', salesman: '/salesman/dashboard' };

function ForgotModal({ onClose }) {
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const handleSend = async (e) => {
    e.preventDefault(); setSending(true);
    try {
      await api.post('/password-reset/request', { email });
      setSent(true); toast.success('Reset request sent to admin!');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed.'); }
    setSending(false);
  };
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-7">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-gray-900">Forgot Password</h3>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400"><X size={18}/></button>
        </div>
        {sent ? (
          <div className="text-center py-4">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Send size={22} className="text-green-600"/>
            </div>
            <p className="font-semibold text-gray-900 mb-1">Request Sent!</p>
            <p className="text-gray-500 text-sm">Your admin will reset your password.</p>
            <button onClick={onClose} className="btn-primary mt-4 w-full">Done</button>
          </div>
        ) : (
          <form onSubmit={handleSend} className="space-y-4">
            <p className="text-gray-500 text-sm">Enter your email. Admin will be notified to reset it.</p>
            <div className="relative">
              <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"/>
              <input className="input-field pl-9" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@vardhman.com" required/>
            </div>
            <button type="submit" disabled={sending} className="btn-primary w-full flex items-center justify-center gap-2">
              {sending ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/> : <><Send size={14}/> Send Request</>}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function LoginPage() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const { login } = useAuth();
  const navigate  = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true);
    const result = await login(email, password);
    setLoading(false);
    if (result?.success) navigate(ROLE_HOME[result.role] || '/');
  };

  return (
    <>
      {forgotOpen && <ForgotModal onClose={() => setForgotOpen(false)}/>}
      <div className="min-h-screen flex items-center justify-center p-4"
        style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1a2e1a 50%, #0f172a 100%)' }}>

        {/* Decorative blobs */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full opacity-10 blur-3xl" style={{ background: '#16a34a' }}/>
          <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full opacity-10 blur-3xl" style={{ background: '#22c55e' }}/>
        </div>

        <div className="relative w-full max-w-md">
          {/* Card */}
          <div className="bg-white rounded-3xl shadow-2xl p-8">
            {/* Branding Text */}
            <div className="text-center mb-7">
              <h1 className="text-2xl font-black text-gray-900">Vardhman Family</h1>
              <p className="text-primary-600 text-base font-semibold">ERP Management System</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Email Address</label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"/>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                    className="input-field pl-9" placeholder="you@vardhman.com" required autoComplete="email"/>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="label mb-0">Password</label>
                  <button type="button" onClick={() => setForgotOpen(true)}
                    className="text-xs text-primary-600 hover:underline font-medium">Forgot password?</button>
                </div>
                <div className="relative">
                  <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"/>
                  <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                    className="input-field pl-9 pr-10" placeholder="••••••••" required autoComplete="current-password"/>
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors">
                    {showPass ? <EyeOff size={15}/> : <Eye size={15}/>}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading} className="btn-primary w-full py-3 flex items-center justify-center gap-2">
                {loading
                  ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"/>
                  : <><Shield size={15}/> Sign In</>}
              </button>
            </form>

            {/* Demo credentials */}
            <div className="mt-5 p-4 bg-gray-50 rounded-2xl">
              <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-widest mb-3 text-center">Demo — Click to Fill</p>
              <div className="space-y-2">
                {ROLE_DEMO.map(d => (
                  <button key={d.label} onClick={() => { setEmail(d.email); setPassword(d.pass); }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl border border-gray-200 bg-white text-left text-xs hover:border-primary-400 hover:bg-primary-50 transition-all">
                    <span className="font-bold text-gray-700 w-20">{d.label}</span>
                    <span className="font-mono text-gray-500 flex-1">{d.email}</span>
                    <span className="font-mono text-gray-400">{d.pass}</span>
                  </button>
                ))}
              </div>
            </div>

            <p className="text-center text-sm text-gray-500 mt-5">
              New user?{' '}
              <Link to="/register" className="text-primary-600 font-semibold hover:underline">Create account</Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
