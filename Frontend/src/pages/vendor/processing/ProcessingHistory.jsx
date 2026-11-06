import { Eye, CheckCircle2, Play, Trash2 } from 'lucide-react';
import VendorDataTable from '../VendorDataTable';
import VendorStatusBadge from '../VendorStatusBadge';
import { formatCurrency, formatNumber } from '../../../utils/formatCurrency';
import { formatDate } from '../../../utils/formatDate';

export function ProcessingHistory({
  records = [],
  onViewDetails,
  onEditDraft,
  onCancelDraft,
  onResetFilters,
}) {
  const columns = [
    {
      key: 'id',
      header: 'Processing ID',
      sortable: true,
      render: (row) => (
        <button
          type="button"
          onClick={() => onViewDetails(row)}
          className="font-mono font-bold text-brand-primary hover:underline cursor-pointer"
        >
          {row.id}
        </button>
      ),
    },
    {
      key: 'processingDate',
      header: 'Date',
      sortable: true,
      render: (row) => formatDate(row.processingDate),
    },
    {
      key: 'rawMaterial',
      header: 'Raw Material & Batch',
      render: (row) => (
        <div>
          <p className="font-bold text-brand-text">{row.rawMaterial}</p>
          <p className="text-xs font-mono text-brand-muted">
            {row.rawMaterialBatchNumber} ({row.stockId})
          </p>
        </div>
      ),
    },
    {
      key: 'inputQuantity',
      header: 'Input Qty',
      align: 'right',
      sortable: true,
      render: (row) => (
        <span className="font-semibold">
          {formatNumber(row.inputQuantity)} {row.inputUnit}
        </span>
      ),
    },
    {
      key: 'outputs',
      header: 'Finished Output(s)',
      render: (row) => (
        <div>
          <p className="font-semibold text-brand-primary">
            {(row.outputs || []).map((o) => o.productName).join(', ')}
          </p>
          <p className="text-xs text-brand-muted">
            {formatNumber(row.actualOutputQuantity)} {row.outputUnit}
          </p>
        </div>
      ),
      exportAccessor: (row) =>
        (row.outputs || [])
          .map((o) => `${o.productName}: ${o.outputQuantity} ${o.outputUnit}`)
          .join('; '),
    },
    {
      key: 'wastageQuantity',
      header: 'Wastage',
      align: 'right',
      render: (row) => (
        <span className="text-brand-warning font-semibold text-xs">
          {formatNumber(row.wastageQuantity)} {row.inputUnit} ({formatNumber(row.wastagePercentage)}%)
        </span>
      ),
    },
    {
      key: 'totalProcessingExpenses',
      header: 'Processing Expenses',
      align: 'right',
      sortable: true,
      render: (row) => formatCurrency(row.totalProcessingExpenses),
    },
    {
      key: 'totalBatchCost',
      header: 'Total Batch Cost',
      align: 'right',
      sortable: true,
      render: (row) => (
        <span className="font-bold text-brand-text">{formatCurrency(row.totalBatchCost)}</span>
      ),
    },
    {
      key: 'costPerUnit',
      header: 'Unit Cost',
      align: 'right',
      render: (row) => (
        <span className="font-bold text-brand-primary">
          {formatCurrency(row.costPerUnit)}/{row.outputUnit}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <VendorStatusBadge status={row.status} size="xs" />,
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (row) => (
        <div className="inline-flex items-center gap-1">
          <button
            type="button"
            onClick={() => onViewDetails(row)}
            title="View Processing Details"
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-brand-light text-brand-primary hover:bg-brand-secondary hover:text-white transition-colors cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" />
            Details
          </button>
          {row.status === 'Draft' && onEditDraft && (
            <>
              <button
                type="button"
                onClick={() => onEditDraft(row)}
                title="Resume & Complete Draft"
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-brand-primary text-white hover:bg-brand-secondary transition-colors cursor-pointer"
              >
                <Play className="w-3.5 h-3.5" />
                Complete
              </button>
              <button
                type="button"
                onClick={() => onCancelDraft(row.id)}
                title="Cancel Draft"
                className="p-1.5 rounded-lg bg-brand-error-light text-brand-error hover:bg-brand-error hover:text-white transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <VendorDataTable
      columns={columns}
      data={records}
      onResetFilters={onResetFilters}
    />
  );
}

export default ProcessingHistory;

