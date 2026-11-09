import { createCrudService, simulateDelay } from './api';
import { STORAGE_KEYS } from '../utils/constants';
import { INITIAL_CONFIRMATIONS } from '../data/mockSales';

/**
 * Mock OTP Confirmation Service
 * Note: Generates a 6-digit demo OTP for the frontend demo environment only.
 * Actual SMS delivery requires backend integration with an authorized SMS gateway.
 */
export const confirmationService = {
  ...createCrudService(STORAGE_KEYS.CONFIRMATIONS, INITIAL_CONFIRMATIONS),
  generateDemoOtpCode: () => {
    return String(Math.floor(100000 + Math.random() * 900000));
  },
  verifyOtp: async (otpRecord, enteredOtp) => {
    await simulateDelay(250);
    const cleaned = String(enteredOtp || '').trim();
    if (!otpRecord) {
      return { success: false, message: 'OTP record not found.' };
    }
    if (otpRecord.otpStatus === 'Verified') {
      return { success: true, alreadyVerified: true, message: 'Transaction is already verified.' };
    }
    if (otpRecord.otpStatus === 'Cancelled' || otpRecord.otpStatus === 'Expired') {
      return { success: false, message: `OTP is ${otpRecord.otpStatus.toLowerCase()}. Please resend a new OTP.` };
    }
    if ((otpRecord.attempts || 0) >= (otpRecord.maxAttempts || 3)) {
      return { success: false, locked: true, message: 'Maximum incorrect OTP attempts reached. Please resend OTP.' };
    }
    if (cleaned === String(otpRecord.demoOtpCode)) {
      return { success: true, alreadyVerified: false, message: 'OTP verified successfully.' };
    }
    return {
      success: false,
      message: `Invalid OTP entered. ${(otpRecord.maxAttempts || 3) - ((otpRecord.attempts || 0) + 1)} attempt(s) remaining.`,
    };
  },
};

export default confirmationService;

