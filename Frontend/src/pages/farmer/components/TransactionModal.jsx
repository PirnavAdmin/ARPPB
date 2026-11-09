import { useFarmer } from '../context/FarmerContext';
import { formatCurrency, formatDate, buyerCategoryStyles } from '../utils/farmerHelpers';
import StatusBadge from './StatusBadge';

function TransactionModal({ transaction, onClose }) {
  const { otpRequests, setActiveOtpRequest } = useFarmer();

  if (!transaction) return null;

  const buyerStyle = buyerCategoryStyles[transaction.buyerCategory] || {
    bg: '#EBF3FB',
    color: '#1B609E',
  };

  // Find linked OTP request if any
  const linkedOtp = otpRequests.find(
    (o) => o.transactionId === transaction.id && o.otpStatus === 'Pending'
  );

  const handleOpenOtp = () => {
    if (linkedOtp) {
      onClose();
      setActiveOtpRequest(linkedOtp);
    }
  };

  return (
    <div className="farmer-modal-overlay" role="dialog" aria-modal="true">
      <div className="farmer-modal-content lg">
        <div className="farmer-modal-header">
          <div>
            <h3>Transaction Details</h3>
            <span style={{ fontSize: '0.84rem', color: 'var(--farmer-secondary)' }}>
              Transaction ID: <strong>{transaction.id}</strong> • Date: {formatDate(transaction.date)}
            </span>
          </div>
          <button type="button" className="farmer-modal-close" onClick={onClose} aria-label="Close modal">
            ✕
          </button>
        </div>

        <div className="farmer-modal-body">
          {/* Status Alert Banner */}
          <div
            style={{
              padding: '14px 18px',
              borderRadius: 12,
              backgroundColor: transaction.transactionStatus === 'Confirmed' ? '#E8F5EC' : '#FFF7ED',
              border: `1px solid ${transaction.transactionStatus === 'Confirmed' ? '#A3E6B4' : '#FED7AA'}`,
              marginBottom: 20,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 12,
            }}
          >
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.96rem', color: 'var(--farmer-text)' }}>
                {transaction.transactionStatus === 'Confirmed'
                  ? '✅ Transaction Confirmed & Verified'
                  : '⏳ Pending OTP Confirmation'}
              </div>
              <div style={{ fontSize: '0.84rem', color: 'var(--farmer-secondary)', marginTop: 2 }}>
                {transaction.transactionStatus === 'Confirmed'
                  ? `Your sale of ${transaction.quantity} ${transaction.unit} ${transaction.cropName} for ${formatCurrency(transaction.totalAmount)} has been confirmed. Your payment is expected within 3 working days (${formatDate(transaction.expectedPaymentDate)}).`
                  : 'Stock is currently reserved. Physical dispatch and stock deduction occur once OTP verification completes.'}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <StatusBadge status={transaction.transactionStatus} />
              <StatusBadge status={transaction.otpStatus} />
            </div>
          </div>

          {/* Details Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20 }}>
            {/* Buyer Details */}
            <div
              style={{
                background: '#F9FAF9',
                padding: '16px 18px',
                borderRadius: 12,
                border: '1px solid var(--farmer-border)',
              }}
            >
              <h4 style={{ margin: '0 0 12px', fontSize: '0.92rem', color: 'var(--farmer-secondary)' }}>
                BUYER & TRADING PARTY
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.9rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--farmer-secondary)' }}>Buyer Name:</span>
                  <strong>{transaction.buyerName}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--farmer-secondary)' }}>Category:</span>
                  <span
                    className="buyer-badge"
                    style={{ backgroundColor: buyerStyle.bg, color: buyerStyle.color }}
                  >
                    {transaction.buyerCategory}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--farmer-secondary)' }}>Contact Phone:</span>
                  <span>{transaction.buyerMobile || 'N/A'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--farmer-secondary)' }}>Pickup Location:</span>
                  <span style={{ textAlign: 'right', maxWidth: 200 }}>
                    {transaction.pickupLocation || 'Farm Gate'}
                  </span>
                </div>
              </div>
            </div>

            {/* Financial & Settlement */}
            <div
              style={{
                background: '#F9FAF9',
                padding: '16px 18px',
                borderRadius: 12,
                border: '1px solid var(--farmer-border)',
              }}
            >
              <h4 style={{ margin: '0 0 12px', fontSize: '0.92rem', color: 'var(--farmer-secondary)' }}>
                COMMODITY & SETTLEMENT
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.9rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--farmer-secondary)' }}>Crop Name:</span>
                  <strong>{transaction.cropName}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--farmer-secondary)' }}>Quantity:</span>
                  <span>
                    {transaction.quantity} {transaction.unit}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--farmer-secondary)' }}>Rate per Unit:</span>
                  <span>
                    {formatCurrency(transaction.rate)} / {transaction.unit}
                  </span>
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    paddingTop: 6,
                    borderTop: '1px solid var(--farmer-border)',
                  }}
                >
                  <span style={{ fontWeight: 700 }}>Total Value:</span>
                  <strong style={{ fontSize: '1.2rem', color: 'var(--farmer-primary)' }}>
                    {formatCurrency(transaction.totalAmount)}
                  </strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                  <span style={{ color: 'var(--farmer-secondary)' }}>Expected Payment:</span>
                  <strong style={{ color: 'var(--farmer-dark)' }}>
                    {formatDate(transaction.expectedPaymentDate)}
                  </strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--farmer-secondary)' }}>Payment Status:</span>
                  <StatusBadge status={transaction.paymentStatus} />
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          {transaction.notes && (
            <div
              style={{
                marginTop: 16,
                padding: '12px 16px',
                background: '#FCFDFC',
                borderRadius: 10,
                border: '1px dashed var(--farmer-border)',
                fontSize: '0.86rem',
                color: 'var(--farmer-secondary)',
              }}
            >
              <strong>Notes / Conditions:</strong> {transaction.notes}
            </div>
          )}
        </div>

        <div className="farmer-modal-footer">
          {linkedOtp && (
            <button
              type="button"
              className="farmer-btn farmer-btn-primary"
              onClick={handleOpenOtp}
            >
              🔐 Enter OTP / Confirm Now
            </button>
          )}

          <button
            type="button"
            className="farmer-btn farmer-btn-outline"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default TransactionModal;
