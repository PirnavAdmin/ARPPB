import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  ArrowRight,
  ShieldCheck,
  CreditCard,
  Boxes,
} from 'lucide-react';

const CategoryIcon = ({ category = '', className = 'w-5 h-5' }) => {
  if (category.includes('Confirmation')) return <ShieldCheck className={className} />;
  if (category.includes('Payment')) return <CreditCard className={className} />;
  if (category.includes('Stock')) return <Boxes className={className} />;
  return <Bell className={className} />;
};

export const NotificationItem = ({
  notification,
  onMarkRead,
}) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (!notification.isRead) {
      onMarkRead(notification.id);
    }
    if (notification.actionUrl) {
      navigate(notification.actionUrl);
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`p-4 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
        !notification.isRead
          ? 'bg-teal-50/30 border-teal-200/80 hover:bg-teal-50/50'
          : 'bg-white border-[#E2E8F0] hover:bg-slate-50'
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
            notification.priority === 'high'
              ? 'bg-amber-100 text-[#D97706]'
              : 'bg-teal-50 text-[#0F766E]'
          }`}
        >
          <CategoryIcon category={notification.category} className="w-5 h-5" />
        </div>

        <div>
          <div className="flex items-center gap-2">
            <h4 className="text-xs sm:text-sm font-bold text-[#1F2937]">{notification.title}</h4>
            {!notification.isRead && (
              <span className="w-2 h-2 rounded-full bg-[#0F766E]" />
            )}
            <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-[#64748B]">
              {notification.category}
            </span>
          </div>

          <p className="text-xs text-[#64748B] mt-1 leading-relaxed">{notification.description}</p>

          <span className="text-[10px] text-[#94A3B8] block mt-1.5 font-medium">
            {notification.timestamp} &bull; {notification.partyName}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <ArrowRight className="w-4 h-4 text-[#94A3B8] group-hover:text-[#0F766E]" />
      </div>
    </div>
  );
};

export default NotificationItem;
