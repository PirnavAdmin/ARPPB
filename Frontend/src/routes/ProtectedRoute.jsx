import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { normalizeRole, PORTAL_HOME_PATHS } from '../context/AuthContext';

export default function ProtectedRoute({ children, allowedRoles = null }) {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (Array.isArray(allowedRoles) && allowedRoles.length > 0) {
    const activeRole = normalizeRole(user?.role);
    const normalizedAllowed = allowedRoles.map((r) => normalizeRole(r));

    if (!normalizedAllowed.includes(activeRole)) {
      const fallbackPath = PORTAL_HOME_PATHS[activeRole] || '/dashboard';
      return <Navigate to={fallbackPath} replace />;
    }
  }

  return children;
}
