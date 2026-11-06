import { useNavigate } from 'react-router-dom';
import { Phone, Mail, MapPin, Landmark, Handshake, FileText } from 'lucide-react';
import VendorStatusBadge from '../VendorStatusBadge';
import VendorDataTable from '../VendorDataTable';
import { formatCurrency, formatNumber, maskIdentifier } from '../../../utils/formatCurrency';
import { formatDate } from '../../../utils/formatDate';

export function MiddlemanDetails({ middleman, purchases = [], ledger = [], onEdit, onClose }) {
  const navigate = useNavigate();
  if (!middleman) return null;

  const midPurchases = purchases.filter(
    (p) => p.supplierCategory === 'Middleman' && p.supplierId === middleman.id
  );
  const midLedger = ledger.filter((l) => l.partyId === middleman.id);

  const columns = [
    {
      key: 'id',
      header: 'Purchase ID',
      render: (row) => <span className="font-bold text-brand-primary">{row.id}</span>,
    },
    {
      key: 'purchaseDate',
      header: 'Date',
      render: (row) => formatDate(row.purchaseDate),
    },
    {
      key: 'crop',
      header: 'Crop & Variety',
      render: (row) => `${row.crop} (${row.variety})`,
    },
    {
      key: 'quantity',
      header: 'Quantity',
      render: (row) => `${row.quantity} ${row.unit}`,
    },
    {
      key: 'totalAmount',
      header: 'Total Value',
      align: 'right',
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
      key: 'status',
      header: 'Status',
      render: (row) => <VendorStatusBadge status={row.status} size="xs" />,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="p-4 rounded-xl bg-brand-light/40 border border-brand-secondary/30 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="px-2.5 py-0.5 rounded-md bg-brand-primary text-white font-mono text-xs font-bold">
              {middleman.id}
            </span>
            <h3 className="text-lg font-bold text-brand-text">{middleman.businessName}</h3>
            <VendorStatusBadge status={middleman.status} size="xs" />
          </div>
          <p className="text-xs text-brand-muted mt-1">
            Owner: <strong>{middleman.ownerName}</strong> • GSTIN:{' '}
            <strong>{middleman.gstNumber || 'Unregistered'}</strong> • PAN:{' '}
            <strong>{middleman.pan || '—'}</strong>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              onClose();
              navigate(`/vendor/purchases/middlemen?middlemanId=${middleman.id}`);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-brand-primary text-white hover:bg-brand-secondary transition-colors cursor-pointer"
          >
            <Handshake className="w-3.5 h-3.5" />
            New Purchase from Middleman
          </button>
          {onEdit && (
            <button
              type="button"
              onClick={() => onEdit(middleman)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-brand-surface border border-brand-border text-brand-primary hover:bg-brand-light transition-colors cursor-pointer"
            >
              Edit Details
            </button>
          )}
        </div>
      </div>

      {/* Purchase & Financial Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-brand-background border border-brand-border">
          <span className="text-[11px] font-semibold uppercase text-brand-muted">
            Confirmed Purchases
          </span>
          <p className="text-lg font-bold text-brand-primary mt-0.5">
            {middleman.totalPurchases} ({formatNumber(middleman.totalQuantity)} Qtl)
          </p>
        </div>
        <div className="p-3.5 rounded-xl bg-brand-background border border-brand-border">
          <span className="text-[11px] font-semibold uppercase text-brand-muted">
            Total Purchase Value
          </span>
          <p className="text-lg font-bold text-brand-text mt-0.5">
            {formatCurrency(middleman.purchaseValue)}
          </p>
        </div>
        <div className="p-3.5 rounded-xl bg-brand-background border border-brand-border">
          <span className="text-[11px] font-semibold uppercase text-brand-muted">
            Opening Balance
          </span>
          <p className="text-lg font-bold text-brand-text mt-0.5">
            {formatCurrency(middleman.openingBalance)}
          </p>
        </div>
        <div className="p-3.5 rounded-xl bg-brand-light/40 border border-brand-secondary/40">
          <span className="text-[11px] font-semibold uppercase text-brand-primary">
            Outstanding Payables
          </span>
          <p className="text-lg font-bold text-brand-warning mt-0.5">
            {formatCurrency(middleman.outstandingPayables)}
          </p>
        </div>
      </div>

      {/* Contact, GST & Bank Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        <div className="p-4 rounded-xl bg-brand-surface border border-brand-border space-y-2.5">
          <h4 className="font-bold text-brand-primary uppercase tracking-wider">
            Contact &amp; Market Yard Address
          </h4>
          <div className="flex items-center gap-2 text-brand-text">
            <Phone className="w-3.5 h-3.5 text-brand-primary" />
            <span>+91 {middleman.mobileNumber}</span>
          </div>
          <div className="flex items-center gap-2 text-brand-text">
            <Mail className="w-3.5 h-3.5 text-brand-primary" />
            <span>{middleman.email || '—'}</span>
          </div>
          <div className="flex items-start gap-2 text-brand-text">
            <MapPin className="w-3.5 h-3.5 text-brand-primary shrink-0 mt-0.5" />
            <span>
              {middleman.address}, {middleman.village ? `${middleman.village}, ` : ''}
              {middleman.district}, {middleman.state} - {middleman.pinCode || '—'}
            </span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-brand-surface border border-brand-border space-y-2.5">
          <h4 className="font-bold text-brand-primary uppercase tracking-wider flex items-center gap-1.5">
            <Landmark className="w-3.5 h-3.5" />
            GST &amp; Settlement Bank Information
          </h4>
          <div className="flex items-center gap-2 text-brand-text">
            <FileText className="w-3.5 h-3.5 text-brand-primary" />
            <span>
              GSTIN: <strong>{middleman.gstNumber || 'N/A'}</strong> • PAN:{' '}
              <strong>{middleman.pan || 'N/A'}</strong>
            </span>
          </div>
          <p className="text-brand-text">
            Bank: <strong>{middleman.bankName || 'Not provided'}</strong> • A/C:{' '}
            <strong>{maskIdentifier(middleman.accountNumber, 4)}</strong> • IFSC:{' '}
            <strong>{middleman.ifscCode || '—'}</strong>
          </p>
          <p className="text-brand-muted">
            Linked Ledger Vouchers: <strong>{midLedger.length}</strong>
          </p>
        </div>
      </div>

      {/* Purchase Transaction History */}
      <div>
        <h4 className="text-xs font-bold uppercase tracking-wider text-brand-primary mb-2">
          Middleman Purchase Transaction History
        </h4>
        <VendorDataTable
          columns={columns}
          data={midPurchases}
          initialPageSize={5}
          emptyTitle="No purchases recorded from this middleman"
        />
      </div>
    </div>
  );
}

export default MiddlemanDetails;

