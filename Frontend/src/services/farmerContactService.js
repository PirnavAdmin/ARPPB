/**
 * AgriConnect Farmer Portal - Contacts API Service
 * Integrates directly with Farmer Contacts endpoints:
 *
 * Get All Farmer Contacts:
 * - GET /api/v1/farmer/contacts (fallback: /api/contacts)
 *
 * Get Farmer Contact by ID:
 * - GET /api/v1/farmer/contacts/{id} (fallback: /api/contacts/{id})
 */

import api from '../API/Config';
import Endpoints from '../API/Endpoints';

/**
 * Normalizes error responses from ASP.NET Core / ApiResponse / ValidationProblemDetails
 */
export function parseContactApiError(error, fallbackMessage = 'Contacts request failed.') {
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
  } else if (!response && error?.request) {
    message = 'Unable to connect to the Contacts server. Please check your network connection.';
  } else if (error?.message) {
    message = error.message;
  }

  const normalized = new Error(message);
  normalized.status = status;
  normalized.data = data;
  normalized.rawErrors = rawErrors;
  return normalized;
}

/**
 * Maps frontend category to backend category format
 */
export function mapCategoryToBackend(frontendCategory = '') {
  const cat = String(frontendCategory || '').trim();
  if (!cat) return '';
  const lower = cat.toLowerCase();
  if (lower.includes('middleman') || lower.includes('trader')) return 'Middleman';
  if (lower.includes('vendor') || lower.includes('factory') || lower.includes('mill')) return 'Vendor';
  if (lower.includes('customer') || lower.includes('retail') || lower.includes('consumer')) return 'Customer';
  return cat;
}

/**
 * Maps backend category to canonical frontend categories: 'Middleman' | 'Vendor' | 'Customer'
 */
export function mapBackendCategoryToFrontend(backendCategory = '') {
  const cat = String(backendCategory || '').trim();
  if (!cat) return 'Middleman';
  const lower = cat.toLowerCase();
  if (lower.includes('middleman') || lower.includes('trader') || lower.includes('agent')) return 'Middleman';
  if (lower.includes('vendor') || lower.includes('mill') || lower.includes('processor') || lower.includes('factory') || lower.includes('company')) return 'Vendor';
  if (lower.includes('customer') || lower.includes('consumer') || lower.includes('retail') || lower.includes('buyer')) return 'Customer';
  return cat;
}

/**
 * Canonical fallback directory of saved agricultural contacts categorized by buyer category
 */
export const DEFAULT_FARMER_CONTACTS = [
  // --- MIDDLEMEN ---
  {
    id: 'CNT-M001',
    name: 'Honey Traders',
    mobile: '9848011221',
    category: 'Middleman',
    cropName: 'Paddy',
    sellingQuantity: '50',
    rate: '910.01',
    qualityGrade: 'Grade A',
    pickupLocation: 'Kurnool APMC Market Yard, Shop #18',
    district: 'Kurnool',
    state: 'Andhra Pradesh',
    lastOrder: '22 Nov 2026',
    totalPurchases: '₹3,64,000',
  },
  {
    id: 'CNT-M002',
    name: 'Hari Traders',
    mobile: '9848033445',
    category: 'Middleman',
    cropName: 'Groundnut',
    sellingQuantity: '45',
    rate: '6100',
    qualityGrade: 'Grade A',
    pickupLocation: 'Adoni Mandi Yard, Shed #7',
    district: 'Kurnool',
    state: 'Andhra Pradesh',
    lastOrder: '19 Nov 2026',
    totalPurchases: '₹2,74,500',
  },
  {
    id: 'CNT-M003',
    name: 'Horizon Agencies',
    mobile: '9848055667',
    category: 'Middleman',
    cropName: 'Turmeric',
    sellingQuantity: '30',
    rate: '8400',
    qualityGrade: 'Grade A',
    pickupLocation: 'Guntur Spices Terminal, Block C',
    district: 'Guntur',
    state: 'Andhra Pradesh',
    lastOrder: '14 Nov 2026',
    totalPurchases: '₹2,52,000',
  },
  {
    id: 'CNT-M004',
    name: 'Bhanu Prasad',
    mobile: '9848012345',
    category: 'Middleman',
    cropName: 'Paddy',
    sellingQuantity: '50',
    rate: '910.01',
    qualityGrade: 'Grade A',
    pickupLocation: 'Kurnool APMC Market Yard, Shop #12',
    district: 'Kurnool',
    state: 'Andhra Pradesh',
    lastOrder: '15 Nov 2026',
    totalPurchases: '₹4,55,000',
  },
  {
    id: 'CNT-M005',
    name: 'Bhanumathi Agro Agencies',
    mobile: '9949123456',
    category: 'Middleman',
    cropName: 'Groundnut',
    sellingQuantity: '40',
    rate: '6100',
    qualityGrade: 'Grade B',
    pickupLocation: 'Adoni Mandi Shed #4',
    district: 'Kurnool',
    state: 'Andhra Pradesh',
    lastOrder: '28 Oct 2026',
    totalPurchases: '₹2,44,000',
  },
  {
    id: 'CNT-M006',
    name: 'Srinivasa Traders',
    mobile: '9849011223',
    category: 'Middleman',
    cropName: 'Paddy',
    sellingQuantity: '60',
    rate: '910.01',
    qualityGrade: 'Grade A',
    pickupLocation: 'Kurnool APMC Yard, Gate 2',
    district: 'Kurnool',
    state: 'Andhra Pradesh',
    lastOrder: '18 Nov 2026',
    totalPurchases: '₹5,46,000',
  },
  {
    id: 'CNT-M007',
    name: 'Sri Balaji Traders',
    mobile: '9848223344',
    category: 'Middleman',
    cropName: 'Maize',
    sellingQuantity: '55',
    rate: '2250',
    qualityGrade: 'Grade A',
    pickupLocation: 'Nandyal Mandi, Platform #3',
    district: 'Nandyal',
    state: 'Andhra Pradesh',
    lastOrder: '24 Oct 2026',
    totalPurchases: '₹1,23,750',
  },
  {
    id: 'CNT-M008',
    name: 'Haritha Agri Brokers',
    mobile: '9848998877',
    category: 'Middleman',
    cropName: 'Paddy',
    sellingQuantity: '70',
    rate: '915',
    qualityGrade: 'Grade A',
    pickupLocation: 'Vijayawada Mandi Terminal, Gate 1',
    district: 'Krishna',
    state: 'Andhra Pradesh',
    lastOrder: '08 Nov 2026',
    totalPurchases: '₹6,40,500',
  },

  // --- VENDORS ---
  {
    id: 'CNT-V001',
    name: 'Bhanu Traders',
    mobile: '9876543210',
    category: 'Vendor',
    cropName: 'Turmeric',
    sellingQuantity: '25',
    rate: '8400',
    qualityGrade: 'Grade A',
    pickupLocation: 'Duggirala Turmeric Terminal, Guntur',
    district: 'Guntur',
    state: 'Andhra Pradesh',
    lastOrder: '10 Nov 2026',
    totalPurchases: '₹2,10,000',
  },
  {
    id: 'CNT-V002',
    name: 'ITC Agri Business Hub',
    mobile: '9440188990',
    category: 'Vendor',
    cropName: 'Turmeric',
    sellingQuantity: '30',
    rate: '8400',
    qualityGrade: 'Grade A',
    pickupLocation: 'ITC Procurement Centre, Guntur',
    district: 'Guntur',
    state: 'Andhra Pradesh',
    lastOrder: '04 Nov 2026',
    totalPurchases: '₹2,52,000',
  },
  {
    id: 'CNT-V003',
    name: 'Lakshmi Agro Exports',
    mobile: '9866123456',
    category: 'Vendor',
    cropName: 'Paddy',
    sellingQuantity: '80',
    rate: '920',
    qualityGrade: 'Grade A',
    pickupLocation: 'Kakinada Port Terminal',
    district: 'Kakinada',
    state: 'Andhra Pradesh',
    lastOrder: '20 Oct 2026',
    totalPurchases: '₹7,36,000',
  },
  {
    id: 'CNT-V004',
    name: 'Heritage Agri Foods Ltd',
    mobile: '9848123789',
    category: 'Vendor',
    cropName: 'Maize',
    sellingQuantity: '100',
    rate: '2280',
    qualityGrade: 'Grade A',
    pickupLocation: 'Heritage Processing Unit, Chittoor',
    district: 'Chittoor',
    state: 'Andhra Pradesh',
    lastOrder: '12 Nov 2026',
    totalPurchases: '₹2,28,000',
  },
  {
    id: 'CNT-V005',
    name: 'Godavari Rice & Oil Mills',
    mobile: '9440234567',
    category: 'Vendor',
    cropName: 'Paddy',
    sellingQuantity: '120',
    rate: '925',
    qualityGrade: 'Grade A',
    pickupLocation: 'Industrial Estate, Rajahmundry',
    district: 'East Godavari',
    state: 'Andhra Pradesh',
    lastOrder: '02 Nov 2026',
    totalPurchases: '₹11,10,000',
  },

  // --- CUSTOMERS ---
  {
    id: 'CNT-C001',
    name: 'Rajesh Kumar',
    mobile: '9123456789',
    category: 'Customer',
    cropName: 'Groundnut',
    sellingQuantity: '10',
    rate: '6100',
    qualityGrade: 'Grade A',
    pickupLocation: 'Farmer Warehouse, Tanuku',
    district: 'West Godavari',
    state: 'Andhra Pradesh',
    lastOrder: '02 Nov 2026',
    totalPurchases: '₹61,000',
  },
  {
    id: 'CNT-C002',
    name: 'Priya Retail Mart',
    mobile: '9848776655',
    category: 'Customer',
    cropName: 'Paddy',
    sellingQuantity: '15',
    rate: '930',
    qualityGrade: 'Grade A',
    pickupLocation: 'Brodipet, Guntur',
    district: 'Guntur',
    state: 'Andhra Pradesh',
    lastOrder: '16 Nov 2026',
    totalPurchases: '₹13,950',
  },
  {
    id: 'CNT-C003',
    name: 'Venkateswara Consumer Store',
    mobile: '9848665544',
    category: 'Customer',
    cropName: 'Turmeric',
    sellingQuantity: '8',
    rate: '8500',
    qualityGrade: 'Grade A',
    pickupLocation: 'Gandhi Nagar, Vijayawada',
    district: 'NTR',
    state: 'Andhra Pradesh',
    lastOrder: '11 Nov 2026',
    totalPurchases: '₹68,000',
  },
  {
    id: 'CNT-C004',
    name: 'Suresh Organic Consumers',
    mobile: '9948554433',
    category: 'Customer',
    cropName: 'Paddy',
    sellingQuantity: '20',
    rate: '935',
    qualityGrade: 'Grade A',
    pickupLocation: 'Tirupati Rural Delivery Point',
    district: 'Tirupati',
    state: 'Andhra Pradesh',
    lastOrder: '05 Nov 2026',
    totalPurchases: '₹18,700',
  },
];

/**
 * Normalizes a raw contact DTO from backend into canonical contact format
 */
export function normalizeContactDto(dto = {}) {
  if (!dto || typeof dto !== 'object') return null;

  const id = dto.id ?? dto.contactId ?? dto.userId ?? dto.code ?? null;
  const name = String(
    dto.name ||
    dto.contactName ||
    dto.tradingFirmName ||
    dto.firmName ||
    dto.businessName ||
    dto.fullName ||
    dto.buyerName ||
    ''
  ).trim();

  const rawMobile = dto.mobile || dto.phone || dto.mobileNumber || dto.contactNumber || dto.buyerMobile || '';
  const mobile = String(rawMobile).replace(/\D/g, '').slice(-10);

  const rawCat = dto.category || dto.buyerCategory || dto.buyerType || dto.type || dto.role || '';
  const category = mapBackendCategoryToFrontend(rawCat);

  const pickupLocation =
    dto.pickupLocation ||
    dto.address ||
    dto.location ||
    [dto.village, dto.district, dto.state].filter(Boolean).join(', ') ||
    '';

  const cropName = dto.cropName || dto.crop || dto.preferredCrop || dto.lastCrop || '';
  const sellingQuantity = dto.sellingQuantity ?? dto.quantity ?? dto.lastQuantity ?? '';
  const rate = dto.rate ?? dto.pricePerUnit ?? dto.expectedPrice ?? '';
  const qualityGrade = dto.qualityGrade || dto.grade || 'Grade A';
  const totalPurchases = dto.totalPurchases || dto.totalPurchaseValue || '';
  const lastOrder = dto.lastOrder || dto.lastTransactionDate || '';

  return {
    id: id || `CNT-${name.replace(/\s+/g, '-').slice(0, 8)}`,
    name,
    mobile,
    category,
    pickupLocation,
    cropName,
    sellingQuantity: sellingQuantity ? String(sellingQuantity) : '',
    rate: rate ? String(rate) : '',
    qualityGrade,
    totalPurchases,
    lastOrder,
    raw: dto,
  };
}

/**
 * Reads user-saved contacts from localStorage
 */
function getLocalSavedContacts() {
  try {
    const raw = localStorage.getItem('farmer_saved_contacts') || localStorage.getItem('farmer_saved_buyers');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.map(normalizeContactDto).filter(Boolean);
      }
    }
  } catch (e) {
    console.warn('Could not read saved contacts from localStorage:', e);
  }
  return [];
}

/**
 * Persists a selected/updated contact to localStorage
 */
export function saveContactToStorage(contact) {
  if (!contact || !contact.name) return;
  try {
    const existing = getLocalSavedContacts();
    const normalized = normalizeContactDto(contact);
    const updated = [
      normalized,
      ...existing.filter((c) => c.name.toLowerCase() !== normalized.name.toLowerCase()),
    ].slice(0, 50);
    localStorage.setItem('farmer_saved_contacts', JSON.stringify(updated));
    localStorage.setItem('farmer_saved_buyers', JSON.stringify(updated));
  } catch (e) {
    console.warn('Could not save contact to storage:', e);
  }
}

/**
 * Returns merged offline fallback contacts
 */
export function getFallbackContactsList(category = '') {
  const local = getLocalSavedContacts();
  const map = new Map();

  // 1. Defaults
  DEFAULT_FARMER_CONTACTS.forEach((c) => {
    map.set(c.name.toLowerCase().trim(), c);
  });

  // 2. Local saved modifications
  local.forEach((c) => {
    if (c && c.name) {
      const key = c.name.toLowerCase().trim();
      map.set(key, { ...(map.get(key) || {}), ...c });
    }
  });

  const all = Array.from(map.values());
  if (!category) return all;

  const targetCategory = mapCategoryToBackend(category).toLowerCase();
  return all.filter((c) => c.category.toLowerCase() === targetCategory);
}

/**
 * GET All Farmer Contacts
 * Supported Endpoints:
 * - Primary: GET /api/v1/farmer/contacts
 * - Fallback: GET /api/contacts
 *
 * Query params:
 * - category: 'Middleman' | 'Vendor' | 'Customer'
 * - search / query: contact name search prefix
 * - userId: optional authenticated farmer id
 */
export async function fetchFarmerContactsApi({ category = '', search = '', query = '', userId } = {}) {
  const term = String(search || query || '').trim();
  const backendCategory = mapCategoryToBackend(category);

  const params = {};
  if (backendCategory) {
    params.category = backendCategory;
    params.buyerCategory = backendCategory;
    params.type = backendCategory;
  }
  if (term) {
    params.search = term;
    params.query = term;
    params.prefix = term;
    params.name = term;
  }
  if (userId) {
    params.userId = userId;
  }

  let rawList = null;

  // 1. Try Primary endpoint: /api/v1/farmer/contacts
  try {
    const primaryUrl = Endpoints?.FARMER_CONTACTS?.BASE || '/api/v1/farmer/contacts';
    const res = await api.get(primaryUrl, { params });
    const body = res?.data;
    rawList = body?.data?.items || body?.items || body?.data || body;
  } catch (err1) {
    // 2. If 404 or failed, try Fallback endpoint: /api/contacts
    if (err1?.response?.status === 404) {
      try {
        const altUrl = Endpoints?.FARMER_CONTACTS?.BASE_ALT || '/api/contacts';
        const res2 = await api.get(altUrl, { params });
        const body2 = res2?.data;
        rawList = body2?.data?.items || body2?.items || body2?.data || body2;
      } catch {
        // Fall back to offline dataset
      }
    }
  }

  // 3. Process records from API or Fallback
  let contacts = [];
  if (Array.isArray(rawList) && rawList.length > 0) {
    contacts = rawList.map(normalizeContactDto).filter(Boolean);
  } else {
    contacts = getFallbackContactsList(category);
  }

  // 4. Client-side Category Filtering (ensure only contacts matching selected category are returned)
  if (category) {
    const normalizedCat = mapCategoryToBackend(category).toLowerCase();
    contacts = contacts.filter((c) => c.category.toLowerCase() === normalizedCat);
  }

  // 5. Client-side Prefix / Autocomplete Filtering
  if (term) {
    const q = term.toLowerCase();
    contacts = contacts
      .filter((c) => {
        const name = c.name.toLowerCase();
        const mobile = c.mobile || '';
        const exactPrefix = name.startsWith(q);
        const wordPrefix = name.split(/\s+/).some((w) => w.startsWith(q));
        const partial = name.includes(q) || mobile.startsWith(q);
        const initialMatch = q.length <= 2 && name.startsWith(q[0]);
        return exactPrefix || wordPrefix || partial || initialMatch;
      })
      .sort((a, b) => {
        const aName = a.name.toLowerCase();
        const bName = b.name.toLowerCase();
        const aPrefix = aName.startsWith(q);
        const bPrefix = bName.startsWith(q);
        if (aPrefix && !bPrefix) return -1;
        if (!aPrefix && bPrefix) return 1;

        const aWordPrefix = aName.split(/\s+/).some((w) => w.startsWith(q));
        const bWordPrefix = bName.split(/\s+/).some((w) => w.startsWith(q));
        if (aWordPrefix && !bWordPrefix) return -1;
        if (!aWordPrefix && bWordPrefix) return 1;

        return aName.localeCompare(bName);
      });
  }

  // 6. Enforce maximum of 10 suggestions as specified in workflow
  return contacts.slice(0, 10);
}

/**
 * GET Farmer Contact by ID
 * Supported Endpoints:
 * - Primary: GET /api/v1/farmer/contacts/{id}
 * - Fallback: GET /api/contacts/{id}
 */
export async function fetchFarmerContactByIdApi(id, userId) {
  if (!id) throw new Error('Contact ID is required.');
  const params = userId ? { userId } : {};

  // 1. Try Primary endpoint: /api/v1/farmer/contacts/{id}
  try {
    const primaryUrl = Endpoints?.FARMER_CONTACTS?.BY_ID
      ? Endpoints.FARMER_CONTACTS.BY_ID(id)
      : `/api/v1/farmer/contacts/${id}`;
    const res = await api.get(primaryUrl, { params });
    const body = res?.data;
    const data = body?.data || body;
    const normalized = normalizeContactDto(data);
    if (normalized) return normalized;
  } catch (err1) {
    // 2. If 404, try Fallback: /api/contacts/{id}
    if (err1?.response?.status === 404) {
      try {
        const altUrl = Endpoints?.FARMER_CONTACTS?.BY_ID_ALT
          ? Endpoints.FARMER_CONTACTS.BY_ID_ALT(id)
          : `/api/contacts/${id}`;
        const res2 = await api.get(altUrl, { params });
        const body2 = res2?.data;
        const data2 = body2?.data || body2;
        const normalized2 = normalizeContactDto(data2);
        if (normalized2) return normalized2;
      } catch {
        // Fall back to offline dataset
      }
    }
  }

  // 3. Fallback to local directory matching id or name
  const allFallback = getFallbackContactsList();
  const idStr = String(id).toLowerCase();
  const found = allFallback.find(
    (c) => String(c.id).toLowerCase() === idStr || c.name.toLowerCase() === idStr
  );

  if (found) return found;

  return {
    id,
    name: String(id),
    mobile: '',
    category: 'Middleman',
    pickupLocation: '',
    cropName: '',
    sellingQuantity: '',
    rate: '',
    qualityGrade: 'Grade A',
  };
}
