/**
 * Portal-Specific My Profile API Service (Vendor, Middleman, Customer)
 * Uses centralized axios instance (src/API/Config.js) and Endpoints (src/API/Endpoints.js).
 * Automatically routes each portal's requests to its configured base URL via getProfileBaseURL(role).
 */

import api, { getProfileBaseURL } from '../API/Config';
import Endpoints from '../API/Endpoints';
import { extractBackendDemoOtp, isDuplicateMobileMessage } from './auth/otpService';

/**
 * Normalizes API errors from ASP.NET Core ApiResponse<T> / ValidationProblemDetails
 */
export function parseProfileApiError(error, fallbackMessage = 'Profile request failed.') {
  const response = error?.response;
  const status = response?.status || error?.status;
  const data = response?.data || error?.data;

  let message = fallbackMessage;
  const rawErrors = [];

  if (data && typeof data === 'object') {
    if (Array.isArray(data.errors) && data.errors.length > 0) {
      rawErrors.push(...data.errors.map((e) => String(e || '')));
      message = String(data.errors[0] || data.message || fallbackMessage);
    } else if (data.errors && typeof data.errors === 'object') {
      const firstKey = Object.keys(data.errors)[0];
      const val = data.errors[firstKey];
      const firstMsg = Array.isArray(val) ? val[0] : val;
      if (firstMsg) {
        rawErrors.push(String(firstMsg));
        message = String(firstMsg);
      }
    } else if (data.message || data.title || data.error) {
      message = String(data.message || data.title || data.error);
    }
  } else if (typeof data === 'string' && data.trim() && !data.trim().startsWith('<')) {
    message = data.trim();
  } else if (error?.message) {
    message = error.message;
  }

  const duplicate = isDuplicateMobileMessage(status, message, rawErrors);
  if (duplicate) {
    message = 'This mobile number is already registered. Please use a different mobile number.';
  }

  const normalized = new Error(message);
  normalized.status = status;
  normalized.data = data;
  normalized.isDuplicateMobile = duplicate;
  return normalized;
}

/* ==========================================================================
   1. MIDDLEMAN MY PROFILE APIs
   - GET    /api/v1/middleman-profile
   - GET    /api/v1/middleman-profile/{id}
   - PUT    /api/v1/middleman-profile/{id}
   - POST   /api/v1/middleman-profile/mobile/send-otp
   - POST   /api/v1/middleman-profile/mobile/verify-otp
   ========================================================================== */

export function mapMiddlemanDtoToProfile(dto = {}, existingProfile = {}) {
  if (!dto || typeof dto !== 'object') return existingProfile;

  const existingBank = existingProfile.bankDetails || {};
  return {
    ...existingProfile,
    id: dto.id ?? existingProfile.id ?? null,
    userId: dto.userId ?? existingProfile.userId ?? null,
    middlemanId:
      dto.middlemanPortalId ||
      dto.middlemanId ||
      existingProfile.middlemanId ||
      'MMP-2026-001',
    middlemanPortalId:
      dto.middlemanPortalId ||
      dto.middlemanId ||
      existingProfile.middlemanPortalId ||
      existingProfile.middlemanId ||
      'MMP-2026-001',
    logo: dto.businessLogoUrl ?? existingProfile.logo ?? '',
    businessLogoUrl: dto.businessLogoUrl ?? existingProfile.logo ?? '',
    businessName:
      dto.registeredBusinessName ??
      dto.businessName ??
      existingProfile.businessName ??
      '',
    registrationNumber:
      dto.registrationLicenseNo ??
      dto.registrationNumber ??
      existingProfile.registrationNumber ??
      '',
    gstNumber: dto.gstin ?? dto.gstNumber ?? existingProfile.gstNumber ?? '',
    ownerName: dto.ownerName ?? existingProfile.ownerName ?? '',
    mobile: dto.mobile ?? existingProfile.mobile ?? '',
    email: dto.email ?? existingProfile.email ?? '',
    businessAddress:
      dto.premisesAddress ??
      dto.businessAddress ??
      existingProfile.businessAddress ??
      '',
    village: dto.villageArea ?? dto.village ?? existingProfile.village ?? '',
    district: dto.district ?? existingProfile.district ?? '',
    state: dto.state ?? existingProfile.state ?? '',
    pinCode: dto.pinCode ?? existingProfile.pinCode ?? '',
    bankDetails: {
      ...existingBank,
      accountHolderName:
        dto.accountHolderName ?? existingBank.accountHolderName ?? '',
      bankName: dto.bankName ?? existingBank.bankName ?? '',
      accountNumber: dto.accountNumber ?? existingBank.accountNumber ?? '',
      ifscCode: dto.ifscCode ?? existingBank.ifscCode ?? '',
      branchName: dto.branchName ?? existingBank.branchName ?? '',
    },
    createdAt: dto.createdAt ?? existingProfile.createdAt,
    updatedAt: dto.updatedAt ?? existingProfile.updatedAt,
  };
}

export function mapMiddlemanProfileToUpdateDto(profileData = {}) {
  const bank = profileData.bankDetails || {};
  const cleanMobile = String(profileData.mobile || '').replace(/\D/g, '');
  const cleanEmail = String(profileData.email || '').trim();
  const cleanPin = String(profileData.pinCode || '').trim();
  const cleanIfsc = String(bank.ifscCode || '').trim().toUpperCase();
  const cleanGstin = String(profileData.gstNumber || profileData.gstin || '')
    .trim()
    .toUpperCase();

  return {
    registeredBusinessName:
      String(
        profileData.businessName || profileData.registeredBusinessName || ''
      ).trim() ||
      String(profileData.ownerName || 'Middleman Enterprise').trim(),
    registrationLicenseNo:
      String(
        profileData.registrationNumber || profileData.registrationLicenseNo || ''
      ).trim() || null,
    gstin: cleanGstin || null,
    ownerName: String(profileData.ownerName || '').trim(),
    mobile: cleanMobile,
    email: cleanEmail && cleanEmail.includes('@') ? cleanEmail : null,
    premisesAddress:
      String(
        profileData.businessAddress || profileData.premisesAddress || ''
      ).trim() || null,
    villageArea:
      String(profileData.village || profileData.villageArea || '').trim() || null,
    district: String(profileData.district || '').trim() || null,
    state: String(profileData.state || '').trim() || null,
    pinCode: /^\d{6}$/.test(cleanPin) ? cleanPin : null,
    accountHolderName: String(bank.accountHolderName || '').trim() || null,
    bankName: String(bank.bankName || '').trim() || null,
    accountNumber: String(bank.accountNumber || '').trim() || null,
    ifscCode: /^[A-Za-z]{4}0[A-Za-z0-9]{6}$/.test(cleanIfsc) ? cleanIfsc : null,
    branchName: String(bank.branchName || '').trim() || null,
  };
}

export async function fetchMiddlemanProfile() {
  try {
    const response = await api.get(Endpoints.MiddlemanProfile.get, {
      baseURL: getProfileBaseURL('middleman'),
      useProfileBaseURL: true,
      profileRole: 'middleman',
    });
    const body = response.data;
    if (body && body.success === false) {
      throw new Error(body.message || 'Failed to load Middleman profile.');
    }
    return body?.data || body;
  } catch (error) {
    throw parseProfileApiError(error, 'Failed to load Middleman profile.');
  }
}

export async function fetchMiddlemanProfileById(id) {
  try {
    const response = await api.get(Endpoints.MiddlemanProfile.getById(id), {
      baseURL: getProfileBaseURL('middleman'),
      useProfileBaseURL: true,
      profileRole: 'middleman',
    });
    const body = response.data;
    if (body && body.success === false) {
      throw new Error(body.message || 'Failed to load Middleman profile by ID.');
    }
    return body?.data || body;
  } catch (error) {
    throw parseProfileApiError(error, 'Failed to load Middleman profile by ID.');
  }
}

export async function updateMiddlemanProfile(id, profileData) {
  try {
    let targetId = id;
    if (!targetId) {
      const current = await fetchMiddlemanProfile();
      targetId = current?.id;
    }
    if (!targetId) {
      throw new Error('Middleman profile ID could not be resolved.');
    }

    const payload = mapMiddlemanProfileToUpdateDto(profileData);
    const response = await api.put(
      Endpoints.MiddlemanProfile.update(targetId),
      payload,
      {
        baseURL: getProfileBaseURL('middleman'),
        useProfileBaseURL: true,
        profileRole: 'middleman',
      }
    );
    const body = response.data;
    if (body && body.success === false) {
      throw new Error(body.message || 'Failed to update Middleman profile.');
    }
    return body?.data || body;
  } catch (error) {
    throw parseProfileApiError(error, 'Failed to update Middleman profile.');
  }
}

export async function sendMiddlemanMobileChangeOtp(newMobile) {
  const cleanPhone = String(newMobile || '').replace(/\D/g, '');
  try {
    const response = await api.post(
      Endpoints.MiddlemanProfile.sendMobileOtp,
      { newMobile: cleanPhone },
      {
        baseURL: getProfileBaseURL('middleman'),
        useProfileBaseURL: true,
        profileRole: 'middleman',
      }
    );
    const body = response.data;
    if (body && body.success === false) {
      const err = new Error(body.message || 'Failed to send OTP.');
      err.status = response.status;
      err.data = body;
      err.isDuplicateMobile = isDuplicateMobileMessage(
        response.status,
        body.message,
        body.errors
      );
      throw err;
    }
    const { rawDevOtp, demoOtp } = extractBackendDemoOtp(body);
    return {
      success: true,
      message:
        (typeof body?.data === 'string' && body.data) ||
        body?.message ||
        'OTP sent successfully to your new mobile number.',
      demoOtp,
      rawDevOtp,
      cooldownSeconds: 30,
      target: cleanPhone,
      raw: body,
    };
  } catch (error) {
    throw parseProfileApiError(error, 'Failed to send OTP to new mobile number.');
  }
}

export async function verifyMiddlemanMobileChangeOtp(newMobile, otp) {
  const cleanPhone = String(newMobile || '').replace(/\D/g, '');
  const cleanOtp = String(otp || '')
    .trim()
    .replace(/^DEV-/i, '')
    .replace(/\D/g, '');
  try {
    const response = await api.post(
      Endpoints.MiddlemanProfile.verifyMobileOtp,
      { newMobile: cleanPhone, otp: cleanOtp },
      {
        baseURL: getProfileBaseURL('middleman'),
        useProfileBaseURL: true,
        profileRole: 'middleman',
      }
    );
    const body = response.data;
    if (body && body.success === false) {
      throw new Error(body.message || 'Invalid or expired OTP code.');
    }
    return {
      success: true,
      verified: true,
      message:
        (typeof body?.data === 'string' && body.data) ||
        body?.message ||
        'New mobile number verified successfully.',
      target: cleanPhone,
      raw: body,
    };
  } catch (error) {
    throw parseProfileApiError(error, 'Invalid or expired OTP code.');
  }
}

/* ==========================================================================
   2. VENDOR MY PROFILE APIs
   - GET    /api/vendor-profile
   - GET    /api/vendor-profile/{vendorId}
   - GET    /api/vendor-profile/bank-details
   - PUT    /api/vendor-profile/bank-details
   - POST   /api/vendor-profile/mobile-change/request-otp
   - POST   /api/vendor-profile/mobile-change/verify-otp
   ========================================================================== */

export function mapVendorDtoToProfile(dto = {}, existingVendor = {}) {
  if (!dto || typeof dto !== 'object') return existingVendor;

  const existingBank = existingVendor.bankDetails || {};
  const dtoBank = dto.bankDetails || {};
  const dtoBiz = dto.business || {};

  return {
    ...existingVendor,
    id: dto.id ?? dto.vendorProfileId ?? existingVendor.id ?? null,
    userId: dto.userId ?? existingVendor.userId ?? null,
    vendorId:
      dto.vendorCode ||
      dto.vendorPortalId ||
      dto.vendorId ||
      dtoBiz.vendorId ||
      existingVendor.vendorId ||
      'VND-AP-2026-001',
    businessName:
      dto.businessName ??
      dtoBiz.businessName ??
      dto.registeredBusinessName ??
      existingVendor.businessName ??
      '',
    ownerName:
      dto.ownerName ??
      dtoBiz.ownerName ??
      dto.fullName ??
      existingVendor.ownerName ??
      '',
    mobileNumber:
      dto.mobileNumber ??
      dto.mobile ??
      dtoBiz.mobile ??
      existingVendor.mobileNumber ??
      '',
    email: dto.email ?? dtoBiz.email ?? existingVendor.email ?? '',
    gstNumber:
      dto.gstNumber ??
      dto.gstin ??
      dtoBiz.gstin ??
      existingVendor.gstNumber ??
      '',
    businessRegNumber:
      dto.businessRegNumber ??
      dtoBiz.businessRegistrationNumber ??
      dto.registrationNumber ??
      dto.registrationLicenseNo ??
      existingVendor.businessRegNumber ??
      '',
    apmcLicense:
      dto.apmcLicense ??
      dto.apmcLicenseNumber ??
      existingVendor.apmcLicense ??
      '',
    businessType:
      dto.businessType ?? dtoBiz.businessType ?? existingVendor.businessType ?? '',
    businessAddress:
      dto.businessAddress ??
      dtoBiz.businessAddress ??
      dto.premisesAddress ??
      dto.address ??
      existingVendor.businessAddress ??
      '',
    district: dto.district ?? dtoBiz.district ?? existingVendor.district ?? '',
    state: dto.state ?? dtoBiz.state ?? existingVendor.state ?? '',
    pinCode: dto.pinCode ?? dtoBiz.pinCode ?? existingVendor.pinCode ?? '',
    logoUrl:
      dto.logoUrl ??
      dtoBiz.logoUrl ??
      dto.businessLogoUrl ??
      existingVendor.logoUrl ??
      '',
    bankDetails: {
      ...existingBank,
      accountHolderName:
        dtoBank.accountHolderName ??
        dto.accountHolderName ??
        existingBank.accountHolderName ??
        '',
      bankName:
        dtoBank.bankName ?? dto.bankName ?? existingBank.bankName ?? '',
      accountNumber:
        dtoBank.accountNumber ??
        dto.accountNumber ??
        existingBank.accountNumber ??
        '',
      ifscCode:
        dtoBank.ifscCode ?? dto.ifscCode ?? existingBank.ifscCode ?? '',
      branchName:
        dtoBank.branchName ?? dto.branchName ?? existingBank.branchName ?? '',
    },
    updatedAt:
      dto.updatedAt || dtoBiz.lastUpdatedAt
        ? String(dto.updatedAt || dtoBiz.lastUpdatedAt).slice(0, 10)
        : existingVendor.updatedAt,
  };
}

export async function fetchVendorProfile(vendorId = null) {
  try {
    const endpoint = vendorId
      ? Endpoints.VendorProfile.getById(vendorId)
      : Endpoints.VendorProfile.get;
    const response = await api.get(endpoint, {
      baseURL: getProfileBaseURL('vendor'),
      useProfileBaseURL: true,
      profileRole: 'vendor',
    });
    const body = response.data;
    if (body && body.success === false) {
      throw new Error(body.message || 'Failed to load Vendor profile.');
    }
    return body?.data || body;
  } catch (error) {
    throw parseProfileApiError(error, 'Failed to load Vendor profile.');
  }
}

const VALID_VENDOR_BUSINESS_TYPES = [
  'Agri Procurement, Milling & Wholesale Distribution',
  'Raw Commodity Processing & Oil Extraction Mill',
  'APMC Licensed Commission & Bulk Trading House',
  'FPO / Agro-Processing Cooperative Enterprise',
];

export async function updateVendorProfileApi(profileData = {}, vendorId = null) {
  let cleanBusinessType = String(profileData.businessType || '').trim();
  const matchedType = VALID_VENDOR_BUSINESS_TYPES.find(
    (t) => t.toLowerCase() === cleanBusinessType.toLowerCase()
  );
  if (matchedType) {
    cleanBusinessType = matchedType;
  } else if (!cleanBusinessType) {
    cleanBusinessType = VALID_VENDOR_BUSINESS_TYPES[0];
  } else if (!VALID_VENDOR_BUSINESS_TYPES.includes(cleanBusinessType)) {
    if (/mill|oil|extract/i.test(cleanBusinessType)) {
      cleanBusinessType = VALID_VENDOR_BUSINESS_TYPES[1];
    } else if (/apmc|commission|trading|mandi/i.test(cleanBusinessType)) {
      cleanBusinessType = VALID_VENDOR_BUSINESS_TYPES[2];
    } else if (/fpo|coop/i.test(cleanBusinessType)) {
      cleanBusinessType = VALID_VENDOR_BUSINESS_TYPES[3];
    } else {
      cleanBusinessType = VALID_VENDOR_BUSINESS_TYPES[0];
    }
  }

  const rawPin = String(profileData.pinCode || '').replace(/\D/g, '').slice(0, 6);
  const cleanPin = rawPin.length === 6 ? rawPin : '518001';

  const rawGst = String(profileData.gstNumber || profileData.gstin || '')
    .trim()
    .toUpperCase();
  const cleanGst = /^[A-Z0-9]{15}$/i.test(rawGst) ? rawGst : '37AAAAA0000A1Z5';

  const payload = {
    businessName: String(profileData.businessName || 'Vendor Enterprise').trim(),
    ownerName: String(profileData.ownerName || '').trim() || null,
    email: String(profileData.email || '').trim() || null,
    gstin: cleanGst,
    businessRegistrationNumber:
      String(profileData.businessRegNumber || profileData.businessRegistrationNumber || 'REG-2026-001').trim(),
    apmcLicenseNumber:
      String(profileData.apmcLicense || profileData.apmcLicenseNumber || '').trim() || null,
    businessType: cleanBusinessType,
    businessAddress: String(profileData.businessAddress || '').trim() || 'Industrial Estate',
    district: String(profileData.district || 'Kurnool').trim(),
    state: String(profileData.state || 'Andhra Pradesh').trim(),
    pinCode: cleanPin,
    logoUrl: profileData.logoUrl || null,
  };

  try {
    // Prefer PUT /api/v1/vendor/profile for the current vendor account
    const endpoint = Endpoints.VendorProfile.updateProfile || Endpoints.VendorProfile.get;
    const response = await api.put(endpoint, payload, {
      baseURL: getProfileBaseURL('vendor'),
      useProfileBaseURL: true,
      profileRole: 'vendor',
    });
    const body = response.data;
    if (body && body.success === false) {
      throw new Error(body.message || 'Failed to update Vendor profile.');
    }
    return body?.data || body;
  } catch (error) {
    throw parseProfileApiError(error, 'Failed to update Vendor profile.');
  }
}

export async function fetchVendorBankDetails() {
  try {
    const response = await api.get(Endpoints.VendorProfile.getBankDetails, {
      baseURL: getProfileBaseURL('vendor'),
      useProfileBaseURL: true,
      profileRole: 'vendor',
    });
    const body = response.data;
    if (body && body.success === false) {
      throw new Error(body.message || 'Failed to load Vendor bank details.');
    }
    return body?.data || body;
  } catch (error) {
    throw parseProfileApiError(error, 'Failed to load Vendor bank details.');
  }
}

export async function updateVendorBankDetailsApi(bankDetails = {}) {
  const payload = {
    accountHolderName: String(bankDetails.accountHolderName || '').trim(),
    bankName: String(bankDetails.bankName || '').trim(),
    accountNumber: String(bankDetails.accountNumber || '').trim(),
    ifscCode: String(bankDetails.ifscCode || '').trim().toUpperCase(),
    branchName: String(bankDetails.branchName || '').trim(),
    confirmUpdate: true,
  };

  try {
    const response = await api.put(
      Endpoints.VendorProfile.updateBankDetails,
      payload,
      {
        baseURL: getProfileBaseURL('vendor'),
        useProfileBaseURL: true,
        profileRole: 'vendor',
      }
    );
    const body = response.data;
    if (body && body.success === false) {
      throw new Error(body.message || 'Failed to update Vendor bank details.');
    }
    return body?.data || body;
  } catch (error) {
    throw parseProfileApiError(error, 'Failed to update Vendor bank details.');
  }
}

export async function sendVendorMobileChangeOtp(newMobile) {
  const cleanPhone = String(newMobile || '').replace(/\D/g, '');
  const reqConfig = {
    baseURL: getProfileBaseURL('vendor'),
    useProfileBaseURL: true,
    profileRole: 'vendor',
  };

  try {
    let response;
    try {
      response = await api.post(
        Endpoints.VendorProfile.sendMobileOtp,
        { newMobile: cleanPhone },
        reqConfig
      );
    } catch (firstErr) {
      if (firstErr?.response?.status === 400) {
        response = await api.post(
          Endpoints.VendorProfile.sendMobileOtp,
          { newMobileNumber: cleanPhone },
          reqConfig
        );
      } else {
        throw firstErr;
      }
    }

    const body = response.data;
    if (body && body.success === false) {
      const err = new Error(body.message || 'Failed to send OTP.');
      err.status = response.status;
      err.data = body;
      err.isDuplicateMobile = isDuplicateMobileMessage(
        response.status,
        body.message,
        body.errors
      );
      throw err;
    }

    const { rawDevOtp, demoOtp } = extractBackendDemoOtp(body);
    return {
      success: true,
      message:
        body?.data?.message ||
        (typeof body?.data === 'string' && body.data) ||
        body?.message ||
        'OTP sent successfully to your new mobile number.',
      demoOtp,
      rawDevOtp,
      cooldownSeconds: 30,
      target: cleanPhone,
      raw: body,
    };
  } catch (error) {
    throw parseProfileApiError(error, 'Failed to send OTP to new mobile number.');
  }
}

export async function verifyVendorMobileChangeOtp(newMobile, otp) {
  const cleanPhone = String(newMobile || '').replace(/\D/g, '');
  const cleanOtp = String(otp || '')
    .trim()
    .replace(/^DEV-/i, '')
    .replace(/\D/g, '');
  const reqConfig = {
    baseURL: getProfileBaseURL('vendor'),
    useProfileBaseURL: true,
    profileRole: 'vendor',
  };

  try {
    let response;
    try {
      response = await api.post(
        Endpoints.VendorProfile.verifyMobileOtp,
        {
          newMobile: cleanPhone,
          otp: cleanOtp,
        },
        reqConfig
      );
    } catch (firstErr) {
      if (firstErr?.response?.status === 400) {
        response = await api.post(
          Endpoints.VendorProfile.verifyMobileOtp,
          { newMobileNumber: cleanPhone, otp: cleanOtp },
          reqConfig
        );
      } else {
        throw firstErr;
      }
    }

    const body = response.data;
    if (body && body.success === false) {
      throw new Error(body.message || 'Invalid or expired OTP code.');
    }

    return {
      success: true,
      verified: true,
      message:
        (typeof body?.data === 'string' && body.data) ||
        body?.message ||
        'New mobile number verified successfully.',
      target: cleanPhone,
      data: body?.data || null,
      raw: body,
    };
  } catch (error) {
    throw parseProfileApiError(error, 'Invalid or expired OTP code.');
  }
}

/* ==========================================================================
   3. CUSTOMER MY PROFILE APIs
   - GET    /api/customer/profile
   - PUT    /api/customer/profile
   - POST   /api/customer/profile/addresses
   - PUT    /api/customer/profile/addresses/{id}
   - PATCH  /api/customer/profile/addresses/{id}/default
   - DELETE /api/customer/profile/addresses/{id}
   - POST   /api/customer/profile/mobile/send-otp
   - POST   /api/customer/profile/mobile/verify-otp
   ========================================================================== */

export function mapCustomerDtoToProfile(dto = {}, existingProfile = {}, user = null) {
  if (!dto || typeof dto !== 'object') return existingProfile;

  const formattedCustomerId =
    user?.entityCode ||
    (dto.customerId !== null && dto.customerId !== undefined
      ? String(dto.customerId)
      : existingProfile.customerId || '');

  const rawAddresses = Array.isArray(dto.addresses)
    ? dto.addresses
    : Array.isArray(dto.deliveryAddresses)
    ? dto.deliveryAddresses
    : existingProfile.deliveryAddresses || [];

  const normalizedAddresses = rawAddresses.map((addr) => ({
    id: addr.id,
    label: addr.label || '',
    recipientName: addr.recipientName || '',
    contactNumber: addr.contactNumber || '',
    addressLine: addr.addressLine || '',
    district: addr.district || '',
    state: addr.state || '',
    pinCode: addr.pinCode || '',
    isDefault: Boolean(addr.isDefault),
  }));

  return {
    ...existingProfile,
    rawCustomerId: dto.customerId ?? existingProfile.rawCustomerId ?? null,
    customerId: formattedCustomerId,
    fullName: dto.fullName ?? existingProfile.fullName ?? '',
    mobileNumber: dto.mobileNumber ?? existingProfile.mobileNumber ?? '',
    email: dto.email ?? existingProfile.email ?? '',
    profilePhoto: dto.profilePhoto ?? existingProfile.profilePhoto ?? '',
    alternateMobileNumber:
      dto.alternateMobileNumber ?? existingProfile.alternateMobileNumber ?? '',
    address: dto.address ?? existingProfile.address ?? '',
    district: dto.district ?? existingProfile.district ?? '',
    state: dto.state ?? existingProfile.state ?? '',
    pinCode: dto.pinCode ?? existingProfile.pinCode ?? '',
    deliveryAddresses: normalizedAddresses,
    addresses: normalizedAddresses,
  };
}

export async function fetchCustomerProfile() {
  try {
    const response = await api.get(Endpoints.CustomerProfile.get, {
      baseURL: getProfileBaseURL('customer'),
      useProfileBaseURL: true,
      profileRole: 'customer',
    });
    const body = response.data;
    if (body && body.success === false) {
      throw new Error(body.message || 'Failed to load Customer profile.');
    }
    return body?.data || body;
  } catch (error) {
    throw parseProfileApiError(error, 'Failed to load Customer profile.');
  }
}

export async function updateCustomerProfileApi(profileData = {}) {
  const cleanMobile = String(profileData.mobileNumber || '').replace(/\D/g, '');
  const cleanAltMobile = String(profileData.alternateMobileNumber || '').replace(
    /\D/g,
    ''
  );
  const cleanEmail = String(profileData.email || '').trim();

  const payload = {
    fullName: String(profileData.fullName || '').trim(),
    mobileNumber: cleanMobile,
    email: cleanEmail ? cleanEmail : null,
    profilePhoto: profileData.profilePhoto ? String(profileData.profilePhoto) : null,
    alternateMobileNumber: cleanAltMobile ? cleanAltMobile : null,
    address: String(profileData.address || '').trim(),
    district: String(profileData.district || '').trim(),
    state: String(profileData.state || '').trim(),
    pinCode: String(profileData.pinCode || '').trim(),
  };

  try {
    const response = await api.put(Endpoints.CustomerProfile.update, payload, {
      baseURL: getProfileBaseURL('customer'),
      useProfileBaseURL: true,
      profileRole: 'customer',
    });
    const body = response.data;
    if (body && body.success === false) {
      throw new Error(body.message || 'Failed to update Customer profile.');
    }
    return body?.data || body;
  } catch (error) {
    throw parseProfileApiError(error, 'Failed to update Customer profile.');
  }
}

export async function createCustomerAddressApi(addr = {}) {
  const payload = {
    label: String(addr.label || '').trim(),
    recipientName: String(addr.recipientName || '').trim(),
    contactNumber: String(addr.contactNumber || '').replace(/\D/g, ''),
    addressLine: String(addr.addressLine || '').trim(),
    district: String(addr.district || '').trim(),
    state: String(addr.state || '').trim(),
    pinCode: String(addr.pinCode || '').trim(),
    isDefault: Boolean(addr.isDefault),
  };

  try {
    const response = await api.post(
      Endpoints.CustomerProfile.addresses,
      payload,
      {
        baseURL: getProfileBaseURL('customer'),
        useProfileBaseURL: true,
        profileRole: 'customer',
      }
    );
    const body = response.data;
    if (body && body.success === false) {
      throw new Error(body.message || 'Failed to add delivery address.');
    }
    return body?.data || body;
  } catch (error) {
    throw parseProfileApiError(error, 'Failed to add delivery address.');
  }
}

export async function updateCustomerAddressApi(id, addr = {}) {
  const payload = {
    label: String(addr.label || '').trim(),
    recipientName: String(addr.recipientName || '').trim(),
    contactNumber: String(addr.contactNumber || '').replace(/\D/g, ''),
    addressLine: String(addr.addressLine || '').trim(),
    district: String(addr.district || '').trim(),
    state: String(addr.state || '').trim(),
    pinCode: String(addr.pinCode || '').trim(),
    isDefault: Boolean(addr.isDefault),
  };

  try {
    const response = await api.put(
      Endpoints.CustomerProfile.addressById(id),
      payload,
      {
        baseURL: getProfileBaseURL('customer'),
        useProfileBaseURL: true,
        profileRole: 'customer',
      }
    );
    const body = response.data;
    if (body && body.success === false) {
      throw new Error(body.message || 'Failed to update delivery address.');
    }
    return body?.data || body;
  } catch (error) {
    throw parseProfileApiError(error, 'Failed to update delivery address.');
  }
}

export async function setDefaultCustomerAddressApi(id) {
  try {
    const response = await api.patch(
      Endpoints.CustomerProfile.setDefaultAddress(id),
      undefined,
      {
        baseURL: getProfileBaseURL('customer'),
        useProfileBaseURL: true,
        profileRole: 'customer',
      }
    );
    const body = response.data;
    if (body && body.success === false) {
      throw new Error(body.message || 'Failed to set default delivery address.');
    }
    return body?.data || body;
  } catch (error) {
    throw parseProfileApiError(error, 'Failed to set default delivery address.');
  }
}

export async function deleteCustomerAddressApi(id) {
  try {
    const response = await api.delete(
      Endpoints.CustomerProfile.addressById(id),
      {
        baseURL: getProfileBaseURL('customer'),
        useProfileBaseURL: true,
        profileRole: 'customer',
      }
    );
    const body = response.data;
    if (body && body.success === false) {
      throw new Error(body.message || 'Failed to delete delivery address.');
    }
    return body?.data || body;
  } catch (error) {
    throw parseProfileApiError(error, 'Failed to delete delivery address.');
  }
}

export async function sendCustomerMobileChangeOtp(newMobileNumber) {
  const cleanPhone = String(newMobileNumber || '').replace(/\D/g, '');
  try {
    const response = await api.post(
      Endpoints.CustomerProfile.sendMobileOtp,
      { newMobileNumber: cleanPhone },
      {
        baseURL: getProfileBaseURL('customer'),
        useProfileBaseURL: true,
        profileRole: 'customer',
      }
    );
    const body = response.data;
    if (body && body.success === false) {
      const err = new Error(body.message || 'Failed to send OTP.');
      err.status = response.status;
      err.data = body;
      err.isDuplicateMobile = isDuplicateMobileMessage(
        response.status,
        body.message,
        body.errors
      );
      throw err;
    }

    const { rawDevOtp, demoOtp } = extractBackendDemoOtp(body);
    return {
      success: true,
      message:
        body?.data?.message ||
        (typeof body?.data === 'string' && body.data) ||
        body?.message ||
        'OTP sent successfully to your new mobile number.',
      demoOtp,
      rawDevOtp,
      cooldownSeconds: 30,
      expiresInMinutes: body?.data?.expiresInMinutes || 5,
      target: cleanPhone,
      raw: body,
    };
  } catch (error) {
    throw parseProfileApiError(error, 'Failed to send OTP to new mobile number.');
  }
}

export async function verifyCustomerMobileChangeOtp(newMobileNumber, otp) {
  const cleanPhone = String(newMobileNumber || '').replace(/\D/g, '');
  const cleanOtp = String(otp || '')
    .trim()
    .replace(/^DEV-/i, '')
    .replace(/\D/g, '');
  try {
    const response = await api.post(
      Endpoints.CustomerProfile.verifyMobileOtp,
      { newMobileNumber: cleanPhone, otp: cleanOtp },
      {
        baseURL: getProfileBaseURL('customer'),
        useProfileBaseURL: true,
        profileRole: 'customer',
      }
    );
    const body = response.data;
    if (body && body.success === false) {
      throw new Error(body.message || 'Invalid or expired OTP code.');
    }

    return {
      success: true,
      verified: true,
      message: body?.message || 'Mobile number updated successfully.',
      target: cleanPhone,
      profileData: body?.data || null,
      raw: body,
    };
  } catch (error) {
    throw parseProfileApiError(error, 'Invalid or expired OTP code.');
  }
}

/* ==========================================================================
   4. FARMER MY PROFILE APIs
   - GET    /api/v1/farmer/profile
   - GET    /api/v1/farmer/profile/all
   - PUT    /api/v1/farmer/profile
   - PUT    /api/v1/farmer/profile/bank-details
   - POST   /api/v1/farmer/profile/change-mobile/send-otp
   - POST   /api/v1/farmer/profile/change-mobile/verify-otp
   - POST   /api/v1/farmer/profile/change-password
   ========================================================================== */

export function mapFarmerDtoToProfile(dto = {}, existingProfile = {}) {
  if (!dto || typeof dto !== 'object') return existingProfile;

  const farmLoc = dto.farmLocation || {};
  const bank = dto.bankDetails || {};

  return {
    ...existingProfile,
    userId: dto.userId ?? existingProfile.userId ?? null,
    numericFarmerId: dto.farmerId ?? existingProfile.numericFarmerId ?? null,
    farmerCode: dto.farmerCode || existingProfile.farmerCode || '',
    farmerId:
      dto.farmerCode ||
      (dto.farmerId ? `AG-FARM-${dto.farmerId}` : existingProfile.farmerId || ''),
    farmerName: dto.fullName ?? existingProfile.farmerName ?? '',
    mobileNumber: dto.mobile
      ? dto.mobile.startsWith('+91')
        ? dto.mobile
        : `+91 ${dto.mobile}`
      : existingProfile.mobileNumber || '',
    email: dto.email ?? existingProfile.email ?? '',
    alternateMobile:
      dto.alternateMobile ??
      existingProfile.alternateMobile ??
      '',
    isActive: dto.isActive ?? existingProfile.isActive ?? true,
    farmName: farmLoc.farmName ?? existingProfile.farmName ?? '',
    totalLandArea: farmLoc.totalLandArea ?? existingProfile.totalLandArea ?? '',
    soilType: farmLoc.soilType ?? dto.soilType ?? existingProfile.soilType ?? '',
    primaryCrops: farmLoc.primaryCrops ?? dto.primaryCrops ?? existingProfile.primaryCrops ?? '',
    village: farmLoc.village ?? existingProfile.village ?? '',
    mandal: farmLoc.mandal ?? existingProfile.mandal ?? '',
    district: farmLoc.district ?? existingProfile.district ?? '',
    state: farmLoc.state ?? existingProfile.state ?? '',
    pinCode: farmLoc.pinCode ?? existingProfile.pinCode ?? '',
    completeAddress: farmLoc.address ?? existingProfile.completeAddress ?? '',
    bankDetails: {
      accountHolderName:
        bank.accountHolderName ?? existingProfile.bankDetails?.accountHolderName ?? '',
      bankName: bank.bankName ?? existingProfile.bankDetails?.bankName ?? '',
      accountNumber:
        bank.accountNumber ?? existingProfile.bankDetails?.accountNumber ?? '',
      fullAccountNumber:
        bank.accountNumber ?? existingProfile.bankDetails?.fullAccountNumber ?? '',
      ifscCode: bank.ifscCode ?? existingProfile.bankDetails?.ifscCode ?? '',
      branch:
        bank.branchName ?? existingProfile.bankDetails?.branch ?? '',
      branchName:
        bank.branchName ?? existingProfile.bankDetails?.branchName ?? '',
      accountType:
        bank.accountType ?? existingProfile.bankDetails?.accountType ?? 'Savings',
      upiId:
        bank.upiId ?? existingProfile.bankDetails?.upiId ?? '',
      upiVpa:
        bank.upiId ?? existingProfile.bankDetails?.upiVpa ?? '',
      isComplete: Boolean(bank.isComplete),
    },
    membership: existingProfile.membership || 'Verified Farmer',
    rating: existingProfile.rating || '',
  };
}

export async function fetchFarmerProfileApi(userId = null) {
  try {
    const params = {};
    if (userId) params.userId = userId;

    const response = await api.get(Endpoints.FarmerProfile.get, {
      baseURL: getProfileBaseURL('farmer'),
      useProfileBaseURL: true,
      profileRole: 'farmer',
      params,
    });
    const body = response.data;
    if (body && body.success === false) {
      throw new Error(body.message || 'Failed to fetch farmer profile.');
    }
    return body?.data || body;
  } catch (error) {
    throw parseProfileApiError(error, 'Failed to fetch farmer profile.');
  }
}

export async function fetchAllFarmerProfilesApi() {
  try {
    const response = await api.get(Endpoints.FarmerProfile.getAll, {
      baseURL: getProfileBaseURL('farmer'),
      useProfileBaseURL: true,
      profileRole: 'farmer',
    });
    const body = response.data;
    if (body && body.success === false) {
      throw new Error(body.message || 'Failed to fetch all farmer profiles.');
    }
    return body?.data || body;
  } catch (error) {
    throw parseProfileApiError(error, 'Failed to fetch all farmer profiles.');
  }
}

export async function fetchFarmerBankDetailsApi(userId = null, reveal = false) {
  try {
    const params = {};
    if (userId) params.userId = userId;
    if (reveal) params.reveal = true;

    const response = await api.get(Endpoints.FarmerProfile.getBankDetails, {
      baseURL: getProfileBaseURL('farmer'),
      useProfileBaseURL: true,
      profileRole: 'farmer',
      params,
    });
    const body = response.data;
    if (body && body.success === false) {
      throw new Error(body.message || 'Failed to fetch farmer bank details.');
    }
    return body?.data || body;
  } catch (error) {
    throw parseProfileApiError(error, 'Failed to fetch farmer bank details.');
  }
}

export async function updateFarmerProfileApi(profileData = {}, userId = null) {
  const cleanPhone = String(
    profileData.mobileNumber || profileData.mobile || ''
  )
    .replace(/\D/g, '')
    .slice(-10);
  const cleanAltPhone = String(
    profileData.alternateMobile || profileData.alternateMobileNumber || ''
  )
    .replace(/\D/g, '')
    .slice(-10);
  const cleanPin = String(profileData.pinCode || '').trim();

  const rawPrimaryCrops = profileData.primaryCrops;
  const cleanPrimaryCrops = Array.isArray(rawPrimaryCrops)
    ? rawPrimaryCrops.join(', ').trim()
    : String(rawPrimaryCrops || '').trim();

  const payload = {
    fullName: String(profileData.farmerName || profileData.fullName || '').trim(),
    mobile: cleanPhone || null,
    alternateMobile: /^[6-9]\d{9}$/.test(cleanAltPhone) ? cleanAltPhone : null,
    farmName: String(profileData.farmName || '').trim() || null,
    totalLandArea: profileData.totalLandArea ? String(profileData.totalLandArea) : null,
    soilType: String(profileData.soilType || profileData.soilComposition || '').trim() || null,
    primaryCrops: cleanPrimaryCrops || null,
    village: String(profileData.village || '').trim() || null,
    mandal: String(profileData.mandal || '').trim() || null,
    district: String(profileData.district || '').trim() || null,
    state: String(profileData.state || '').trim() || null,
    pinCode: /^[1-9][0-9]{5}$/.test(cleanPin) ? cleanPin : null,
    address: String(profileData.completeAddress || profileData.address || '').trim() || null,
  };

  try {
    const params = {};
    if (userId) params.userId = userId;

    const response = await api.put(Endpoints.FarmerProfile.update, payload, {
      baseURL: getProfileBaseURL('farmer'),
      useProfileBaseURL: true,
      profileRole: 'farmer',
      params,
    });
    const body = response.data;
    if (body && body.success === false) {
      throw new Error(body.message || 'Failed to update farmer profile.');
    }
    return body?.data || body;
  } catch (error) {
    throw parseProfileApiError(error, 'Failed to update farmer profile.');
  }
}

export async function updateFarmerBankDetailsApi(bankData = {}, userId = null) {
  const cleanAccountHolder = String(
    bankData.accountHolderName || bankData.holderName || ''
  ).trim();
  const cleanBankName = String(bankData.bankName || '').trim();
  const cleanAccountNo = String(
    bankData.accountNumber || bankData.fullAccountNumber || ''
  ).trim();
  const cleanIfsc = String(bankData.ifscCode || '').trim().toUpperCase();
  const cleanBranch = String(bankData.branchName || bankData.branch || '').trim() || null;
  const cleanAccountType = String(bankData.accountType || 'Savings').trim() || 'Savings';
  const rawUpi = String(bankData.upiId || bankData.upiVpa || '').trim();
  const cleanUpi = /^[\w.-]+@[\w-]+$/.test(rawUpi) ? rawUpi : null;

  const payload = {
    bankName: cleanBankName,
    accountHolderName: cleanAccountHolder,
    accountNumber: cleanAccountNo,
    ifscCode: cleanIfsc,
    branchName: cleanBranch,
    accountType: cleanAccountType,
    upiId: cleanUpi,
  };

  try {
    const params = {};
    if (userId) params.userId = userId;

    const response = await api.put(
      Endpoints.FarmerProfile.updateBankDetails,
      payload,
      {
        baseURL: getProfileBaseURL('farmer'),
        useProfileBaseURL: true,
        profileRole: 'farmer',
        params,
      }
    );
    const body = response.data;
    if (body && body.success === false) {
      throw new Error(body.message || 'Failed to update farmer bank details.');
    }
    return body?.data || body;
  } catch (error) {
    throw parseProfileApiError(error, 'Failed to update farmer bank details.');
  }
}

export async function sendFarmerMobileChangeOtp(newMobile, userId = null) {
  const cleanPhone = String(newMobile || '')
    .replace(/\D/g, '')
    .slice(-10);

  try {
    const params = {};
    if (userId) params.userId = userId;

    const response = await api.post(
      Endpoints.FarmerProfile.sendMobileOtp,
      { newMobile: cleanPhone },
      {
        baseURL: getProfileBaseURL('farmer'),
        useProfileBaseURL: true,
        profileRole: 'farmer',
        params,
      }
    );
    const body = response.data;
    if (body && body.success === false) {
      const err = new Error(body.message || 'Failed to send OTP.');
      err.status = response.status;
      err.data = body;
      err.isDuplicateMobile = isDuplicateMobileMessage(
        response.status,
        body.message,
        body.errors
      );
      throw err;
    }

    const { rawDevOtp, demoOtp } = extractBackendDemoOtp(body);
    return {
      success: true,
      message:
        body?.data?.message ||
        (typeof body?.data === 'string' && body.data) ||
        body?.message ||
        'OTP sent successfully to your new mobile number.',
      demoOtp,
      rawDevOtp,
      cooldownSeconds: 30,
      expiresInMinutes: 5,
      target: cleanPhone,
      raw: body,
    };
  } catch (error) {
    throw parseProfileApiError(error, 'Failed to send OTP to new mobile number.');
  }
}

export async function verifyFarmerMobileChangeOtp(newMobile, otp, userId = null) {
  const cleanPhone = String(newMobile || '')
    .replace(/\D/g, '')
    .slice(-10);
  const cleanOtp = String(otp || '')
    .trim()
    .replace(/^DEV-/i, '')
    .replace(/\D/g, '');

  try {
    const params = {};
    if (userId) params.userId = userId;

    const response = await api.post(
      Endpoints.FarmerProfile.verifyMobileOtp,
      { newMobile: cleanPhone, otp: cleanOtp },
      {
        baseURL: getProfileBaseURL('farmer'),
        useProfileBaseURL: true,
        profileRole: 'farmer',
        params,
      }
    );
    const body = response.data;
    if (body && body.success === false) {
      throw new Error(body.message || 'Invalid or expired OTP code.');
    }

    return {
      success: true,
      verified: true,
      message: body?.message || 'Mobile number updated successfully.',
      target: cleanPhone,
      profileData: body?.data || null,
      raw: body,
    };
  } catch (error) {
    throw parseProfileApiError(error, 'Invalid or expired OTP code.');
  }
}

export async function changeFarmerPasswordApi(passwordData = {}, userId = null) {
  const payload = {
    currentPassword: passwordData.currentPassword || '',
    newPassword: passwordData.newPassword || '',
    confirmNewPassword:
      passwordData.confirmNewPassword || passwordData.confirmPassword || '',
  };

  try {
    const params = {};
    if (userId) params.userId = userId;

    const response = await api.post(
      Endpoints.FarmerProfile.changePassword,
      payload,
      {
        baseURL: getProfileBaseURL('farmer'),
        useProfileBaseURL: true,
        profileRole: 'farmer',
        params,
      }
    );
    const body = response.data;
    if (body && body.success === false) {
      throw new Error(body.message || 'Failed to change password.');
    }
    return {
      success: true,
      message: body?.message || 'Password changed successfully.',
      raw: body,
    };
  } catch (error) {
    throw parseProfileApiError(error, 'Failed to change password.');
  }
}
