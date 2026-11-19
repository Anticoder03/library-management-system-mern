import { AlertCircle, ChevronLeft, ChevronRight, Inbox, Loader2, Search, X } from 'lucide-react';
import { useEffect } from 'react';
import { formatNumber, initials, statusTone, titleCase } from '../utils/format.js';

export const Loader = ({ compact = false, label = 'Loading…' }) => (
  <div className={`flex items-center justify-center gap-2 ${compact ? 'py-8' : 'min-h-[50vh]'}`}>
    <Loader2 className="h-5 w-5 animate-spin text-brand-500" />
    <span className="text-sm font-medium text-ink-500">{label}</span>
  </div>
);

export const PageHeader = ({ title, subtitle, actions, breadcrumb }) => (
  <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
    <div>
      {breadcrumb && <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-brand-500">{breadcrumb}</p>}
      <h1 className="text-2xl font-extrabold tracking-tight text-ink-900 sm:text-[28px]">{title}</h1>
      {subtitle && <p className="mt-1 text-sm text-ink-500">{subtitle}</p>}
    </div>
    {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
  </div>
);

export const StatCard = ({ icon: Icon, label, value, hint, tone = 'brand', onClick }) => {
  const tones = {
    brand: 'bg-brand-50 text-brand-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    rose: 'bg-rose-50 text-rose-600',
    sky: 'bg-sky-50 text-sky-600',
    violet: 'bg-violet-50 text-violet-600',
  };
  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(event) => onClick && event.key === 'Enter' && onClick()}
      className={`card group p-5 transition-all duration-200 animate-fade-up ${
        onClick ? 'cursor-pointer hover:-translate-y-1 hover:border-brand-200 hover:shadow-float' : ''
      }`}
    >
      <div className="flex items-start justify-between">
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${tones[tone] || tones.brand}`}>
          {Icon && <Icon className="h-5 w-5" strokeWidth={2} />}
        </div>
        {hint && <span className="text-[11px] font-semibold text-ink-400">{hint}</span>}
      </div>
      <p className="mt-4 text-3xl font-extrabold tracking-tight text-ink-900">
        {typeof value === 'number' ? formatNumber(value) : value}
      </p>
      <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-ink-500">{label}</p>
    </div>
  );
};

export const Badge = ({ children, status, className = '' }) => (
  <span
    className={`chip ring-1 ring-inset ${status ? statusTone(status) : 'bg-ink-100 text-ink-700 ring-ink-500/10'} ${className}`}
  >
    {status ? titleCase(status) : children}
  </span>
);

export const Avatar = ({ name = '', src = '', size = 'md' }) => {
  const sizes = { sm: 'h-8 w-8 text-[10px]', md: 'h-10 w-10 text-xs', lg: 'h-14 w-14 text-sm' };
  return src ? (
    <img src={src} alt={name} className={`${sizes[size]} rounded-full object-cover ring-2 ring-white`} />
  ) : (
    <span
      className={`${sizes[size]} inline-flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-violet-600 font-bold text-white shadow-sm`}
    >
      {initials(name) || '?'}
    </span>
  );
};

export const EmptyState = ({ icon: Icon = Inbox, title = 'Nothing here yet', description, action }) => (
  <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-ink-50 text-ink-400">
      <Icon className="h-6 w-6" />
    </div>
    <p className="font-bold text-ink-800">{title}</p>
    {description && <p className="mt-1 max-w-sm text-sm text-ink-500">{description}</p>}
    {action && <div className="mt-5">{action}</div>}
  </div>
);

export const ErrorState = ({ message, onRetry }) => (
  <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-500">
      <AlertCircle className="h-6 w-6" />
    </div>
    <p className="font-bold text-ink-800">Could not load data</p>
    <p className="mt-1 max-w-sm text-sm text-ink-500">{message}</p>
    {onRetry && (
      <button className="btn-secondary mt-5" onClick={onRetry}>
        Try again
      </button>
    )}
  </div>
);

export const DataTable = ({
  columns,
  rows,
  loading,
  emptyText = 'No records found',
  keyField = '_id',
  onRowClick,
  compact = false,
}) => {
  if (loading) return <Loader compact />;
  if (!rows?.length) return <EmptyState title={emptyText} />;

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full min-w-[640px] border-collapse text-left">
        <thead>
          <tr className="border-b border-ink-100">
            {columns.map((column) => (
              <th key={column.key} className={`table-head ${column.className || ''}`}>
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-ink-50">
          {rows.map((row, index) => (
            <tr
              key={row[keyField] || index}
              onClick={() => onRowClick?.(row)}
              className={`transition-colors ${onRowClick ? 'cursor-pointer hover:bg-brand-50/40' : 'hover:bg-ink-50/50'}`}
            >
              {columns.map((column) => (
                <td key={column.key} className={`table-cell ${compact ? 'py-2.5' : ''} ${column.className || ''}`}>
                  {column.render ? column.render(row, index) : row[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export const Pagination = ({ meta, onPageChange }) => {
  if (!meta || meta.totalPages <= 1) return null;
  const { page, totalPages, total } = meta;
  return (
    <div className="flex flex-col items-center justify-between gap-3 border-t border-ink-100 px-4 py-3 sm:flex-row">
      <p className="text-xs text-ink-500">
        Page <strong className="text-ink-800">{page}</strong> of {totalPages} · {formatNumber(total)} records
      </p>
      <div className="flex items-center gap-1.5">
        <button
          className="btn-secondary !px-2.5 !py-1.5"
          disabled={!meta.hasPrev}
          onClick={() => onPageChange(page - 1)}
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        {[...Array(Math.min(totalPages, 5))].map((_, index) => {
          const start = Math.max(1, Math.min(page - 2, totalPages - 4));
          const number = start + index;
          if (number > totalPages) return null;
          return (
            <button
              key={number}
              onClick={() => onPageChange(number)}
              className={`h-8 w-8 rounded-lg text-xs font-bold transition ${
                number === page ? 'bg-brand-600 text-white' : 'text-ink-600 hover:bg-ink-100'
              }`}
            >
              {number}
            </button>
          );
        })}
        <button
          className="btn-secondary !px-2.5 !py-1.5"
          disabled={!meta.hasNext}
          onClick={() => onPageChange(page + 1)}
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export const SearchInput = ({ value, onChange, placeholder = 'Search…', className = '' }) => (
  <div className={`relative ${className}`}>
    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
    <input
      className="input !pl-9"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      aria-label={placeholder}
    />
  </div>
);

export const FormField = ({ label, error, children, hint, className = '' }) => (
  <div className={className}>
    {label && <label className="label">{label}</label>}
    {children}
    {hint && !error && <p className="mt-1 text-[11px] text-ink-400">{hint}</p>}
    {error && <p className="mt-1 text-[11px] font-medium text-rose-600">{error}</p>}
  </div>
);

export const Modal = ({ open, onClose, title, description, children, footer, size = 'md' }) => {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => event.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;
  const sizes = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-ink-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative z-10 w-full ${sizes[size]} max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-float animate-fade-up`}>
        <div className="flex items-start justify-between border-b border-ink-100 px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-ink-900">{title}</h2>
            {description && <p className="mt-0.5 text-xs text-ink-500">{description}</p>}
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-ink-400 hover:bg-ink-100 hover:text-ink-700" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-ink-100 px-6 py-4">{footer}</div>}
      </div>
    </div>
  );
};

export const ConfirmDialog = ({ open, onClose, onConfirm, title, message, confirmLabel = 'Delete', loading }) => (
  <Modal
    open={open}
    onClose={onClose}
    title={title}
    size="sm"
    footer={
      <>
        <button className="btn-secondary" onClick={onClose}>
          Cancel
        </button>
        <button className="btn-danger" disabled={loading} onClick={onConfirm}>
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {confirmLabel}
        </button>
      </>
    }
  >
    <p className="text-sm leading-relaxed text-ink-600">{message}</p>
  </Modal>
);

export const Toggle = ({ checked, onChange, options, size = 'md' }) => {
  const values = options || ['all', 'available', 'unavailable'];
  return (
    <div className="inline-flex rounded-xl bg-ink-100 p-1">
      {values.map((value) => (
        <button
          key={value}
          onClick={() => onChange(value)}
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition ${
            checked === value ? 'bg-white text-brand-700 shadow-sm' : 'text-ink-500 hover:text-ink-800'
          } ${size}`}
        >
          {value.replace('_', ' ')}
        </button>
      ))}
    </div>
  );
};
