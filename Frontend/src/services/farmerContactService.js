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
 * Canonical fallback directory of saved agricultural contacts categorized by buyer category.
 * Each entry has BOTH businessName and contactPerson to support searching by either.
 */
export const DEFAULT_FARMER_CONTACTS = [
  // =========================================================================
  // MIDDLEMEN (Mandi Commission Agents, Traders, Brokers)
  // =========================================================================
  {
    id: 'CNT-M001',
    name: 'Honey Traders',
    businessName: 'Honey Traders',
    contactPerson: 'Harish Kumar',
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
    businessName: 'Hari Traders',
    contactPerson: 'Hari Krishna',
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
    businessName: 'Horizon Agencies',
    contactPerson: 'Hemanth Reddy',
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
    businessName: 'Bhanu Prasad & Co Traders',
    contactPerson: 'Bhanu Prasad',
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
    businessName: 'Bhanumathi Agro Agencies',
    contactPerson: 'Bhanumathi Devi',
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
    businessName: 'Srinivasa Traders',
    contactPerson: 'Srinivasa Rao',
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
    businessName: 'Sri Balaji Traders',
    contactPerson: 'Balaji Naidu',
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
    businessName: 'Haritha Agri Brokers',
    contactPerson: 'Haritha Murthy',
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

  // =========================================================================
  // VENDORS (Processing Mills, Food Factories, Aggregators, Exporters)
  // =========================================================================
  {
    id: 'CNT-V001',
    name: 'Bhanu Traders',
    businessName: 'Bhanu Traders & Processors',
    contactPerson: 'Bhanu Prakash',
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
    businessName: 'ITC Agri Business Hub',
    contactPerson: 'Venkat Rao',
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
    businessName: 'Lakshmi Agro Exports',
    contactPerson: 'Lakshmi Narayana',
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
    businessName: 'Heritage Agri Foods Ltd',
    contactPerson: 'Ramesh Varma',
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
    businessName: 'Godavari Rice & Oil Mills',
    contactPerson: 'Satyanarayana Murthy',
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
  {
    id: 'CNT-V006',
    name: 'Kaveri Seed & Grain Processing',
    businessName: 'Kaveri Seed & Grain Processing',
    contactPerson: 'Kiran Kumar',
    mobile: '9848332211',
    category: 'Vendor',
    cropName: 'Maize',
    sellingQuantity: '90',
    rate: '2260',
    qualityGrade: 'Grade A',
    pickupLocation: 'Kaveri Processing Facility, Bellary Road, Kurnool',
    district: 'Kurnool',
    state: 'Andhra Pradesh',
    lastOrder: '25 Oct 2026',
    totalPurchases: '₹2,03,400',
  },
  {
    id: 'CNT-V007',
    name: 'Coastal Agro Food Industries',
    businessName: 'Coastal Agro Food Industries',
    contactPerson: 'Naresh Babu',
    mobile: '9848556677',
    category: 'Vendor',
    cropName: 'Paddy',
    sellingQuantity: '75',
    rate: '918',
    qualityGrade: 'Grade A',
    pickupLocation: 'Auto Nagar, Vijayawada',
    district: 'Krishna',
    state: 'Andhra Pradesh',
    lastOrder: '17 Nov 2026',
    totalPurchases: '₹6,88,500',
  },

  // =========================================================================
  // CUSTOMERS (Retail Stores, Organic Consumers, Direct Buyers)
  // =========================================================================
  {
    id: 'CNT-C001',
    name: 'Rajesh Kumar',
    businessName: 'Rajesh Consumer Household',
    contactPerson: 'Rajesh Kumar',
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
    businessName: 'Priya Retail Mart',
    contactPerson: 'Priya Sharma',
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
    businessName: 'Venkateswara Consumer Store',
    contactPerson: 'Venkateswara Rao',
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
    businessName: 'Suresh Organic Consumers Club',
    contactPerson: 'Suresh Reddy',
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
  {
    id: 'CNT-C005',
    name: 'Anil Provisions Store',
    businessName: 'Anil Provisions Store',
    contactPerson: 'Anil Kumar',
    mobile: '9849221100',
    category: 'Customer',
    cropName: 'Paddy',
    sellingQuantity: '12',
    rate: '925',
    qualityGrade: 'Grade A',
    pickupLocation: 'RTC Complex Area, Kurnool',
    district: 'Kurnool',
    state: 'Andhra Pradesh',
    lastOrder: '21 Nov 2026',
    totalPurchases: '₹11,100',
  },
  {
    id: 'CNT-C006',
    name: 'Deepika Organic Groceries',
    businessName: 'Deepika Organic Groceries',
    contactPerson: 'Deepika Reddy',
    mobile: '9848119922',
    category: 'Customer',
    cropName: 'Groundnut',
    sellingQuantity: '15',
    rate: '6200',
    qualityGrade: 'Grade A',
    pickupLocation: 'Collectorate Road, Kadapa',
    district: 'YSR Kadapa',
    state: 'Andhra Pradesh',
    lastOrder: '13 Nov 2026',
    totalPurchases: '₹93,000',
  },
];

/**
 * Sanitizes and cleans localStorage, removing poisoned dummy records
 * (e.g. entries where name was set to 'CNT-V001' or mobile was empty).
 */
export function sanitizeAndCleanSavedContacts() {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    ['farmer_saved_contacts', 'farmer_saved_buyers'].forEach((key) => {
      const raw = localStorage.getItem(key);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const cleaned = parsed.filter((c) => {
          if (!c || typeof c !== 'object') return false;
          const name = String(c.name || '').trim();
          const id = String(c.id || '').trim();
          // Filter out corrupted entries
          if (!name || name === id || name.startsWith('CNT-') || name.startsWith('BUYER-') || /^[0-9]+$/.test(name)) {
            return false;
          }
          const mob = String(c.mobile || c.mobileNumber || '').replace(/\D/g, '');
          if (!mob || mob.length !== 10 || !/^[6-9]/.test(mob)) {
            return false;
          }
          return true;
        });
        localStorage.setItem(key, JSON.stringify(cleaned));
      }
    });
  } catch (e) {
    console.warn('Error sanitizing saved contacts in localStorage:', e);
  }
}

// Run cleanup immediately on load
sanitizeAndCleanSavedContacts();

/**
 * Normalizes a raw contact DTO from backend or fallback into canonical contact format.
 * Captures both businessName and contactPerson so both are preserved and searchable.
 */
export function normalizeContactDto(dto = {}) {
  if (!dto || typeof dto !== 'object') return null;

  const id = dto.id ?? dto.contactId ?? dto.userId ?? dto.code ?? null;
  const idStr = id ? String(id).toLowerCase().trim() : '';

  // Look up known default contact if id or name matches
  const defaultMatch = DEFAULT_FARMER_CONTACTS.find(
    (c) =>
      (idStr && String(c.id).toLowerCase() === idStr) ||
      (dto.name && c.name.toLowerCase() === String(dto.name).toLowerCase()) ||
      (dto.businessName && c.businessName?.toLowerCase() === String(dto.businessName).toLowerCase()) ||
      (dto.contactPerson && c.contactPerson?.toLowerCase() === String(dto.contactPerson).toLowerCase())
  );

  let businessName = String(
    dto.businessName ||
    dto.tradingFirmName ||
    dto.firmName ||
    dto.companyName ||
    dto.storeName ||
    dto.shopName ||
    defaultMatch?.businessName ||
    ''
  ).trim();

  let contactPerson = String(
    dto.contactPerson ||
    dto.personName ||
    dto.ownerName ||
    dto.proprietor ||
    dto.contactName ||
    dto.fullName ||
    dto.customerName ||
    dto.vendorName ||
    dto.middlemanName ||
    dto.userName ||
    defaultMatch?.contactPerson ||
    (businessName && dto.name && dto.name !== businessName ? dto.name : '') ||
    ''
  ).trim();

  // Canonical display name: never an ID or number
  let name = String(dto.name || '').trim();
  if (!name || name.startsWith('CNT-') || name.startsWith('BUYER-') || /^[0-9]+$/.test(name)) {
    name = businessName || contactPerson || defaultMatch?.name || 'Agricultural Buyer';
  }

  if (!businessName) businessName = name;
  if (!contactPerson) contactPerson = name;

  const rawMobile =
    dto.mobileNumber ||
    dto.mobile ||
    dto.phone ||
    dto.contactNumber ||
    dto.buyerMobile ||
    defaultMatch?.mobile ||
    '';
  const mobile = String(rawMobile).replace(/\D/g, '').slice(-10);

  const rawCat = dto.category || dto.buyerCategory || dto.buyerType || dto.type || dto.role || defaultMatch?.category || '';
  const category = mapBackendCategoryToFrontend(rawCat);

  const pickupLocation =
    dto.pickupLocation ||
    dto.address ||
    dto.location ||
    [dto.village, dto.district, dto.state].filter(Boolean).join(', ') ||
    defaultMatch?.pickupLocation ||
    '';

  const cropName = dto.cropName || dto.crop || dto.preferredCrop || dto.lastCrop || defaultMatch?.cropName || '';
  const sellingQuantity = dto.sellingQuantity ?? dto.quantity ?? dto.lastQuantity ?? defaultMatch?.sellingQuantity ?? '25';
  const rate = dto.rate ?? dto.pricePerUnit ?? dto.expectedPrice ?? defaultMatch?.rate ?? '910.01';
  const qualityGrade = dto.qualityGrade || dto.grade || defaultMatch?.qualityGrade || 'Grade A';
  const totalPurchases = dto.totalPurchases || dto.totalPurchaseValue || defaultMatch?.totalPurchases || '';
  const lastOrder = dto.lastOrder || dto.lastTransactionDate || defaultMatch?.lastOrder || '';

  return {
    id: id || defaultMatch?.id || `CNT-${name.replace(/\s+/g, '-').slice(0, 8)}`,
    name,
    businessName,
    contactPerson,
    mobile,
    category,
    pickupLocation,
    cropName,
    sellingQuantity: sellingQuantity ? String(sellingQuantity) : '25',
    rate: rate ? String(rate) : '910.01',
    qualityGrade,
    totalPurchases,
    lastOrder,
    raw: dto,
  };
}

/**
 * Reads user-saved contacts from localStorage, filtering out any corrupted records
 */
function getLocalSavedContacts() {
  try {
    const raw = localStorage.getItem('farmer_saved_contacts') || localStorage.getItem('farmer_saved_buyers');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed
          .map(normalizeContactDto)
          .filter((c) => c && c.name && !c.name.startsWith('CNT-') && c.mobile && c.mobile.length === 10);
      }
    }
  } catch (e) {
    console.warn('Could not read saved contacts from localStorage:', e);
  }
  return [];
}

/**
 * Persists a selected/updated contact to localStorage safely
 */
export function saveContactToStorage(contact) {
  if (!contact || !contact.name || contact.name.startsWith('CNT-')) return;
  try {
    const existing = getLocalSavedContacts();
    const normalized = normalizeContactDto(contact);
    if (!normalized || !normalized.name || normalized.name.startsWith('CNT-')) return;

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
 * Returns merged offline fallback contacts for category
 */
export function getFallbackContactsList(category = '') {
  const local = getLocalSavedContacts();
  const map = new Map();

  // 1. Defaults
  DEFAULT_FARMER_CONTACTS.forEach((c) => {
    map.set(c.id.toLowerCase(), c);
  });

  // 2. Local saved modifications (only if valid and not an ID)
  local.forEach((c) => {
    if (c && c.name && !c.name.startsWith('CNT-') && c.mobile && c.mobile.length === 10) {
      const key = (c.id || c.name).toLowerCase().trim();
      const existing = map.get(key) || {};
      map.set(key, { ...existing, ...c });
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
 * - prefix: contact name or person name search prefix
 * - limit: max 10
 * - userId: optional authenticated farmer id
 */
export async function fetchFarmerContactsApi({ category = '', search = '', query = '', userId } = {}) {
  const term = String(search || query || '').trim();
  const backendCategory = mapCategoryToBackend(category);

  const params = {};
  if (backendCategory) {
    params.category = backendCategory;
  }
  if (term) {
    params.prefix = term;
    params.search = term;
  }
  params.limit = 10;
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

  // 5. Client-side Prefix & Substring Filtering
  // Matches against: name, businessName, contactPerson, and mobile number!
  if (term) {
    const q = term.toLowerCase();
    contacts = contacts
      .filter((c) => {
        const name = (c.name || '').toLowerCase();
        const business = (c.businessName || '').toLowerCase();
        const person = (c.contactPerson || '').toLowerCase();
        const mobile = c.mobile || '';

        // Prefix match on full string or any word
        const nameMatch = name.startsWith(q) || name.split(/\s+/).some((w) => w.startsWith(q));
        const bizMatch = business.startsWith(q) || business.split(/\s+/).some((w) => w.startsWith(q));
        const personMatch = person.startsWith(q) || person.split(/\s+/).some((w) => w.startsWith(q));

        // Substring / partial match
        const partial = name.includes(q) || business.includes(q) || person.includes(q) || mobile.startsWith(q);

        // Broad match if 2 characters (e.g. 'Ho' matches Hari Traders / Honey Traders)
        const broad = q.length === 2 && (name.startsWith(q[0]) || person.startsWith(q[0]) || business.startsWith(q[0]));

        return nameMatch || bizMatch || personMatch || partial || broad;
      })
      .sort((a, b) => {
        const aName = (a.name || '').toLowerCase();
        const bName = (b.name || '').toLowerCase();
        const aPerson = (a.contactPerson || '').toLowerCase();
        const bPerson = (b.contactPerson || '').toLowerCase();
        const aBiz = (a.businessName || '').toLowerCase();
        const bBiz = (b.businessName || '').toLowerCase();

        // 1. Exact prefix match first (on name, businessName, or contactPerson)
        const aExact = aName.startsWith(q) || aBiz.startsWith(q) || aPerson.startsWith(q);
        const bExact = bName.startsWith(q) || bBiz.startsWith(q) || bPerson.startsWith(q);
        if (aExact && !bExact) return -1;
        if (!aExact && bExact) return 1;

        // 2. Word prefix match second
        const aWord = aName.split(/\s+/).some((w) => w.startsWith(q)) || aPerson.split(/\s+/).some((w) => w.startsWith(q));
        const bWord = bName.split(/\s+/).some((w) => w.startsWith(q)) || bPerson.split(/\s+/).some((w) => w.startsWith(q));
        if (aWord && !bWord) return -1;
        if (!aWord && bWord) return 1;

        return aName.localeCompare(bName);
      });
  }

  // 6. Enforce maximum of 10 suggestions
  return contacts.slice(0, 10);
}

/**
 * GET Farmer Contact by ID
 * Supported Endpoints:
 * - Primary: GET /api/v1/farmer/contacts/{id}?category=...
 * - Fallback: GET /api/contacts/{id}?category=...
 */
export async function fetchFarmerContactByIdApi(id, userId, category = '') {
  if (!id) return null;
  const backendCategory = mapCategoryToBackend(category);
  const params = {};
  if (userId) params.userId = userId;
  if (backendCategory) {
    params.category = backendCategory;
  }

  const idStr = String(id).trim();
  const isNumericId = /^[0-9]+$/.test(idStr);

  // 1. Try Primary endpoint: /api/v1/farmer/contacts/{id} ONLY if numeric ID
  if (isNumericId) {
    try {
      const primaryUrl = Endpoints?.FARMER_CONTACTS?.BY_ID
        ? Endpoints.FARMER_CONTACTS.BY_ID(idStr)
        : `/api/v1/farmer/contacts/${idStr}`;
      const res = await api.get(primaryUrl, { params });
      const body = res?.data;
      const data = body?.data || body;
      const normalized = normalizeContactDto(data);
      if (normalized && normalized.name && !normalized.name.startsWith('CNT-') && !/^\d+$/.test(normalized.name)) {
        return normalized;
      }
    } catch (err1) {
      // 2. If 404, try Fallback: /api/contacts/{id}
      if (err1?.response?.status === 404) {
        try {
          const altUrl = Endpoints?.FARMER_CONTACTS?.BY_ID_ALT
            ? Endpoints.FARMER_CONTACTS.BY_ID_ALT(idStr)
            : `/api/contacts/${idStr}`;
          const res2 = await api.get(altUrl, { params });
          const body2 = res2?.data;
          const data2 = body2?.data || body2;
          const normalized2 = normalizeContactDto(data2);
          if (normalized2 && normalized2.name && !normalized2.name.startsWith('CNT-') && !/^\d+$/.test(normalized2.name)) {
            return normalized2;
          }
        } catch {
          // Fall back to offline dataset
        }
      }
    }
  }

  // 3. Fallback to local directory matching id, name, businessName, contactPerson, or mobile
  const allFallback = getFallbackContactsList(category);
  const idLower = idStr.toLowerCase();

  const found = allFallback.find((c) => {
    return (
      String(c.id).toLowerCase() === idLower ||
      (c.name && c.name.toLowerCase() === idLower) ||
      (c.businessName && c.businessName.toLowerCase() === idLower) ||
      (c.contactPerson && c.contactPerson.toLowerCase() === idLower) ||
      (c.mobile && c.mobile === idStr.replace(/\D/g, ''))
    );
  });

  if (found) {
    return found;
  }

  // Also check without category constraint
  const globalFallback = getFallbackContactsList();
  const globalFound = globalFallback.find((c) => {
    return (
      String(c.id).toLowerCase() === idLower ||
      (c.name && c.name.toLowerCase() === idLower) ||
      (c.businessName && c.businessName.toLowerCase() === idLower) ||
      (c.contactPerson && c.contactPerson.toLowerCase() === idLower) ||
      (c.mobile && c.mobile === idStr.replace(/\D/g, ''))
    );
  });

  return globalFound || null;
}

