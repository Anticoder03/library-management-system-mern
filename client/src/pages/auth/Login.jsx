import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, LockKeyhole, Mail } from 'lucide-react';
import { toast } from 'react-toastify';
import { AuthLayout } from './AuthLayout.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { FormField } from '../../components/ui.jsx';

export const Login = () => {
  const [values, setValues] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const submit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      const user = await login(values);
      toast.success(`Welcome back, ${user.name.split(' ')[0]}!`);
      const destination = location.state?.from?.pathname || (user.role === 'member' ? '/books' : '/dashboard');
      navigate(destination, { replace: true });
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to access your library workspace."
      footer={
        <>
          Don't have an account?{' '}
          <Link to="/register" className="font-bold text-brand-600 hover:underline">
            Create one
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-5">
        <FormField label="Email address">
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
            <input
              className="input !pl-10"
              type="email"
              required
              autoComplete="email"
              placeholder="you@example.com"
              value={values.email}
              onChange={(event) => setValues({ ...values, email: event.target.value })}
            />
          </div>
        </FormField>

        <FormField label="Password">
          <div className="relative">
            <LockKeyhole className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
            <input
              className="input !pl-10 !pr-10"
              type={showPassword ? 'text' : 'password'}
              required
              autoComplete="current-password"
              placeholder="Enter your password"
              value={values.password}
              onChange={(event) => setValues({ ...values, password: event.target.value })}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-700"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </FormField>

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-xs font-medium text-ink-600">
            <input type="checkbox" className="h-4 w-4 rounded border-ink-300 text-brand-600 focus:ring-brand-500" />
            Remember me
          </label>
          <Link to="/forgot-password" className="text-xs font-bold text-brand-600 hover:underline">
            Forgot password?
          </Link>
        </div>

        <button type="submit" className="btn-primary w-full !py-3" disabled={submitting}>
          {submitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <div className="mt-8 rounded-xl border border-ink-100 bg-ink-50/60 p-4">
        <p className="text-[11px] font-bold uppercase tracking-wide text-ink-500">Demo accounts (after seeding)</p>
        <div className="mt-2 space-y-1 text-[11px] text-ink-600">
          <p><strong>Admin:</strong> admin@library.com / Admin@12345</p>
          <p><strong>Librarian:</strong> librarian@library.com / Librarian@123</p>
          <p><strong>Member:</strong> liam.carter@student.edu / Member@123</p>
        </div>
      </div>
    </AuthLayout>
  );
};

export default Login;
