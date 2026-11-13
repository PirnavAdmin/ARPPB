import { TrendingUp, TrendingDown, ArrowUpRight } from 'lucide-react';

export function CustomerStatCard({
  title,
  value,
  description = '',
  subtitle = '',
  icon: Icon,
  trend = null,
  onClick = null,
}) {
  const Wrapper = onClick ? 'button' : 'div';
  const subText = description || subtitle;

  return (
    <Wrapper
      type={onClick ? 'button' : undefined}
      onClick={onClick || undefined}
      className={`group w-full h-[148px] text-left rounded-2xl bg-white border border-[#E2E8F0] p-5 shadow-xs flex flex-col justify-between transition-all duration-200 ${
        onClick
          ? 'hover:border-[#14B8A6] hover:shadow-md hover:-translate-y-0.5 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20'
          : ''
      }`}
    >
      <div className="flex items-center justify-between gap-2.5 w-full">
        <span className="text-xs font-bold uppercase tracking-wide text-[#64748B] leading-snug">
          {title}
        </span>

        {Icon && (
          <div className="w-10 h-10 min-w-[2.5rem] min-h-[2.5rem] rounded-xl bg-[#CCFBF1] text-[#0F766E] border border-[#14B8A6]/25 flex items-center justify-center shrink-0 group-hover:bg-[#0F766E] group-hover:text-white transition-colors duration-200">
            <Icon className="w-5 h-5 stroke-[2] shrink-0" />
          </div>
        )}
      </div>

      <div className="my-1 w-full">
        <p className="text-xl xl:text-[21px] 2xl:text-2xl font-extrabold text-[#0F766E] tracking-tight leading-tight whitespace-nowrap truncate">
          {value}
        </p>
      </div>

      <div className="pt-2.5 border-t border-[#E2E8F0] flex items-center justify-between gap-2 w-full">
        <span className="text-xs font-medium text-[#64748B] truncate">{subText}</span>

        <div className="flex items-center gap-1.5 shrink-0">
          {trend && trend.value ? (
            <span
              className={`inline-flex items-center gap-0.5 text-[11px] font-bold px-2 py-0.5 rounded-full ${
                trend.direction === 'down'
                  ? 'bg-red-50 text-red-600'
                  : 'bg-[#DCFCE7] text-[#16A34A]'
              }`}
            >
              {trend.direction === 'down' ? (
                <TrendingDown className="w-3 h-3 shrink-0" />
              ) : (
                <TrendingUp className="w-3 h-3 shrink-0" />
              )}
              {trend.value}
            </span>
          ) : null}

          {onClick && (
            <ArrowUpRight className="w-3.5 h-3.5 text-[#64748B] group-hover:text-[#0F766E] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-200 shrink-0" />
          )}
        </div>
      </div>
    </Wrapper>
  );
}

export default CustomerStatCard;

