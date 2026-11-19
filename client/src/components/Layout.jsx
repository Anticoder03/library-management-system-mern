import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Activity,
  ArrowLeftRight,
  BadgeIndianRupee,
  BarChart3,
  Bell,
  BookCopy,
  BookMarked,
  BookOpenCheck,
  ChevronDown,
  ClipboardList,
  FolderTree,
  LayoutDashboard,
  LibraryBig,
  LogOut,
  Menu,
  ReceiptText,
  Search,
  Settings2,
  UserRound,
  Users,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../services/api.js';
import { Avatar } from './ui.jsx';
import { timeAgo } from '../utils/format.js';
import { toast } from 'react-toastify';

const navGroups = [
  {
    label: 'Overview',
    items: [{ to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, staffOnly: true }],
  },
  {
    label: 'Library',
    items: [
      { to: '/books', label: 'Books', icon: LibraryBig },
      { to: '/categories', label: 'Categories', icon: FolderTree, staffOnly: true },
      { to: '/reservations', label: 'Reservations', icon: BookMarked },
    ],
  },
  {
    label: 'Circulation',
    items: [
      { to: '/issue', label: 'Issue Book', icon: BookOpenCheck, staffOnly: true },
      { to: '/returns', label: 'Returns', icon: ArrowLeftRight, staffOnly: true },
      { to: '/my-borrows', label: 'My Borrows', icon: BookCopy, memberOnly: true },
      { to: '/borrowing', label: 'Borrowing History', icon: ClipboardList, staffOnly: true },
      { to: '/fines', label: 'Fines', icon: ReceiptText },
    ],
  },
  {
    label: 'Management',
    items: [
      { to: '/members', label: 'Members', icon: Users, staffOnly: true },
      { to: '/activity', label: 'Activity Log', icon: Activity, staffOnly: true },
      { to: '/reports', label: 'Reports', icon: BarChart3, staffOnly: true },
    ],
  },
];

const SidebarContent = ({ onNavigate, isStaff, isMember }) => (
  <div className="flex h-full flex-col">
    <div className="flex h-[72px] items-center gap-3 border-b border-white/10 px-6">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-400 to-violet-500 shadow-lg shadow-brand-900/30">
        <LibraryBig className="h-5 w-5 text-white" />
      </div>
      <div>
        <p className="text-[15px] font-extrabold leading-tight tracking-tight text-white">Smart Library</p>
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-brand-200">Management System</p>
      </div>
    </div>

    <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-6">
      {navGroups.map((group) => {
        const items = group.items.filter(
          (item) => (!item.staffOnly || isStaff) && (!item.memberOnly || isMember)
        );
        if (!items.length) return null;
        return (
          <div key={group.label}>
            <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
              {group.label}
            </p>
            <div className="space-y-1">
              {items.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    `group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-semibold transition-all ${
                      isActive
                        ? 'bg-brand-500/15 text-white'
                        : 'text-slate-400 hover:bg-white/5 hover:text-slate-100'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isActive && <span className="absolute -left-3 h-6 w-1 rounded-r-full bg-brand-400" />}
                      <Icon className={`h-[18px] w-[18px] ${isActive ? 'text-brand-300' : ''}`} />
                      {label}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        );
      })}
    </nav>

    <div className="border-t border-white/10 p-4">
      <NavLink
        to="/profile"
        onClick={onNavigate}
        className={({ isActive }) =>
          `flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-semibold transition ${
            isActive ? 'bg-white/10 text-white' : 'text-slate-400 hover:bg-white/5 hover:text-white'
          }`
        }
      >
        <Settings2 className="h-[18px] w-[18px]" />
        Profile & Settings
      </NavLink>
      <div className="mt-3 rounded-xl bg-white/5 p-3">
        <p className="text-[10px] leading-relaxed text-slate-400">
          Need help? Contact your library administrator for account support.
        </p>
      </div>
    </div>
  </div>
);

export const DashboardLayout = () => {
  const { user, isStaff, isMember, logout } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const [search, setSearch] = useState('');
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    setDrawerOpen(false);
    setNotifOpen(false);
    setProfileOpen(false);
  }, [location.pathname]);

  const loadNotifications = () => {
    api
      .get('/notifications?limit=6')
      .then((data) => {
        setNotifications(data.data);
        setUnread(data.unreadCount || 0);
      })
      .catch(() => {});
  };

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  const markAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setUnread(0);
      setNotifications((items) => items.map((item) => ({ ...item, read: true })));
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleSearch = (event) => {
    if (event.key === 'Enter' && search.trim()) {
      navigate(`/books?search=${encodeURIComponent(search.trim())}`);
      setSearch('');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
    toast.info('You have been logged out');
  };

  return (
    <div className="min-h-screen bg-[#f7f8fc]">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[252px] bg-[#111827] lg:block">
        <SidebarContent isStaff={isStaff} isMember={isMember} />
      </aside>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-ink-900/50 backdrop-blur-sm" onClick={() => setDrawerOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-[260px] bg-[#111827] shadow-2xl">
            <button
              className="absolute right-3 top-5 rounded-lg p-1.5 text-slate-400 hover:bg-white/10"
              onClick={() => setDrawerOpen(false)}
              aria-label="Close navigation"
            >
              <X className="h-5 w-5" />
            </button>
            <SidebarContent isStaff={isStaff} isMember={isMember} onNavigate={() => setDrawerOpen(false)} />
          </aside>
        </div>
      )}

      <div className="lg:pl-[252px]">
        <header className="sticky top-0 z-30 flex h-[72px] items-center gap-3 border-b border-ink-100 bg-white/90 px-4 backdrop-blur-xl sm:px-6">
          <button className="rounded-xl p-2 text-ink-600 hover:bg-ink-100 lg:hidden" onClick={() => setDrawerOpen(true)} aria-label="Open navigation">
            <Menu className="h-5 w-5" />
          </button>

          <div className="relative hidden max-w-md flex-1 sm:block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              onKeyDown={handleSearch}
              placeholder="Search books, press Enter…"
              className="input !rounded-full !bg-ink-50 !py-2.5 !pl-9"
            />
          </div>
          <div className="flex-1 sm:hidden" />

          <div className="relative">
            <button
              onClick={() => {
                setNotifOpen((open) => !open);
                setProfileOpen(false);
              }}
              className="relative rounded-xl p-2.5 text-ink-500 transition hover:bg-ink-100 hover:text-ink-900"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5" />
              {unread > 0 && (
                <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white">
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </button>
            {notifOpen && (
              <div className="absolute right-0 top-12 w-[330px] overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-float">
                <div className="flex items-center justify-between border-b border-ink-100 px-4 py-3">
                  <p className="text-sm font-bold">Notifications</p>
                  <button onClick={markAllRead} className="text-[11px] font-semibold text-brand-600 hover:underline">
                    Mark all read
                  </button>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length ? (
                    notifications.map((item) => (
                      <button
                        key={item._id}
                        onClick={async () => {
                          if (!item.read) {
                            await api.put(`/notifications/${item._id}/read`).catch(() => {});
                            setUnread((count) => Math.max(0, count - 1));
                          }
                          if (item.link) navigate(item.link);
                          setNotifOpen(false);
                        }}
                        className={`block w-full border-b border-ink-50 px-4 py-3 text-left transition hover:bg-ink-50 ${
                          item.read ? '' : 'bg-brand-50/40'
                        }`}
                      >
                        <p className="text-xs font-bold text-ink-800">{item.title}</p>
                        <p className="mt-0.5 line-clamp-2 text-[11px] text-ink-500">{item.message}</p>
                        <p className="mt-1 text-[10px] text-ink-400">{timeAgo(item.createdAt)}</p>
                      </button>
                    ))
                  ) : (
                    <p className="px-4 py-8 text-center text-xs text-ink-500">No notifications yet</p>
                  )}
                </div>
                <button
                  onClick={() => navigate('/notifications')}
                  className="w-full bg-ink-50 py-2.5 text-xs font-bold text-brand-600 hover:bg-ink-100"
                >
                  View all notifications
                </button>
              </div>
            )}
          </div>

          <div className="relative">
            <button
              onClick={() => {
                setProfileOpen((open) => !open);
                setNotifOpen(false);
              }}
              className="flex items-center gap-2 rounded-xl p-1 pr-2 transition hover:bg-ink-100"
            >
              <Avatar name={user?.name} src={user?.avatar} size="sm" />
              <span className="hidden text-left sm:block">
                <span className="block text-xs font-bold text-ink-900">{user?.name}</span>
                <span className="block text-[10px] capitalize text-ink-500">{user?.role}</span>
              </span>
              <ChevronDown className="hidden h-4 w-4 text-ink-400 sm:block" />
            </button>
            {profileOpen && (
              <div className="absolute right-0 top-12 w-52 overflow-hidden rounded-2xl border border-ink-100 bg-white p-1.5 shadow-float">
                <button
                  onClick={() => navigate('/profile')}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-xs font-semibold text-ink-700 hover:bg-ink-50"
                >
                  <UserRound className="h-4 w-4" /> My Profile
                </button>
                <button
                  onClick={() => navigate(isStaff ? '/dashboard' : '/books')}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-xs font-semibold text-ink-700 hover:bg-ink-50"
                >
                  <BadgeIndianRupee className="h-4 w-4" /> Home
                </button>
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-xs font-semibold text-rose-600 hover:bg-rose-50"
                >
                  <LogOut className="h-4 w-4" /> Log out
                </button>
              </div>
            )}
          </div>
        </header>

        <main className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6 sm:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
