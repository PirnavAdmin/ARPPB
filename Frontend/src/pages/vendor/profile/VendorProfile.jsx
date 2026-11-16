import { useEffect, useCallback } from 'react';
import { ShieldCheck, RotateCcw, Building, MapPin } from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import { useVendor } from '../../../hooks/useVendor';
import { formatDate } from '../../../utils/formatDate';
import {
  fetchVendorProfile,
  fetchVendorBankDetails,
  updateVendorProfileApi,
  updateVendorBankDetailsApi,
  mapVendorDtoToProfile,
} from '../../../services/profileService';
import VendorPageHeader from '../VendorPageHeader';
import VendorStatusBadge from '../VendorStatusBadge';
import ProfileForm from './ProfileForm';
import BankDetailsForm from './BankDetailsForm';

export default function VendorProfile() {
  const { user, token, vendorUser, updateVendorProfile } = useAuth();
  const { resetDemoData } = useVendor();

  const resolvedVendorUser = {
    ...vendorUser,
    mobileNumber: vendorUser?.mobileNumber || user?.mobile || user?.contactNumber || '',
  };

  const loadVendorProfileFromApi = useCallback(async () => {
    if (!token) return;
    try {
      const profileDto = await fetchVendorProfile();
      let mergedDto = profileDto;
      const lookupId = profileDto?.id || profileDto?.vendorId;
      if (lookupId) {
        const byIdDto = await fetchVendorProfile(lookupId).catch(() => null);
        if (byIdDto && typeof byIdDto === 'object') {
          mergedDto = { ...profileDto, ...byIdDto };
        }
      }

      const bankDto = await fetchVendorBankDetails().catch(() => null);
      const mapped = mapVendorDtoToProfile(
        {
          ...(mergedDto || {}),
          ...(bankDto ? { bankDetails: bankDto } : {}),
        },
        vendorUser
      );
      updateVendorProfile(mapped);
    } catch {
      // Fallback to existing vendorUser state if backend is unreachable
    }
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    loadVendorProfileFromApi();
  }, [loadVendorProfileFromApi]);

  const handleSaveProfile = async (profileUpdates) => {
    updateVendorProfile(profileUpdates);
    if (token) {
      try {
        const updatedDto = await updateVendorProfileApi(
          profileUpdates,
          vendorUser?.id || null
        );
        if (updatedDto && typeof updatedDto === 'object') {
          updateVendorProfile(
            mapVendorDtoToProfile(updatedDto, {
              ...vendorUser,
              ...profileUpdates,
            })
          );
        }
      } catch {
        // Local profile state is already updated
      }
    }
  };

  const handleSaveBankDetails = async (bankUpdates) => {
    if (token) {
      const updatedBank = await updateVendorBankDetailsApi(bankUpdates);
      updateVendorProfile({
        bankDetails:
          updatedBank && typeof updatedBank === 'object'
            ? { ...bankUpdates, ...updatedBank }
            : bankUpdates,
      });
      return;
    }
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
              {(vendorUser?.businessName || user?.fullName || 'VN').slice(0, 2).toUpperCase()}
            </div>
          )}

          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-extrabold text-brand-text">
                {vendorUser?.businessName || 'Vendor Business'}
              </h2>
              <VendorStatusBadge status="Active" />
            </div>
            <p className="text-xs text-brand-muted flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-1">
                <Building className="w-3.5 h-3.5 text-brand-primary" />
                {vendorUser?.businessType || 'Enterprise'}
              </span>
              <span>•</span>
              <span className="inline-flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-brand-primary" />
                {vendorUser?.district
                  ? `${vendorUser.district}, ${vendorUser.state || ''} - ${vendorUser.pinCode || ''}`
                  : 'Location not set'}
              </span>
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
              <span className="px-2.5 py-0.5 rounded-md bg-brand-light text-brand-primary font-mono font-bold">
                Vendor ID: {vendorUser?.vendorId || '—'}
              </span>
              <span className="px-2.5 py-0.5 rounded-md bg-brand-background border border-brand-border font-mono font-semibold text-brand-text">
                GSTIN: {vendorUser?.gstNumber || '—'}
              </span>
              <span className="px-2.5 py-0.5 rounded-md bg-brand-background border border-brand-border font-mono font-semibold text-brand-text">
                APMC License: {vendorUser?.apmcLicense || '—'}
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
            Last Updated: {vendorUser?.updatedAt ? formatDate(vendorUser.updatedAt) : 'Not updated yet'}
          </p>
        </div>
      </div>

      {/* Profile Form */}
      <ProfileForm
        vendorUser={resolvedVendorUser}
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

