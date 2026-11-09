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
 * Backend enums, and Portal route guards ('vendor', 'middleman', 'farmer', 'customer').
 */
export function normalizeRole(rawRole) {
  if (!rawRole) return 'vendor';
  const cleaned = String(rawRole).trim().toLowerCase().replace(/\s+/g, '');
  if (cleaned === 'middleman' || cleaned === 'supplier') return 'middleman';
  if (cleaned === 'farmer') return 'farmer';
  if (cleaned === 'customer') return 'customer';
  if (cleaned === 'vendor') return 'vendor';
  return 'vendor';
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
    const resolvedRole = normalizeRole(userData?.role || 'vendor');
    const nextSession = {
      isAuthenticated: true,
      user: userData
        ? {
            ...userData,
            role: resolvedRole,
          }
        : {
            contactNumber: INITIAL_VENDOR_PROFILE.mobileNumber,
            role: 'vendor',
            fullName: INITIAL_VENDOR_PROFILE.ownerName,
          },
    };
    setAuthSession(nextSession);
    writeStorage(AUTH_SESSION_KEY, nextSession);
  }, []);

  const switchPortalRole = useCallback((targetRole) => {
    const normalized = normalizeRole(targetRole);
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
