import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { AuthLayout } from './AuthLayout.jsx';
import { FormField } from '../../components/ui.jsx';
import api from '../../services/api.js';

export const ResetPassword = () => {
  const [params] = useSearchParams();
  const [values, setValues] = useState({
    token: params.get('token') || '',
    password: '',
    confirmPassword: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const submit = async (event) => {
    event.preventDefault();
    if (values.password !== values.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/auth/reset-password', { token: values.token, password: values.password });
      toast.success('Password reset. Please sign in with your new password.');
      navigate('/login', { replace: true });
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Reset password"
      subtitle="Choose a strong new password for your account."
      footer={<Link to="/login" className="font-bold text-brand-600 hover:underline">← Back to sign in</Link>}
    >
      <form onSubmit={submit} className="space-y-5">
        <FormField label="Reset token">
          <input
            className="input font-mono text-xs"
            required
            value={values.token}
            onChange={(event) => setValues({ ...values, token: event.target.value })}
            placeholder="Paste the token from your email"
          />
        </FormField>
        <FormField label="New password">
          <input
            className="input"
            type="password"
            minLength={8}
            required
            value={values.password}
            onChange={(event) => setValues({ ...values, password: event.target.value })}
            placeholder="At least 8 characters"
          />
        </FormField>
        <FormField label="Confirm new password">
          <input
            className="input"
            type="password"
            minLength={8}
            required
            value={values.confirmPassword}
            onChange={(event) => setValues({ ...values, confirmPassword: event.target.value })}
            placeholder="Repeat new password"
          />
        </FormField>
        <button type="submit" className="btn-primary w-full !py-3" disabled={submitting}>
          {submitting ? 'Resetting…' : 'Reset password'}
        </button>
      </form>
    </AuthLayout>
  );
};

export default ResetPassword;
