import { Printer, Calendar, UserCheck, Scale } from 'lucide-react';
import { formatCurrency } from '../../../utils/formatCurrency';
import { formatDate } from '../../../utils/formatDate';
import { printDocumentSummary } from '../../../utils/exportUtils';
import VendorModal from '../VendorModal';
import VendorStatusBadge from '../VendorStatusBadge';

export default function LedgerDetails({ entry, isOpen, onClose }) {
  if (!entry) return null;

  const handlePrintVoucher = () => {
    printDocumentSummary({
      title: `Accounting Ledger Voucher – ${entry.id}`,
      subtitle: `Reference Transaction: ${entry.transactionId} | Posting Date: ${formatDate(entry.date)}`,
      metadata: [
        { label: 'Ledger Voucher ID', value: entry.id },
        { label: 'Transaction Reference', value: entry.transactionId },
        { label: 'Ledger Category', value: entry.category },
        { label: 'Party Name', value: entry.partyName },
        { label: 'Party ID', value: entry.partyId },
        { label: 'Party Category', value: entry.partyCategory },
        { label: 'Posting Date', value: formatDate(entry.date) },
        { label: 'Expected Settlement Date', value: formatDate(entry.expectedPaymentDate) },
        { label: 'Settlement Status', value: entry.status },
        {
          label: 'Running Balance After Entry',
          value: `${formatCurrency(Math.abs(entry.runningBalance || 0))} (${entry.balanceLabel || 'Bal'})`,
        },
      ],
      items: [
        {
          Particulars: entry.description,
          'Debit (Dr)': formatCurrency(entry.debit || 0),
          'Credit (Cr)': formatCurrency(entry.credit || 0),
          'Processing Exp': formatCurrency(entry.processingExpenses || 0),
        },
      ],
    });
  };

  return (
    <VendorModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Accounting Voucher Details – ${entry.id}`}
      subtitle={`Category: ${entry.category} | Reference ID: ${entry.transactionId}`}
      size="lg"
      footer={
        <div className="flex items-center justify-between w-full">
          <button
            type="button"
            onClick={handlePrintVoucher}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-lg bg-brand-primary text-white hover:bg-brand-secondary transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            Print Accounting Voucher
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-lg border border-brand-border text-brand-text hover:bg-brand-background cursor-pointer"
          >
            Close
          </button>
        </div>
      }
    >
      <div className="space-y-4 text-xs">
        <div className="p-4 rounded-xl bg-brand-light/40 border border-brand-primary/30 flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="text-brand-muted block">Ledger Voucher & Reference</span>
            <span className="text-sm font-extrabold text-brand-primary">
              {entry.id} • {entry.transactionId}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <VendorStatusBadge status={entry.partyCategory} />
            <VendorStatusBadge status={entry.status} />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl border border-brand-border bg-brand-background/50 space-y-2">
            <h4 className="font-bold text-brand-text flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-brand-primary" />
              Counterparty Details
            </h4>
            <div>
              <span className="text-brand-muted block">Party Name</span>
              <span className="font-bold text-brand-text">{entry.partyName}</span>
            </div>
            <div>
              <span className="text-brand-muted block">Party ID & Category</span>
              <span className="font-mono font-semibold text-brand-primary">
                {entry.partyId} ({entry.partyCategory})
              </span>
            </div>
            <div>
              <span className="text-brand-muted block">Ledger Category</span>
              <span className="font-semibold text-brand-text">{entry.category}</span>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-brand-border bg-brand-background/50 space-y-2">
            <h4 className="font-bold text-brand-text flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-brand-primary" />
              Dates & Running Balance
            </h4>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-brand-muted block">Posting Date</span>
                <span className="font-semibold">{formatDate(entry.date)}</span>
              </div>
              <div>
                <span className="text-brand-muted block">Expected Settlement</span>
                <span className="font-semibold">
                  {formatDate(entry.expectedPaymentDate)}
                </span>
              </div>
            </div>
            <div className="pt-2 border-t border-brand-border">
              <span className="text-brand-muted block">
                Contextual Running Balance ({entry.balanceLabel || 'Party Account'})
              </span>
              <span className="text-base font-extrabold text-brand-primary">
                {formatCurrency(Math.abs(entry.runningBalance || 0))}
              </span>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-brand-border bg-brand-surface space-y-3">
          <h4 className="font-bold text-brand-text flex items-center gap-1.5">
            <Scale className="w-4 h-4 text-brand-primary" />
            Double-Entry Posting Breakdown
          </h4>
          <p className="text-brand-text bg-brand-background p-3 rounded-lg border border-brand-border">
            {entry.description}
          </p>

          <div className="grid grid-cols-3 gap-3 pt-1">
            <div className="p-3 rounded-lg bg-brand-background border border-brand-border">
              <span className="text-brand-muted block">Debit (Dr)</span>
              <span className="text-sm font-extrabold text-brand-text">
                {formatCurrency(entry.debit || 0)}
              </span>
            </div>
            <div className="p-3 rounded-lg bg-brand-background border border-brand-border">
              <span className="text-brand-muted block">Credit (Cr)</span>
              <span className="text-sm font-extrabold text-brand-primary">
                {formatCurrency(entry.credit || 0)}
              </span>
            </div>
            <div className="p-3 rounded-lg bg-brand-background border border-brand-border">
              <span className="text-brand-muted block">Processing Expense</span>
              <span className="text-sm font-extrabold text-brand-warning">
                {formatCurrency(entry.processingExpenses || 0)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </VendorModal>
  );
}

