import { useCallback, useState } from 'react';
import { Activity as ActivityIcon } from 'lucide-react';
import api from '../../services/api.js';
import { useFetch } from '../../hooks/useFetch.js';
import { Avatar, Badge, DataTable, ErrorState, PageHeader, Pagination, SearchInput } from '../../components/ui.jsx';
import { timeAgo } from '../../utils/format.js';

export const ActivityLog = () => {
  const [page, setPage] = useState(1);
  const [action, setAction] = useState('');

  const fetchActivities = useCallback(
    () => api.get('/activities', { params: { page, limit: 20, action: action || undefined } }),
    [page, action]
  );
  const { data, loading, error, refresh } = useFetch(fetchActivities);

  const columns = [
    {
      key: 'action',
      label: 'Action',
      render: (row) => <span className="chip bg-brand-50 text-brand-700">{row.action.replace(/_/g, ' ').toLowerCase()}</span>,
    },
    {
      key: 'actor',
      label: 'Performed by',
      render: (row) => (
        <div className="flex items-center gap-2">
          <Avatar name={row.actor?.name || 'System'} size="sm" />
          <div>
            <p className="text-xs font-bold text-ink-800">{row.actor?.name || 'System'}</p>
            <p className="text-[11px] text-ink-500">{row.actor?.role || '—'}</p>
          </div>
        </div>
      ),
    },
    { key: 'description', label: 'Description', render: (row) => row.description || '—' },
    { key: 'entity', label: 'Module', render: (row) => (row.entity ? <Badge>{row.entity}</Badge> : '—') },
    { key: 'createdAt', label: 'When', render: (row) => timeAgo(row.createdAt) },
  ];

  return (
    <>
      <PageHeader breadcrumb="Management" title="Activity Log" subtitle="Audit trail of important actions across the system." />
      <div className="card mb-5 flex flex-col gap-3 p-4 sm:flex-row">
        <SearchInput value={action} onChange={setAction} placeholder="Filter by action (e.g. BOOK_ISSUED)…" className="flex-1" />
      </div>
      <div className="card overflow-hidden">
        {error ? <ErrorState message={error} onRetry={refresh} /> : (
          <>
            <DataTable columns={columns} rows={data?.data} loading={loading} emptyText="No activity recorded" />
            <Pagination meta={data?.meta} onPageChange={setPage} />
          </>
        )}
      </div>
    </>
  );
};

export default ActivityLog;
