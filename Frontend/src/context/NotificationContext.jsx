import { createContext, useContext, useCallback, useMemo } from 'react';
import { toast } from 'sonner';

export const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const notifySuccess = useCallback((title, description = '') => {
    toast.success(title, { description });
  }, []);

  const notifyError = useCallback((title, description = '') => {
    toast.error(title, { description });
  }, []);

  const notifyWarning = useCallback((title, description = '') => {
    toast.warning(title, { description });
  }, []);

  const notifyInfo = useCallback((title, description = '') => {
    toast.info(title, { description });
  }, []);

  const value = useMemo(
    () => ({
      notifySuccess,
      notifyError,
      notifyWarning,
      notifyInfo,
    }),
    [notifySuccess, notifyError, notifyWarning, notifyInfo]
  );

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotificationToast() {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error('useNotificationToast must be used within NotificationProvider');
  }
  return ctx;
}

export default NotificationProvider;

