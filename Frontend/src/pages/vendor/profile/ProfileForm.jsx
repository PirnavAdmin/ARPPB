import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Building2, Save, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { profileSchema } from '../../../utils/validators';
import { AP_DISTRICTS } from '../../../utils/constants';
import VendorFormField from '../VendorFormField';
import VendorFileUpload from '../VendorFileUpload';

export default function ProfileForm({ vendorUser, onSaveProfile }) {
  const [logoUrl, setLogoUrl] = useState(vendorUser?.logoUrl || '');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      businessName: vendorUser?.businessName || '',
      ownerName: vendorUser?.ownerName || '',
      mobileNumber: vendorUser?.mobileNumber || '',
      email: vendorUser?.email || '',
      gstNumber: vendorUser?.gstNumber || '',
      businessRegNumber: vendorUser?.businessRegNumber || '',
      businessType:
        vendorUser?.businessType ||
        'Agri Procurement, Milling & Wholesale Distribution',
      businessAddress: vendorUser?.businessAddress || '',
      district: vendorUser?.district || 'Kurnool',
      state: vendorUser?.state || 'Andhra Pradesh',
      pinCode: vendorUser?.pinCode || '518003',
    },
  });

  const onSubmit = (data) => {
    onSaveProfile({
      ...data,
      logoUrl,
    });
    toast.success('Vendor business profile updated successfully.');
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="bg-brand-surface border border-brand-border rounded-xl p-5 space-y-5 shadow-xs"
    >
      <div className="flex items-center justify-between border-b border-brand-border pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-brand-light text-brand-primary">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-brand-text">
              Business & Statutory Profile
            </h2>
            <p className="text-xs text-brand-muted">
              Update registered enterprise identity, GSTIN, APMC details, and business logo
            </p>
          </div>
        </div>
        <span className="px-2.5 py-1 rounded-md bg-brand-light text-brand-primary font-mono text-xs font-bold">
          {vendorUser?.vendorId || 'VND-AP-2026-001'}
        </span>
      </div>

      {/* Business Logo Upload */}
      <div className="p-4 rounded-xl bg-brand-background/60 border border-brand-border">
        <VendorFileUpload
          label="Business Logo (Displayed on Invoices & Reports)"
          value={logoUrl}
          onChange={setLogoUrl}
          helperText="Upload PNG, JPG or WEBP corporate seal/logo (Max 2MB)"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <VendorFormField label="Vendor ID (Read-Only)">
          <input
            type="text"
            readOnly
            value={vendorUser?.vendorId || 'VND-AP-2026-001'}
            className="w-full px-3 py-2 text-sm font-mono font-bold rounded-lg border border-brand-border bg-brand-background text-brand-primary cursor-not-allowed"
          />
        </VendorFormField>

        <div className="md:col-span-2">
          <VendorFormField
            label="Business Name"
            required
            error={errors.businessName?.message}
          >
            <input
              type="text"
              {...register('businessName')}
              className="w-full px-3 py-2 text-sm rounded-lg border border-brand-border bg-brand-surface text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-primary"
            />
          </VendorFormField>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <VendorFormField
          label="Owner / Managing Director Name"
          required
          error={errors.ownerName?.message}
        >
          <input
            type="text"
            {...register('ownerName')}
            className="w-full px-3 py-2 text-sm rounded-lg border border-brand-border bg-brand-surface text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-primary"
          />
        </VendorFormField>

        <VendorFormField
          label="Mobile Number"
          required
          error={errors.mobileNumber?.message}
        >
          <input
            type="text"
            maxLength={10}
            {...register('mobileNumber')}
            className="w-full px-3 py-2 text-sm rounded-lg border border-brand-border bg-brand-surface text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-primary"
          />
        </VendorFormField>

        <VendorFormField label="Email Address" required error={errors.email?.message}>
          <input
            type="email"
            {...register('email')}
            className="w-full px-3 py-2 text-sm rounded-lg border border-brand-border bg-brand-surface text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-primary"
          />
        </VendorFormField>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <VendorFormField
          label="GST Number (GSTIN)"
          required
          error={errors.gstNumber?.message}
        >
          <input
            type="text"
            maxLength={15}
            {...register('gstNumber')}
            className="w-full px-3 py-2 text-sm font-mono uppercase rounded-lg border border-brand-border bg-brand-surface text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-primary"
          />
        </VendorFormField>

        <VendorFormField
          label="Business Registration Number (CIN / MSME)"
          required
          error={errors.businessRegNumber?.message}
        >
          <input
            type="text"
            {...register('businessRegNumber')}
            className="w-full px-3 py-2 text-sm font-mono rounded-lg border border-brand-border bg-brand-surface text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-primary"
          />
        </VendorFormField>

        <VendorFormField
          label="Business Type"
          required
          error={errors.businessType?.message}
        >
          <select
            {...register('businessType')}
            className="w-full px-3 py-2 text-sm rounded-lg border border-brand-border bg-brand-surface text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-primary"
          >
            <option value="Agri Procurement, Milling & Wholesale Distribution">
              Agri Procurement, Milling & Wholesale Distribution
            </option>
            <option value="Raw Commodity Processing & Oil Extraction Mill">
              Raw Commodity Processing & Oil Extraction Mill
            </option>
            <option value="APMC Licensed Commission & Bulk Trading House">
              APMC Licensed Commission & Bulk Trading House
            </option>
            <option value="FPO / Agro-Processing Cooperative Enterprise">
              FPO / Agro-Processing Cooperative Enterprise
            </option>
          </select>
        </VendorFormField>
      </div>

      <VendorFormField
        label="Business Address"
        required
        error={errors.businessAddress?.message}
      >
        <input
          type="text"
          {...register('businessAddress')}
          className="w-full px-3 py-2 text-sm rounded-lg border border-brand-border bg-brand-surface text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-primary"
        />
      </VendorFormField>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <VendorFormField label="District" required error={errors.district?.message}>
          <select
            {...register('district')}
            className="w-full px-3 py-2 text-sm rounded-lg border border-brand-border bg-brand-surface text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-primary"
          >
            {AP_DISTRICTS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </VendorFormField>

        <VendorFormField label="State" required error={errors.state?.message}>
          <input
            type="text"
            {...register('state')}
            className="w-full px-3 py-2 text-sm rounded-lg border border-brand-border bg-brand-surface text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-primary"
          />
        </VendorFormField>

        <VendorFormField label="PIN Code" required error={errors.pinCode?.message}>
          <input
            type="text"
            maxLength={6}
            {...register('pinCode')}
            className="w-full px-3 py-2 text-sm font-mono rounded-lg border border-brand-border bg-brand-surface text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-primary"
          />
        </VendorFormField>
      </div>

      <div className="flex items-center justify-end gap-2 pt-3 border-t border-brand-border">
        <button
          type="button"
          onClick={() => {
            reset();
            setLogoUrl(vendorUser?.logoUrl || '');
          }}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg border border-brand-border text-brand-text hover:bg-brand-background transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset Changes
        </button>
        <button
          type="submit"
          disabled={!isDirty && logoUrl === (vendorUser?.logoUrl || '')}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg bg-brand-primary text-white hover:bg-brand-secondary transition-colors disabled:opacity-50 cursor-pointer"
        >
          <Save className="w-4 h-4" />
          Save Business Profile
        </button>
      </div>
    </form>
  );
}

