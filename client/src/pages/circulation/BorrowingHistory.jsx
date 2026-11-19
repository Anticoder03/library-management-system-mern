import { useCallback, useState } from 'react';
import { Download } from 'lucide-react';
import { toast } from 'react-toastify';
import api, { downloadFile } from '../../services/api.js';
import { useFetch } from '../../hooks/useFetch.js';
import {
  Avatar,
  Badge,
  DataTable,
  ErrorState,
  PageHeader,
  Pagination,
  SearchInput,
} from '../../components/ui.jsx';
import { formatCurrency, formatDate } from '../../utils/format.js';

export const BorrowingHistory = () => {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('all');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const fetchBorrows = useCallback(
    () => api.get('/borrow', { params: { page, limit: 15, status, from: from || undefined, to: to || undefined } }),
    [page, status, from, to]
  );
  const { data, loading, error, refresh } = useFetch(fetchBorrows);

  const exportCsv = async () => {
    try {
      await downloadFile('/reports/borrowing?format=csv', 'borrowing-report.csv');
      toast.success('Report downloaded');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const columns = [
    {
      key: 'book',
      label: 'Book',
      render: (row) => (
        <div>
          <p className="font-bold text-ink-900">{row.book?.title || 'Deleted book'}</p>
          <p className="text-xs text-ink-500">{row.book?.author || ''}</p>
        </div>
      ),
    },
    {
      key: 'member',
      label: 'Member',
      render: (row) => (
        <div className="flex items-center gap-2">
          <Avatar name={row.member?.name} size="sm" />
          <div>
            <p className="text-xs font-bold text-ink-800">{row.member?.name || '—'}</p>
            <p className="text-[11px] text-ink-500">{row.member?.email || ''}</p>
          </div>
        </div>
      ),
    },
    { key: 'issueDate', label: 'Issued', render: (row) => formatDate(row.issueDate) },
    { key: 'dueDate', label: 'Due', render: (row) => formatDate(row.dueDate) },
    { key: 'returnDate', label: 'Returned', render: (row) => (row.returnDate ? formatDate(row.returnDate) : '—') },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <Badge status={row.overdue && row.status === 'issued' ? 'overdue' : row.status} />,
    },
    { key: 'fineAmount', label: 'Fine', render: (row) => formatCurrency(row.fineAmount) },
  ];

  return (
    <>
      <PageHeader
        breadcrumb="Circulation"
        title="Borrowing History"
        subtitle="Complete record of all book loans and returns."
        actions={
          <button className="btn-secondary" onClick={exportCsv}>
            <Download className="h-4 w-4" /> Export CSV
          </button>
        }
      />

      <div className="card mb-5 flex flex-wrap items-end gap-3 p-4">
        <div className="min-w-[220px] flex-1">
          <label className="label">Status</label>
          <select className="input" value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="all">All statuses</option>
            <option value="issued">Issued</option>
            <option value="overdue">Overdue</option>
            <option value="returned">Returned</option>
            <option value="lost">Lost</option>
          </select>
        </div>
        <div>
          <label className="label">From</label>
          <input className="input" type="date" value={from} onChange={(event) => setFrom(event.target.value)} />
        </div>
        <div>
          <label className="label">To</label>
          <input className="input" type="date" value={to} onChange={(event) => setTo(event.target.value)} />
        </div>
      </div>

      <div className="card overflow-hidden">
        {error ? <ErrorState message={error} onRetry={refresh} /> : (
          <>
            <DataTable columns={columns} rows={data?.data} loading={loading} emptyText="No borrowing records found" />
            <Pagination meta={data?.meta} onPageChange={setPage} />
          </>
        )}
      </div>
    </>
  );
};

export default BorrowingHistory;
