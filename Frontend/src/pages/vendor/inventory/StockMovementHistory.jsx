import { ArrowDownLeft, ArrowUpRight, Lock } from 'lucide-react';
import VendorDataTable from '../VendorDataTable';
import { formatNumber } from '../../../utils/formatCurrency';
import { formatDate } from '../../../utils/formatDate';

export function StockMovementHistory({ movements = [], stockIdFilter = null }) {
  const list = stockIdFilter
    ? movements.filter((m) => m.stockId === stockIdFilter)
    : movements;

  const columns = [
    {
      key: 'id',
      header: 'Movement ID',
      sortable: true,
      render: (row) => <span className="font-mono font-bold text-brand-primary">{row.id}</span>,
    },
    {
      key: 'date',
      header: 'Date',
      sortable: true,
      render: (row) => formatDate(row.date),
    },
    {
      key: 'batchNumber',
      header: 'Batch Number',
      render: (row) => (
        <div>
          <p className="font-mono font-semibold text-brand-text text-xs">{row.batchNumber}</p>
          <p className="text-[11px] text-brand-muted">{row.stockId}</p>
        </div>
      ),
    },
    {
      key: 'cropName',
      header: 'Crop',
      sortable: true,
    },
    {
      key: 'type',
      header: 'Movement Type',
      render: (row) => {
        const isInward = row.quantity > 0;
        return (
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
              isInward
                ? 'bg-brand-success-light text-brand-success'
                : 'bg-brand-light text-brand-primary'
            }`}
          >
            {isInward ? (
              <ArrowDownLeft className="w-3.5 h-3.5" />
            ) : (
              <ArrowUpRight className="w-3.5 h-3.5" />
            )}
            {row.type}
          </span>
        );
      },
    },
    {
      key: 'referenceId',
      header: 'Reference ID',
      render: (row) => <span className="font-mono font-bold text-brand-primary">{row.referenceId}</span>,
    },
    {
      key: 'quantity',
      header: 'Quantity Change',
      align: 'right',
      render: (row) => (
        <span
          className={`font-bold ${
            row.quantity > 0 ? 'text-brand-success' : 'text-brand-primary'
          }`}
        >
          {row.quantity > 0 ? `+${formatNumber(row.quantity)}` : formatNumber(row.quantity)}{' '}
          {row.unit}
        </span>
      ),
    },
    {
      key: 'balanceAfter',
      header: 'Balance After',
      align: 'right',
      render: (row) => (
        <span className="font-bold text-brand-text">
          {formatNumber(row.balanceAfter)} {row.unit}
        </span>
      ),
    },
    {
      key: 'remarks',
      header: 'Remarks',
      render: (row) => <span className="text-xs text-brand-muted">{row.remarks}</span>,
    },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs text-brand-muted">
        <span>Stock Movement History ({list.length} records)</span>
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-primary">
          <Lock className="w-3 h-3" />
          Completed movements are audit-locked
        </span>
      </div>
      <VendorDataTable
        columns={columns}
        data={list}
        initialPageSize={6}
        emptyTitle="No stock movements recorded for this selection"
      />
    </div>
  );
}

export default StockMovementHistory;
