import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, RefreshCw, Eye, CheckCircle2 } from 'lucide-react';
import { useVendor } from '../../../hooks/useVendor';
import VendorStatusBadge from '../VendorStatusBadge';
import VendorModal from '../VendorModal';
import { formatCurrency, maskMobileNumber } from '../../../utils/formatCurrency';

export function PendingConfirmations() {
  const navigate = useNavigate();
  const { confirmations, resendTransactionOtp, verifyTransactionOtp } = useVendor();

  const [verifyingItem, setVerifyingItem] = useState(null);
  const [otpInput, setOtpInput] = useState('');

  const pendingList = confirmations.filter(
    (c) => c.otpStatus === 'Pending' || c.otpStatus === 'Sent' || c.otpStatus === 'Failed'
  );

  const handleOpenVerify = (item) => {
    setVerifyingItem(item);
    setOtpInput(item.demoOtpCode || '');
  };

  const handleVerifySubmit = (e) => {
    e.preventDefault();
    if (!verifyingItem) return;
    const res = verifyTransactionOtp(verifyingItem.id, otpInput);
    if (res.success) {
      setVerifyingItem(null);
      setOtpInput('');
    }
  };

  return (
    <div className="bg-brand-surface rounded-2xl border border-brand-border p-5 shadow-2xs">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-brand-light text-brand-primary flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-brand-primary">Pending OTP Confirmations</h3>
            <p className="text-xs text-brand-muted">
              Awaiting OTP confirmation from Farmers, Middlemen, and Customers
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => navigate('/vendor/confirmations')}
          className="px-3.5 py-1.5 rounded-xl bg-brand-light text-brand-primary hover:bg-brand-secondary hover:text-white text-xs font-semibold transition-colors cursor-pointer"
        >
          View All Confirmations ({pendingList.length} Pending)
        </button>
      </div>

      {pendingList.length === 0 ? (
        <div className="p-6 rounded-xl bg-brand-light/30 border border-brand-secondary/30 text-center">
          <CheckCircle2 className="w-8 h-8 text-brand-success mx-auto mb-2" />
          <p className="text-sm font-semibold text-brand-text">
            All Farmer, Middleman, and Customer transactions are verified!
          </p>
          <p className="text-xs text-brand-muted mt-0.5">
            New purchases and sales orders requiring OTP confirmation will appear here immediately.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {pendingList.map((item) => (
            <div
              key={item.id}
              className="rounded-xl border border-brand-border bg-brand-background/60 p-4 flex flex-col justify-between gap-3 hover:border-brand-secondary transition-colors"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-brand-light text-brand-primary">
                      {item.transactionType}
                    </span>
                    <h4 className="text-sm font-bold text-brand-text mt-1.5">{item.partyName}</h4>
                    <p className="text-xs text-brand-muted">
                      {maskMobileNumber(item.mobileNumber)} • ID:{' '}
                      <strong className="text-brand-primary">{item.transactionId}</strong>
                    </p>
                  </div>
                  <VendorStatusBadge status={item.otpStatus} size="xs" />
                </div>

                <div className="mt-3 pt-2.5 border-t border-brand-border/70 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-brand-muted block text-[11px]">Amount</span>
                    <strong className="text-brand-primary text-sm">
                      {formatCurrency(item.amount)}
                    </strong>
                  </div>
                  <div>
                    <span className="text-brand-muted block text-[11px]">Initiated</span>
                    <span className="font-medium text-brand-text">{item.initiatedDate}</span>
                  </div>
                </div>

                <div className="mt-2.5 px-2.5 py-1.5 rounded-lg bg-brand-light/50 border border-brand-secondary/30 flex items-center justify-between text-xs">
                  <span className="text-brand-primary font-medium">Demo Sandbox OTP:</span>
                  <code className="font-bold tracking-widest text-brand-primary bg-white px-2 py-0.5 rounded border border-brand-secondary/30">
                    {item.demoOtpCode}
                  </code>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-brand-border">
                <button
                  type="button"
                  onClick={() => handleOpenVerify(item)}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-brand-primary text-white hover:bg-brand-secondary transition-colors cursor-pointer"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Verify OTP
                </button>
                <button
                  type="button"
                  onClick={() => resendTransactionOtp(item.id)}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-brand-light text-brand-primary hover:bg-brand-secondary hover:text-white transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Resend
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/vendor/confirmations')}
                  className="p-1.5 rounded-lg border border-brand-border bg-brand-surface text-brand-muted hover:text-brand-primary cursor-pointer"
                  title="View Confirmation Details"
                >
                  <Eye className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quick OTP Verification Modal */}
      <VendorModal
        isOpen={Boolean(verifyingItem)}
        onClose={() => setVerifyingItem(null)}
        title={`Verify Transaction OTP – ${verifyingItem?.transactionId || ''}`}
        subtitle={`${verifyingItem?.partyName || ''} (${verifyingItem?.transactionType || ''})`}
        size="sm"
      >
        {verifyingItem && (
          <form onSubmit={handleVerifySubmit} className="space-y-4">
            <div className="p-3.5 rounded-xl bg-brand-light/40 border border-brand-secondary/30 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-brand-muted">Party Mobile:</span>
                <strong className="text-brand-text">
                  {maskMobileNumber(verifyingItem.mobileNumber)}
                </strong>
              </div>
              <div className="flex justify-between">
                <span className="text-brand-muted">Product &amp; Qty:</span>
                <strong className="text-brand-text">{verifyingItem.product}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-brand-muted">Transaction Value:</span>
                <strong className="text-brand-primary">
                  {formatCurrency(verifyingItem.amount)}
                </strong>
              </div>
              <div className="pt-2 mt-2 border-t border-brand-secondary/30 flex items-center justify-between">
                <span className="font-semibold text-brand-primary">
                  Demo Environment OTP Code:
                </span>
                <span className="px-2 py-0.5 rounded bg-brand-primary text-white font-mono font-bold tracking-widest">
                  {verifyingItem.demoOtpCode}
                </span>
              </div>
            </div>

            <div>
              <label
                htmlFor="dash-otp-input"
                className="block text-xs font-semibold text-brand-text mb-1.5"
              >
                Enter 6-Digit Confirmation OTP <span className="text-brand-error">*</span>
              </label>
              <input
                id="dash-otp-input"
                type="text"
                maxLength={6}
                required
                value={otpInput}
                onChange={(e) => setOtpInput(e.target.value)}
                placeholder="Enter 6-digit OTP"
                className="w-full px-3.5 py-2.5 text-center font-mono text-lg font-bold tracking-widest bg-brand-surface border border-brand-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary"
              />
              <p className="text-[11px] text-brand-muted mt-1.5">
                Note: Simulated OTP verification for frontend demo. Real SMS gateway requires backend integration.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setVerifyingItem(null)}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-brand-light text-brand-primary hover:bg-brand-secondary hover:text-white transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-brand-primary text-white hover:bg-brand-secondary transition-colors cursor-pointer"
              >
                Verify &amp; Confirm Transaction
              </button>
            </div>
          </form>
        )}
      </VendorModal>
    </div>
  );
}

export default PendingConfirmations;

