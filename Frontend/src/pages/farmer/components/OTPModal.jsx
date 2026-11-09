import { useState, useEffect, useRef } from 'react';
import { useFarmer } from '../context/FarmerContext';
import { formatCurrency, buyerCategoryStyles } from '../utils/farmerHelpers';

function OTPModal({ request, onClose }) {
  const { verifyOTP, rejectOTP, resendOTP } = useFarmer();
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [countdown, setCountdown] = useState(() => {
    const expiresAt = Number(request?.expiresAt || Date.now() + (Number(request?.expiresInMinutes || 10) * 60 * 1000));
    return Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000));
  });
  const [resendCooldown, setResendCooldown] = useState(30);
  const [errorMsg, setErrorMsg] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const inputRefs = useRef([]);

  useEffect(() => {
    if (!request?.expiresAt && !request?.expiresInMinutes) return;
    const updateCountdown = () => {
      const expiresAt = Number(request?.expiresAt || Date.now() + (Number(request?.expiresInMinutes || 10) * 60 * 1000));
      setCountdown(Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000)));
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, [request?.expiresAt, request?.expiresInMinutes, request?.id]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const cooldownTimer = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(cooldownTimer);
  }, [resendCooldown]);

  // Auto focus first input on load
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  if (!request) return null;

  const buyerStyle = buyerCategoryStyles[request.buyerCategory] || {
    bg: '#EBF3FB',
    color: '#1B609E',
  };

  const handleDigitChange = (index, value) => {
    // Only accept numeric
    const clean = value.replace(/[^0-9]/g, '');
    if (!clean && value !== '') return;

    const newDigits = [...otpDigits];
    newDigits[index] = clean.slice(-1); // Take last typed char
    setOtpDigits(newDigits);
    setErrorMsg('');

    // Auto-advance
    if (clean && index < 5 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const paste = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 6);
    if (!paste) return;
    const newDigits = [...otpDigits];
    paste.split('').forEach((char, i) => {
      newDigits[i] = char;
    });
    setOtpDigits(newDigits);
    if (inputRefs.current[Math.min(paste.length, 5)]) {
      inputRefs.current[Math.min(paste.length, 5)].focus();
    }
  };

  const fullCode = otpDigits.join('');

  const handleVerify = () => {
    if (fullCode.length !== 6) {
      setErrorMsg('Please enter the complete 6-digit OTP code.');
      return;
    }
    const success = verifyOTP(request.id, fullCode);
    if (!success) {
      setErrorMsg('Verification failed. Please check the code and try again.');
    } else {
      onClose();
    }
  };

  const handleRejectConfirm = () => {
    rejectOTP(request.id, rejectReason || 'Transaction rejected by farmer.');
    onClose();
  };

  const formatTimer = (sec) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="farmer-modal-overlay" role="dialog" aria-modal="true">
      <div className="farmer-modal-content">
        <div className="farmer-modal-header">
          <div>
            <h3>Secure OTP Confirmation</h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--farmer-secondary)' }}>
              Transaction: <strong>{request.transactionId}</strong>
            </span>
          </div>
          <button type="button" className="farmer-modal-close" onClick={onClose} aria-label="Close modal">
            ✕
          </button>
        </div>

        <div className="farmer-modal-body">
          {/* Transaction Summary Card inside Modal */}
          <div
            style={{
              padding: '16px',
              backgroundColor: '#F7FAF7',
              borderRadius: 12,
              border: '1px solid var(--farmer-border)',
              marginBottom: 20,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span
                className="buyer-badge"
                style={{ backgroundColor: buyerStyle.bg, color: buyerStyle.color }}
              >
                {request.buyerCategory}
              </span>
              <strong style={{ fontSize: '1.15rem', color: 'var(--farmer-primary)' }}>
                {formatCurrency(request.totalAmount)}
              </strong>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: '0.88rem' }}>
              <div>
                <span style={{ color: 'var(--farmer-secondary)', display: 'block', fontSize: '0.76rem' }}>BUYER</span>
                <strong>{request.buyerName}</strong>
                <div style={{ fontSize: '0.78rem', color: 'var(--farmer-secondary)' }}>{request.buyerMobile}</div>
              </div>
              <div>
                <span style={{ color: 'var(--farmer-secondary)', display: 'block', fontSize: '0.76rem' }}>CROP DETAILS</span>
                <strong>{request.crop}</strong>
                <div style={{ fontSize: '0.78rem', color: 'var(--farmer-secondary)' }}>
                  {request.quantity} {request.unit} @ {formatCurrency(request.rate)}/{request.unit}
                </div>
              </div>
            </div>
          </div>

          {!isRejecting ? (
            <>
              <div style={{ textAlign: 'center', marginBottom: 12 }}>
                <p style={{ margin: 0, fontSize: '0.92rem', color: 'var(--farmer-text)' }}>
                  Enter the 6-digit confirmation code generated for this transaction.
                </p>
                <small style={{ color: 'var(--farmer-secondary)' }}>
                  A verification SMS with OTP was sent to receiving party at <strong>{request.buyerMobile}</strong>
                </small>
              </div>

              {/* 6-box OTP Input */}
              <div className="otp-input-boxes" onPaste={handlePaste}>
                {otpDigits.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => (inputRefs.current[idx] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    className="otp-digit"
                    value={digit}
                    onChange={(e) => handleDigitChange(idx, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(idx, e)}
                  />
                ))}
              </div>

              {/* Countdown & Attempts Status */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '0.84rem',
                  color: 'var(--farmer-secondary)',
                  marginBottom: 16,
                }}
              >
                <span>
                  Code expires in: <strong style={{ color: countdown < 60 ? 'var(--farmer-danger)' : 'var(--farmer-text)' }}>{formatTimer(countdown)}</strong>
                </span>
                <span>
                  Verification attempts left: <strong>{request.attemptsLeft}</strong>
                </span>
              </div>

              {errorMsg && (
                <div
                  style={{
                    backgroundColor: '#FEF2F2',
                    color: 'var(--farmer-danger)',
                    padding: '10px 14px',
                    borderRadius: 8,
                    fontSize: '0.84rem',
                    marginBottom: 16,
                    border: '1px solid #FECACA',
                  }}
                >
                  ⚠️ {errorMsg}
                </div>
              )}

              {/* Resend button */}
              <div style={{ textAlign: 'center', marginBottom: 12 }}>
                {resendCooldown > 0 ? (
                  <span style={{ fontSize: '0.82rem', color: 'var(--farmer-secondary)' }}>
                    Resend OTP available in {resendCooldown}s
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      resendOTP(request.id);
                      setResendCooldown(30);
                      setErrorMsg('');
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--farmer-primary)',
                      fontWeight: 700,
                      cursor: 'pointer',
                      fontSize: '0.86rem',
                    }}
                  >
                    🔄 Resend OTP Code
                  </button>
                )}
              </div>
            </>
          ) : (
            <div style={{ padding: '10px 0' }}>
              <h4 style={{ color: 'var(--farmer-danger)', margin: '0 0 8px' }}>Reject Transaction</h4>
              <p style={{ fontSize: '0.88rem', color: 'var(--farmer-secondary)', margin: '0 0 14px' }}>
                Rejecting this transaction will release any held or reserved inventory back into your available stock.
              </p>
              <div className="farmer-form-group">
                <label>Reason for rejection (optional):</label>
                <textarea
                  rows={3}
                  placeholder="e.g., Buyer cancelled order, price mismatch, inspection failure..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                />
              </div>
            </div>
          )}
        </div>

        <div className="farmer-modal-footer">
          {!isRejecting ? (
            <>
              <button
                type="button"
                className="farmer-btn farmer-btn-danger"
                onClick={() => setIsRejecting(true)}
              >
                Reject Transaction
              </button>
              <button
                type="button"
                className="farmer-btn farmer-btn-outline"
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                type="button"
                className="farmer-btn farmer-btn-primary"
                onClick={handleVerify}
                disabled={fullCode.length !== 6 || countdown <= 0}
              >
                Confirm Transaction
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className="farmer-btn farmer-btn-outline"
                onClick={() => setIsRejecting(false)}
              >
                Back
              </button>
              <button
                type="button"
                className="farmer-btn farmer-btn-danger"
                onClick={handleRejectConfirm}
              >
                Confirm Rejection
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default OTPModal;
