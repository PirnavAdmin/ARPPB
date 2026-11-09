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
    <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 sm:p-6 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 min-w-[2.5rem] min-h-[2.5rem] rounded-xl bg-[#CCFBF1] text-[#0F766E] border border-[#14B8A6]/25 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5 stroke-[2] shrink-0" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#0F766E] leading-snug">
              Pending OTP Confirmations
            </h3>
            <p className="text-xs text-[#64748B] mt-0.5">
              Awaiting OTP confirmation from Farmers, Middlemen, and Customers
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => navigate('/vendor/confirmations')}
          className="inline-flex items-center justify-center h-9 px-4 rounded-xl bg-[#CCFBF1] text-[#0F766E] border border-[#14B8A6]/30 hover:bg-[#0F766E] hover:text-white text-xs font-semibold transition-all duration-200 cursor-pointer shrink-0"
        >
          View All Confirmations ({pendingList.length} Pending)
        </button>
      </div>

      {pendingList.length === 0 ? (
        <div className="py-8 px-6 rounded-2xl bg-[#F5FAF8] border border-[#14B8A6]/25 text-center">
          <div className="w-12 h-12 rounded-full bg-[#DCFCE7] text-[#16A34A] border border-[#16A34A]/20 flex items-center justify-center mx-auto mb-3 shadow-2xs">
            <CheckCircle2 className="w-6 h-6 stroke-[2]" />
          </div>
          <p className="text-sm font-bold text-[#172B29]">
            All Farmer, Middleman, and Customer transactions are verified!
          </p>
          <p className="text-xs text-[#64748B] mt-1 max-w-md mx-auto">
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
                  className="flex-1 h-8 inline-flex items-center justify-center gap-1.5 px-3 rounded-lg text-xs font-semibold bg-brand-primary text-white hover:bg-brand-secondary transition-colors cursor-pointer shrink-0"
                >
                  <ShieldCheck className="w-3.5 h-3.5 shrink-0 !max-w-none" />
                  <span>Verify OTP</span>
                </button>
                <button
                  type="button"
                  onClick={() => resendTransactionOtp(item.id)}
                  className="h-8 inline-flex items-center gap-1.5 px-2.5 rounded-lg text-xs font-semibold bg-brand-light text-brand-primary hover:bg-brand-secondary hover:text-white transition-colors cursor-pointer shrink-0"
                >
                  <RefreshCw className="w-3.5 h-3.5 shrink-0 !max-w-none" />
                  <span>Resend</span>
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/vendor/confirmations')}
                  className="w-8 h-8 inline-flex items-center justify-center shrink-0 rounded-lg border border-brand-border bg-brand-surface text-brand-muted hover:bg-brand-light hover:text-brand-primary transition-colors cursor-pointer"
                  title="View Confirmation Details"
                >
                  <Eye className="w-4 h-4 shrink-0 !max-w-none" />
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

