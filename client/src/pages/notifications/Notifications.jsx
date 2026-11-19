import { useCallback, useState } from 'react';
import { Bell, CheckCheck, Trash2 } from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../../services/api.js';
import { useFetch } from '../../hooks/useFetch.js';
import { EmptyState, ErrorState, Loader, PageHeader, Pagination } from '../../components/ui.jsx';
import { timeAgo } from '../../utils/format.js';

export const Notifications = () => {
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState('all');

  const fetchNotifications = useCallback(
    () => api.get('/notifications', { params: { page, limit: 20, read: filter === 'all' ? undefined : filter === 'read' } }),
    [page, filter]
  );
  const { data, loading, error, refresh } = useFetch(fetchNotifications);

  const markAll = async () => {
    try {
      await api.put('/notifications/read-all');
      toast.success('All notifications marked as read');
      refresh(true);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const markRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      refresh(true);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const remove = async (id) => {
    try {
      await api.delete(`/notifications/${id}`);
      toast.success('Notification removed');
      refresh(true);
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <>
      <PageHeader
        breadcrumb="Account"
        title="Notifications"
        subtitle={`You have ${data?.unreadCount || 0} unread notification(s).`}
        actions={
          <button className="btn-secondary" onClick={markAll}>
            <CheckCheck className="h-4 w-4" /> Mark all read
          </button>
        }
      />

      <div className="card mb-5 flex gap-2 p-4">
        {['all', 'unread', 'read'].map((value) => (
          <button
            key={value}
            onClick={() => setFilter(value)}
            className={`chip capitalize ${filter === value ? 'bg-brand-600 text-white' : 'bg-ink-100 text-ink-600'}`}
          >
            {value}
          </button>
        ))}
      </div>

      <div className="card overflow-hidden">
        {error ? (
          <ErrorState message={error} onRetry={refresh} />
        ) : loading ? (
          <Loader compact />
        ) : data?.data?.length ? (
          <div className="divide-y divide-ink-50">
            {data.data.map((item) => (
              <div key={item._id} className={`flex gap-4 p-5 ${item.read ? '' : 'bg-brand-50/30'}`}>
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-600">
                  <Bell className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-ink-900">{item.title}</p>
                    {!item.read && <span className="h-2 w-2 rounded-full bg-brand-500" />}
                  </div>
                  <p className="mt-1 text-xs text-ink-600">{item.message}</p>
                  <p className="mt-1 text-[11px] text-ink-400">{timeAgo(item.createdAt)}</p>
                </div>
                <div className="flex gap-1">
                  {!item.read && (
                    <button className="btn-ghost !p-2" onClick={() => markRead(item._id)} title="Mark as read">
                      <CheckCheck className="h-4 w-4" />
                    </button>
                  )}
                  <button className="btn-ghost !p-2 !text-rose-500" onClick={() => remove(item._id)} title="Remove">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
            <Pagination meta={data.meta} onPageChange={setPage} />
          </div>
        ) : (
          <EmptyState icon={Bell} title="No notifications" description="Important updates will appear here." />
        )}
      </div>
    </>
  );
};

export default Notifications;
