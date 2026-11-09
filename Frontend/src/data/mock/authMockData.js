/**
 * Mock Data & Role Configuration for AgriConnect
 */

export const ROLE_OPTIONS = [
  { value: 'Farmer', label: 'Farmer' },
  { value: 'Vendor', label: 'Vendor' },
  { value: 'Middle Man', label: 'Middle Man' },
  { value: 'Customer', label: 'Customer' },
];

export const BRAND_COLORS = {
  primary: '#0F766E',
  accent: '#14B8A6',
  lightMint: '#CCFBF1',
  mainText: '#1F2937',
  secondaryText: '#64748B',
  inputBorder: '#DCE3EA',
  cardBg: '#FFFFFF',
};

export const DEMO_CONFIG = {
  otpCooldownSeconds: 30,
  otpLength: 6,
  defaultOtpDemoNotice: 'Demo OTP generated. Enter the 6-digit code to continue.',
};

export default {
  ROLE_OPTIONS,
  BRAND_COLORS,
  DEMO_CONFIG,
};

