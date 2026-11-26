/**
 * India Post PIN-code Lookup Service
 * Endpoint: https://api.postalpincode.in/pincode/{pincode}
 */

export async function fetchLocationByPincode(pincode, options = {}) {
  const cleanPin = String(pincode || '').replace(/\D/g, '').slice(0, 6);
  if (cleanPin.length !== 6) {
    return {
      success: false,
      message: 'PIN code must be exactly 6 digits.',
    };
  }

  const { signal } = options;

  try {
    const response = await fetch(`https://api.postalpincode.in/pincode/${cleanPin}`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      signal,
    });

    if (!response.ok) {
      return {
        success: false,
        pincode: cleanPin,
        message: `Postal service responded with status ${response.status}`,
      };
    }

    const data = await response.json();
    if (!Array.isArray(data) || data.length === 0) {
      return {
        success: false,
        pincode: cleanPin,
        message: 'Invalid response from Postal PIN code service.',
      };
    }

    const entry = data[0];
    if (
      entry.Status === 'Success' &&
      Array.isArray(entry.PostOffice) &&
      entry.PostOffice.length > 0
    ) {
      const firstPO = entry.PostOffice[0];
      const district = String(firstPO.District || '').trim();
      const state = String(firstPO.State || '').trim();

      return {
        success: true,
        pincode: cleanPin,
        district,
        state,
        postOffices: entry.PostOffice.map((po) => po.Name).filter(Boolean),
      };
    }

    return {
      success: false,
      pincode: cleanPin,
      message: entry.Message || 'No location records found for this PIN code.',
    };
  } catch (err) {
    if (err.name === 'AbortError') {
      return { success: false, aborted: true };
    }
    return {
      success: false,
      pincode: cleanPin,
      message: err.message || 'Network error occurred while fetching PIN code details.',
    };
  }
}

