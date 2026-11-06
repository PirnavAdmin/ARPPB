import React from 'react';
import { Landmark } from 'lucide-react';
import { FormField } from '../common/FormField';

export const BankDetails = ({
  data = {},
  onChange,
  disabled = false,
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 pb-2 border-b border-[#E2E8F0]">
        <Landmark className="w-4 h-4 text-[#0F766E]" />
        <h3 className="text-xs sm:text-sm font-bold text-[#1F2937] uppercase tracking-wider">
          Bank Settlement Details (Optional)
        </h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Account Holder Name" name="accountHolderName" optional>
          <input
            type="text"
            name="accountHolderName"
            value={data.accountHolderName || ''}
            onChange={onChange}
            disabled={disabled}
            placeholder="Official business account name"
            className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-[#E2E8F0] focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/15 outline-none disabled:bg-slate-50 disabled:text-slate-500"
          />
        </FormField>

        <FormField label="Bank Name" name="bankName" optional>
          <input
            type="text"
            name="bankName"
            value={data.bankName || ''}
            onChange={onChange}
            disabled={disabled}
            placeholder="e.g. State Bank of India"
            className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-[#E2E8F0] focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/15 outline-none disabled:bg-slate-50 disabled:text-slate-500"
          />
        </FormField>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <FormField label="Account Number" name="accountNumber" optional>
          <input
            type="text"
            name="accountNumber"
            value={data.accountNumber || ''}
            onChange={onChange}
            disabled={disabled}
            placeholder="Bank account number"
            className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-[#E2E8F0] focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/15 outline-none font-mono disabled:bg-slate-50 disabled:text-slate-500"
          />
        </FormField>

        <FormField label="IFSC Code" name="ifscCode" optional>
          <input
            type="text"
            name="ifscCode"
            value={data.ifscCode || ''}
            onChange={onChange}
            disabled={disabled}
            placeholder="SBIN0001234"
            className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-[#E2E8F0] focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/15 outline-none uppercase font-mono disabled:bg-slate-50 disabled:text-slate-500"
          />
        </FormField>

        <FormField label="Branch Name" name="branchName" optional>
          <input
            type="text"
            name="branchName"
            value={data.branchName || ''}
            onChange={onChange}
            disabled={disabled}
            placeholder="e.g. Market Yard Branch"
            className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-[#E2E8F0] focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/15 outline-none disabled:bg-slate-50 disabled:text-slate-500"
          />
        </FormField>
      </div>
    </div>
  );
};

export default BankDetails;
