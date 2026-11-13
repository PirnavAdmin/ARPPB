import { createContext, useState, useCallback, useMemo, useEffect } from 'react';
import { INITIAL_VENDOR_PROFILE } from '../data/mockNotifications';
import { STORAGE_KEYS } from '../utils/constants';
import { readStorage, writeStorage } from '../services/api';
import {
  AUTH_SESSION_STORAGE_KEY,
  AUTH_TOKEN_STORAGE_KEY,
} from '../API/Config';
import { fetchAuthenticatedProfile } from '../services/auth/authService';

const EMPTY_AUTH_SESSION = {
  isAuthenticated: false,
  token: null,
  tokenType: 'Bearer',
  expiresAt: null,
  user: null,
};

export const PORTAL_HOME_PATHS = {
  vendor: '/vendor/dashboard',
  middleman: '/middleman/dashboard',
  farmer: '/farmer',
  customer: '/customer/dashboard',
};

/**
 * Normalize role strings across Registration ('Farmer', 'Vendor', 'Middle Man', 'Customer'),
 * Backend enums ('Farmer', 'Customer', 'Middleman', 'Supplier', 'Vendor'),
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

function readStoredAuthSession() {
  try {
    const raw = window.localStorage.getItem(AUTH_SESSION_STORAGE_KEY);
    if (!raw) return EMPTY_AUTH_SESSION;

    const parsed = JSON.parse(raw);
    if (!parsed || !parsed.isAuthenticated || !parsed.user) {
      return EMPTY_AUTH_SESSION;
    }

    const resolvedRole = normalizeRole(parsed.user.role);
    if (!resolvedRole) {
      return EMPTY_AUTH_SESSION;
    }

    if (parsed.expiresAt) {
      const expiryMs = new Date(parsed.expiresAt).getTime();
      if (!Number.isNaN(expiryMs) && expiryMs <= Date.now()) {
        window.localStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
        window.localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
        return EMPTY_AUTH_SESSION;
      }
    }

    const token =
      parsed.token ||
      parsed.accessToken ||
      parsed.user?.accessToken ||
      window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY) ||
      null;

    return {
      isAuthenticated: true,
      token,
      tokenType: parsed.tokenType || 'Bearer',
      expiresAt: parsed.expiresAt || null,
      user: {
        ...parsed.user,
        role: resolvedRole,
      },
    };
  } catch {
    return EMPTY_AUTH_SESSION;
  }
}

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [authSession, setAuthSession] = useState(() => readStoredAuthSession());

  const [vendorUser, setVendorUser] = useState(() =>
    readStorage(STORAGE_KEYS.VENDOR_PROFILE, INITIAL_VENDOR_PROFILE)
  );

  const isAuthenticated = Boolean(authSession?.isAuthenticated && authSession?.user);
  const token = authSession?.token || null;

  const currentUser = useMemo(() => {
    if (!authSession?.user) return null;
    return {
      ...authSession.user,
      role: normalizeRole(authSession.user.role),
    };
  }, [authSession]);

  const role = currentUser?.role || null;

  const logout = useCallback(() => {
    setAuthSession(EMPTY_AUTH_SESSION);
    try {
      window.localStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
      window.localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
    } catch {
      // Ignore storage errors
    }
  }, []);

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

    const accessToken =
      sanitizedUser.accessToken || sanitizedUser.token || null;
    const tokenType = sanitizedUser.tokenType || 'Bearer';
    const expiresAt = sanitizedUser.expiresAt || null;

    const nextSession = {
      isAuthenticated: true,
      token: accessToken,
      tokenType,
      expiresAt,
      user: {
        ...sanitizedUser,
        mobile: contactNum,
        contactNumber: contactNum,
        phone: contactNum,
        role: resolvedRole,
      },
    };

    setAuthSession(nextSession);
    writeStorage(AUTH_SESSION_STORAGE_KEY, nextSession);
    try {
      if (accessToken) {
        window.localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, accessToken);
      } else {
        window.localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
      }
    } catch {
      // Ignore storage errors
    }

    if (resolvedRole === 'vendor' && (sanitizedUser.fullName || contactNum)) {
      setVendorUser((prev) => {
        const nextVendor = {
          ...prev,
          ownerName: sanitizedUser.fullName || prev.ownerName,
          mobileNumber: contactNum || prev.mobileNumber,
          email: sanitizedUser.email || prev.email,
        };
        writeStorage(STORAGE_KEYS.VENDOR_PROFILE, nextVendor);
        return nextVendor;
      });
    }

    return nextSession.user;
  }, []);

  // Verify stored JWT token against GET /api/v1/role-access/profile on session load
  useEffect(() => {
    if (!isAuthenticated || !token) return undefined;

    const tracker = { active: true };
    fetchAuthenticatedProfile()
      .then((profile) => {
        if (!tracker.active || !profile?.success) return;
        const verifiedRole = normalizeRole(profile.role);
        if (!verifiedRole) return;

        setAuthSession((prev) => {
          if (!prev?.isAuthenticated) return prev;
          const contactNum =
            prev.user?.mobileVerifiedViaOtp && prev.user?.mobile
              ? prev.user.mobile
              : profile.mobile ||
                prev.user?.mobile ||
                prev.user?.contactNumber ||
                '';
          const updatedSession = {
            ...prev,
            user: {
              ...prev.user,
              userId: profile.userId ?? prev.user?.userId,
              fullName: profile.fullName || prev.user?.fullName || '',
              email: profile.email ?? prev.user?.email ?? null,
              mobile: contactNum,
              contactNumber: contactNum,
              phone: contactNum,
              role: verifiedRole,
            },
          };
          writeStorage(AUTH_SESSION_STORAGE_KEY, updatedSession);
          return updatedSession;
        });
      })
      .catch((err) => {
        if (tracker.active && err?.status === 401) {
          logout();
        }
      });

    return () => {
      tracker.active = false;
    };
  }, [isAuthenticated, token, logout]);

  const switchPortalRole = useCallback((targetRole) => {
    const normalized = normalizeRole(targetRole);
    if (!normalized) return;
    setAuthSession((prev) => {
      const nextSession = {
        ...(prev || EMPTY_AUTH_SESSION),
        isAuthenticated: true,
        user: {
          ...(prev?.user || {
            contactNumber: INITIAL_VENDOR_PROFILE.mobileNumber,
            fullName: INITIAL_VENDOR_PROFILE.ownerName,
          }),
          role: normalized,
        },
      };
      writeStorage(AUTH_SESSION_STORAGE_KEY, nextSession);
      return nextSession;
    });
  }, []);

  const updateUserMobile = useCallback((newMobile) => {
    const cleanedMobile = String(newMobile || '').replace(/\D/g, '');
    if (!/^[6-9]\d{9}$/.test(cleanedMobile)) return;

    setAuthSession((prev) => {
      if (!prev?.user) return prev;
      const nextSession = {
        ...prev,
        user: {
          ...prev.user,
          mobile: cleanedMobile,
          contactNumber: cleanedMobile,
          phone: cleanedMobile,
          mobileVerifiedViaOtp: true,
        },
      };
      writeStorage(AUTH_SESSION_STORAGE_KEY, nextSession);
      return nextSession;
    });
  }, []);

  const updateVendorProfile = useCallback(
    (updates) => {
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

      if (updates?.mobileNumber) {
        updateUserMobile(updates.mobileNumber);
      }
    },
    [updateUserMobile]
  );

  const value = useMemo(
    () => ({
      isAuthenticated,
      token,
      user: currentUser,
      role,
      vendorUser,
      login,
      switchPortalRole,
      logout,
      updateVendorProfile,
      updateUserMobile,
    }),
    [
      isAuthenticated,
      token,
      currentUser,
      role,
      vendorUser,
      login,
      switchPortalRole,
      logout,
      updateVendorProfile,
      updateUserMobile,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default AuthProvider;

