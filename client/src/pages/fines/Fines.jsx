import { useCallback, useState } from 'react';
import { CheckCircle2, Plus } from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../../services/api.js';
import { useFetch } from '../../hooks/useFetch.js';
import { useAuth } from '../../context/AuthContext.jsx';
import {
  Avatar,
  Badge,
  DataTable,
  ErrorState,
  FormField,
  Modal,
  PageHeader,
  Pagination,
  StatCard,
} from '../../components/ui.jsx';
import { formatCurrency, formatDate, titleCase } from '../../utils/format.js';

export const Fines = () => {
  const { isStaff } = useAuth();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('all');
  const [paying, setPaying] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [members, setMembers] = useState([]);
  const [newFine, setNewFine] = useState({ member: '', amount: '', reason: 'other', description: '' });

  const fetchFines = useCallback(
    () => api.get('/fines', { params: { page, limit: 15, status } }),
    [page, status]
  );
  const { data, loading, error, refresh } = useFetch(fetchFines);

  const openCreate = async () => {
    try {
      const data = await api.get('/members?limit=100');
      setMembers(data.data);
      setShowCreate(true);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const pay = async () => {
    setSubmitting(true);
    try {
      const response = await api.put(`/fines/${paying._id}/pay`, { paymentMethod: 'cash' });
      toast.success(response.message);
      setPaying(null);
      refresh(true);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const createFine = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/fines', { ...newFine, amount: Number(newFine.amount) });
      toast.success('Fine created');
      setShowCreate(false);
      setNewFine({ member: '', amount: '', reason: 'other', description: '' });
      refresh(true);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
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
    { key: 'book', label: 'Book', render: (row) => row.book?.title || '—' },
    { key: 'amount', label: 'Amount', render: (row) => <strong className="text-ink-900">{formatCurrency(row.amount)}</strong> },
    { key: 'reason', label: 'Reason', render: (row) => titleCase(row.reason) },
    { key: 'description', label: 'Description', render: (row) => row.description || '—' },
    { key: 'createdAt', label: 'Date', render: (row) => formatDate(row.createdAt) },
    { key: 'status', label: 'Status', render: (row) => <Badge status={row.status} /> },
    {
      key: 'action',
      label: 'Action',
      render: (row) =>
        isStaff && row.status === 'unpaid' ? (
          <button className="btn-secondary !px-2.5 !py-1.5 !text-[11px]" onClick={() => setPaying(row)}>
            <CheckCircle2 className="h-3.5 w-3.5" /> Record payment
          </button>
        ) : (
          <span className="text-xs text-ink-400">—</span>
        ),
    },
  ];

  return (
    <>
      <PageHeader
        breadcrumb="Circulation"
        title="Fines & Payments"
        subtitle="Track overdue fines and payment history."
        actions={
          isStaff ? (
            <button className="btn-primary" onClick={openCreate}>
              <Plus className="h-4 w-4" /> Add Fine
            </button>
          ) : null
        }
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard icon={CheckCircle2} label="Collected" value={formatCurrency(data?.summary?.paid?.amount)} tone="emerald" />
        <StatCard icon={CheckCircle2} label="Outstanding" value={formatCurrency(data?.summary?.unpaid?.amount)} tone="rose" />
        <StatCard icon={CheckCircle2} label="Unpaid fines" value={data?.summary?.unpaid?.count} tone="amber" />
      </div>

      <div className="card mb-5 flex items-center gap-3 p-4">
        <select className="input !w-auto" value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="all">All fines</option>
          <option value="unpaid">Unpaid</option>
          <option value="paid">Paid</option>
          <option value="waived">Waived</option>
        </select>
      </div>

      <div className="card overflow-hidden">
        {error ? (
          <ErrorState message={error} onRetry={refresh} />
        ) : (
          <>
            <DataTable columns={columns} rows={data?.data} loading={loading} emptyText="No fines found" />
            <Pagination meta={data?.meta} onPageChange={setPage} />
          </>
        )}
      </div>

      <Modal
        open={Boolean(paying)}
        onClose={() => setPaying(null)}
        title="Record fine payment"
        size="sm"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setPaying(null)}>Cancel</button>
            <button className="btn-primary" disabled={submitting} onClick={pay}>Confirm payment</button>
          </>
        }
      >
        <p className="text-sm text-ink-600">
          Mark <strong>{formatCurrency(paying?.amount)}</strong> for {paying?.member?.name} as paid?
        </p>
      </Modal>

      <Modal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title="Add a fine"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
            <button type="submit" form="fine-form" className="btn-primary" disabled={submitting}>Create fine</button>
          </>
        }
      >
        <form id="fine-form" onSubmit={createFine} className="space-y-4">
          <FormField label="Member">
            <select className="input" required value={newFine.member} onChange={(event) => setNewFine({ ...newFine, member: event.target.value })}>
              <option value="">Select a member</option>
              {members.map((member) => (
                <option key={member._id} value={member._id}>{member.name} · {member.email}</option>
              ))}
            </select>
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Amount">
              <input className="input" type="number" min="0" step="0.01" required value={newFine.amount} onChange={(event) => setNewFine({ ...newFine, amount: event.target.value })} />
            </FormField>
            <FormField label="Reason">
              <select className="input" value={newFine.reason} onChange={(event) => setNewFine({ ...newFine, reason: event.target.value })}>
                <option value="overdue">Overdue</option>
                <option value="damage">Damage</option>
                <option value="lost">Lost</option>
                <option value="other">Other</option>
              </select>
            </FormField>
          </div>
          <FormField label="Description">
            <input className="input" value={newFine.description} onChange={(event) => setNewFine({ ...newFine, description: event.target.value })} />
          </FormField>
        </form>
      </Modal>
    </>
  );
};

export default Fines;
