import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { middlemanSchema } from '../../../utils/validators';
import { AP_DISTRICTS, INDIAN_STATES } from '../../../utils/constants';
import VendorFormField, { INPUT_CLASSES } from '../VendorFormField';

export function MiddlemanForm({
  initialData = null,
  nextMiddlemanId = 'MID-0007',
  onSubmit,
  onCancel,
}) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(middlemanSchema),
    defaultValues: {
      businessName: initialData?.businessName || '',
      ownerName: initialData?.ownerName || '',
      mobileNumber: initialData?.mobileNumber || '',
      email: initialData?.email || '',
      gstNumber: initialData?.gstNumber || '',
      pan: initialData?.pan || '',
      address: initialData?.address || '',
      village: initialData?.village || '',
      district: initialData?.district || 'Kurnool',
      state: initialData?.state || 'Andhra Pradesh',
      pinCode: initialData?.pinCode || '',
      bankName: initialData?.bankName || '',
      accountNumber: initialData?.accountNumber || '',
      ifscCode: initialData?.ifscCode || '',
      openingBalance: initialData?.openingBalance ?? 0,
      status: initialData?.status || 'Active',
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <VendorFormField label="Middleman ID (Auto-generated)" id="mid-id">
          <input
            id="mid-id"
            type="text"
            readOnly
            disabled
            value={initialData?.id || nextMiddlemanId}
            className={`${INPUT_CLASSES} font-mono font-bold text-brand-primary`}
          />
        </VendorFormField>

        <VendorFormField
          label="Business Name"
          id="businessName"
          required
          error={errors.businessName?.message}
        >
          <input
            id="businessName"
            type="text"
            placeholder="e.g., Sri Sai Krupa Mandi Traders"
            {...register('businessName')}
            className={INPUT_CLASSES}
          />
        </VendorFormField>

        <VendorFormField
          label="Owner Name"
          id="ownerName"
          required
          error={errors.ownerName?.message}
        >
          <input
            id="ownerName"
            type="text"
            placeholder="e.g., K. Madhusudhan Rao"
            {...register('ownerName')}
            className={INPUT_CLASSES}
          />
        </VendorFormField>

        <VendorFormField
          label="Mobile Number"
          id="mobileNumber"
          required
          error={errors.mobileNumber?.message}
        >
          <input
            id="mobileNumber"
            type="tel"
            maxLength={10}
            placeholder="10-digit mobile number"
            {...register('mobileNumber')}
            className={INPUT_CLASSES}
          />
        </VendorFormField>

        <VendorFormField label="Email Address" id="email" error={errors.email?.message}>
          <input
            id="email"
            type="email"
            placeholder="trader@mandicorp.in"
            {...register('email')}
            className={INPUT_CLASSES}
          />
        </VendorFormField>

        <VendorFormField label="GST Number" id="gstNumber" error={errors.gstNumber?.message}>
          <input
            id="gstNumber"
            type="text"
            maxLength={15}
            placeholder="e.g., 37AABCS4812F1Z2"
            {...register('gstNumber')}
            className={`${INPUT_CLASSES} uppercase`}
          />
        </VendorFormField>

        <VendorFormField label="PAN Number" id="pan" error={errors.pan?.message}>
          <input
            id="pan"
            type="text"
            maxLength={10}
            placeholder="e.g., AABCS4812F"
            {...register('pan')}
            className={`${INPUT_CLASSES} uppercase`}
          />
        </VendorFormField>

        <VendorFormField
          label="Opening Balance (₹)"
          id="openingBalance"
          error={errors.openingBalance?.message}
        >
          <input
            id="openingBalance"
            type="number"
            step="0.01"
            min="0"
            {...register('openingBalance')}
            className={INPUT_CLASSES}
          />
        </VendorFormField>

        <VendorFormField label="Status" id="status" required>
          <select id="status" {...register('status')} className={INPUT_CLASSES}>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </VendorFormField>
      </div>

      {/* Location Details */}
      <div className="pt-3 border-t border-brand-border grid grid-cols-1 sm:grid-cols-4 gap-4">
        <VendorFormField label="Village / Town" id="village">
          <input
            id="village"
            type="text"
            placeholder="e.g., Kurnool Urban"
            {...register('village')}
            className={INPUT_CLASSES}
          />
        </VendorFormField>

        <VendorFormField label="District" id="district" required error={errors.district?.message}>
          <select id="district" {...register('district')} className={INPUT_CLASSES}>
            {AP_DISTRICTS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </VendorFormField>

        <VendorFormField label="State" id="state" required error={errors.state?.message}>
          <select id="state" {...register('state')} className={INPUT_CLASSES}>
            {INDIAN_STATES.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>
        </VendorFormField>

        <VendorFormField label="PIN Code" id="pinCode" error={errors.pinCode?.message}>
          <input
            id="pinCode"
            type="text"
            maxLength={6}
            placeholder="e.g., 518003"
            {...register('pinCode')}
            className={INPUT_CLASSES}
          />
        </VendorFormField>
      </div>

      <VendorFormField label="Business Address" id="address" required error={errors.address?.message}>
        <input
          id="address"
          type="text"
          placeholder="Shop No, Market Yard, Road Name"
          {...register('address')}
          className={INPUT_CLASSES}
        />
      </VendorFormField>

      {/* Bank Details */}
      <div className="pt-3 border-t border-brand-border">
        <h4 className="text-xs font-bold uppercase tracking-wider text-brand-primary mb-3">
          Bank Settlement Details (Optional)
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <VendorFormField label="Bank Name" id="bankName">
            <input
              id="bankName"
              type="text"
              placeholder="e.g., State Bank of India"
              {...register('bankName')}
              className={INPUT_CLASSES}
            />
          </VendorFormField>
          <VendorFormField label="Account Number" id="accountNumber">
            <input
              id="accountNumber"
              type="text"
              placeholder="Account Number"
              {...register('accountNumber')}
              className={INPUT_CLASSES}
            />
          </VendorFormField>
          <VendorFormField label="IFSC Code" id="ifscCode">
            <input
              id="ifscCode"
              type="text"
              placeholder="e.g., SBIN0000860"
              {...register('ifscCode')}
              className={INPUT_CLASSES}
            />
          </VendorFormField>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-brand-border">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded-lg text-xs font-semibold bg-brand-light text-brand-primary hover:bg-brand-secondary hover:text-white transition-colors cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-5 py-2 rounded-lg text-xs font-semibold bg-brand-primary text-white hover:bg-brand-secondary transition-colors cursor-pointer"
        >
          {initialData ? 'Save Changes' : 'Register Middleman'}
        </button>
      </div>
    </form>
  );
}

export default MiddlemanForm;

