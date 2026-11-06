import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { farmerSchema } from '../../../utils/validators';
import { CROP_OPTIONS, AP_DISTRICTS, INDIAN_STATES } from '../../../utils/constants';
import VendorFormField, { INPUT_CLASSES } from '../VendorFormField';

export function FarmerForm({ initialData = null, nextFarmerId = 'FARM-0012', onSubmit, onCancel }) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(farmerSchema),
    defaultValues: {
      farmerName: initialData?.farmerName || '',
      fatherName: initialData?.fatherName || '',
      mobileNumber: initialData?.mobileNumber || '',
      email: initialData?.email || '',
      village: initialData?.village || '',
      mandal: initialData?.mandal || '',
      district: initialData?.district || 'Kurnool',
      state: initialData?.state || 'Andhra Pradesh',
      pinCode: initialData?.pinCode || '',
      availableCrops: initialData?.availableCrops || ['Paddy'],
      address: initialData?.address || '',
      aadhaarId: initialData?.aadhaarId || '',
      bankName: initialData?.bankName || '',
      accountNumber: initialData?.accountNumber || '',
      ifscCode: initialData?.ifscCode || '',
      status: initialData?.status || 'Active',
    },
  });

  const selectedCrops = watch('availableCrops') || [];

  const toggleCrop = (crop) => {
    const next = selectedCrops.includes(crop)
      ? selectedCrops.filter((c) => c !== crop)
      : [...selectedCrops, crop];
    setValue('availableCrops', next, { shouldValidate: true });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Personal & Contact Information */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <VendorFormField label="Farmer ID (Auto-generated)" id="farmer-id">
          <input
            id="farmer-id"
            type="text"
            readOnly
            disabled
            value={initialData?.id || nextFarmerId}
            className={`${INPUT_CLASSES} font-mono font-bold text-brand-primary`}
          />
        </VendorFormField>

        <VendorFormField
          label="Farmer Name"
          id="farmerName"
          required
          error={errors.farmerName?.message}
        >
          <input
            id="farmerName"
            type="text"
            placeholder="e.g., Venkateswarlu Reddy"
            {...register('farmerName')}
            className={INPUT_CLASSES}
          />
        </VendorFormField>

        <VendorFormField
          label="Father Name"
          id="fatherName"
          error={errors.fatherName?.message}
        >
          <input
            id="fatherName"
            type="text"
            placeholder="e.g., Subba Reddy"
            {...register('fatherName')}
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
            placeholder="farmer@agrimail.in"
            {...register('email')}
            className={INPUT_CLASSES}
          />
        </VendorFormField>

        <VendorFormField
          label="Aadhaar / Kisan ID (Masked)"
          id="aadhaarId"
          hint="Stored & displayed in masked format"
        >
          <input
            id="aadhaarId"
            type="text"
            placeholder="XXXX XXXX 1234"
            {...register('aadhaarId')}
            className={INPUT_CLASSES}
          />
        </VendorFormField>
      </div>

      {/* Location Details */}
      <div className="pt-3 border-t border-brand-border grid grid-cols-1 sm:grid-cols-3 gap-4">
        <VendorFormField label="Village" id="village" required error={errors.village?.message}>
          <input
            id="village"
            type="text"
            placeholder="e.g., Bethamcherla"
            {...register('village')}
            className={INPUT_CLASSES}
          />
        </VendorFormField>

        <VendorFormField label="Mandal" id="mandal" error={errors.mandal?.message}>
          <input
            id="mandal"
            type="text"
            placeholder="e.g., Bethamcherla"
            {...register('mandal')}
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
            placeholder="e.g., 518599"
            {...register('pinCode')}
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

      <VendorFormField label="Full Address" id="address">
        <input
          id="address"
          type="text"
          placeholder="House No, Street, Landmark, Village"
          {...register('address')}
          className={INPUT_CLASSES}
        />
      </VendorFormField>

      {/* Multi-select Available Crops */}
      <VendorFormField
        label="Available Crops (Multi-select)"
        id="availableCrops"
        required
        error={errors.availableCrops?.message}
      >
        <div className="flex flex-wrap gap-2 p-3 rounded-xl bg-brand-background border border-brand-border">
          {CROP_OPTIONS.map((crop) => {
            const active = selectedCrops.includes(crop);
            return (
              <button
                key={crop}
                type="button"
                onClick={() => toggleCrop(crop)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                  active
                    ? 'bg-brand-primary text-white border-brand-primary'
                    : 'bg-brand-surface text-brand-text border-brand-border hover:bg-brand-light hover:text-brand-primary'
                }`}
              >
                {crop}
              </button>
            );
          })}
        </div>
      </VendorFormField>

      {/* Optional Bank Details */}
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
              placeholder="e.g., SBIN0002714"
              {...register('ifscCode')}
              className={INPUT_CLASSES}
            />
          </VendorFormField>
        </div>
      </div>

      {/* Actions */}
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
          {initialData ? 'Save Changes' : 'Register Farmer'}
        </button>
      </div>
    </form>
  );
}

export default FarmerForm;

