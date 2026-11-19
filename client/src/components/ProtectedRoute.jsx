import { Navigate, useLocation } from 'react-router-dom';
import { Loader } from './ui.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export const ProtectedRoute = ({ children, roles }) => {
  const { user, token, loading } = useAuth();
  const location = useLocation();

  if (loading) return <Loader label="Checking your session…" />;
  if (!token || !user) return <Navigate to="/login" replace state={{ from: location }} />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/unauthorized" replace />;
  return children;
};

export default ProtectedRoute;
