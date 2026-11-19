import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus } from 'lucide-react';
import api from '../../services/api.js';
import { useFetch } from '../../hooks/useFetch.js';
import { useDebounce } from '../../hooks/useDebounce.js';
import {
  Avatar,
  Badge,
  DataTable,
  ErrorState,
  PageHeader,
  Pagination,
  SearchInput,
} from '../../components/ui.jsx';
import { formatDate } from '../../utils/format.js';

export const Members = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [role, setRole] = useState('all');
  const debounced = useDebounce(search);
  const navigate = useNavigate();

  const fetchMembers = useCallback(
    () =>
      api.get('/members', {
        params: { page, limit: 10, search: debounced || undefined, status, role },
      }),
    [page, debounced, status, role]
  );
  const { data, loading, error, refresh } = useFetch(fetchMembers);

  const columns = [
    {
      key: 'name',
      label: 'Member',
      render: (member) => (
        <div className="flex items-center gap-3">
          <Avatar name={member.name} src={member.avatar} size="sm" />
          <div>
            <p className="font-bold text-ink-900">{member.name}</p>
            <p className="text-xs text-ink-500">{member.email}</p>
          </div>
        </div>
      ),
    },
    { key: 'studentId', label: 'Student ID', render: (m) => m.studentId || '—' },
    { key: 'phone', label: 'Phone', render: (m) => m.phone || '—' },
    { key: 'role', label: 'Role', render: (m) => <Badge status={m.role} /> },
    { key: 'membershipDate', label: 'Joined', render: (m) => formatDate(m.membershipDate) },
    { key: 'membershipStatus', label: 'Status', render: (m) => <Badge status={m.membershipStatus} /> },
  ];

  return (
    <>
      <PageHeader
        breadcrumb="Management"
        title="Members"
        subtitle="Manage library members, their status and membership details."
        actions={
          <button className="btn-primary" onClick={() => navigate('/members/new')}>
            <UserPlus className="h-4 w-4" /> Add Member
          </button>
        }
      />

      <div className="card mb-5 flex flex-col gap-3 p-4 sm:flex-row">
        <SearchInput value={search} onChange={setSearch} placeholder="Search by name, email, ID or phone…" className="flex-1" />
        <select className="input !w-auto" value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
          <option value="inactive">Inactive</option>
        </select>
        <select className="input !w-auto" value={role} onChange={(event) => setRole(event.target.value)}>
          <option value="all">Members</option>
          <option value="librarian">Librarians</option>
          <option value="staff">All staff</option>
        </select>
      </div>

      <div className="card overflow-hidden">
        {error ? (
          <ErrorState message={error} onRetry={refresh} />
        ) : (
          <>
            <DataTable columns={columns} rows={data?.data} loading={loading} onRowClick={(m) => navigate(`/members/${m._id}`)} />
            <Pagination meta={data?.meta} onPageChange={setPage} />
          </>
        )}
      </div>
    </>
  );
};

export default Members;
