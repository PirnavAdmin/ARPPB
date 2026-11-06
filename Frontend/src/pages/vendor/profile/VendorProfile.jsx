import { ShieldCheck, RotateCcw, Building, Award, MapPin } from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import { useVendor } from '../../../hooks/useVendor';
import { formatDate } from '../../../utils/formatDate';
import VendorPageHeader from '../VendorPageHeader';
import VendorStatusBadge from '../VendorStatusBadge';
import ProfileForm from './ProfileForm';
import BankDetailsForm from './BankDetailsForm';

export default function VendorProfile() {
  const { vendorUser, updateVendorProfile } = useAuth();
  const { resetDemoData } = useVendor();

  const handleSaveProfile = (profileUpdates) => {
    updateVendorProfile(profileUpdates);
  };

  const handleSaveBankDetails = (bankUpdates) => {
    updateVendorProfile({
      bankDetails: bankUpdates,
    });
  };

  return (
    <div className="space-y-6">
      <VendorPageHeader
        title="My Vendor Profile & Treasury Settings"
        subtitle="Manage your enterprise registration, GSTIN, APMC mandi license, business logo, and settlement bank account"
        badge="Verified Enterprise Vendor"
        actions={
          <button
            type="button"
            onClick={resetDemoData}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg border border-brand-border bg-brand-surface text-brand-text hover:bg-brand-light/40 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4 text-brand-primary" />
            Restore Default Demo ERP Dataset
          </button>
        }
      />

      {/* Enterprise Identity Summary Card */}
      <div className="bg-brand-surface border border-brand-border rounded-xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-4">
          {vendorUser?.logoUrl ? (
            <img
              src={vendorUser.logoUrl}
              alt="Vendor Logo"
              className="w-16 h-16 rounded-xl object-cover border border-brand-border"
            />
          ) : (
            <div className="w-16 h-16 rounded-xl bg-brand-primary text-white flex items-center justify-center font-extrabold text-xl shrink-0">
              SR
            </div>
          )}

          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-extrabold text-brand-text">
                {vendorUser?.businessName}
              </h2>
              <VendorStatusBadge status="Active" />
            </div>
            <p className="text-xs text-brand-muted flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-1">
                <Building className="w-3.5 h-3.5 text-brand-primary" />
                {vendorUser?.businessType}
              </span>
              <span>•</span>
              <span className="inline-flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-brand-primary" />
                {vendorUser?.district}, {vendorUser?.state} - {vendorUser?.pinCode}
              </span>
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
              <span className="px-2.5 py-0.5 rounded-md bg-brand-light text-brand-primary font-mono font-bold">
                Vendor ID: {vendorUser?.vendorId}
              </span>
              <span className="px-2.5 py-0.5 rounded-md bg-brand-background border border-brand-border font-mono font-semibold text-brand-text">
                GSTIN: {vendorUser?.gstNumber}
              </span>
              <span className="px-2.5 py-0.5 rounded-md bg-brand-background border border-brand-border font-mono font-semibold text-brand-text">
                APMC License: {vendorUser?.apmcLicense || 'AP-KNL-MKT-4491/2026'}
              </span>
            </div>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-brand-light/40 border border-brand-primary/20 text-xs space-y-1 shrink-0">
          <div className="flex items-center gap-1.5 font-bold text-brand-primary">
            <ShieldCheck className="w-4 h-4" />
            <span>ERP Compliance Status</span>
          </div>
          <p className="text-brand-text">
            OTP Security & GST Billing Enabled
          </p>
          <p className="text-[11px] text-brand-muted">
            Last Updated: {formatDate(vendorUser?.updatedAt || '2026-11-05')}
          </p>
        </div>
      </div>

      {/* Profile Form */}
      <ProfileForm
        vendorUser={vendorUser}
        onSaveProfile={handleSaveProfile}
      />

      {/* Bank Details Form */}
      <BankDetailsForm
        bankDetails={vendorUser?.bankDetails}
        onSaveBankDetails={handleSaveBankDetails}
      />
    </div>
  );
}

