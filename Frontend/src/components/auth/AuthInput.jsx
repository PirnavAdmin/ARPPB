import React from 'react';
import { AlertCircle } from 'lucide-react';

/**
 * Reusable Auth Input with accessible labels, icons, and error states.
 */
export const AuthInput = ({
  label,
  name,
  type = 'text',
  value,
  onChange,
  onBlur,
  placeholder,
  error = null,
  helperText = null,
  required = false,
  disabled = false,
  icon: Icon = null,
  rightElement = null,
  className = '',
  autoComplete = 'off',
  inputMode = undefined,
  maxLength = undefined,
}) => {
  const hasError = Boolean(error);

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label
          htmlFor={name}
          className="block text-xs font-semibold text-[#172B29] mb-1.5 select-none"
        >
          {label}
          {required && <span className="text-[#DC2626] ml-1">*</span>}
        </label>
      )}

      <div className="relative rounded-xl">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#64748B]">
            <Icon className="w-4 h-4" />
          </div>
        )}

        <input
          id={name}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          autoComplete={autoComplete}
          inputMode={inputMode}
          maxLength={maxLength}
          className={`
            w-full block rounded-xl border text-sm transition-all duration-150
            placeholder:text-[#64748B]/60 text-[#172B29] py-2.5
            ${Icon ? 'pl-10' : 'pl-3.5'}
            ${rightElement ? 'pr-11' : 'pr-3.5'}
            ${
              hasError
                ? 'border-[#DC2626] bg-red-50/20 text-[#172B29] focus:border-[#DC2626] focus:ring-2 focus:ring-[#DC2626]/20'
                : 'border-[#E2E8F0] bg-white hover:border-[#CBD5E1] focus:border-[#0F766E] focus:ring-2 focus:ring-[#14B8A6]/20'
            }
            ${disabled ? 'bg-slate-50 text-[#64748B] cursor-not-allowed select-none' : ''}
            focus:outline-none
          `}
        />

        {rightElement && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            {rightElement}
          </div>
        )}
      </div>

      {hasError ? (
        <div className="flex items-center gap-1.5 mt-1 text-xs text-[#DC2626]">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      ) : helperText ? (
        <p className="mt-1 text-xs text-[#64748B]">{helperText}</p>
      ) : null}
    </div>
  );
};

export default AuthInput;

