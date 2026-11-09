import { useVendor } from '../../../hooks/useVendor';
import { OTP_STATUSES } from '../../../utils/constants';
import SharedOtpConfirmations from '../../../components/shared/otp-confirmations/OtpConfirmations';

const VENDOR_OTP_TABS = [
  { id: 'Farmer', label: 'Farmer Confirmations' },
  { id: 'Middleman', label: 'Middleman Confirmations' },
  { id: 'Customer', label: 'Customer Confirmations' },
  { id: 'All', label: 'All Confirmations' },
];

export default function OTPConfirmations() {
  const {
    confirmations,
    verifyTransactionOtp,
    resendTransactionOtp,
  } = useVendor();

  const handleVerifyOtp = ({ otpId, transactionId, enteredCode }) => {
    return verifyTransactionOtp({
      otpId,
      transactionId,
      enteredCode,
    });
  };

  const handleResendOtp = (otpId) => {
    return resendTransactionOtp(otpId);
  };

  return (
    <SharedOtpConfirmations
      portal="vendor"
      title="OTP Confirmations & Transaction Security"
      subtitle="Multi-party OTP verification center for Farmer Purchases, Middleman Purchases, and Customer Sales Orders"
      confirmations={confirmations}
      tabs={VENDOR_OTP_TABS}
      statusOptions={OTP_STATUSES}
      onVerifyOtp={handleVerifyOtp}
      onResendOtp={handleResendOtp}
      exportFilePrefix="Vendor_OTP_Confirmations_Log"
    />
  );
}
