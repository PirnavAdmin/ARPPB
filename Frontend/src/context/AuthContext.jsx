import { createContext, useState, useCallback, useMemo } from 'react';
import { INITIAL_VENDOR_PROFILE } from '../data/mockNotifications';
import { STORAGE_KEYS } from '../utils/constants';
import { readStorage, writeStorage } from '../services/api';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [vendorUser, setVendorUser] = useState(() =>
    readStorage(STORAGE_KEYS.VENDOR_PROFILE, INITIAL_VENDOR_PROFILE)
  );

  const login = useCallback((customProfile = null) => {
    if (customProfile) {
      setVendorUser(customProfile);
      writeStorage(STORAGE_KEYS.VENDOR_PROFILE, customProfile);
    }
    setIsAuthenticated(true);
  }, []);

  const logout = useCallback(() => {
    setIsAuthenticated(false);
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
      vendorUser,
      login,
      logout,
      updateVendorProfile,
    }),
    [isAuthenticated, vendorUser, login, logout, updateVendorProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default AuthProvider;

