import { z } from 'zod';

/**
 * Centralized Zod Validation Schemas & Helpers
 */

export const INDIAN_MOBILE_REGEX = /^[6-9]\d{9}$/;
export const PIN_CODE_REGEX = /^[1-9][0-9]{5}$/;
export const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/i;
export const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i;
export const IFSC_REGEX = /^[A-Z]{4}0[A-Z0-9]{6}$/i;

export const farmerSchema = z.object({
  farmerName: z.string().trim().min(2, 'Farmer Name is required (minimum 2 characters)'),
  fatherName: z.string().trim().optional().or(z.literal('')),
  mobileNumber: z
    .string()
    .trim()
    .regex(INDIAN_MOBILE_REGEX, 'Enter a valid 10-digit Indian mobile number starting with 6-9'),
  email: z.string().trim().email('Enter a valid email address').optional().or(z.literal('')),
  village: z.string().trim().min(2, 'Village name is required'),
  mandal: z.string().trim().optional().or(z.literal('')),
  district: z.string().trim().min(2, 'District is required'),
  state: z.string().trim().min(2, 'State is required'),
  pinCode: z
    .string()
    .trim()
    .regex(PIN_CODE_REGEX, 'Enter a valid 6-digit PIN code')
    .optional()
    .or(z.literal('')),
  availableCrops: z.array(z.string()).min(1, 'Select at least one available crop'),
  address: z.string().trim().optional().or(z.literal('')),
  aadhaarId: z.string().trim().optional().or(z.literal('')),
  bankName: z.string().trim().optional().or(z.literal('')),
  accountNumber: z.string().trim().optional().or(z.literal('')),
  ifscCode: z.string().trim().optional().or(z.literal('')),
  status: z.enum(['Active', 'Inactive']).default('Active'),
});

export const middlemanSchema = z.object({
  businessName: z.string().trim().min(2, 'Business Name is required'),
  ownerName: z.string().trim().min(2, 'Owner Name is required'),
  mobileNumber: z
    .string()
    .trim()
    .regex(INDIAN_MOBILE_REGEX, 'Enter a valid 10-digit Indian mobile number'),
  email: z.string().trim().email('Enter a valid email address').optional().or(z.literal('')),
  gstNumber: z
    .string()
    .trim()
    .refine((val) => !val || GSTIN_REGEX.test(val), 'Enter a valid 15-character GSTIN (e.g., 37AAAAA0000A1Z5)')
    .optional()
    .or(z.literal('')),
  pan: z
    .string()
    .trim()
    .refine((val) => !val || PAN_REGEX.test(val), 'Enter a valid 10-character PAN')
    .optional()
    .or(z.literal('')),
  address: z.string().trim().min(4, 'Address is required'),
  village: z.string().trim().optional().or(z.literal('')),
  district: z.string().trim().min(2, 'District is required'),
  state: z.string().trim().min(2, 'State is required'),
  pinCode: z
    .string()
    .trim()
    .refine((val) => !val || PIN_CODE_REGEX.test(val), 'Enter a valid 6-digit PIN code')
    .optional()
    .or(z.literal('')),
  bankName: z.string().trim().optional().or(z.literal('')),
  accountNumber: z.string().trim().optional().or(z.literal('')),
  ifscCode: z.string().trim().optional().or(z.literal('')),
  openingBalance: z.coerce.number().min(0, 'Opening balance cannot be negative').optional().default(0),
  status: z.enum(['Active', 'Inactive']).default('Active'),
});

export const customerSchema = z.object({
  customerName: z.string().trim().min(2, 'Customer Name is required'),
  businessName: z.string().trim().optional().or(z.literal('')),
  mobileNumber: z
    .string()
    .trim()
    .regex(INDIAN_MOBILE_REGEX, 'Enter a valid 10-digit Indian mobile number'),
  email: z.string().trim().email('Enter a valid email address').optional().or(z.literal('')),
  gstNumber: z
    .string()
    .trim()
    .refine((val) => !val || GSTIN_REGEX.test(val), 'Enter a valid 15-character GSTIN')
    .optional()
    .or(z.literal('')),
  pan: z
    .string()
    .trim()
    .refine((val) => !val || PAN_REGEX.test(val), 'Enter a valid 10-character PAN')
    .optional()
    .or(z.literal('')),
  address: z.string().trim().min(4, 'Address is required'),
  district: z.string().trim().min(2, 'District is required'),
  state: z.string().trim().min(2, 'State is required'),
  pinCode: z
    .string()
    .trim()
    .refine((val) => !val || PIN_CODE_REGEX.test(val), 'Enter a valid 6-digit PIN code')
    .optional()
    .or(z.literal('')),
  creditLimit: z.coerce.number().min(0, 'Credit limit cannot be negative').optional().default(0),
  openingBalance: z.coerce.number().min(0, 'Opening balance cannot be negative').optional().default(0),
  status: z.enum(['Active', 'Inactive']).default('Active'),
});

export const profileSchema = z.object({
  businessName: z.string().trim().min(2, 'Business Name is required'),
  ownerName: z.string().trim().min(2, 'Owner Name is required'),
  mobileNumber: z
    .string()
    .trim()
    .regex(INDIAN_MOBILE_REGEX, 'Enter a valid 10-digit mobile number'),
  email: z.string().trim().email('Enter a valid email address'),
  gstNumber: z
    .string()
    .trim()
    .refine((val) => !val || GSTIN_REGEX.test(val), 'Enter a valid 15-character GSTIN'),
  businessRegNumber: z.string().trim().min(2, 'Business Registration Number is required'),
  businessType: z.string().trim().min(2, 'Business Type is required'),
  businessAddress: z.string().trim().min(5, 'Business Address is required'),
  district: z.string().trim().min(2, 'District is required'),
  state: z.string().trim().min(2, 'State is required'),
  pinCode: z.string().trim().regex(PIN_CODE_REGEX, 'Enter a valid 6-digit PIN code'),
});

export const bankDetailsSchema = z.object({
  accountHolderName: z.string().trim().min(2, 'Account Holder Name is required'),
  bankName: z.string().trim().min(2, 'Bank Name is required'),
  accountNumber: z
    .string()
    .trim()
    .min(8, 'Enter a valid Bank Account Number (minimum 8 digits)'),
  ifscCode: z
    .string()
    .trim()
    .regex(IFSC_REGEX, 'Enter a valid 11-character IFSC code (e.g., SBIN0001234)'),
  branchName: z.string().trim().min(2, 'Branch Name is required'),
});

