/**
 * Customer Portal - Mobile Number Update OTP Service
 *
 * Temporary frontend-only demo OTP logic for mobile number update verification.
 * All functions here are replaceable with real backend API calls later.
 *
 * Backend integration points (to be implemented by backend developer):
 *   - sendOTP(mobileNumber)     -> POST /api/v1/customer/mobile-update/send-otp
 *   - verifyOTP(mobile, otp)    -> POST /api/v1/customer/mobile-update/verify-otp
 *   - updateMobileNumber(mobile)-> POST /api/v1/customer/profile/mobile-number
 *
 * Demo OTPs are stored separately from the customer profile and are never
 * persisted as permanent account data.
 */

const STORAGE_KEY = 'arppb_customer_mobile_update_otp_v1';
const OTP_EXPIRY_SECONDS = 300;
const RESEND_COOLDOWN_SECONDS = 30;
const MAX_ATTEMPTS = 3;

function readStored() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function writeStored(data) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Ignore storage quota errors in restricted environments
  }
  return data;
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
  sendDemoOTP(mobileNumber) {
    const code = generateSixDigitCode();
    const now = new Date().toISOString();
    const records = readStored();
    records[mobileNumber] = {
      mobileNumber,
      demoOtpCode: code,
      createdAt: now,
      expiresAt: new Date(Date.now() + OTP_EXPIRY_SECONDS * 1000).toISOString(),
      attemptsUsed: 0,
      maxAttempts: MAX_ATTEMPTS,
      status: 'pending',
      lastResendAt: now,
    };
    writeStored(records);
    return code;
  },

  /**
   * Verify the entered OTP against the stored demo OTP.
   * Returns { success: boolean, message: string, errorType: string|null }.
   * Backend replacement: call verify-otp API instead.
   */
  verifyDemoOTP(mobileNumber, enteredOTP) {
    const records = readStored();
    const record = records[mobileNumber];

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
      records[mobileNumber] = { ...record, status: 'expired' };
      writeStored(records);
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

      records[mobileNumber] = {
        ...record,
        attemptsUsed: nextAttempts,
        status: exceeded ? 'failed' : record.status,
      };
      writeStored(records);

      return {
        success: false,
        message: exceeded
          ? `Incorrect OTP. Maximum ${maxAtt} attempts reached. Please request a new OTP.`
          : `Incorrect OTP. ${maxAtt - nextAttempts} attempt${maxAtt - nextAttempts === 1 ? '' : 's'} remaining.`,
        errorType: exceeded ? 'locked' : 'incorrect',
      };
    }

    records[mobileNumber] = {
      ...record,
      status: 'verified',
      verifiedAt: now.toISOString(),
    };
    writeStored(records);

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
  getRecord(mobileNumber) {
    const records = readStored();
    return records[mobileNumber] || null;
  },

  /**
   * Clear the demo OTP record for a mobile number after successful update.
   * Does not touch customer profile data.
   */
  clearRecord(mobileNumber) {
    const records = readStored();
    delete records[mobileNumber];
    writeStored(records);
  },
};

export { STORAGE_KEY, OTP_EXPIRY_SECONDS, RESEND_COOLDOWN_SECONDS };
