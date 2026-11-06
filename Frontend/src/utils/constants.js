/**
 * Enterprise Constants for Agri Raw Product Purchase & Billing Management ERP
 */

export const STORAGE_KEYS = {
  VENDOR_PROFILE: 'arppb_vendor_profile_v1',
  FARMERS: 'arppb_farmers_v1',
  MIDDLEMEN: 'arppb_middlemen_v1',
  CUSTOMERS: 'arppb_customers_v1',
  PURCHASES: 'arppb_purchases_v1',
  INVENTORY: 'arppb_inventory_v1',
  STOCK_MOVEMENTS: 'arppb_stock_movements_v1',
  PROCESSING: 'arppb_processing_v1',
  PRODUCTS: 'arppb_products_v1',
  PRODUCT_BATCHES: 'arppb_product_batches_v1',
  SALES: 'arppb_sales_v1',
  ORDERS: 'arppb_orders_v1',
  CONFIRMATIONS: 'arppb_confirmations_v1',
  LEDGER: 'arppb_ledger_v1',
  NOTIFICATIONS: 'arppb_notifications_v1',
  CONVERSION_MAPPINGS: 'arppb_conversion_mappings_v1',
};

export const CROP_OPTIONS = [
  'Paddy',
  'Groundnut',
  'Wheat',
  'Chilli',
  'Maize',
  'Turmeric',
  'Cotton',
  'Other crops',
];

export const CROP_VARIETIES = {
  Paddy: ['BPT 5204 (Sona Masoori)', 'MTU 1010', 'RNR 15048 (Telangana Sona)', 'Swarna (MTU 7029)', 'Basmati 1121'],
  Groundnut: ['K-6 (Kadiri-6)', 'TAG-24', 'TMV-2', 'Kadiri Lepakshi (K-1812)', 'JL-24'],
  Wheat: ['Sharbati', 'Lokwan', 'HD 2967', 'MACS 6222', 'Bansi Durum'],
  Chilli: ['Guntur Sannam (S4)', 'Teja (S17)', 'Byadgi', '334 / Wonder Hot', '273 Wrinkled'],
  Maize: ['Hybrid Yellow (DHM 117)', 'Sweet Corn', 'Popcorn Grade', 'Pusa Vivek QPM9'],
  Turmeric: ['Duggirala Finger', 'Koyyuru Bulb', 'Nizamabad Finger', 'Salem', 'Erode Local'],
  Cotton: ['Bunny Bt (Long Staple)', 'MCU-5', 'Suraj', 'Narasimha'],
  'Other crops': ['Red Gram (Toor)', 'Bengal Gram (Chana)', 'Black Gram (Urad)', 'Coriander', 'Sesame'],
};

export const DEFAULT_CONVERSION_MAPPINGS = [
  {
    id: 'MAP-01',
    rawMaterial: 'Paddy',
    defaultOutputs: [
      { productName: 'Rice', category: 'Food Grains & Cereals', defaultUnit: 'Quintal' },
      { productName: 'Rice Bran (By-product)', category: 'By-Products & Feed', defaultUnit: 'Kg' },
      { productName: 'Broken Rice', category: 'Food Grains & Cereals', defaultUnit: 'Kg' },
    ],
  },
  {
    id: 'MAP-02',
    rawMaterial: 'Groundnut',
    defaultOutputs: [
      { productName: 'Groundnut Oil', category: 'Edible Oils', defaultUnit: 'Litre' },
      { productName: 'Groundnut Oil Cake', category: 'By-Products & Feed', defaultUnit: 'Kg' },
    ],
  },
  {
    id: 'MAP-03',
    rawMaterial: 'Wheat',
    defaultOutputs: [
      { productName: 'Wheat Flour', category: 'Flours & Semolina', defaultUnit: 'Quintal' },
      { productName: 'Wheat Bran', category: 'By-Products & Feed', defaultUnit: 'Kg' },
    ],
  },
  {
    id: 'MAP-04',
    rawMaterial: 'Chilli',
    defaultOutputs: [
      { productName: 'Chilli Powder', category: 'Spices & Condiments', defaultUnit: 'Kg' },
      { productName: 'Chilli Flakes', category: 'Spices & Condiments', defaultUnit: 'Kg' },
    ],
  },
  {
    id: 'MAP-05',
    rawMaterial: 'Maize',
    defaultOutputs: [
      { productName: 'Processed Maize Products', category: 'Cereals & Grits', defaultUnit: 'Quintal' },
      { productName: 'Maize Cattle Feed', category: 'By-Products & Feed', defaultUnit: 'Bag' },
    ],
  },
  {
    id: 'MAP-06',
    rawMaterial: 'Turmeric',
    defaultOutputs: [
      { productName: 'Turmeric Powder', category: 'Spices & Condiments', defaultUnit: 'Kg' },
    ],
  },
  {
    id: 'MAP-07',
    rawMaterial: 'Cotton',
    defaultOutputs: [
      { productName: 'Cotton Lint Bales', category: 'Fibres & Commercial', defaultUnit: 'Quintal' },
      { productName: 'Cotton Seed', category: 'By-Products & Feed', defaultUnit: 'Quintal' },
    ],
  },
];

export const FINISHED_PRODUCT_CATEGORIES = [
  'Food Grains & Cereals',
  'Edible Oils',
  'Flours & Semolina',
  'Spices & Condiments',
  'Cereals & Grits',
  'Fibres & Commercial',
  'By-Products & Feed',
  'Other Products',
];

export const PACKAGING_TYPES = [
  'PP Woven Bag',
  'Jute Gunny Bag',
  'HDPE Jerry Can',
  'Tin Container',
  'Vacuum Pouch',
  'Laminated Retail Pack',
  'Bulk Loose',
];

export const UNITS = ['Kg', 'Quintal', 'Ton', 'Bag', 'Litre', 'Packet'];

/**
 * Base unit conversion model for mass/weight comparisons
 * Base mass unit = Kg
 * Base volume unit = Litre
 */
export const UNIT_DIMENSIONS = {
  Kg: { dimension: 'mass', toBaseKg: 1 },
  Quintal: { dimension: 'mass', toBaseKg: 100 },
  Ton: { dimension: 'mass', toBaseKg: 1000 },
  Bag: { dimension: 'mass', toBaseKg: 50 }, // Standard 50 Kg agricultural bag
  Litre: { dimension: 'volume', toBaseKg: null, toBaseLitre: 1 },
  Packet: { dimension: 'count', toBaseKg: 1 },
};

export const QUALITY_GRADES = [
  'Grade A (Export / Premium)',
  'Grade A (Standard FAQ)',
  'Grade B (Commercial)',
  'Grade C (Processing)',
];

export const AP_DISTRICTS = [
  'Kurnool',
  'Nandyal',
  'Anantapur',
  'Guntur',
  'Prakasam',
  'Kadapa',
  'Palnadu',
  'Bapatla',
  'Krishna',
  'NTR',
  'West Godavari',
  'East Godavari',
  'Nellore',
  'Chittoor',
  'Tirupati',
  'Visakhapatnam',
  'Vizianagaram',
  'Srikakulam',
];

export const INDIAN_STATES = [
  'Andhra Pradesh',
  'Telangana',
  'Karnataka',
  'Tamil Nadu',
  'Maharashtra',
  'Odisha',
  'Chhattisgarh',
];

export const ORDER_STATUSES = [
  'New',
  'Confirmed',
  'Processing',
  'Packed',
  'Shipped',
  'Delivered',
  'Completed',
  'Cancelled',
];

/**
 * Valid Order Status Transitions
 * Rules:
 * - Must follow step-by-step progression or valid skip-free operational workflow
 * - Cancelled orders cannot transition to any other state
 * - Completed orders cannot be cancelled or reverted
 */
export const VALID_ORDER_TRANSITIONS = {
  New: ['Confirmed', 'Cancelled'],
  Confirmed: ['Processing', 'Cancelled'],
  Processing: ['Packed', 'Cancelled'],
  Packed: ['Shipped', 'Cancelled'],
  Shipped: ['Delivered', 'Cancelled'],
  Delivered: ['Completed'],
  Completed: [],
  Cancelled: [],
};

export const OTP_STATUSES = [
  'Not Sent',
  'Sent',
  'Pending',
  'Verified',
  'Expired',
  'Failed',
  'Cancelled',
];

export const LEDGER_CATEGORIES = [
  'Farmer Purchase',
  'Middleman Purchase',
  'Processing Expense',
  'Customer Sale',
  'Supplier Payment',
  'Customer Payment',
  'Transport Charges',
  'Other Adjustments',
];

export const PAYMENT_TERMS = [
  'Immediate / On Delivery',
  'Net 7 Days',
  'Net 15 Days',
  'Net 30 Days',
  'Advance Settlement',
];

export const NOTIFICATION_CATEGORIES = [
  'New Farmer Purchase',
  'New Middleman Purchase',
  'Purchase Confirmed',
  'OTP Verification',
  'Inventory Updated',
  'Processing Completed',
  'Customer Order Received',
  'Customer Order Confirmed',
  'Product Sold',
  'Expected Payment',
  'Payment Due',
  'Payment Delayed',
  'Low Stock',
];

export const DATE_RANGE_PRESETS = [
  { id: 'all', label: 'All Time' },
  { id: 'today', label: 'Today' },
  { id: 'yesterday', label: 'Yesterday' },
  { id: 'last7', label: 'Last 7 Days' },
  { id: 'last30', label: 'Last 30 Days' },
  { id: 'thisMonth', label: 'This Month' },
  { id: 'lastMonth', label: 'Last Month' },
  { id: 'custom', label: 'Custom Date Range' },
];
