import React from 'react';
import { AlertCircle } from 'lucide-react';

export const FormField = ({
  label,
  name,
  error = null,
  required = false,
  optional = false,
  helperText = null,
  children,
  className = '',
}) => {
  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label
          htmlFor={name}
          className="block text-xs font-semibold text-[#1F2937] select-none"
        >
          {label}
          {required && <span className="text-[#DC2626] ml-1">*</span>}
          {optional && <span className="text-[#64748B] font-normal text-[11px] ml-1.5">(Optional)</span>}
        </label>
      )}

      {children}

      {error ? (
        <p className="text-[11px] text-[#DC2626] flex items-center gap-1 font-medium">
          <AlertCircle className="w-3 h-3 flex-shrink-0" />
          <span>{error}</span>
        </p>
      ) : helperText ? (
        <p className="text-[11px] text-[#64748B]">{helperText}</p>
      ) : null}
    </div>
  );
};

export default FormField;

