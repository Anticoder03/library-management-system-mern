import { useCallback, useMemo, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../../services/api.js';
import { useFetch } from '../../hooks/useFetch.js';
import { useDebounce } from '../../hooks/useDebounce.js';
import {
  Avatar,
  Badge,
  DataTable,
  ErrorState,
  FormField,
  Modal,
  PageHeader,
  SearchInput,
} from '../../components/ui.jsx';
import { formatCurrency, formatDate, titleCase } from '../../utils/format.js';

export const Returns = () => {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('issued');
  const [target, setTarget] = useState(null);
  const [condition, setCondition] = useState('good');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const debounced = useDebounce(search);

  const fetchBorrows = useCallback(
    () => api.get('/borrow', { params: { limit: 100, status, search: debounced || undefined } }),
    [status, debounced]
  );
  const { data, loading, error, refresh } = useFetch(fetchBorrows);

  const rows = useMemo(() => {
    const list = data?.data || [];
    const query = search.trim().toLowerCase();
    if (!query) return list;
    return list.filter(
      (borrow) =>
        borrow.book?.title?.toLowerCase().includes(query) ||
        borrow.book?.author?.toLowerCase().includes(query) ||
        borrow.member?.name?.toLowerCase().includes(query)
    );
  }, [data, search]);

  const daysLate = (borrow) =>
    borrow.status === 'issued' && new Date(borrow.dueDate) < new Date()
      ? Math.max(1, Math.ceil((new Date() - new Date(borrow.dueDate)) / 86_400_000))
      : 0;

  const processReturn = async () => {
    setSubmitting(true);
    try {
      const response = await api.post('/borrow/return', {
        borrowId: target._id,
        condition,
        notes,
      });
      toast.success(response.message);
      setTarget(null);
      setNotes('');
      refresh(true);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
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
          <Avatar name={row.member?.name} src={row.member?.avatar} size="sm" />
          <div>
            <p className="text-xs font-bold text-ink-800">{row.member?.name || '—'}</p>
            <p className="text-[11px] text-ink-500">{row.member?.studentId || ''}</p>
          </div>
        </div>
      ),
    },
    { key: 'issueDate', label: 'Issued', render: (row) => formatDate(row.issueDate) },
    { key: 'dueDate', label: 'Due date', render: (row) => formatDate(row.dueDate) },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <Badge status={daysLate(row) > 0 ? 'overdue' : row.status} />,
    },
    {
      key: 'returnDate',
      label: 'Returned',
      render: (row) => (row.returnDate ? formatDate(row.returnDate) : '—'),
    },
  ];

  return (
    <>
      <PageHeader
        breadcrumb="Circulation"
        title="Book Returns"
        subtitle="Process returns and automatically calculate overdue fines."
      />

      <div className="card mb-5 flex flex-col gap-3 p-4 sm:flex-row">
        <SearchInput value={search} onChange={setSearch} placeholder="Search by book or member…" className="flex-1" />
        <select className="input !w-auto" value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="issued">Active loans</option>
          <option value="overdue">Overdue only</option>
          <option value="returned">Returned</option>
          <option value="all">All loans</option>
        </select>
      </div>

      <div className="card overflow-hidden">
        {error ? (
          <ErrorState message={error} onRetry={refresh} />
        ) : (
          <DataTable
            columns={[
              ...columns,
              {
                key: 'action',
                label: 'Action',
                render: (row) =>
                  row.status === 'issued' ? (
                    <button className="btn-secondary !px-3 !py-1.5 !text-xs" onClick={() => setTarget(row)}>
                      <RotateCcw className="h-3.5 w-3.5" /> Return
                    </button>
                  ) : (
                    <span className="text-xs text-ink-400">—</span>
                  ),
              },
            ]}
            rows={rows}
            loading={loading}
            emptyText="No loans match your filters"
          />
        )}
      </div>

      <Modal
        open={Boolean(target)}
        onClose={() => setTarget(null)}
        title="Process book return"
        description={target?.book?.title}
        footer={
          <>
            <button className="btn-secondary" onClick={() => setTarget(null)}>Cancel</button>
            <button className="btn-primary" disabled={submitting} onClick={processReturn}>
              <RotateCcw className="h-4 w-4" /> {submitting ? 'Processing…' : 'Confirm return'}
            </button>
          </>
        }
      >
        {target && (
          <div className="space-y-4">
            <div className="rounded-xl bg-ink-50 p-4 text-xs">
              <p><strong>Member:</strong> {target.member?.name}</p>
              <p className="mt-1"><strong>Due date:</strong> {formatDate(target.dueDate)}</p>
              {daysLate(target) > 0 && (
                <p className="mt-2 rounded-lg bg-rose-50 p-2 font-bold text-rose-700">
                  {daysLate(target)} day(s) late · Estimated fine: {formatCurrency(daysLate(target) * 5)}
                </p>
              )}
            </div>
            <FormField label="Condition on return">
              <select className="input" value={condition} onChange={(event) => setCondition(event.target.value)}>
                <option value="good">Good</option>
                <option value="fair">Fair</option>
                <option value="damaged">Damaged</option>
              </select>
            </FormField>
            <FormField label="Notes (optional)">
              <textarea className="input min-h-[80px]" value={notes} onChange={(event) => setNotes(event.target.value)} />
            </FormField>
            <p className="text-[11px] text-ink-400">Condition: {titleCase(condition)}</p>
          </div>
        )}
      </Modal>
    </>
  );
};

export default Returns;
