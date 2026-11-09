import React from 'react';

export const SectionCard = ({
  title,
  subtitle,
  icon: Icon = null,
  action = null,
  badge = null,
  children,
  className = '',
  bodyClassName = 'p-5 sm:p-6',
}) => {
  return (
    <div className={`bg-white rounded-2xl border border-[#E2E8F0] shadow-xs overflow-hidden transition-all duration-200 ${className}`}>
      {(title || subtitle || action || badge || Icon) && (
        <div className="px-5 py-4 sm:px-6 border-b border-[#E2E8F0] flex flex-wrap items-center justify-between gap-3 bg-white">
          <div className="flex items-center gap-3">
            {Icon && (
              <div className="w-8 h-8 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-[#0F766E] flex-shrink-0">
                <Icon className="w-4 h-4" />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-[#1F2937]">{title}</h3>
                {badge}
              </div>
              {subtitle && <p className="text-xs text-[#64748B] mt-0.5">{subtitle}</p>}
            </div>
          </div>
          {action && <div className="flex items-center gap-2">{action}</div>}
        </div>
      )}

      <div className={bodyClassName}>{children}</div>
    </div>
  );
};

export default SectionCard;

