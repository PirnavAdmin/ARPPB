import React from 'react';
import { Sprout } from 'lucide-react';

/**
 * Centered Authentication Header with AgriConnect Sprout branding
 */
export const AuthHeader = ({
  title,
  subtitle,
  titleColor = 'text-[#0F766E]',
  className = '',
}) => {
  return (
    <div className={`text-center mb-5 ${className}`}>
      {/* Brand Icon Badge */}
      <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200/80 flex items-center justify-center mx-auto mb-2.5 shadow-xs">
        <Sprout className="w-5 h-5 text-[#0F766E]" />
      </div>

      {/* Main Heading */}
      {title && (
        <h2 className={`text-xl sm:text-2xl font-bold tracking-tight ${titleColor}`}>
          {title}
        </h2>
      )}

      {/* Subtitle */}
      {subtitle && (
        <p className="mt-1 text-xs text-[#64748B] leading-relaxed">
          {subtitle}
        </p>
      )}
    </div>
  );
};

export default AuthHeader;

