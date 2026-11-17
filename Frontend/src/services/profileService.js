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
    const response = await api.get(Endpoints.MIDDLEMAN_PROFILE.PROFILE, {
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
    const response = await api.get(Endpoints.MIDDLEMAN_PROFILE.BY_ID(id), {
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
      Endpoints.MIDDLEMAN_PROFILE.BY_ID(targetId),
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
      Endpoints.MIDDLEMAN_PROFILE.SEND_MOBILE_OTP,
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
      Endpoints.MIDDLEMAN_PROFILE.VERIFY_MOBILE_OTP,
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
      ? Endpoints.VENDOR_PROFILE.BY_ID(vendorId)
      : Endpoints.VENDOR_PROFILE.PROFILE;
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

export async function updateVendorProfileApi(profileData = {}, vendorId = null) {
  const payload = {
    businessName: String(profileData.businessName || '').trim(),
    registeredBusinessName: String(profileData.businessName || '').trim(),
    ownerName: String(profileData.ownerName || '').trim(),
    mobileNumber: String(profileData.mobileNumber || '').replace(/\D/g, ''),
    mobile: String(profileData.mobileNumber || '').replace(/\D/g, ''),
    email: String(profileData.email || '').trim() || null,
    gstNumber: String(profileData.gstNumber || '').trim().toUpperCase(),
    gstin: String(profileData.gstNumber || '').trim().toUpperCase(),
    businessRegNumber: String(profileData.businessRegNumber || '').trim(),
    businessType: String(profileData.businessType || '').trim(),
    businessAddress: String(profileData.businessAddress || '').trim(),
    district: String(profileData.district || '').trim(),
    state: String(profileData.state || '').trim(),
    pinCode: String(profileData.pinCode || '').trim(),
    logoUrl: profileData.logoUrl || null,
  };

  try {
    const targetEndpoint = vendorId
      ? Endpoints.VENDOR_PROFILE.BY_ID(vendorId)
      : Endpoints.VENDOR_PROFILE.PROFILE;
    const response = await api.put(targetEndpoint, payload, {
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
    const response = await api.get(Endpoints.VENDOR_PROFILE.BANK_DETAILS, {
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
      Endpoints.VENDOR_PROFILE.BANK_DETAILS,
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
        Endpoints.VENDOR_PROFILE.REQUEST_MOBILE_OTP,
        { newMobile: cleanPhone },
        reqConfig
      );
    } catch (firstErr) {
      if (firstErr?.response?.status === 400) {
        response = await api.post(
          Endpoints.VENDOR_PROFILE.REQUEST_MOBILE_OTP,
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
        Endpoints.VENDOR_PROFILE.VERIFY_MOBILE_OTP,
        {
          newMobile: cleanPhone,
          otp: cleanOtp,
        },
        reqConfig
      );
    } catch (firstErr) {
      if (firstErr?.response?.status === 400) {
        response = await api.post(
          Endpoints.VENDOR_PROFILE.VERIFY_MOBILE_OTP,
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
    (typeof dto.customerId === 'string' && dto.customerId.startsWith('CUS')
      ? dto.customerId
      : dto.customerId
      ? `CUS-${dto.customerId}`
      : existingProfile.customerId || 'CUS-1001');

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
    const response = await api.get(Endpoints.CUSTOMER_PROFILE.PROFILE, {
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
    const response = await api.put(Endpoints.CUSTOMER_PROFILE.PROFILE, payload, {
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
      Endpoints.CUSTOMER_PROFILE.ADDRESSES,
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
      Endpoints.CUSTOMER_PROFILE.ADDRESS_BY_ID(id),
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
      Endpoints.CUSTOMER_PROFILE.SET_DEFAULT_ADDRESS(id),
      {},
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
      Endpoints.CUSTOMER_PROFILE.ADDRESS_BY_ID(id),
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
      Endpoints.CUSTOMER_PROFILE.SEND_MOBILE_OTP,
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
      Endpoints.CUSTOMER_PROFILE.VERIFY_MOBILE_OTP,
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
    isActive: dto.isActive ?? existingProfile.isActive ?? true,
    farmName: farmLoc.farmName ?? existingProfile.farmName ?? '',
    totalLandArea: farmLoc.totalLandArea ?? existingProfile.totalLandArea ?? '',
    village: farmLoc.village ?? existingProfile.village ?? '',
    mandal: farmLoc.mandal ?? existingProfile.mandal ?? '',
    district: farmLoc.district ?? existingProfile.district ?? '',
    state: farmLoc.state ?? existingProfile.state ?? '',
    pinCode: farmLoc.pinCode ?? existingProfile.pinCode ?? '',
    completeAddress: farmLoc.address ?? existingProfile.completeAddress ?? '',
    bankDetails: {
      bankName: bank.bankName ?? existingProfile.bankDetails?.bankName ?? '',
      accountNumber:
        bank.accountNumber ?? existingProfile.bankDetails?.accountNumber ?? '',
      fullAccountNumber:
        bank.accountNumber ?? existingProfile.bankDetails?.fullAccountNumber ?? '',
      ifscCode: bank.ifscCode ?? existingProfile.bankDetails?.ifscCode ?? '',
      branch: bank.branchName ?? existingProfile.bankDetails?.branch ?? '',
      branchName:
        bank.branchName ?? existingProfile.bankDetails?.branchName ?? '',
      accountType: bank.accountType ?? existingProfile.bankDetails?.accountType ?? 'Savings',
    },
    membership: existingProfile.membership || 'Verified Farmer',
    rating: existingProfile.rating || '',
  };
}

export async function fetchFarmerProfileApi(userId = null) {
  try {
    const params = {};
    if (userId) params.userId = userId;

    const response = await api.get(Endpoints.FARMER_PROFILE.PROFILE, {
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
    const response = await api.get(Endpoints.FARMER_PROFILE.ALL, {
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

export async function updateFarmerProfileApi(profileData = {}, userId = null) {
  const cleanPhone = String(
    profileData.mobileNumber || profileData.mobile || ''
  )
    .replace(/\D/g, '')
    .slice(-10);

  const payload = {
    fullName: profileData.farmerName || profileData.fullName || '',
    mobile: cleanPhone,
    farmName: profileData.farmName || '',
    totalLandArea: profileData.totalLandArea || '',
    village: profileData.village || '',
    mandal: profileData.mandal || '',
    district: profileData.district || '',
    state: profileData.state || '',
    pinCode: profileData.pinCode || '',
    address: profileData.completeAddress || profileData.address || '',
  };

  try {
    const params = {};
    if (userId) params.userId = userId;

    const response = await api.put(Endpoints.FARMER_PROFILE.PROFILE, payload, {
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
  const payload = {
    bankName: bankData.bankName || '',
    accountNumber:
      bankData.accountNumber || bankData.fullAccountNumber || '',
    ifscCode: bankData.ifscCode || '',
    branchName: bankData.branchName || bankData.branch || '',
    accountType: bankData.accountType || 'Savings',
  };

  try {
    const params = {};
    if (userId) params.userId = userId;

    const response = await api.put(
      Endpoints.FARMER_PROFILE.BANK_DETAILS,
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
      Endpoints.FARMER_PROFILE.SEND_MOBILE_OTP,
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
      Endpoints.FARMER_PROFILE.VERIFY_MOBILE_OTP,
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
      Endpoints.FARMER_PROFILE.CHANGE_PASSWORD,
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
