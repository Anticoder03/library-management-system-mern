import { useCallback, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Edit3, Mail, MapPin, Phone, Trash2, UserRound } from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../../services/api.js';
import { useFetch } from '../../hooks/useFetch.js';
import { useAuth } from '../../context/AuthContext.jsx';
import {
  Avatar,
  Badge,
  ConfirmDialog,
  DataTable,
  EmptyState,
  ErrorState,
  Loader,
  PageHeader,
  StatCard,
} from '../../components/ui.jsx';
import { formatCurrency, formatDate, titleCase } from '../../utils/format.js';

export const MemberDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [tab, setTab] = useState('issued');
  const [confirm, setConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchMember = useCallback(() => api.get(`/members/${id}`).then((d) => d.data), [id]);
  const { data, loading, error, refresh } = useFetch(fetchMember);

  const remove = async () => {
    setDeleting(true);
    try {
      await api.delete(`/members/${id}`);
      toast.success('Member deleted');
      navigate('/members');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDeleting(false);
      setConfirm(false);
    }
  };

  if (loading) return <Loader label="Loading member profile…" />;
  if (error) return <ErrorState message={error} onRetry={refresh} />;

  const { member, currentlyIssued, history, fines, reservations, outstandingFine } = data;
  const tabs = [
    { key: 'issued', label: 'Currently issued', rows: currentlyIssued },
    { key: 'history', label: 'Borrowing history', rows: history },
    { key: 'fines', label: 'Fines', rows: fines },
    { key: 'reservations', label: 'Reservations', rows: reservations },
  ];
  const currentRows = tabs.find((item) => item.key === tab)?.rows || [];

  const bookColumn = {
    key: 'book',
    label: 'Book',
    render: (row) => (
      <div>
        <p className="font-bold text-ink-900">{row.book?.title || 'Deleted book'}</p>
        <p className="text-xs text-ink-500">{row.book?.author || ''}</p>
      </div>
    ),
  };

  const columns =
    tab === 'issued' || tab === 'history'
      ? [
          bookColumn,
          {
            key: 'issueDate',
            label: 'Issued',
            render: (row) => formatDate(row.issueDate),
          },
          {
            key: 'dueDate',
            label: 'Due',
            render: (row) => formatDate(row.dueDate),
          },
          {
            key: 'status',
            label: 'Status',
            render: (row) => (
              <Badge status={row.status === 'issued' && new Date(row.dueDate) < new Date() ? 'overdue' : row.status} />
            ),
          },
          {
            key: 'fineAmount',
            label: 'Fine',
            render: (row) => formatCurrency(row.fineAmount),
          },
        ]
      : tab === 'fines'
        ? [
            { key: 'book', label: 'Book', render: (row) => row.book?.title || '—' },
            { key: 'amount', label: 'Amount', render: (row) => formatCurrency(row.amount) },
            { key: 'reason', label: 'Reason', render: (row) => titleCase(row.reason) },
            { key: 'status', label: 'Status', render: (row) => <Badge status={row.status} /> },
            { key: 'createdAt', label: 'Date', render: (row) => formatDate(row.createdAt) },
          ]
        : [
            bookColumn,
            { key: 'status', label: 'Status', render: (row) => <Badge status={row.status} /> },
            { key: 'reservedAt', label: 'Reserved', render: (row) => formatDate(row.reservedAt) },
          ];

  return (
    <>
      <button onClick={() => navigate(-1)} className="btn-ghost mb-5 -ml-2">
        <ArrowLeft className="h-4 w-4" /> Back to members
      </button>

      <div className="card mb-6 p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Avatar name={member.name} src={member.avatar} size="lg" />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-extrabold text-ink-900">{member.name}</h1>
                <Badge status={member.membershipStatus} />
                <Badge status={member.role} />
              </div>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-500">
                <span className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" /> {member.email}</span>
                <span className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" /> {member.phone || '—'}</span>
                <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> {member.address || '—'}</span>
                <span className="flex items-center gap-1.5"><UserRound className="h-3.5 w-3.5" /> {member.studentId || 'No ID'}</span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="btn-secondary" onClick={() => navigate(`/members/${id}/edit`)}>
              <Edit3 className="h-4 w-4" /> Edit
            </button>
            {isAdmin && (
              <button className="btn-danger !px-3" onClick={() => setConfirm(true)} aria-label="Delete member">
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={UserRound} label="Member since" value={formatDate(member.membershipDate, 'MMM yyyy')} tone="brand" />
        <StatCard icon={ArrowLeft} label="Active loans" value={currentlyIssued.length} tone="sky" />
        <StatCard icon={ArrowLeft} label="Total borrows" value={history.length + currentlyIssued.length} tone="violet" />
        <StatCard icon={Mail} label="Outstanding fine" value={formatCurrency(outstandingFine)} tone="rose" />
      </div>

      <div className="card mt-6 overflow-hidden">
        <div className="flex gap-1 overflow-x-auto border-b border-ink-100 px-4 pt-3">
          {tabs.map((item) => (
            <button
              key={item.key}
              onClick={() => setTab(item.key)}
              className={`whitespace-nowrap border-b-2 px-3 py-2.5 text-xs font-bold transition ${
                tab === item.key ? 'border-brand-600 text-brand-700' : 'border-transparent text-ink-500 hover:text-ink-800'
              }`}
            >
              {item.label} <span className="ml-1 text-ink-400">({item.rows.length})</span>
            </button>
          ))}
        </div>
        {currentRows.length ? (
          <DataTable columns={columns} rows={currentRows} compact />
        ) : (
          <EmptyState title={`No ${tabs.find((t) => t.key === tab)?.label.toLowerCase()} records`} />
        )}
      </div>

      <ConfirmDialog
        open={confirm}
        onClose={() => setConfirm(false)}
        onConfirm={remove}
        loading={deleting}
        title="Delete this member?"
        message="This action is permanent. Members with active loans or unpaid fines cannot be deleted."
      />
    </>
  );
};

export default MemberDetail;
