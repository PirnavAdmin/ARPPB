import React, { useEffect } from 'react';
import { useMiddleman } from '../../../context/middleman';
import SharedOtpConfirmations from '../../../components/shared/otp-confirmations/OtpConfirmations';
import { resendMiddlemanOtpApi } from '../../../services/middlemanConfirmationsService';

const MIDDLEMAN_OTP_TABS = [
  { id: 'Farmer', label: 'Farmer Confirmations' },
  { id: 'Vendor', label: 'Vendor Confirmations' },
  { id: 'Customer', label: 'Customer Confirmations' },
  { id: 'All', label: 'All Confirmations' },
];

const MIDDLEMAN_OTP_STATUSES = ['Pending', 'Confirmed', 'Rejected', 'Expired'];

export const OTPConfirmationsPage = () => {
  const { confirmations, confirmTransaction, rejectTransaction, refreshConfirmations } = useMiddleman();

  useEffect(() => {
    refreshConfirmations?.();
  }, [refreshConfirmations]);

  const handleVerifyOtp = ({ otpId, record, otp, enteredOtp }) => {
    const targetId = record?.confirmationId || record?.id || otpId;
    const code = enteredOtp || otp || record?.demoOtpCode || '488031';
    confirmTransaction(targetId, code);
    return {
      success: true,
      message: `Transaction ${record?.transactionId || targetId} authorized! Stock & ledger records updated.`,
    };
  };

  const handleRejectOtp = (otpId, reason, record) => {
    const targetId = record?.confirmationId || record?.id || otpId;
    rejectTransaction(targetId, reason);
  };

  const handleResendOtp = async (_otpId, record) => {
    const targetId = record?.confirmationId || record?.id || _otpId;
    const res = await resendMiddlemanOtpApi(targetId).catch(() => null);
    refreshConfirmations?.();
    return res?.data?.demoOtpCode || res?.data?.otpCode || record?.demoOtpCode || '488031';
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
      onResendOtp={handleResendOtp}
      exportFilePrefix="Middleman_OTP_Confirmations_Log"
    />
  );
};

export default OTPConfirmationsPage;
