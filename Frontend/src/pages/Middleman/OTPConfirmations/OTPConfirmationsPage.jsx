import React from 'react';
import { useMiddleman } from '../../../context/middleman';
import SharedOtpConfirmations from '../../../components/shared/otp-confirmations/OtpConfirmations';

const MIDDLEMAN_OTP_TABS = [
  { id: 'Farmer', label: 'Farmer Confirmations' },
  { id: 'Vendor', label: 'Vendor Confirmations' },
  { id: 'Customer', label: 'Customer Confirmations' },
  { id: 'All', label: 'All Confirmations' },
];

const MIDDLEMAN_OTP_STATUSES = ['Pending', 'Confirmed', 'Rejected', 'Expired'];

export const OTPConfirmationsPage = () => {
  const { confirmations, confirmTransaction, rejectTransaction } = useMiddleman();

  const handleVerifyOtp = ({ otpId }) => {
    confirmTransaction(otpId);
    return {
      success: true,
      message: 'Transaction authorized! Stock & ledger records updated.',
    };
  };

  const handleRejectOtp = (otpId, reason) => {
    rejectTransaction(otpId, reason);
  };

  return (
    <SharedOtpConfirmations
      portal="middleman"
      title="OTP Confirmations & Transaction Security"
      subtitle="Multi-party OTP verification center for Farmer Purchases, Vendor Sales, and Customer Sales"
      confirmations={confirmations}
      tabs={MIDDLEMAN_OTP_TABS}
      statusOptions={MIDDLEMAN_OTP_STATUSES}
      onVerifyOtp={handleVerifyOtp}
      onRejectOtp={handleRejectOtp}
      exportFilePrefix="Middleman_OTP_Confirmations_Log"
    />
  );
};

export default OTPConfirmationsPage;
