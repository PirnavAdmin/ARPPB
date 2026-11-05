import React, { useState } from 'react';
import { Eye, EyeOff, Lock, AlertCircle } from 'lucide-react';

/**
 * Reusable Password Input with Show/Hide toggle and optional password strength meter.
 */
export const PasswordInput = ({
  label = 'Password',
  name = 'password',
  value = '',
  onChange,
  onBlur,
  placeholder = 'Enter password',
  error = null,
  helperText = null,
  required = false,
  showStrength = false,
  className = '',
  autoComplete = 'current-password',
}) => {
  const [showPassword, setShowPassword] = useState(false);

  const toggleVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  // Password strength calculation
  const getStrength = (pwd) => {
    if (!pwd) return { score: 0, label: 'None', color: 'bg-slate-200' };
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(pwd)) score++;

    if (score <= 1) return { score: 1, label: 'Weak', color: 'bg-[#DC2626]' };
    if (score === 2 || score === 3) return { score: 2, label: 'Medium', color: 'bg-amber-500' };
    return { score: 3, label: 'Strong', color: 'bg-[#16A34A]' };
  };

  const strength = getStrength(value);
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
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#64748B]">
          <Lock className="w-4 h-4" />
        </div>

        <input
          id={name}
          name={name}
          type={showPassword ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          required={required}
          autoComplete={autoComplete}
          className={`
            w-full block rounded-xl border text-sm transition-all duration-150
            placeholder:text-[#64748B]/60 text-[#172B29] pl-10 pr-10 py-2.5
            ${
              hasError
                ? 'border-[#DC2626] bg-red-50/20 text-[#172B29] focus:border-[#DC2626] focus:ring-2 focus:ring-[#DC2626]/20'
                : 'border-[#E2E8F0] bg-white hover:border-[#CBD5E1] focus:border-[#0F766E] focus:ring-2 focus:ring-[#14B8A6]/20'
            }
            focus:outline-none
          `}
        />

        <button
          type="button"
          onClick={toggleVisibility}
          tabIndex={-1}
          aria-label={showPassword ? 'Hide password' : 'Show password'}
          className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#64748B] hover:text-[#0F766E] transition-colors focus:outline-none cursor-pointer"
        >
          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>

      {/* Password Strength Indicator */}
      {showStrength && value && (
        <div className="mt-2 space-y-1">
          <div className="flex gap-1.5 h-1 w-full">
            <div
              className={`h-full rounded-full flex-1 transition-colors duration-200 ${
                strength.score >= 1 ? strength.color : 'bg-slate-200'
              }`}
            />
            <div
              className={`h-full rounded-full flex-1 transition-colors duration-200 ${
                strength.score >= 2 ? strength.color : 'bg-slate-200'
              }`}
            />
            <div
              className={`h-full rounded-full flex-1 transition-colors duration-200 ${
                strength.score >= 3 ? strength.color : 'bg-slate-200'
              }`}
            />
          </div>
          <div className="flex justify-between items-center text-[11px] text-[#64748B]">
            <span>
              Strength: <strong className="font-semibold text-[#172B29]">{strength.label}</strong>
            </span>
            <span className="text-[10px]">Min 8 chars, 1 uppercase, 1 digit, 1 symbol</span>
          </div>
        </div>
      )}

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

export default PasswordInput;

