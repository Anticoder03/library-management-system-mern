import { Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute.jsx';
import { DashboardLayout } from './components/Layout.jsx';
import { useAuth } from './context/AuthContext.jsx';
import { Loader } from './components/ui.jsx';
import { Login } from './pages/auth/Login.jsx';
import { Register } from './pages/auth/Register.jsx';
import { ForgotPassword } from './pages/auth/ForgotPassword.jsx';
import { ResetPassword } from './pages/auth/ResetPassword.jsx';
import { Dashboard } from './pages/dashboard/Dashboard.jsx';
import { Books } from './pages/books/Books.jsx';
import { BookDetail } from './pages/books/BookDetail.jsx';
import { BookForm } from './pages/books/BookForm.jsx';
import { Members } from './pages/members/Members.jsx';
import { MemberDetail } from './pages/members/MemberDetail.jsx';
import { MemberForm } from './pages/members/MemberForm.jsx';
import { IssueBook } from './pages/circulation/IssueBook.jsx';
import { Returns } from './pages/circulation/Returns.jsx';
import { BorrowingHistory } from './pages/circulation/BorrowingHistory.jsx';
import { MyBorrows } from './pages/circulation/MyBorrows.jsx';
import { Reservations } from './pages/reservations/Reservations.jsx';
import { Fines } from './pages/fines/Fines.jsx';
import { Categories } from './pages/categories/Categories.jsx';
import { Reports } from './pages/reports/Reports.jsx';
import { ActivityLog } from './pages/activity/ActivityLog.jsx';
import { Notifications } from './pages/notifications/Notifications.jsx';
import { Profile } from './pages/profile/Profile.jsx';
import { NotFound, Unauthorized } from './pages/StatusPages.jsx';

const Home = () => {
  const { user, loading } = useAuth();
  if (loading) return <Loader />;
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={user.role === 'member' ? '/books' : '/dashboard'} replace />;
};

const guard = (element, roles) => (
  <ProtectedRoute roles={roles}>{element}</ProtectedRoute>
);

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/unauthorized" element={<Unauthorized />} />

      <Route element={guard(<DashboardLayout />)}>
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={guard(<Dashboard />, ['admin', 'librarian'])} />
        <Route path="/books" element={<Books />} />
        <Route path="/books/new" element={guard(<BookForm />, ['admin', 'librarian'])} />
        <Route path="/books/:id" element={<BookDetail />} />
        <Route path="/books/:id/edit" element={guard(<BookForm />, ['admin', 'librarian'])} />
        <Route path="/categories" element={guard(<Categories />, ['admin', 'librarian'])} />
        <Route path="/reservations" element={<Reservations />} />
        <Route path="/issue" element={guard(<IssueBook />, ['admin', 'librarian'])} />
        <Route path="/returns" element={guard(<Returns />, ['admin', 'librarian'])} />
        <Route path="/borrowing" element={guard(<BorrowingHistory />, ['admin', 'librarian'])} />
        <Route path="/my-borrows" element={guard(<MyBorrows />, ['member'])} />
        <Route path="/fines" element={<Fines />} />
        <Route path="/members" element={guard(<Members />, ['admin', 'librarian'])} />
        <Route path="/members/new" element={guard(<MemberForm />, ['admin', 'librarian'])} />
        <Route path="/members/:id" element={guard(<MemberDetail />, ['admin', 'librarian'])} />
        <Route path="/members/:id/edit" element={guard(<MemberForm />, ['admin', 'librarian'])} />
        <Route path="/activity" element={guard(<ActivityLog />, ['admin', 'librarian'])} />
        <Route path="/reports" element={guard(<Reports />, ['admin', 'librarian'])} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/profile" element={<Profile />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
