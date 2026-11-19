import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookMarked, CalendarClock } from 'lucide-react';
import api from '../../services/api.js';
import { useFetch } from '../../hooks/useFetch.js';
import { Badge, DataTable, EmptyState, ErrorState, Loader, PageHeader, StatCard } from '../../components/ui.jsx';
import { getImageUrl } from '../../services/api.js';
import { formatCurrency, formatDate } from '../../utils/format.js';

export const MyBorrows = () => {
  const [tab, setTab] = useState('issued');
  const navigate = useNavigate();

  const fetchBorrows = useCallback(
    () => api.get('/borrow/me', { params: { status: tab === 'overdue' ? 'issued' : tab, limit: 200 } }),
    [tab]
  );
  const { data, loading, error, refresh } = useFetch(fetchBorrows);

  const rows = tab === 'overdue' ? (data?.data || []).filter((borrow) => borrow.overdue) : data?.data || [];

  if (loading) return <Loader label="Loading your loans…" />;
  if (error) return <ErrorState message={error} onRetry={refresh} />;

  const columns = [
    {
      key: 'book',
      label: 'Book',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg bg-brand-50">
            {row.book?.coverImage ? (
              <img src={getImageUrl(row.book.coverImage)} alt="" className="h-full w-full object-cover" />
            ) : (
              <BookMarked className="h-5 w-5 text-brand-500" />
            )}
          </div>
          <div>
            <p className="font-bold text-ink-900">{row.book?.title || 'Deleted book'}</p>
            <p className="text-xs text-ink-500">{row.book?.author || ''}</p>
          </div>
        </div>
      ),
    },
    { key: 'issueDate', label: 'Issued', render: (row) => formatDate(row.issueDate) },
    { key: 'dueDate', label: 'Due date', render: (row) => formatDate(row.dueDate) },
    { key: 'returnDate', label: 'Returned', render: (row) => (row.returnDate ? formatDate(row.returnDate) : '—') },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <Badge status={row.status === 'issued' && row.overdue ? 'overdue' : row.status} />,
    },
    { key: 'fine', label: 'Fine', render: (row) => formatCurrency(row.fineAmount) },
  ];

  return (
    <>
      <PageHeader breadcrumb="My Library" title="My Borrowed Books" subtitle="Track your current loans and borrowing history." />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={BookMarked} label="Currently borrowed" value={data?.meta?.total || 0} tone="brand" />
        <StatCard icon={CalendarClock} label="Overdue" value={(data?.data || []).filter((b) => b.overdue).length} tone="rose" />
      </div>

      <div className="card overflow-hidden">
        <div className="flex gap-1 border-b border-ink-100 px-4 pt-3">
          {[
            { key: 'issued', label: 'Currently borrowed' },
            { key: 'returned', label: 'History' },
            { key: 'overdue', label: 'Overdue' },
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => setTab(item.key)}
              className={`border-b-2 px-3 py-2.5 text-xs font-bold transition ${
                tab === item.key ? 'border-brand-600 text-brand-700' : 'border-transparent text-ink-500 hover:text-ink-800'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
        {rows.length ? (
          <DataTable columns={columns} rows={rows} />
        ) : (
          <EmptyState
            icon={BookMarked}
            title={tab === 'issued' ? 'No books borrowed yet' : `No ${tab} loans`}
            description="Browse the catalog to find your next read."
            action={<button className="btn-primary" onClick={() => navigate('/books')}>Browse books</button>}
          />
        )}
      </div>
    </>
  );
};

export default MyBorrows;
