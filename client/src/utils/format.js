import { format, formatDistanceToNow, isValid, parseISO } from 'date-fns';

export const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Number(amount) || 0);

export const formatNumber = (value) => new Intl.NumberFormat('en-US').format(Number(value) || 0);

const toDate = (value) => {
  if (!value) return null;
  const date = typeof value === 'string' ? parseISO(value) : new Date(value);
  return isValid(date) ? date : null;
};

export const formatDate = (value, pattern = 'MMM d, yyyy') => {
  const date = toDate(value);
  return date ? format(date, pattern) : '—';
};

export const timeAgo = (value) => {
  const date = toDate(value);
  return date ? formatDistanceToNow(date, { addSuffix: true }) : '—';
};

export const initials = (name = '') =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');

export const titleCase = (value = '') =>
  value
    .toString()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());

export const statusTone = (status) => {
  const map = {
    issued: 'bg-indigo-50 text-indigo-700 ring-indigo-600/10',
    returned: 'bg-emerald-50 text-emerald-700 ring-emerald-600/10',
    overdue: 'bg-rose-50 text-rose-700 ring-rose-600/10',
    available: 'bg-emerald-50 text-emerald-700 ring-emerald-600/10',
    unavailable: 'bg-amber-50 text-amber-700 ring-amber-600/10',
    pending: 'bg-amber-50 text-amber-700 ring-amber-600/10',
    notified: 'bg-sky-50 text-sky-700 ring-sky-600/10',
    fulfilled: 'bg-emerald-50 text-emerald-700 ring-emerald-600/10',
    cancelled: 'bg-ink-100 text-ink-600 ring-ink-500/10',
    expired: 'bg-ink-100 text-ink-600 ring-ink-500/10',
    unpaid: 'bg-rose-50 text-rose-700 ring-rose-600/10',
    paid: 'bg-emerald-50 text-emerald-700 ring-emerald-600/10',
    waived: 'bg-ink-100 text-ink-600 ring-ink-500/10',
    active: 'bg-emerald-50 text-emerald-700 ring-emerald-600/10',
    suspended: 'bg-rose-50 text-rose-700 ring-rose-600/10',
    inactive: 'bg-ink-100 text-ink-600 ring-ink-500/10',
    admin: 'bg-violet-50 text-violet-700 ring-violet-600/10',
    librarian: 'bg-sky-50 text-sky-700 ring-sky-600/10',
    member: 'bg-ink-100 text-ink-600 ring-ink-500/10',
    lost: 'bg-rose-50 text-rose-700 ring-rose-600/10',
  };
  return map[String(status || '').toLowerCase()] || 'bg-ink-100 text-ink-600 ring-ink-500/10';
};
