import React from 'react';
import { Briefcase, ChevronDown, AlertCircle } from 'lucide-react';
import { ROLE_OPTIONS } from '../../../data/mock/authMockData';

/**
 * RoleSelect Component for AgriConnect Registration
 * Supports: Farmer, Vendor, Middle Man, Customer
 */
export const RoleSelect = ({
  label = 'Select Your Role',
  name = 'role',
  value = '',
  onChange,
  onBlur,
  error = null,
  required = true,
  disabled = false,
  className = '',
}) => {
  const hasError = Boolean(error);
  const options = ROLE_OPTIONS || [
    { value: 'Farmer', label: 'Farmer' },
    { value: 'Vendor', label: 'Vendor' },
    { value: 'Middle Man', label: 'Middle Man' },
    { value: 'Customer', label: 'Customer' },
  ];

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label
          htmlFor={name}
          className="block text-xs font-semibold text-[#1F2937] mb-1.5 select-none"
        >
          {label}
          {required && <span className="text-[#DC2626] ml-1">*</span>}
        </label>
      )}

      <div className="relative rounded-xl">
        <div className="absolute inset-y-0 left-0 pl-3 sm:pl-3.5 flex items-center pointer-events-none text-[#64748B]">
          <Briefcase className="w-4 h-4" />
        </div>

        <select
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          disabled={disabled}
          className={`
            w-full pl-9 pr-9 py-2.5 text-xs sm:text-sm rounded-xl border bg-white text-[#1F2937]
            transition-all duration-150 appearance-none cursor-pointer outline-none
            ${
              hasError
                ? 'border-[#DC2626] focus:border-[#DC2626] focus:ring-2 focus:ring-[#DC2626]/15 bg-red-50/20'
                : 'border-[#DCE3EA] hover:border-[#CBD5E1] focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/15'
            }
            ${disabled ? 'bg-slate-100 text-slate-400 cursor-not-allowed opacity-75' : ''}
            ${!value ? 'text-[#94A3B8]' : 'text-[#1F2937] font-medium'}
          `}
        >
          <option value="" disabled className="text-gray-400">
            Select your role
          </option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} className="text-[#1F2937] py-1">
              {opt.label}
            </option>
          ))}
        </select>

        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-[#64748B]">
          <ChevronDown className="w-4 h-4" />
        </div>
      </div>

      {hasError && (
        <p className="mt-1 text-[11px] text-[#DC2626] flex items-center gap-1 font-medium">
          <AlertCircle className="w-3 h-3 flex-shrink-0" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
};

export default RoleSelect;

