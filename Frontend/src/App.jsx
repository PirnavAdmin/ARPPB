import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { VendorProvider } from './context/VendorContext';
import AppRoutes from './routes/AppRoutes';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NotificationProvider>
          <VendorProvider>
            <AppRoutes />
            <Toaster position="top-right" richColors closeButton />
          </VendorProvider>
        </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
