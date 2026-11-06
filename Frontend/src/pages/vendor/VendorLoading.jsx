import { Loader2 } from 'lucide-react';

export function VendorLoading({ label = 'Loading agricultural ERP records...', rows = 4 }) {
  return (
    <div className="bg-brand-surface rounded-xl border border-brand-border p-6">
      <div className="flex items-center gap-3 text-brand-primary mb-4">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span className="text-sm font-medium">{label}</span>
      </div>
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, idx) => (
          <div
            key={idx}
            className="h-10 bg-brand-background rounded-lg animate-pulse border border-brand-border/50"
          />
        ))}
      </div>
    </div>
  );
}

export default VendorLoading;

