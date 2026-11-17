/**
 * Customer Portal - Mobile Number Update OTP Service
 *
 * Temporary frontend-only demo OTP logic for mobile number update verification.
 * All functions here are replaceable with real backend API calls later.
 *
 * No Customer mobile-update OTP endpoint contract is available in this
 * frontend. Replace this adapter only after the backend contract is supplied.
 *
 * Demo OTP records are scoped by customer and kept in memory only. This
 * frontend-only demo flow is not production-secure.
 */

const OTP_EXPIRY_SECONDS = 300;
const RESEND_COOLDOWN_SECONDS = 30;
const MAX_ATTEMPTS = 3;
const demoOtpRecords = new Map();

try {
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem('arppb_customer_mobile_update_otp_v1');
  }
} catch {
  // Storage cleanup is best effort; active demo OTPs remain in memory only.
}

function getRecordKey(customerId, mobileNumber) {
  return `${customerId || 'customer'}:${mobileNumber}`;
}

export function generateSixDigitCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export function formatMaskedNumber(mobileNumber) {
  const digits = String(mobileNumber || '').replace(/\D/g, '');
  if (digits.length !== 10) return mobileNumber;
  return `+91 ${digits.slice(0, 5)}*****`;
}

export function formatDisplayNumber(mobileNumber) {
  const digits = String(mobileNumber || '').replace(/\D/g, '');
  if (digits.length !== 10) return mobileNumber;
  return `+91 ${digits}`;
}

export const mobileOTPService = {
  /**
   * Generate and store a demo OTP for the given mobile number.
   * Returns the generated code (visible only in frontend dev mode).
   * Backend replacement: call send-otp API instead.
   */
  sendDemoOTP(mobileNumber, customerId) {
    const code = generateSixDigitCode();
    const now = new Date().toISOString();
    demoOtpRecords.set(getRecordKey(customerId, mobileNumber), {
      mobileNumber,
      demoOtpCode: code,
      createdAt: now,
      expiresAt: new Date(Date.now() + OTP_EXPIRY_SECONDS * 1000).toISOString(),
      attemptsUsed: 0,
      maxAttempts: MAX_ATTEMPTS,
      status: 'pending',
      lastResendAt: now,
    });
    return code;
  },

  /**
   * Verify the entered OTP against the stored demo OTP.
   * Returns { success: boolean, message: string, errorType: string|null }.
   * Backend replacement: call verify-otp API instead.
   */
  verifyDemoOTP(mobileNumber, enteredOTP, customerId) {
    const key = getRecordKey(customerId, mobileNumber);
    const record = demoOtpRecords.get(key);

    if (!record) {
      return {
        success: false,
        message: 'No OTP found for this number. Please request a new OTP.',
        errorType: 'not_found',
      };
    }

    if (record.status === 'verified') {
      return {
        success: true,
        message: 'Mobile number already verified.',
        errorType: null,
      };
    }

    if (record.status === 'failed') {
      return {
        success: false,
        message: 'Maximum verification attempts exceeded. Please request a new OTP.',
        errorType: 'locked',
      };
    }

    const now = new Date();
    if (now > new Date(record.expiresAt)) {
      demoOtpRecords.set(key, { ...record, status: 'expired' });
      return {
        success: false,
        message: 'OTP has expired. Please request a new OTP.',
        errorType: 'expired',
      };
    }

    const cleaned = String(enteredOTP || '').trim();
    if (!/^\d{6}$/.test(cleaned)) {
      return {
        success: false,
        message: 'Please enter a valid 6-digit numeric OTP.',
        errorType: 'invalid_format',
      };
    }

    if (cleaned !== record.demoOtpCode) {
      const nextAttempts = (record.attemptsUsed || 0) + 1;
      const maxAtt = record.maxAttempts || MAX_ATTEMPTS;
      const exceeded = nextAttempts >= maxAtt;

      demoOtpRecords.set(key, {
        ...record,
        attemptsUsed: nextAttempts,
        status: exceeded ? 'failed' : record.status,
      });

      return {
        success: false,
        message: exceeded
          ? `Incorrect OTP. Maximum ${maxAtt} attempts reached. Please request a new OTP.`
          : `Incorrect OTP. ${maxAtt - nextAttempts} attempt${maxAtt - nextAttempts === 1 ? '' : 's'} remaining.`,
        errorType: exceeded ? 'locked' : 'incorrect',
      };
    }

    demoOtpRecords.set(key, {
      ...record,
      status: 'verified',
      verifiedAt: now.toISOString(),
    });

    return {
      success: true,
      message: 'Mobile number verified successfully.',
      errorType: null,
    };
  },

  /**
   * Check if a demo OTP record exists and is still pending/valid.
   * Used to pre-fill UI state when reopening the verification modal.
   */
  getRecord(mobileNumber, customerId) {
    return demoOtpRecords.get(getRecordKey(customerId, mobileNumber)) || null;
  },

  /**
   * Clear the demo OTP record for a mobile number after successful update.
   * Does not touch customer profile data.
   */
  clearRecord(mobileNumber, customerId) {
    demoOtpRecords.delete(getRecordKey(customerId, mobileNumber));
  },
};

export { OTP_EXPIRY_SECONDS, RESEND_COOLDOWN_SECONDS };
