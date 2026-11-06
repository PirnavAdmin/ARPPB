import { TrendingUp, TrendingDown, ArrowUpRight } from 'lucide-react';

export function VendorStatCard({
  title,
  value,
  description = '',
  subtitle = '',
  icon: Icon,
  trend = null, // { value: '+8.4%', direction: 'up' | 'down' } or null when comparison data is unavailable
  onClick = null,
  highlight = false,
}) {
  const Wrapper = onClick ? 'button' : 'div';
  const subText = description || subtitle;

  return (
    <Wrapper
      type={onClick ? 'button' : undefined}
      onClick={onClick || undefined}
      className={`group w-full text-left rounded-xl border p-4 transition-all duration-200 flex flex-col justify-between ${
        highlight
          ? 'bg-brand-light/45 border-brand-secondary/40 shadow-xs'
          : 'bg-brand-surface border-brand-border shadow-2xs'
      } ${
        onClick
          ? 'hover:border-brand-secondary hover:shadow-md hover:-translate-y-0.5 cursor-pointer'
          : ''
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-brand-muted uppercase tracking-wider truncate">
            {title}
          </p>
          <p className="text-xl sm:text-2xl font-bold text-brand-primary mt-1.5 tracking-tight">
            {value}
          </p>
        </div>

        {Icon && (
          <div className="w-10 h-10 rounded-xl bg-brand-light text-brand-primary flex items-center justify-center shrink-0 group-hover:bg-brand-primary group-hover:text-white transition-colors">
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      <div className="mt-3 pt-2.5 border-t border-brand-border/60 flex items-center justify-between gap-2">
        <span className="text-xs text-brand-muted truncate">{subText}</span>

        <div className="flex items-center gap-1.5 shrink-0">
          {trend && trend.value ? (
            <span
              className={`inline-flex items-center gap-0.5 text-xs font-semibold px-1.5 py-0.5 rounded-md ${
                trend.direction === 'down'
                  ? 'bg-brand-error-light text-brand-error'
                  : 'bg-brand-success-light text-brand-success'
              }`}
            >
              {trend.direction === 'down' ? (
                <TrendingDown className="w-3 h-3" />
              ) : (
                <TrendingUp className="w-3 h-3" />
              )}
              {trend.value}
            </span>
          ) : null}
          {onClick && (
            <ArrowUpRight className="w-3.5 h-3.5 text-brand-muted group-hover:text-brand-primary transition-colors" />
          )}
        </div>
      </div>
    </Wrapper>
  );
}

export default VendorStatCard;
