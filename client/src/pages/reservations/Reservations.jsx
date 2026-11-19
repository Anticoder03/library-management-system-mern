import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpenCheck, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../../services/api.js';
import { useFetch } from '../../hooks/useFetch.js';
import { useAuth } from '../../context/AuthContext.jsx';
import {
  Avatar,
  Badge,
  DataTable,
  ErrorState,
  PageHeader,
  Pagination,
  SearchInput,
} from '../../components/ui.jsx';
import { formatDate, timeAgo } from '../../utils/format.js';

export const Reservations = () => {
  const { isStaff } = useAuth();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [busyId, setBusyId] = useState(null);

  const fetchReservations = useCallback(
    () => api.get('/reservations', { params: { page, limit: 15, status, search: search || undefined } }),
    [page, status, search]
  );
  const { data, loading, error, refresh } = useFetch(fetchReservations);

  const update = async (id, action) => {
    setBusyId(id);
    try {
      if (action === 'cancel') {
        await api.delete(`/reservations/${id}`);
        toast.success('Reservation cancelled');
      } else {
        await api.put(`/reservations/${id}`, { status: action });
        toast.success(`Reservation marked as ${action}`);
      }
      refresh(true);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const issueReserved = (row) => navigate('/issue', { state: { bookId: row.book?._id || row.book, memberId: row.member?._id || row.member } });

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
    ...(isStaff
      ? [
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
        ]
      : []),
    {
      key: 'queue',
      label: 'Queue position',
      render: (row) => <span className="font-bold text-brand-600">#{row.queuePosition || 1}</span>,
    },
    { key: 'date', label: 'Reserved', render: (row) => `${formatDate(row.reservedAt)} · ${timeAgo(row.reservedAt)}` },
    {
      key: 'expiresAt',
      label: 'Expires',
      render: (row) => (row.expiresAt ? formatDate(row.expiresAt) : '—'),
    },
    { key: 'status', label: 'Status', render: (row) => <Badge status={row.status} /> },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => {
        const disabled = busyId === row._id;
        const active = ['pending', 'notified'].includes(row.status);
        return (
          <div className="flex items-center gap-1.5">
            {isStaff && active && (
              <button
                disabled={disabled}
                onClick={() => issueReserved(row)}
                className="btn-secondary !px-2.5 !py-1.5 !text-[11px]"
                title="Issue this reserved book"
              >
                <BookOpenCheck className="h-3.5 w-3.5" /> Issue
              </button>
            )}
            {isStaff && row.status === 'pending' && (
              <button
                disabled={disabled}
                onClick={() => update(row._id, 'notified')}
                className="btn-secondary !px-2.5 !py-1.5 !text-[11px]"
              >
                <CheckCircle2 className="h-3.5 w-3.5" /> Notify
              </button>
            )}
            {active && (
              <button
                disabled={disabled}
                onClick={() => update(row._id, 'cancel')}
                className="btn-ghost !px-2.5 !py-1.5 !text-[11px] !text-rose-600"
              >
                <XCircle className="h-3.5 w-3.5" /> Cancel
              </button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <>
      <PageHeader
        breadcrumb="Library"
        title="Reservations"
        subtitle={isStaff ? 'Manage the reservation queue and notify members.' : 'Track your reserved books and queue positions.'}
      />

      <div className="card mb-5 flex flex-col gap-3 p-4 sm:flex-row">
        <SearchInput value={search} onChange={setSearch} placeholder="Search reservations…" className="flex-1" />
        <select className="input !w-auto" value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="all">All statuses</option>
          <option value="pending">Pending</option>
          <option value="notified">Notified</option>
          <option value="fulfilled">Fulfilled</option>
          <option value="cancelled">Cancelled</option>
          <option value="expired">Expired</option>
        </select>
      </div>

      <div className="card overflow-hidden">
        {error ? (
          <ErrorState message={error} onRetry={refresh} />
        ) : (
          <>
            <DataTable columns={columns} rows={data?.data} loading={loading} emptyText="No reservations found" />
            <Pagination meta={data?.meta} onPageChange={setPage} />
          </>
        )}
      </div>
    </>
  );
};

export default Reservations;
