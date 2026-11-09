import React from 'react';
import { FormField } from '../common/FormField';

export const PurchaseCharges = ({
  formData,
  onChange,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
      <FormField label="Transportation Charges (₹)" name="transportation">
        <input
          type="number"
          name="transportation"
          min="0"
          value={formData.transportation}
          onChange={onChange}
          placeholder="0"
          className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-[#E2E8F0] focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/15 outline-none font-medium"
        />
      </FormField>

      <FormField label="Loading / Weighing Charges (₹)" name="loading">
        <input
          type="number"
          name="loading"
          min="0"
          value={formData.loading}
          onChange={onChange}
          placeholder="0"
          className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-[#E2E8F0] focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/15 outline-none font-medium"
        />
      </FormField>

      <FormField label="Other Miscellaneous Charges (₹)" name="otherCharges">
        <input
          type="number"
          name="otherCharges"
          min="0"
          value={formData.otherCharges}
          onChange={onChange}
          placeholder="0"
          className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-[#E2E8F0] focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/15 outline-none font-medium"
        />
      </FormField>
    </div>
  );
};

export default PurchaseCharges;

