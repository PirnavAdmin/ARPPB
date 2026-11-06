import { useNavigate } from 'react-router-dom';
import { Tractor } from 'lucide-react';
import VendorDataTable from '../VendorDataTable';
import VendorStatusBadge from '../VendorStatusBadge';
import { formatCurrency } from '../../../utils/formatCurrency';
import { formatDate } from '../../../utils/formatDate';

export function FarmerPurchaseHistory({ farmer, purchases = [] }) {
  const navigate = useNavigate();

  const farmerPurchases = purchases.filter(
    (p) => p.supplierCategory === 'Farmer' && p.supplierId === farmer?.id
  );

  const columns = [
    {
      key: 'id',
      header: 'Purchase ID',
      sortable: true,
      render: (row) => <span className="font-bold text-brand-primary">{row.id}</span>,
    },
    {
      key: 'purchaseDate',
      header: 'Purchase Date',
      sortable: true,
      render: (row) => formatDate(row.purchaseDate),
    },
    {
      key: 'crop',
      header: 'Crop & Variety',
      render: (row) => (
        <div>
          <p className="font-semibold text-brand-text">{row.crop}</p>
          <p className="text-xs text-brand-muted">{row.variety}</p>
        </div>
      ),
    },
    {
      key: 'quantity',
      header: 'Quantity',
      render: (row) => (
        <span className="font-semibold">
          {row.quantity} {row.unit}
        </span>
      ),
    },
    {
      key: 'rate',
      header: 'Rate / Unit',
      align: 'right',
      render: (row) => formatCurrency(row.rate),
    },
    {
      key: 'totalAmount',
      header: 'Total Value',
      align: 'right',
      sortable: true,
      render: (row) => (
        <span className="font-bold text-brand-primary">{formatCurrency(row.totalAmount)}</span>
      ),
    },
    {
      key: 'otpStatus',
      header: 'OTP Status',
      render: (row) => <VendorStatusBadge status={row.otpStatus} size="xs" />,
    },
    {
      key: 'paymentStatus',
      header: 'Payment',
      render: (row) => <VendorStatusBadge status={row.paymentStatus} size="xs" />,
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <VendorStatusBadge status={row.status} size="xs" />,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-brand-light/40 border border-brand-secondary/30">
        <div className="text-xs">
          <span className="text-brand-muted">Farmer:</span>{' '}
          <strong className="text-brand-primary">
            {farmer?.farmerName} ({farmer?.id})
          </strong>{' '}
          • {farmer?.village}, {farmer?.district}
        </div>
        <button
          type="button"
          onClick={() => navigate(`/vendor/purchases/farmers?farmerId=${farmer?.id}`)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-brand-primary text-white hover:bg-brand-secondary transition-colors cursor-pointer"
        >
          <Tractor className="w-3.5 h-3.5" />
          New Purchase from {farmer?.farmerName}
        </button>
      </div>

      <VendorDataTable
        columns={columns}
        data={farmerPurchases}
        initialPageSize={5}
        emptyTitle="No purchases recorded for this farmer yet"
        emptyDescription="Click 'New Purchase' above to initiate a raw material purchase from this farmer."
      />
    </div>
  );
}

export default FarmerPurchaseHistory;

