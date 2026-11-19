import { useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BookMarked,
  BookOpen,
  CalendarClock,
  CircleDollarSign,
  Clock3,
  LibraryBig,
  UserPlus,
  Users,
  Wallet,
} from 'lucide-react';
import api from '../../services/api.js';
import { useFetch } from '../../hooks/useFetch.js';
import { Avatar, Badge, ErrorState, Loader, PageHeader, StatCard } from '../../components/ui.jsx';
import { AvailabilityChart, PopularBooksChart, TrendChart } from '../../components/Charts.jsx';
import { formatCurrency, formatDate, timeAgo } from '../../utils/format.js';

const StatGrid = ({ stats }) => (
  <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
    <StatCard icon={LibraryBig} label="Total copies" value={stats.totalBooks} hint={`${stats.totalTitles} titles`} tone="brand" />
    <StatCard icon={BookOpen} label="Available books" value={stats.availableBooks} tone="emerald" />
    <StatCard icon={CalendarClock} label="Issued books" value={stats.issuedBooks} tone="sky" />
    <StatCard icon={Users} label="Total members" value={stats.totalMembers} hint={`+${stats.newMembersThisMonth} this month`} tone="violet" />
    <StatCard icon={Clock3} label="Overdue books" value={stats.overdueBooks} tone="rose" />
    <StatCard icon={BookMarked} label="Pending reservations" value={stats.pendingReservations} tone="amber" />
    <StatCard icon={Wallet} label="Fine collection" value={formatCurrency(stats.totalFineCollection)} tone="emerald" />
    <StatCard icon={CircleDollarSign} label="Outstanding fines" value={formatCurrency(stats.unpaidFineAmount)} tone="rose" />
  </div>
);

export const Dashboard = () => {
  const fetchDashboard = useCallback(() => api.get('/dashboard').then((data) => data.data), []);
  const { data, loading, error, refresh } = useFetch(fetchDashboard);

  if (loading) return <Loader label="Preparing your dashboard…" />;
  if (error) return <ErrorState message={error} onRetry={refresh} />;

  const { stats, analytics } = data;

  return (
    <>
      <PageHeader
        breadcrumb="Overview"
        title="Dashboard"
        subtitle="A live snapshot of your library's activity and performance."
        actions={
          <button onClick={refresh} className="btn-secondary">
            <ArrowRight className="h-4 w-4 -rotate-90" /> Refresh
          </button>
        }
      />

      <StatGrid stats={stats} />

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="card p-5 xl:col-span-2">
          <div className="mb-2 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-ink-900">Borrowing trends</h2>
              <p className="text-xs text-ink-500">Issued vs returned books over the last 12 months</p>
            </div>
          </div>
          <TrendChart data={analytics.monthlyTrend} />
        </div>

        <div className="card p-5">
          <h2 className="text-sm font-bold text-ink-900">Most borrowed books</h2>
          <p className="text-xs text-ink-500">All-time favorites</p>
          <div className="mt-3">
            <PopularBooksChart data={analytics.mostBorrowed} />
          </div>
        </div>

        <div className="card p-5 xl:col-span-2">
          <h2 className="text-sm font-bold text-ink-900">Collection availability</h2>
          <p className="text-xs text-ink-500">Copies by category</p>
          <AvailabilityChart data={analytics.availability} />
        </div>

        <div className="card p-5">
          <h2 className="text-sm font-bold text-ink-900">Recently issued</h2>
          <p className="text-xs text-ink-500">Latest checkouts</p>
          <div className="mt-4 space-y-3">
            {analytics.recentIssued.length ? (
              analytics.recentIssued.map((borrow) => (
                <div key={borrow._id} className="flex items-center gap-3">
                  <Avatar name={borrow.member?.name} src={borrow.member?.avatar} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-bold text-ink-800">{borrow.book?.title || 'Deleted book'}</p>
                    <p className="text-[11px] text-ink-500">{borrow.member?.name} · due {formatDate(borrow.dueDate, 'MMM d')}</p>
                  </div>
                  <Badge status={new Date(borrow.dueDate) < new Date() ? 'overdue' : 'issued'} />
                </div>
              ))
            ) : (
              <p className="py-6 text-center text-xs text-ink-400">No active loans</p>
            )}
          </div>
        </div>

        <div className="card p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-ink-900">New members</h2>
              <p className="text-xs text-ink-500">Latest registrations</p>
            </div>
            <Link to="/members" className="text-xs font-bold text-brand-600 hover:underline">View all</Link>
          </div>
          <div className="space-y-3">
            {analytics.recentMembers.map((member) => (
              <div key={member._id} className="flex items-center gap-3">
                <Avatar name={member.name} src={member.avatar} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold text-ink-800">{member.name}</p>
                  <p className="truncate text-[11px] text-ink-500">{member.email}</p>
                </div>
                <span className="text-[10px] text-ink-400">{timeAgo(member.membershipDate)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-5 xl:col-span-3">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-ink-900">Recent activity</h2>
              <p className="text-xs text-ink-500">What's been happening in your library</p>
            </div>
            <Link to="/activity" className="text-xs font-bold text-brand-600 hover:underline">View log</Link>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
            {analytics.activities.map((activity) => (
              <div key={activity._id} className="rounded-xl border border-ink-100 bg-ink-50/50 p-3.5">
                <p className="text-[11px] font-bold text-ink-800">{activity.action.replace(/_/g, ' ').toLowerCase()}</p>
                <p className="mt-1 line-clamp-2 text-[11px] text-ink-500">{activity.description}</p>
                <p className="mt-2 text-[10px] text-ink-400">
                  {activity.actor?.name || 'System'} · {timeAgo(activity.createdAt)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default Dashboard;
