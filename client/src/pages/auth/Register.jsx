import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { AuthLayout } from './AuthLayout.jsx';
import { FormField } from '../../components/ui.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

export const Register = () => {
  const [values, setValues] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    studentId: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const submit = async (event) => {
    event.preventDefault();
    if (values.password !== values.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setSubmitting(true);
    try {
      const user = await register({
        name: values.name,
        email: values.email,
        password: values.password,
        phone: values.phone,
        studentId: values.studentId,
      });
      toast.success(`Welcome to the library, ${user.name.split(' ')[0]}!`);
      navigate(user.role === 'member' ? '/books' : '/dashboard', { replace: true });
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const field = (key) => (event) => setValues({ ...values, [key]: event.target.value });

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Join your library and start borrowing in minutes."
      footer={
        <>
          Already registered?{' '}
          <Link to="/login" className="font-bold text-brand-600 hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <FormField label="Full name">
          <input className="input" required value={values.name} onChange={field('name')} placeholder="Jane Doe" />
        </FormField>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Email">
            <input className="input" type="email" required value={values.email} onChange={field('email')} placeholder="you@example.com" />
          </FormField>
          <FormField label="Student ID">
            <input className="input" value={values.studentId} onChange={field('studentId')} placeholder="STU-1009" />
          </FormField>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Password">
            <input className="input" type="password" minLength={8} required value={values.password} onChange={field('password')} placeholder="At least 8 characters" />
          </FormField>
          <FormField label="Confirm password">
            <input className="input" type="password" minLength={8} required value={values.confirmPassword} onChange={field('confirmPassword')} placeholder="Repeat password" />
          </FormField>
        </div>
        <FormField label="Phone number">
          <input className="input" value={values.phone} onChange={field('phone')} placeholder="+1 555 010 2000" />
        </FormField>
        <button type="submit" className="btn-primary w-full !py-3" disabled={submitting}>
          {submitting ? 'Creating account…' : 'Create account'}
        </button>
      </form>
    </AuthLayout>
  );
};

export default Register;
