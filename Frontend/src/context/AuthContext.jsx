import { createContext, useState, useCallback, useMemo } from 'react';
import { INITIAL_VENDOR_PROFILE } from '../data/mockNotifications';
import { STORAGE_KEYS } from '../utils/constants';
import { readStorage, writeStorage } from '../services/api';

const AUTH_SESSION_KEY = 'arppb_auth_session_v1';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [authSession, setAuthSession] = useState(() =>
    readStorage(AUTH_SESSION_KEY, {
      isAuthenticated: true,
      user: {
        contactNumber: INITIAL_VENDOR_PROFILE.mobileNumber,
        role: 'Vendor',
        fullName: INITIAL_VENDOR_PROFILE.ownerName,
      },
    })
  );

  const [vendorUser, setVendorUser] = useState(() =>
    readStorage(STORAGE_KEYS.VENDOR_PROFILE, INITIAL_VENDOR_PROFILE)
  );

  const isAuthenticated = Boolean(authSession?.isAuthenticated);
  const currentUser = authSession?.user || null;

  const login = useCallback((userData = null) => {
    const nextSession = {
      isAuthenticated: true,
      user: userData || {
        contactNumber: INITIAL_VENDOR_PROFILE.mobileNumber,
        role: 'Vendor',
        fullName: INITIAL_VENDOR_PROFILE.ownerName,
      },
    };
    setAuthSession(nextSession);
    writeStorage(AUTH_SESSION_KEY, nextSession);
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
      vendorUser,
      login,
      logout,
      updateVendorProfile,
    }),
    [isAuthenticated, currentUser, vendorUser, login, logout, updateVendorProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default AuthProvider;
