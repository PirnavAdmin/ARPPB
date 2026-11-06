import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Landmark, Eye, EyeOff, ShieldAlert, Save, Edit3 } from 'lucide-react';
import { toast } from 'sonner';
import { bankDetailsSchema } from '../../../utils/validators';
import { maskAccountNumber } from '../../../utils/formatCurrency';
import VendorFormField from '../VendorFormField';
import VendorConfirmDialog from '../VendorConfirmDialog';

export default function BankDetailsForm({ bankDetails, onSaveBankDetails }) {
  const [isEditing, setIsEditing] = useState(false);
  const [showFullAccount, setShowFullAccount] = useState(false);
  const [pendingData, setPendingData] = useState(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(bankDetailsSchema),
    defaultValues: {
      accountHolderName:
        bankDetails?.accountHolderName ||
        'Sri Rayalaseema Agri Commodities & Processing Pvt. Ltd.',
      bankName: bankDetails?.bankName || 'State Bank of India',
      accountNumber: bankDetails?.accountNumber || '38910244551290',
      ifscCode: bankDetails?.ifscCode || 'SBIN0000860',
      branchName: bankDetails?.branchName || 'Kurnool Main Treasury Branch',
    },
  });

  const handleStageConfirm = (data) => {
    setPendingData(data);
  };

  const handleConfirmSave = () => {
    if (!pendingData) return;
    onSaveBankDetails(pendingData);
    setPendingData(null);
    setIsEditing(false);
    toast.success('Vendor settlement bank details updated after security confirmation.');
  };

  return (
    <div className="bg-brand-surface border border-brand-border rounded-xl p-5 space-y-5 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-brand-border pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-brand-light text-brand-primary">
            <Landmark className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-brand-text">
              Primary Treasury & Settlement Bank Details
            </h2>
            <p className="text-xs text-brand-muted">
              Used for customer NEFT/RTGS invoice remittances and farmer disbursement reconciliation
            </p>
          </div>
        </div>

        {!isEditing && (
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-brand-light text-brand-primary hover:bg-brand-primary hover:text-white transition-colors cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5" />
            Modify Bank Details
          </button>
        )}
      </div>

      {!isEditing ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4 rounded-xl bg-brand-background/70 border border-brand-border text-xs">
            <div>
              <span className="text-brand-muted block mb-0.5">Account Holder Name</span>
              <span className="font-bold text-brand-text">
                {bankDetails?.accountHolderName}
              </span>
            </div>
            <div>
              <span className="text-brand-muted block mb-0.5">Bank Name</span>
              <span className="font-bold text-brand-text">{bankDetails?.bankName}</span>
            </div>
            <div>
              <span className="text-brand-muted block mb-0.5">Branch Name</span>
              <span className="font-semibold text-brand-text">
                {bankDetails?.branchName}
              </span>
            </div>
            <div>
              <span className="text-brand-muted block mb-0.5">
                Bank Account Number (Masked)
              </span>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-brand-primary text-sm">
                  {showFullAccount
                    ? bankDetails?.accountNumber
                    : maskAccountNumber(bankDetails?.accountNumber)}
                </span>
                <button
                  type="button"
                  onClick={() => setShowFullAccount((p) => !p)}
                  className="text-brand-muted hover:text-brand-primary cursor-pointer"
                  title={showFullAccount ? 'Mask Account Number' : 'Reveal Account Number'}
                >
                  {showFullAccount ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
            <div>
              <span className="text-brand-muted block mb-0.5">IFSC Code</span>
              <span className="font-mono font-bold text-brand-text">
                {bankDetails?.ifscCode}
              </span>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-brand-light/40 border border-brand-primary/20 text-xs text-brand-text flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-brand-primary shrink-0" />
            <span>
              Sensitive bank account numbers are masked by default. Updating bank details
              requires explicit confirmation.
            </span>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit(handleStageConfirm)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <VendorFormField
              label="Account Holder Name"
              required
              error={errors.accountHolderName?.message}
            >
              <input
                type="text"
                {...register('accountHolderName')}
                className="w-full px-3 py-2 text-sm rounded-lg border border-brand-border bg-brand-surface text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-primary"
              />
            </VendorFormField>

            <VendorFormField
              label="Bank Name"
              required
              error={errors.bankName?.message}
            >
              <input
                type="text"
                {...register('bankName')}
                className="w-full px-3 py-2 text-sm rounded-lg border border-brand-border bg-brand-surface text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-primary"
              />
            </VendorFormField>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <VendorFormField
              label="Account Number"
              required
              error={errors.accountNumber?.message}
            >
              <input
                type="text"
                {...register('accountNumber')}
                className="w-full px-3 py-2 text-sm font-mono rounded-lg border border-brand-border bg-brand-surface text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-primary"
              />
            </VendorFormField>

            <VendorFormField
              label="IFSC Code"
              required
              error={errors.ifscCode?.message}
            >
              <input
                type="text"
                maxLength={11}
                {...register('ifscCode')}
                className="w-full px-3 py-2 text-sm font-mono uppercase rounded-lg border border-brand-border bg-brand-surface text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-primary"
              />
            </VendorFormField>

            <VendorFormField
              label="Branch Name"
              required
              error={errors.branchName?.message}
            >
              <input
                type="text"
                {...register('branchName')}
                className="w-full px-3 py-2 text-sm rounded-lg border border-brand-border bg-brand-surface text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-primary"
              />
            </VendorFormField>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-brand-border">
            <button
              type="button"
              onClick={() => {
                reset();
                setIsEditing(false);
              }}
              className="px-4 py-2 text-xs font-semibold rounded-lg border border-brand-border text-brand-text hover:bg-brand-background cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg bg-brand-primary text-white hover:bg-brand-secondary transition-colors cursor-pointer"
            >
              <Save className="w-4 h-4" />
              Verify & Update Bank Details
            </button>
          </div>
        </form>
      )}

      {/* Confirmation Dialog before saving sensitive bank details */}
      <VendorConfirmDialog
        isOpen={Boolean(pendingData)}
        onClose={() => setPendingData(null)}
        onConfirm={handleConfirmSave}
        title="Confirm Treasury Bank Details Update"
        description={`Are you sure you want to update your settlement bank account to ${
          pendingData?.bankName || ''
        } (IFSC: ${
          pendingData?.ifscCode || ''
        })? All future customer tax invoices will display these updated remittance details.`}
        confirmLabel="Confirm & Save Bank Details"
        variant="warning"
      />
    </div>
  );
}

