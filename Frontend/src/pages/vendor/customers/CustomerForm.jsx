import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { customerSchema } from '../../../utils/validators';
import { AP_DISTRICTS, INDIAN_STATES } from '../../../utils/constants';
import VendorFormField, { INPUT_CLASSES } from '../VendorFormField';

export function CustomerForm({
  initialData = null,
  nextCustomerId = 'CUST-0011',
  onSubmit,
  onCancel,
}) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      customerName: initialData?.customerName || '',
      businessName: initialData?.businessName || '',
      mobileNumber: initialData?.mobileNumber || '',
      email: initialData?.email || '',
      gstNumber: initialData?.gstNumber || '',
      pan: initialData?.pan || '',
      address: initialData?.address || '',
      district: initialData?.district || 'Kurnool',
      state: initialData?.state || 'Andhra Pradesh',
      pinCode: initialData?.pinCode || '',
      creditLimit: initialData?.creditLimit ?? 250000,
      openingBalance: initialData?.openingBalance ?? 0,
      status: initialData?.status || 'Active',
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <VendorFormField label="Customer ID (Auto-generated)" id="cust-id">
          <input
            id="cust-id"
            type="text"
            readOnly
            disabled
            value={initialData?.id || nextCustomerId}
            className={`${INPUT_CLASSES} font-mono font-bold text-brand-primary`}
          />
        </VendorFormField>

        <VendorFormField
          label="Customer Name"
          id="customerName"
          required
          error={errors.customerName?.message}
        >
          <input
            id="customerName"
            type="text"
            placeholder="e.g., Surya Prakash Somani"
            {...register('customerName')}
            className={INPUT_CLASSES}
          />
        </VendorFormField>

        <VendorFormField
          label="Business Name (Optional)"
          id="businessName"
          error={errors.businessName?.message}
        >
          <input
            id="businessName"
            type="text"
            placeholder="e.g., Annapurna Wholesale Supermart"
            {...register('businessName')}
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
            placeholder="buyer@company.in"
            {...register('email')}
            className={INPUT_CLASSES}
          />
        </VendorFormField>

        <VendorFormField label="GST Number" id="gstNumber" error={errors.gstNumber?.message}>
          <input
            id="gstNumber"
            type="text"
            maxLength={15}
            placeholder="e.g., 37AABCA8891D1Z3"
            {...register('gstNumber')}
            className={`${INPUT_CLASSES} uppercase`}
          />
        </VendorFormField>

        <VendorFormField label="PAN Number" id="pan" error={errors.pan?.message}>
          <input
            id="pan"
            type="text"
            maxLength={10}
            placeholder="e.g., AABCA8891D"
            {...register('pan')}
            className={`${INPUT_CLASSES} uppercase`}
          />
        </VendorFormField>

        <VendorFormField
          label="Credit Limit (₹)"
          id="creditLimit"
          error={errors.creditLimit?.message}
        >
          <input
            id="creditLimit"
            type="number"
            step="1000"
            min="0"
            {...register('creditLimit')}
            className={INPUT_CLASSES}
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
      </div>

      {/* Location Details */}
      <div className="pt-3 border-t border-brand-border grid grid-cols-1 sm:grid-cols-4 gap-4">
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
            placeholder="e.g., 518004"
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

      <VendorFormField label="Delivery Address" id="address" required error={errors.address?.message}>
        <input
          id="address"
          type="text"
          placeholder="Plot No, Industrial Estate / Market Road, City"
          {...register('address')}
          className={INPUT_CLASSES}
        />
      </VendorFormField>

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
          {initialData ? 'Save Changes' : 'Register Customer'}
        </button>
      </div>
    </form>
  );
}

export default CustomerForm;

