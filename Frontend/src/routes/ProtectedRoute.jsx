import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { normalizeRole, PORTAL_HOME_PATHS } from '../context/AuthContext';
import { verifyRoleAccess } from '../services/auth/authService';

export default function ProtectedRoute({ children, allowedRoles = null }) {
  const { isAuthenticated, user, token, logout } = useAuth();
  const location = useLocation();
  const [serverDeniedFor, setServerDeniedFor] = useState(null);

  const activeRole = normalizeRole(user?.role);
  const normalizedAllowed = Array.isArray(allowedRoles)
    ? allowedRoles.map((r) => normalizeRole(r)).filter(Boolean)
    : [];
  const targetRoleToVerify =
    normalizedAllowed.length === 1 ? normalizedAllowed[0] : null;
  const verificationKey =
    token && targetRoleToVerify ? `${token}:${targetRoleToVerify}` : null;

  useEffect(() => {
    if (
      !isAuthenticated ||
      !token ||
      !targetRoleToVerify ||
      activeRole !== targetRoleToVerify
    ) {
      return undefined;
    }

    const tracker = { active: true };
    verifyRoleAccess(targetRoleToVerify)
      .then(() => {
        if (tracker.active) {
          setServerDeniedFor(null);
        }
      })
      .catch((err) => {
        if (!tracker.active) return;
        if (err?.status === 401) {
          logout();
        } else if (err?.status === 403) {
          setServerDeniedFor(verificationKey);
        }
      });

    return () => {
      tracker.active = false;
    };
  }, [isAuthenticated, token, targetRoleToVerify, activeRole, verificationKey, logout]);

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (normalizedAllowed.length > 0) {
    if (!activeRole) {
      return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (!normalizedAllowed.includes(activeRole)) {
      const fallbackPath = PORTAL_HOME_PATHS[activeRole] || '/login';
      return <Navigate to={fallbackPath} replace />;
    }

    if (verificationKey && serverDeniedFor === verificationKey) {
      return <Navigate to="/login" state={{ from: location }} replace />;
    }
  }

  return children;
}

