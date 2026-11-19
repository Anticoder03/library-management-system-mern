import { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { AuthLayout } from './AuthLayout.jsx';
import { FormField } from '../../components/ui.jsx';
import api from '../../services/api.js';

export const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [token, setToken] = useState('');

  const submit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      const data = await api.post('/auth/forgot-password', { email });
      toast.success(data.message);
      setToken(data.data?.resetToken || '');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Forgot your password?"
      subtitle="Enter your email and we'll help you reset it."
      footer={<Link to="/login" className="font-bold text-brand-600 hover:underline">← Back to sign in</Link>}
    >
      <form onSubmit={submit} className="space-y-5">
        <FormField label="Email address">
          <input className="input" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" />
        </FormField>
        <button type="submit" className="btn-primary w-full !py-3" disabled={submitting}>
          {submitting ? 'Sending…' : 'Send reset link'}
        </button>
      </form>

      {token && (
        <div className="mt-5 rounded-xl border border-brand-100 bg-brand-50 p-4">
          <p className="text-xs font-bold text-brand-800">Development mode token</p>
          <p className="mt-1 break-all font-mono text-[11px] text-brand-700">{token}</p>
          <Link
            to={`/reset-password?token=${token}`}
            className="mt-2 inline-block text-xs font-bold text-brand-700 underline"
          >
            Continue to reset password →
          </Link>
        </div>
      )}
    </AuthLayout>
  );
};

export default ForgotPassword;
