import React from 'react';
import { CheckCircle2 } from 'lucide-react';

/**
 * VerificationStatus Component
 * Displays the verified badge with icon and label when a credential (phone/email) is verified.
 */
export const VerificationStatus = ({
  message = 'Phone Number Verified',
  className = '',
  compact = false,
}) => {
  if (compact) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-[#16A34A] border border-emerald-200/80 shadow-xs ${className}`}
      >
        <CheckCircle2 className="w-3.5 h-3.5 text-[#16A34A] flex-shrink-0" />
        <span>{message}</span>
      </span>
    );
  }

  return (
    <div
      className={`flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-[#16A34A] text-xs font-medium animate-fadeIn ${className}`}
    >
      <CheckCircle2 className="w-4 h-4 text-[#16A34A] flex-shrink-0" />
      <span className="font-semibold">{message}</span>
    </div>
  );
};

export default VerificationStatus;

