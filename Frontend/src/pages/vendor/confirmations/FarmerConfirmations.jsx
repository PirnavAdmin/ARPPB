import { ShieldCheck, RefreshCw, Eye, KeyRound } from 'lucide-react';
import { formatCurrency, maskMobile } from '../../../utils/formatCurrency';
import VendorDataTable from '../VendorDataTable';
import VendorStatusBadge from '../VendorStatusBadge';

export default function FarmerConfirmations({
  records = [],
  onOpenVerifyModal,
  onResendOtp,
  onViewDetails,
}) {
  const columns = [
    {
      key: 'transactionId',
      label: 'Transaction ID',
      render: (row) => (
        <div>
          <span className="font-bold text-brand-primary block">{row.transactionId}</span>
          <span className="text-[11px] font-mono text-brand-muted">{row.id}</span>
        </div>
      ),
    },
    {
      key: 'partyName',
      label: 'Party Name',
      render: (row) => (
        <div>
          <span className="font-semibold text-brand-text block">{row.partyName}</span>
          <span className="text-[11px] text-brand-muted">{row.partyId}</span>
        </div>
      ),
    },
    {
      key: 'partyCategory',
      label: 'Party Category',
      render: (row) => <VendorStatusBadge status={row.partyCategory} />,
    },
    {
      key: 'mobileNumber',
      label: 'Mobile Number',
      render: (row) => (
        <span className="font-mono text-xs">{maskMobile(row.mobileNumber)}</span>
      ),
    },
    {
      key: 'transactionType',
      label: 'Transaction Type',
      render: (row) => <span className="font-medium">{row.transactionType}</span>,
    },
    {
      key: 'product',
      label: 'Product',
      render: (row) => <span className="font-semibold text-brand-text">{row.product}</span>,
    },
    {
      key: 'quantity',
      label: 'Quantity',
      render: (row) => <span className="font-semibold">{row.quantity}</span>,
    },
    {
      key: 'amount',
      label: 'Amount',
      align: 'right',
      render: (row) => (
        <span className="font-bold text-brand-primary">
          {formatCurrency(row.amount)}
        </span>
      ),
    },
    {
      key: 'otpStatus',
      label: 'OTP Status',
      render: (row) => (
        <div className="space-y-1">
          <VendorStatusBadge status={row.otpStatus} />
          {row.otpStatus !== 'Verified' && row.otpStatus !== 'Cancelled' && (
            <span className="block text-[10px] font-mono font-bold text-brand-primary">
              Demo OTP: {row.demoOtpCode}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'confirmationDate',
      label: 'Confirmation Date',
      render: (row) => (
        <span className="text-xs">{row.confirmationDate || 'Awaiting Verification'}</span>
      ),
    },
    {
      key: 'expiryTime',
      label: 'Expiry Time',
      render: (row) => <span className="text-xs text-brand-muted">{row.expiryTime}</span>,
    },
    {
      key: 'actions',
      label: 'Actions',
      align: 'right',
      render: (row) => {
        const canVerify =
          row.otpStatus === 'Pending' ||
          row.otpStatus === 'Sent' ||
          row.otpStatus === 'Failed' ||
          row.otpStatus === 'Expired';

        return (
          <div className="flex items-center justify-end gap-1.5">
            {canVerify && (
              <>
                <button
                  type="button"
                  onClick={() => onOpenVerifyModal(row)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg bg-brand-primary text-white hover:bg-brand-secondary transition-colors cursor-pointer"
                  title="Enter & Verify OTP"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  Verify
                </button>
                <button
                  type="button"
                  onClick={() => onResendOtp(row.id)}
                  className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-lg border border-brand-primary text-brand-primary hover:bg-brand-light/50 transition-colors cursor-pointer"
                  title="Resend OTP"
                >
                  <RefreshCw className="w-3 h-3" />
                </button>
              </>
            )}
            <button
              type="button"
              onClick={() => onViewDetails(row)}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-brand-light text-brand-primary hover:bg-brand-primary hover:text-white transition-colors cursor-pointer"
              title="View Transaction & OTP Attempt History"
            >
              <Eye className="w-3.5 h-3.5" />
              Details
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <VendorDataTable
      columns={columns}
      data={records}
      rowKey="id"
      enablePagination={false}
      emptyTitle="No Farmer OTP Confirmations Found"
      emptyDescription="All farmer raw material purchases matching the current filter are displayed here."
      emptyIcon={ShieldCheck}
    />
  );
}

