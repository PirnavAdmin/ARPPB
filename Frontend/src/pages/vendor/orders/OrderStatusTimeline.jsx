import { CheckCircle2, Circle, XCircle, Clock } from 'lucide-react';
import { ORDER_STATUSES } from '../../../utils/constants';

const STANDARD_STEPS = ORDER_STATUSES.filter((s) => s !== 'Cancelled');

export default function OrderStatusTimeline({ currentStatus, timeline = [], cancellationReason = '' }) {
  const isCancelled = currentStatus === 'Cancelled';
  const currentStepIndex = STANDARD_STEPS.indexOf(currentStatus);

  return (
    <div className="space-y-4">
      {/* Horizontal Stepper */}
      <div className="p-4 rounded-xl bg-brand-background/70 border border-brand-border">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-brand-text">
            Order Fulfilment Pipeline
          </span>
          {isCancelled ? (
            <span className="inline-flex items-center gap-1 text-xs font-bold text-brand-error">
              <XCircle className="w-4 h-4" />
              Cancelled — Stock Restored
            </span>
          ) : (
            <span className="text-xs font-semibold text-brand-primary">
              Stage {Math.max(1, currentStepIndex + 1)} of {STANDARD_STEPS.length}:{' '}
              <strong>{currentStatus}</strong>
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-7 gap-2">
          {STANDARD_STEPS.map((step, idx) => {
            const isCompleted = !isCancelled && idx <= currentStepIndex;
            const isCurrent = !isCancelled && idx === currentStepIndex;
            const matchingLog = timeline.find((t) => t.status === step);

            return (
              <div
                key={step}
                className={`p-2.5 rounded-lg border text-xs transition-all ${
                  isCurrent
                    ? 'bg-brand-light border-brand-primary text-brand-primary shadow-xs'
                    : isCompleted
                    ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                    : 'bg-brand-surface border-brand-border text-brand-muted opacity-70'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold mb-1">
                  {isCompleted ? (
                    <CheckCircle2
                      className={`w-4 h-4 shrink-0 ${
                        isCurrent ? 'text-brand-primary' : 'text-brand-success'
                      }`}
                    />
                  ) : (
                    <Circle className="w-3.5 h-3.5 shrink-0 text-brand-muted" />
                  )}
                  <span className="truncate">{step}</span>
                </div>
                <div className="text-[10px] leading-tight truncate opacity-80">
                  {matchingLog ? matchingLog.timestamp : 'Pending'}
                </div>
              </div>
            );
          })}
        </div>

        {isCancelled && (
          <div className="mt-3 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-brand-error flex items-start gap-2">
            <XCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">Order Cancelled</span>
              <span>
                Reason: {cancellationReason || 'Cancelled by vendor; reserved stock restored.'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Detailed Audit Log */}
      {timeline.length > 0 && (
        <div className="p-4 rounded-xl border border-brand-border bg-brand-surface space-y-2.5">
          <h4 className="text-xs font-bold text-brand-text flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-brand-primary" />
            Chronological Status History
          </h4>
          <div className="space-y-2">
            {timeline.map((log, i) => (
              <div
                key={i}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs py-1.5 border-b last:border-b-0 border-brand-border"
              >
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md bg-brand-light text-brand-primary font-bold text-[11px]">
                    {log.status}
                  </span>
                  <span className="text-brand-text font-medium">{log.note}</span>
                </div>
                <span className="text-[11px] font-mono text-brand-muted">
                  {log.timestamp}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

