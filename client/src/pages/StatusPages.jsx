import { Link } from 'react-router-dom';
import { ShieldAlert, Compass } from 'lucide-react';
import { AuthLayout } from './auth/AuthLayout.jsx';

export const Unauthorized = () => (
  <AuthLayout
    title="Access denied"
    subtitle="You don't have permission to view this page."
    footer={<Link to="/" className="font-bold text-brand-600 hover:underline">Go back home</Link>}
  >
    <div className="rounded-2xl border border-amber-100 bg-amber-50 p-6 text-center">
      <ShieldAlert className="mx-auto h-10 w-10 text-amber-500" />
      <p className="mt-3 text-sm text-amber-800">
        Your account role doesn't allow access to this section. Contact an administrator if you believe this is a mistake.
      </p>
    </div>
  </AuthLayout>
);

export const NotFound = () => (
  <AuthLayout
    title="Page not found"
    subtitle="The page you're looking for doesn't exist or has moved."
    footer={<Link to="/" className="font-bold text-brand-600 hover:underline">Return to homepage</Link>}
  >
    <div className="rounded-2xl border border-ink-100 bg-ink-50 p-6 text-center">
      <Compass className="mx-auto h-10 w-10 text-ink-400" />
      <p className="mt-3 text-sm text-ink-600">Try checking the URL or navigating from the dashboard.</p>
    </div>
  </AuthLayout>
);
