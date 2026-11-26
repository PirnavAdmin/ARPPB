import api from '../API/Config';
import Endpoints from '../API/Endpoints';

export async function fetchMiddlemanConfirmationsSummaryApi() {
  try {
    const res = await api.get(Endpoints.MiddlemanConfirmations.summary);
    if (res?.data?.success) {
      return res.data.data;
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
    const params = new URLSearchParams();
    if (query.category && query.category !== 'All') params.append('category', query.category);
    if (query.otpStatus && query.otpStatus !== 'All') params.append('otpStatus', query.otpStatus);
    if (query.search) params.append('search', query.search);
    if (query.page) params.append('page', query.page);
    params.append('pageSize', effectivePageSize);

    const url = `${Endpoints.MiddlemanConfirmations.getAll}?${params.toString()}`;
    const res = await api.get(url);
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
  try {
    const res = await api.get(Endpoints.MiddlemanConfirmations.getById(id));
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
