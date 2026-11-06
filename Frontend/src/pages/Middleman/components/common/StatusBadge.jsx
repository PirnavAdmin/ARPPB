import React from 'react';
import {
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  FileText,
  AlertCircle,
} from 'lucide-react';

/**
 * Enterprise StatusBadge for Middleman transactions and entities
 */
export const StatusBadge = ({ status = '', size = 'md', className = '' }) => {
  const norm = String(status).toLowerCase().trim();

  let styles = 'bg-slate-100 text-slate-700 border-slate-200';
  let Icon = FileText;
  let text = status || 'Unknown';

  if (norm.includes('confirm') || norm === 'active' || norm === 'completed' || norm === 'paid' || norm === 'in stock') {
    styles = 'bg-emerald-50 text-[#15803D] border-emerald-200/80';
    Icon = CheckCircle2;
  } else if (norm.includes('pend') || norm === 'due' || norm === 'partially paid') {
    styles = 'bg-amber-50 text-[#D97706] border-amber-200/80';
    Icon = Clock;
  } else if (norm.includes('reject') || norm === 'overdue' || norm === 'cancelled') {
    styles = 'bg-red-50 text-[#DC2626] border-red-200/80';
    Icon = XCircle;
  } else if (norm.includes('low') || norm.includes('expir')) {
    styles = 'bg-orange-50 text-orange-700 border-orange-200/80';
    Icon = AlertTriangle;
  } else if (norm === 'draft') {
    styles = 'bg-slate-100 text-slate-600 border-slate-200';
    Icon = FileText;
  } else if (norm === 'exhausted' || norm === 'inactive') {
    styles = 'bg-gray-100 text-gray-500 border-gray-200';
    Icon = AlertCircle;
  }

  const sizeClasses =
    size === 'sm'
      ? 'px-2 py-0.5 text-[11px] gap-1'
      : size === 'lg'
      ? 'px-3 py-1.5 text-xs font-semibold gap-1.5'
      : 'px-2.5 py-1 text-xs font-medium gap-1.5';

  return (
    <span
      className={`inline-flex items-center rounded-full border whitespace-nowrap select-none font-medium transition-colors ${styles} ${sizeClasses} ${className}`}
    >
      <Icon className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
      <span>{text}</span>
    </span>
  );
};

export default StatusBadge;

