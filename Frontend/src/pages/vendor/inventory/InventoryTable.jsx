import { Eye, Factory } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import VendorDataTable from '../VendorDataTable';
import VendorStatusBadge from '../VendorStatusBadge';
import { formatCurrency, formatNumber } from '../../../utils/formatCurrency';
import { formatDate } from '../../../utils/formatDate';

export function InventoryTable({ inventory = [], onSelectBatch, onResetFilters }) {
  const navigate = useNavigate();

  const columns = [
    {
      key: 'id',
      header: 'Stock ID',
      sortable: true,
      render: (row) => (
        <button
          type="button"
          onClick={() => onSelectBatch(row)}
          className="font-mono font-bold text-brand-primary hover:underline cursor-pointer"
        >
          {row.id}
        </button>
      ),
    },
    {
      key: 'cropName',
      header: 'Crop Name',
      sortable: true,
      render: (row) => <span className="font-bold text-brand-text">{row.cropName}</span>,
    },
    {
      key: 'cropVariety',
      header: 'Crop Variety',
      render: (row) => <span className="text-xs text-brand-muted">{row.cropVariety}</span>,
    },
    {
      key: 'supplierName',
      header: 'Supplier Name',
      sortable: true,
    },
    {
      key: 'supplierCategory',
      header: 'Supplier Category',
      render: (row) => (
        <span className="px-2 py-0.5 rounded-md bg-brand-light/70 text-brand-primary text-xs font-semibold">
          {row.supplierCategory}
        </span>
      ),
    },
    {
      key: 'purchaseId',
      header: 'Purchase ID',
      render: (row) => (
        <span className="font-mono text-xs font-semibold text-brand-primary">{row.purchaseId}</span>
      ),
    },
    {
      key: 'batchNumber',
      header: 'Batch Number',
      sortable: true,
      render: (row) => (
        <span className="font-mono text-xs font-bold text-brand-text">{row.batchNumber}</span>
      ),
    },
    {
      key: 'purchaseDate',
      header: 'Purchase Date',
      sortable: true,
      render: (row) => <span className="whitespace-nowrap">{formatDate(row.purchaseDate)}</span>,
    },
    {
      key: 'purchasedQuantity',
      header: 'Purchased Qty',
      align: 'right',
      sortable: true,
      render: (row) => formatNumber(row.purchasedQuantity),
    },
    {
      key: 'processedQuantity',
      header: 'Processed Qty',
      align: 'right',
      sortable: true,
      render: (row) => formatNumber(row.processedQuantity),
    },
    {
      key: 'availableQuantity',
      header: 'Available Qty',
      align: 'right',
      sortable: true,
      render: (row) => (
        <span className="font-bold text-brand-primary">
          {formatNumber(row.availableQuantity)}
        </span>
      ),
    },
    {
      key: 'unit',
      header: 'Unit',
    },
    {
      key: 'averageCost',
      header: 'Average Cost',
      align: 'right',
      sortable: true,
      render: (row) => (
        <span className="whitespace-nowrap font-semibold">
          {formatCurrency(row.averageCost)}
        </span>
      ),
    },
    {
      key: 'qualityGrade',
      header: 'Quality Grade',
      render: (row) => <span className="text-xs">{row.qualityGrade}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => {
        const isLow =
          Number(row.availableQuantity || 0) <= Number(row.minimumThreshold || 15) &&
          Number(row.availableQuantity || 0) > 0;
        const badgeStatus =
          Number(row.availableQuantity || 0) <= 0
            ? 'Exhausted'
            : isLow
            ? 'Low Stock'
            : row.status;
        return <VendorStatusBadge status={badgeStatus} size="xs" />;
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (row) => (
        <div className="inline-flex items-center gap-1">
          <button
            type="button"
            onClick={() => onSelectBatch(row)}
            title="View Batch Traceability Details"
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-brand-light text-brand-primary hover:bg-brand-secondary hover:text-white transition-colors cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" />
            Details
          </button>
          {row.availableQuantity > 0 && (
            <button
              type="button"
              onClick={() => navigate(`/vendor/processing?stockId=${row.id}`)}
              title="Process Batch"
              className="p-1.5 rounded-lg bg-brand-primary text-white hover:bg-brand-secondary transition-colors cursor-pointer"
            >
              <Factory className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <VendorDataTable
      columns={columns}
      data={inventory}
      onResetFilters={onResetFilters}
    />
  );
}

export default InventoryTable;

