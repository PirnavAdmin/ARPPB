import { ShieldCheck, LogIn, Building2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, vendorUser, login } = useAuth();

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-brand-background flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-brand-surface border border-brand-border rounded-2xl p-8 shadow-sm text-center space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-brand-primary text-white flex items-center justify-center mx-auto shadow-xs">
            <Building2 className="w-8 h-8" />
          </div>

          <div className="space-y-1.5">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-brand-light text-brand-primary text-xs font-bold">
              <ShieldCheck className="w-3.5 h-3.5" />
              Agri Raw Product Purchase & Billing ERP
            </span>
            <h1 className="text-xl font-extrabold text-brand-text">
              Vendor Portal Session Locked
            </h1>
            <p className="text-xs text-brand-muted leading-relaxed">
              You have signed out of the enterprise Vendor Portal for{' '}
              <strong>{vendorUser?.businessName}</strong> ({vendorUser?.vendorId}).
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-brand-background border border-brand-border text-left text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-brand-muted">Authorized Operator:</span>
              <span className="font-bold text-brand-text">{vendorUser?.ownerName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-brand-muted">Branch Location:</span>
              <span className="font-semibold text-brand-primary">
                {vendorUser?.district}, {vendorUser?.state}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => login()}
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-brand-primary text-white text-sm font-bold hover:bg-brand-secondary transition-colors cursor-pointer"
          >
            <LogIn className="w-4 h-4" />
            Sign Back In to Vendor Portal
          </button>
        </div>
      </div>
    );
  }

  return children;
}

