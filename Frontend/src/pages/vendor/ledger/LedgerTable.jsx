import { Eye, CreditCard, BookOpen } from 'lucide-react';
import { formatCurrency } from '../../../utils/formatCurrency';
import { formatDate } from '../../../utils/formatDate';
import VendorDataTable from '../VendorDataTable';
import VendorStatusBadge from '../VendorStatusBadge';

export default function LedgerTable({
  entries = [],
  onViewEntry,
  onSettleEntry,
}) {
  const columns = [
    {
      key: 'date',
      label: 'Date',
      render: (row) => (
        <span className="font-medium text-xs whitespace-nowrap">
          {formatDate(row.date)}
        </span>
      ),
    },
    {
      key: 'transactionId',
      label: 'Transaction ID',
      render: (row) => (
        <div>
          <span className="font-bold text-brand-primary block">
            {row.transactionId}
          </span>
          <span className="text-[11px] font-mono text-brand-muted">
            {row.id} • {row.category}
          </span>
        </div>
      ),
    },
    {
      key: 'description',
      label: 'Description',
      render: (row) => (
        <p className="text-xs text-brand-text max-w-xs leading-snug">
          {row.description}
        </p>
      ),
    },
    {
      key: 'partyName',
      label: 'Party Name',
      render: (row) => (
        <div>
          <span className="font-semibold text-brand-text block">
            {row.partyName}
          </span>
          <span className="text-[10px] font-mono text-brand-muted">
            {row.partyId}
          </span>
        </div>
      ),
    },
    {
      key: 'partyCategory',
      label: 'Party Category',
      render: (row) => <VendorStatusBadge status={row.partyCategory} />,
    },
    {
      key: 'debit',
      label: 'Debit (Dr)',
      align: 'right',
      render: (row) =>
        row.debit > 0 ? (
          <span className="font-bold text-brand-text">
            {formatCurrency(row.debit)}
          </span>
        ) : (
          <span className="text-brand-muted">—</span>
        ),
    },
    {
      key: 'credit',
      label: 'Credit (Cr)',
      align: 'right',
      render: (row) =>
        row.credit > 0 ? (
          <span className="font-bold text-brand-primary">
            {formatCurrency(row.credit)}
          </span>
        ) : (
          <span className="text-brand-muted">—</span>
        ),
    },
    {
      key: 'processingExpenses',
      label: 'Processing Expenses',
      align: 'right',
      render: (row) =>
        row.processingExpenses > 0 ? (
          <span className="font-semibold text-brand-warning">
            {formatCurrency(row.processingExpenses)}
          </span>
        ) : (
          <span className="text-brand-muted">—</span>
        ),
    },
    {
      key: 'runningBalance',
      label: 'Running Balance',
      align: 'right',
      render: (row) => (
        <div className="text-right">
          <span className="font-bold text-brand-text block">
            {formatCurrency(Math.abs(row.runningBalance || 0))}
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-brand-primary">
            {row.balanceLabel || 'Party Bal'}
          </span>
        </div>
      ),
    },
    {
      key: 'expectedPaymentDate',
      label: 'Expected Payment Date',
      render: (row) => (
        <span className="text-xs whitespace-nowrap">
          {formatDate(row.expectedPaymentDate)}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <VendorStatusBadge status={row.status} />,
    },
    {
      key: 'actions',
      label: 'Actions',
      align: 'right',
      render: (row) => {
        const canSettle =
          (row.status === 'Unpaid' || row.status === 'Partial') &&
          (row.category === 'Farmer Purchase' ||
            row.category === 'Middleman Purchase' ||
            row.category === 'Customer Sale');

        return (
          <div className="flex items-center justify-end gap-1.5">
            {canSettle && (
              <button
                type="button"
                onClick={() => onSettleEntry(row)}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg bg-brand-primary text-white hover:bg-brand-secondary transition-colors cursor-pointer"
                title="Record Settlement Payment"
              >
                <CreditCard className="w-3.5 h-3.5" />
                Settle
              </button>
            )}
            <button
              type="button"
              onClick={() => onViewEntry(row)}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-brand-light text-brand-primary hover:bg-brand-primary hover:text-white transition-colors cursor-pointer"
              title="View Voucher Details"
            >
              <Eye className="w-3.5 h-3.5" />
              Voucher
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <VendorDataTable
      columns={columns}
      data={entries}
      rowKey="id"
      enablePagination={false}
      emptyTitle="No Ledger Entries Found"
      emptyDescription="Adjust your sub-ledger tab or filter criteria to view financial postings."
      emptyIcon={BookOpen}
    />
  );
}

