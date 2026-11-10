import { createContext, useState, useCallback, useMemo } from 'react';
import { INITIAL_VENDOR_PROFILE } from '../data/mockNotifications';
import { STORAGE_KEYS } from '../utils/constants';
import { readStorage, writeStorage } from '../services/api';

const AUTH_SESSION_KEY = 'arppb_auth_session_v1';

export const PORTAL_HOME_PATHS = {
  vendor: '/vendor/dashboard',
  middleman: '/middleman/dashboard',
  farmer: '/farmer',
  customer: '/customer/dashboard',
};

/**
 * Normalize role strings across Registration ('Farmer', 'Vendor', 'Middle Man', 'Customer'),
 * Backend enums ('Farmer', 'Customer', 'Supplier', 'Vendor'),
 * and Portal route guards ('vendor', 'middleman', 'farmer', 'customer').
 * Returns null if the role is missing or unrecognized.
 */
export function normalizeRole(rawRole) {
  if (rawRole === null || rawRole === undefined || rawRole === '') return null;
  if (typeof rawRole === 'number') {
    if (rawRole === 1) return 'farmer';
    if (rawRole === 2) return 'customer';
    if (rawRole === 3) return 'middleman';
    if (rawRole === 4) return 'vendor';
    return null;
  }
  const cleaned = String(rawRole)
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, '');
  if (cleaned === 'farmer' || cleaned === '1') return 'farmer';
  if (cleaned === 'customer' || cleaned === '2') return 'customer';
  if (cleaned === 'middleman' || cleaned === 'supplier' || cleaned === '3') {
    return 'middleman';
  }
  if (cleaned === 'vendor' || cleaned === '4') return 'vendor';
  return null;
}

/**
 * Resolve the portal dashboard route for a given backend role.
 * Returns null if the role is missing or unknown.
 */
export function getDashboardPathByRole(rawRole) {
  const normalized = normalizeRole(rawRole);
  return normalized ? PORTAL_HOME_PATHS[normalized] || null : null;
}

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [authSession, setAuthSession] = useState(() =>
    readStorage(AUTH_SESSION_KEY, {
      isAuthenticated: true,
      user: {
        contactNumber: INITIAL_VENDOR_PROFILE.mobileNumber,
        role: 'vendor',
        fullName: INITIAL_VENDOR_PROFILE.ownerName,
      },
    })
  );

  const [vendorUser, setVendorUser] = useState(() =>
    readStorage(STORAGE_KEYS.VENDOR_PROFILE, INITIAL_VENDOR_PROFILE)
  );

  const isAuthenticated = Boolean(authSession?.isAuthenticated);
  const currentUser = useMemo(() => {
    if (!authSession?.user) return null;
    return {
      ...authSession.user,
      role: normalizeRole(authSession.user.role),
    };
  }, [authSession]);

  const role = currentUser?.role || null;

  const login = useCallback((userData = null) => {
    const resolvedRole = normalizeRole(userData?.role);
    if (!userData || !resolvedRole) {
      return null;
    }

    const sanitizedUser = { ...userData };
    delete sanitizedUser.password;
    delete sanitizedUser.confirmPassword;

    const contactNum =
      sanitizedUser.mobile ||
      sanitizedUser.contactNumber ||
      sanitizedUser.phone ||
      '';

    const nextSession = {
      isAuthenticated: true,
      user: {
        ...sanitizedUser,
        mobile: contactNum,
        contactNumber: contactNum,
        phone: contactNum,
        role: resolvedRole,
      },
    };
    setAuthSession(nextSession);
    writeStorage(AUTH_SESSION_KEY, nextSession);
    return nextSession.user;
  }, []);

  const switchPortalRole = useCallback((targetRole) => {
    const normalized = normalizeRole(targetRole);
    if (!normalized) return;
    setAuthSession((prev) => {
      const nextSession = {
        isAuthenticated: true,
        user: {
          ...(prev?.user || {
            contactNumber: INITIAL_VENDOR_PROFILE.mobileNumber,
            fullName: INITIAL_VENDOR_PROFILE.ownerName,
          }),
          role: normalized,
        },
      };
      writeStorage(AUTH_SESSION_KEY, nextSession);
      return nextSession;
    });
  }, []);

  const logout = useCallback(() => {
    const nextSession = {
      isAuthenticated: false,
      user: null,
    };
    setAuthSession(nextSession);
    writeStorage(AUTH_SESSION_KEY, nextSession);
  }, []);

  const updateVendorProfile = useCallback((updates) => {
    setVendorUser((prev) => {
      const next = {
        ...prev,
        ...updates,
        bankDetails: updates.bankDetails
          ? { ...(prev.bankDetails || {}), ...updates.bankDetails }
          : prev.bankDetails,
        updatedAt: new Date().toISOString().slice(0, 10),
      };
      writeStorage(STORAGE_KEYS.VENDOR_PROFILE, next);
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({
      isAuthenticated,
      user: currentUser,
      role,
      vendorUser,
      login,
      switchPortalRole,
      logout,
      updateVendorProfile,
    }),
    [
      isAuthenticated,
      currentUser,
      role,
      vendorUser,
      login,
      switchPortalRole,
      logout,
      updateVendorProfile,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default AuthProvider;
