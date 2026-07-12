import { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../../api/axios';
import toast from 'react-hot-toast';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [done, setDone] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirm) { toast.error('Passwords do not match.'); return; }
    try {
      await api.post('/password-reset/confirm', { token, newPassword: password });
      setDone(true);
      toast.success('Password reset successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Reset failed.');
    }
  };

  if (!token) return <div className="min-h-screen flex items-center justify-center"><p className="text-red-500">Invalid reset link.</p></div>;

  return (
    <div className="min-h-screen bg-mesh flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <img src="/logo.png" alt="Vardhman Family" className="h-12 w-12 object-contain mx-auto mb-4" onError={e => { e.target.style.display='none'; }} />
        <h2 className="text-2xl font-heading font-bold text-center text-gray-900 mb-6">Reset Password</h2>
        {done ? (
          <div className="text-center">
            <div className="text-5xl mb-4">✅</div>
            <p className="text-gray-700 mb-4">Password reset successfully!</p>
            <Link to="/login" className="btn-primary">Back to Login</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">New Password</label>
              <input type="password" className="input-field" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
            </div>
            <div>
              <label className="label">Confirm Password</label>
              <input type="password" className="input-field" value={confirm} onChange={e => setConfirm(e.target.value)} required />
            </div>
            <button type="submit" className="btn-primary w-full py-3">Reset Password</button>
          </form>
        )}
      </div>
    </div>
  );
}
