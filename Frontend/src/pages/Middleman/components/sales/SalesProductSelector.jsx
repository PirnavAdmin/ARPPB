import React from 'react';
import { Boxes } from 'lucide-react';
import { FormField } from '../common/FormField';
import { CROP_LIST, QUALITY_GRADES, STANDARD_UNITS } from '../../../../utils/middleman/transactionHelpers';
import { formatINR, formatIndianNumber } from '../../../../utils/middleman/formatters';

export const SalesProductSelector = ({
  formData,
  onChange,
  availableStock = 0,
  subtotal = 0,
  errors = {},
}) => {
  const isOverStock = Number(formData.quantity) > availableStock;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        {/* Select Crop */}
        <FormField label="Select Crop" name="cropName" required error={errors.cropName}>
          <select
            name="cropName"
            value={formData.cropName}
            onChange={onChange}
            className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-[#E2E8F0] focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/15 outline-none bg-white font-medium cursor-pointer"
          >
            <option value="">-- Choose Crop --</option>
            {CROP_LIST.map((crop) => (
              <option key={crop} value={crop}>
                {crop}
              </option>
            ))}
          </select>
        </FormField>

        {/* Available Stock Indicator */}
        <div className="p-2.5 rounded-xl bg-teal-50/50 border border-teal-100 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-[#0F766E] font-semibold uppercase block">
              Available in Inventory
            </span>
            <span className="text-base font-extrabold text-[#1F2937]">
              {formatIndianNumber(availableStock)} {formData.unit || 'Qtl'}
            </span>
          </div>
          <Boxes className="w-5 h-5 text-[#0F766E]" />
        </div>

        {/* Quality Grade */}
        <FormField label="Quality Grade" name="quality">
          <select
            name="quality"
            value={formData.quality}
            onChange={onChange}
            className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-[#E2E8F0] focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/15 outline-none bg-white font-medium cursor-pointer"
          >
            {QUALITY_GRADES.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </FormField>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5 items-end">
        {/* Selling Quantity */}
        <FormField
          label={`Selling Quantity (${formData.unit || 'Qtl'})`}
          name="quantity"
          required
          error={errors.quantity || (isOverStock ? `Exceeds available stock (${availableStock})` : null)}
        >
          <input
            type="number"
            name="quantity"
            min="1"
            max={availableStock || undefined}
            step="any"
            value={formData.quantity}
            onChange={onChange}
            placeholder="Quantity to sell"
            className={`w-full px-3 py-2 text-xs sm:text-sm rounded-xl border focus:ring-2 outline-none font-bold ${
              isOverStock
                ? 'border-[#DC2626] focus:border-[#DC2626] focus:ring-[#DC2626]/15 bg-red-50/20'
                : 'border-[#E2E8F0] focus:border-[#0F766E] focus:ring-[#0F766E]/15'
            }`}
          />
        </FormField>

        {/* Unit */}
        <FormField label="Unit" name="unit">
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

        {/* Selling Price */}
        <FormField label={`Selling Price per ${formData.unit || 'Unit'} (₹)`} name="rate" required error={errors.rate}>
          <input
            type="number"
            name="rate"
            min="1"
            step="any"
            value={formData.rate}
            onChange={onChange}
            placeholder="Price in ₹"
            className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-[#E2E8F0] focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/15 outline-none font-bold"
          />
        </FormField>

        {/* Live Subtotal */}
        <div className="p-2.5 rounded-xl bg-slate-50 border border-[#E2E8F0] flex flex-col justify-center h-[42px]">
          <span className="text-[10px] text-[#64748B] font-semibold uppercase">Sales Subtotal</span>
          <span className="text-sm font-extrabold text-[#0F766E] truncate">
            {formatINR(subtotal)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default SalesProductSelector;
