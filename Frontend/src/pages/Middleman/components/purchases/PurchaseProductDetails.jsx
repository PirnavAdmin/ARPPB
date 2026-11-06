import React from 'react';
import { FormField } from '../common/FormField';
import {
  CROP_LIST,
  CROP_VARIETIES,
  QUALITY_GRADES,
  STANDARD_UNITS,
} from '../../../../utils/middleman/transactionHelpers';
import { formatINR } from '../../../../utils/middleman/formatters';

export const PurchaseProductDetails = ({
  formData,
  onChange,
  subtotal = 0,
  errors = {},
}) => {
  const availableVarieties = formData.cropName ? CROP_VARIETIES[formData.cropName] || [] : [];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        {/* Crop Name */}
        <FormField label="Crop Name" name="cropName" required error={errors.cropName}>
          <select
            name="cropName"
            value={formData.cropName}
            onChange={onChange}
            className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-[#E2E8F0] focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/15 outline-none bg-white font-medium cursor-pointer"
          >
            <option value="">Select Crop</option>
            {CROP_LIST.map((crop) => (
              <option key={crop} value={crop}>
                {crop}
              </option>
            ))}
          </select>
        </FormField>

        {/* Variety */}
        <FormField label="Crop Variety" name="variety">
          <input
            type="text"
            name="variety"
            list="variety-list"
            value={formData.variety}
            onChange={onChange}
            placeholder="Select or enter variety"
            className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-[#E2E8F0] focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/15 outline-none"
          />
          <datalist id="variety-list">
            {availableVarieties.map((v) => (
              <option key={v} value={v} />
            ))}
          </datalist>
        </FormField>

        {/* Quality Grade */}
        <FormField label="Quality Grade" name="quality">
          <select
            name="quality"
            value={formData.quality}
            onChange={onChange}
            className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-[#E2E8F0] focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/15 outline-none bg-white font-medium cursor-pointer"
          >
            {QUALITY_GRADES.map((grade) => (
              <option key={grade} value={grade}>
                {grade}
              </option>
            ))}
          </select>
        </FormField>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5 items-end">
        {/* Purchased Quantity */}
        <FormField label="Purchased Quantity" name="quantity" required error={errors.quantity}>
          <input
            type="number"
            name="quantity"
            min="1"
            step="any"
            value={formData.quantity}
            onChange={onChange}
            placeholder="e.g. 100"
            className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-[#E2E8F0] focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/15 outline-none font-bold"
          />
        </FormField>

        {/* Unit */}
        <FormField label="Unit of Measure" name="unit">
          <select
            name="unit"
            value={formData.unit}
            onChange={onChange}
            className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-[#E2E8F0] focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/15 outline-none bg-white font-medium cursor-pointer"
          >
            {STANDARD_UNITS.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
        </FormField>

        {/* Price per Unit */}
        <FormField label={`Price per ${formData.unit || 'Unit'} (₹)`} name="rate" required error={errors.rate}>
          <input
            type="number"
            name="rate"
            min="1"
            step="any"
            value={formData.rate}
            onChange={onChange}
            placeholder="Rate in ₹"
            className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-[#E2E8F0] focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/15 outline-none font-bold"
          />
        </FormField>

        {/* Dynamic Subtotal Display */}
        <div className="p-2.5 rounded-xl bg-slate-50 border border-[#E2E8F0] flex flex-col justify-center h-[42px]">
          <span className="text-[10px] text-[#64748B] font-semibold uppercase">Product Subtotal</span>
          <span className="text-sm font-extrabold text-[#0F766E] truncate">
            {formatINR(subtotal)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default PurchaseProductDetails;

