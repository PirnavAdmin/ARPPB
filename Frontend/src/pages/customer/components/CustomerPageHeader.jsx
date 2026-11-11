import CustomerBreadcrumb from '../layout/CustomerBreadcrumb';

export function CustomerPageHeader({
  title,
  subtitle = '',
  icon: Icon = null,
  badge = null,
  actions = null,
  showBreadcrumb = true,
}) {
  return (
    <div className="mb-6">
      {showBreadcrumb && (
        <div className="mb-2">
          <CustomerBreadcrumb customTitle={title} />
        </div>
      )}

      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-2xs">
        <div className="flex items-start gap-3.5">
          {Icon && (
            <div className="w-11 h-11 rounded-xl bg-[#CCFBF1] text-[#0F766E] flex items-center justify-center shrink-0 border border-[#14B8A6]/30">
              <Icon className="w-6 h-6" />
            </div>
          )}
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-bold text-[#0F766E] tracking-tight">
                {title}
              </h1>
              {typeof badge === 'string' ? (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#CCFBF1] text-[#0F766E] border border-[#14B8A6]/30">
                  {badge}
                </span>
              ) : (
                badge
              )}
            </div>
            {subtitle && <p className="text-xs sm:text-sm text-[#64748B] mt-1">{subtitle}</p>}
          </div>
        </div>

        {actions && <div className="flex flex-wrap items-center gap-2.5 shrink-0">{actions}</div>}
      </div>
    </div>
  );
}

export default CustomerPageHeader;

