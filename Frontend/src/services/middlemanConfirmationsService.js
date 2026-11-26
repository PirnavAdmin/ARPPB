import api from '../API/Config';
import Endpoints from '../API/Endpoints';

export async function fetchMiddlemanConfirmationsSummaryApi() {
  try {
    const res = await api.get(Endpoints.MiddlemanConfirmations.getAll, {
      params: { page: 1, pageSize: 1 },
    });
    if (res?.data?.summary) {
      return res.data.summary;
    }
    if (res?.data?.success) {
      return {
        pendingCount: res.data.totalPending ?? 0,
        verifiedCount: res.data.totalVerified ?? 0,
        failedOrExpiredCount: res.data.totalExpired ?? 0,
        farmerCount: res.data.farmerPending ?? 0,
        vendorCount: res.data.vendorPending ?? 0,
        customerCount: res.data.customerPending ?? 0,
      };
    }
    return res?.data || null;
  } catch (err) {
    console.warn('Backend call fetchMiddlemanConfirmationsSummaryApi had non-blocking issue:', err);
    return null;
  }
}

export async function fetchMiddlemanConfirmationsApi(query = {}) {
  try {
    const effectivePageSize = query.pageSize || 1000;
    const params = {};
    if (query.category && query.category !== 'All') params.category = query.category;
    if (query.otpStatus && query.otpStatus !== 'All') params.otpStatus = query.otpStatus;
    if (query.search) params.search = query.search;
    if (query.partyFilter) params.partyFilter = query.partyFilter;
    if (query.page) params.page = query.page;
    params.pageSize = effectivePageSize;

    const res = await api.get(Endpoints.MiddlemanConfirmations.getAll, { params });
    if (res?.data?.success) {
      return res.data.data?.items || res.data.data || [];
    }
    return res?.data?.items || res?.data || [];
  } catch (err) {
    console.warn('Backend call fetchMiddlemanConfirmationsApi had non-blocking issue:', err);
    return null;
  }
}

export async function fetchMiddlemanConfirmationByIdApi(id) {
  if (!id) return null;
  try {
    const res = await api.get(Endpoints.MiddlemanConfirmations.getAll, {
      params: { id },
    });
    if (res?.data?.success) {
      return res.data.data;
    }
    return res?.data || null;
  } catch (err) {
    console.warn(`Backend call fetchMiddlemanConfirmationByIdApi for ${id} had issue:`, err);
    return null;
  }
}

export async function verifyMiddlemanOtpApi(id, enteredCode) {
  try {
    const res = await api.post(Endpoints.MiddlemanConfirmations.verify(id), { enteredCode, otp: enteredCode });
    if (res?.data?.success) {
      return res.data;
    }
    return res?.data || null;
  } catch (err) {
    console.warn(`Backend call verifyMiddlemanOtpApi for ${id} had issue:`, err);
    return null;
  }
}

export async function resendMiddlemanOtpApi(id) {
  try {
    const res = await api.post(Endpoints.MiddlemanConfirmations.resend(id), {});
    if (res?.data?.success) {
      return res.data;
    }
    return res?.data || null;
  } catch (err) {
    console.warn(`Backend call resendMiddlemanOtpApi for ${id} had issue:`, err);
    return null;
  }
}

export async function rejectMiddlemanOtpApi(id, reason) {
  try {
    const res = await api.post(Endpoints.MiddlemanConfirmations.reject(id), { reason });
    if (res?.data?.success) {
      return res.data;
    }
    return res?.data || null;
  } catch (err) {
    console.warn(`Backend call rejectMiddlemanOtpApi for ${id} had issue:`, err);
    return null;
  }
}
