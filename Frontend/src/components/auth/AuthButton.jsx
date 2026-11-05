import React from 'react';
import { Loader2 } from 'lucide-react';

/**
 * Enterprise Primary Auth Button with loading spinner and disabled state.
 */
export const AuthButton = ({
  children,
  type = 'button',
  variant = 'primary',
  size = 'md',
  isLoading = false,
  loadingText = 'Processing...',
  disabled = false,
  fullWidth = true,
  onClick,
  icon: Icon = null,
  className = '',
}) => {
  const isDisabled = disabled || isLoading;

  const sizeClasses = {
    sm: 'py-2 px-3.5 text-xs',
    md: 'py-2.5 px-4 text-sm font-semibold',
    lg: 'py-3.5 px-6 text-base font-semibold',
  };

  const variantClasses = {
    primary:
      'bg-[#0F766E] text-white hover:bg-[#0d645e] active:bg-[#094742] shadow-xs hover:shadow-sm focus:ring-2 focus:ring-[#14B8A6]/30 border border-transparent',
    secondary:
      'bg-[#CCFBF1] text-[#0F766E] hover:bg-teal-100 active:bg-teal-200 border border-teal-200/60 focus:ring-2 focus:ring-teal-400/20',
    outline:
      'bg-white text-[#0F766E] border border-[#0F766E] hover:bg-teal-50/50 active:bg-teal-100 focus:ring-2 focus:ring-[#0F766E]/20',
    ghost:
      'bg-transparent text-[#64748B] hover:text-[#0F766E] hover:bg-slate-100 focus:ring-2 focus:ring-slate-200 border border-transparent',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      className={`
        inline-flex items-center justify-center gap-2 rounded-xl transition-all duration-150 select-none
        ${sizeClasses[size] || sizeClasses.md}
        ${variantClasses[variant] || variantClasses.primary}
        ${fullWidth ? 'w-full' : 'w-auto'}
        ${isDisabled ? 'opacity-60 cursor-not-allowed pointer-events-none' : 'cursor-pointer'}
        focus:outline-none
        ${className}
      `}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
          <span>{loadingText}</span>
        </>
      ) : (
        <>
          {Icon && <Icon className="w-4 h-4 flex-shrink-0" />}
          <span>{children}</span>
        </>
      )}
    </button>
  );
};

export default AuthButton;

