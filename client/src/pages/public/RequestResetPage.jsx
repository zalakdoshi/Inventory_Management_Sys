import { useState } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { KeyRound } from 'lucide-react';

export default function RequestResetPage() {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const handleRequest = async () => {
    setLoading(true);
    try {
      await api.post('/password-reset/request');
      setSent(true);
      toast.success('Reset request submitted to admin!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Request failed.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-mesh flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md text-center">
        <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <KeyRound size={28} className="text-primary-600" />
        </div>
        <h2 className="text-2xl font-heading font-bold text-gray-900 mb-2">Password Reset Request</h2>
        <p className="text-gray-500 mb-6">A reset request will be sent to the admin. Once approved, you'll receive an email with a reset link.</p>
        {sent ? (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-green-700">
            ✅ Request submitted! Admin will review and send you an email.
          </div>
        ) : (
          <button onClick={handleRequest} disabled={loading} className="btn-primary w-full py-3 text-base">
            {loading ? 'Submitting...' : 'Request Password Reset'}
          </button>
        )}
      </div>
    </div>
  );
}
