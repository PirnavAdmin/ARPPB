import {
  Bell,
  ShoppingCart,
  ShieldCheck,
  AlertTriangle,
  Factory,
  Package,
  ClipboardList,
  CreditCard,
  Clock,
  Check,
  Trash2,
  ExternalLink,
} from 'lucide-react';
import VendorStatusBadge from '../VendorStatusBadge';

const CATEGORY_ICON_MAP = {
  'New Purchase Recorded': ShoppingCart,
  'New Farmer Purchase': ShoppingCart,
  'New Middleman Purchase': ShoppingCart,
  'Purchase Confirmed': ShoppingCart,
  'OTP Confirmation Pending': ShieldCheck,
  'OTP Verification': ShieldCheck,
  'OTP Expired': ShieldCheck,
  'OTP Failed': ShieldCheck,
  'Low Raw Material Stock': AlertTriangle,
  'Low Finished Product Stock': AlertTriangle,
  'Low Stock': AlertTriangle,
  'Inventory Updated': Package,
  'Processing Completed': Factory,
  'Customer Order Received': ClipboardList,
  'Customer Order Confirmed': ClipboardList,
  'Product Sold': Package,
  'Expected Payment': CreditCard,
  'Payment Due': CreditCard,
  'Payment Overdue': CreditCard,
  'Payment Delayed': CreditCard,
};

export default function NotificationItem({
  notification,
  onMarkRead,
  onDelete,
  onNavigate,
}) {
  const Icon = CATEGORY_ICON_MAP[notification.category] || Bell;
  const isUnread = !notification.isRead;

  return (
    <div
      onClick={() => {
        if (isUnread) onMarkRead(notification.id);
        if (notification.targetPath) onNavigate(notification.targetPath);
      }}
      className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${isUnread
          ? 'bg-brand-light/35 border-brand-primary/40 shadow-xs'
          : 'bg-brand-surface border-brand-border hover:bg-brand-background/60'
        }`}
    >
      <div className="flex items-start gap-3.5">
        <div
          className={`p-2.5 rounded-xl shrink-0 mt-0.5 ${isUnread
              ? 'bg-brand-primary text-white'
              : 'bg-brand-light text-brand-primary'
            }`}
        >
          <Icon className="w-5 h-5" />
        </div>

        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            {isUnread && (
              <span className="w-2 h-2 rounded-full bg-brand-primary shrink-0" />
            )}
            <h4
              className={`text-sm ${isUnread
                  ? 'font-extrabold text-brand-text'
                  : 'font-semibold text-brand-text'
                }`}
            >
              {notification.title}
            </h4>
            <span className="px-2 py-0.5 rounded-md bg-brand-background border border-brand-border text-[11px] font-semibold text-brand-primary">
              {notification.category}
            </span>
            <VendorStatusBadge status={notification.priority || 'Medium'} />
          </div>

          <p className="text-xs text-brand-muted leading-relaxed">
            {notification.description}
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-brand-muted">
            <span className="inline-flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {notification.date}
            </span>
            {notification.transactionId && (
              <span className="font-mono font-bold text-brand-primary">
                Ref: {notification.transactionId}
              </span>
            )}
            {notification.targetPath && (
              <span className="inline-flex items-center gap-1 text-brand-primary font-semibold hover:underline">
                Open Module
                <ExternalLink className="w-3 h-3" />
              </span>
            )}
          </div>
        </div>
      </div>

      <div
        className="flex items-center gap-2 shrink-0 self-end sm:self-center"
        onClick={(e) => e.stopPropagation()}
      >
        {isUnread && (
          <button
            type="button"
            onClick={() => onMarkRead(notification.id)}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold rounded-lg bg-brand-primary text-white hover:bg-brand-secondary transition-colors cursor-pointer"
            title="Mark as Read"
          >
            <Check className="w-3.5 h-3.5" />
            Mark Read
          </button>
        )}
        <button
          type="button"
          onClick={() => onDelete(notification.id)}
          className="p-1.5 rounded-lg border border-brand-border text-brand-muted hover:text-brand-error hover:bg-red-50 transition-colors cursor-pointer"
          title="Delete Notification"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
