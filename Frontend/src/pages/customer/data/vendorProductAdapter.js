import dayjs from 'dayjs';
import { STORAGE_KEYS } from '../../../utils/constants';
import { readStorage } from '../../../services/api';
import { INITIAL_INVENTORY as VENDOR_INITIAL_INVENTORY } from '../../../data/mockInventory';
import { INITIAL_PRODUCTS as VENDOR_INITIAL_PRODUCTS } from '../../../data/mockProducts';
import { INITIAL_PRODUCTS as CUSTOMER_INITIAL_PRODUCTS } from './customerData';
import { createAgriArtwork } from './productArtwork';

/**
 * Image mapping for known vendor product IDs (Raw Materials & Finished Products)
 */
export const VENDOR_IMAGE_MAPPING = {
  // Finished Products
  'PROD-0001': '/assets/product-images/paddy.jpg', // Rice
  'PROD-0002': '/assets/product-images/groundnut.jpg', // Groundnut Oil
  'PROD-0003': '/assets/product-images/wheat.jpg', // Wheat Flour
  'PROD-0004': '/assets/product-images/red-chillies.jpg', // Chilli Powder
  'PROD-0005': '/assets/product-images/yellow-maize.jpg', // Processed Maize Products
  'PROD-0006': '/assets/product-images/turmeric.jpg', // Turmeric Powder
  'PROD-0007': '/assets/product-images/paddy-straw-husk.jpg', // Rice Bran (By-product)
  // Raw Material Inventory Batches
  'STK-0001': '/assets/product-images/paddy.jpg', // Paddy BPT 5204
  'STK-0002': '/assets/product-images/groundnut.jpg', // Groundnut K-6
  'STK-0003': '/assets/product-images/red-chillies.jpg', // Chilli Teja S17
  'STK-0004': '/assets/product-images/yellow-maize.jpg', // Maize Hybrid Yellow
  'STK-0005': '/assets/product-images/turmeric.jpg', // Turmeric Duggirala
  'STK-0006': '/assets/product-images/cotton.jpg', // Cotton Bunny Bt
  'STK-0007': '/assets/product-images/whole-red-gram.jpg', // Red Gram (Toor)
  'STK-0008': '/assets/product-images/wheat.jpg', // Wheat Sharbati
  'STK-0009': '/assets/product-images/paddy.jpg', // Paddy MTU 1010
  'STK-0010': '/assets/product-images/groundnut.jpg', // Groundnut TAG-24
};

/**
 * Resolves a reliable image URL or fallback artwork for any finished product or raw material.
 */
export function resolveVendorProductImage(vp) {
  if (vp?.imageUrl && typeof vp.imageUrl === 'string' && vp.imageUrl.trim() !== '') {
    return vp.imageUrl.trim();
  }
  if (vp?.id && VENDOR_IMAGE_MAPPING[vp.id]) {
    return VENDOR_IMAGE_MAPPING[vp.id];
  }

  const text = `${vp?.productName || vp?.cropName || ''} ${vp?.cropVariety || ''} ${vp?.sourceRawMaterial || ''}`.toLowerCase();
  if (text.includes('paddy') || text.includes('rice')) return '/assets/product-images/paddy.jpg';
  if (text.includes('wheat') || text.includes('atta') || text.includes('flour')) return '/assets/product-images/wheat.jpg';
  if (text.includes('maize') || text.includes('corn') || text.includes('grit')) return '/assets/product-images/yellow-maize.jpg';
  if (text.includes('groundnut') || text.includes('peanut') || text.includes('oil')) return '/assets/product-images/groundnut.jpg';
  if (text.includes('chilli') || text.includes('mirchi')) return '/assets/product-images/red-chillies.jpg';
  if (text.includes('turmeric') || text.includes('haldi')) return '/assets/product-images/turmeric.jpg';
  if (text.includes('cotton') || text.includes('kapas')) return '/assets/product-images/cotton.jpg';
  if (text.includes('sugarcane')) return '/assets/product-images/sugarcane.jpg';
  if (text.includes('soybean')) return '/assets/product-images/soybean.jpg';
  if (text.includes('mustard')) return '/assets/product-images/mustard-seeds.jpg';
  if (text.includes('sunflower')) return '/assets/product-images/sunflower-seeds.jpg';
  if (text.includes('toor') || text.includes('red gram')) return '/assets/product-images/whole-red-gram.jpg';
  if (text.includes('bengal') || text.includes('chana') || text.includes('gram')) return '/assets/product-images/bengal-gram.jpg';
  if (text.includes('moong')) return '/assets/product-images/green-moong.jpg';
  if (text.includes('coriander') || text.includes('dhania')) return '/assets/product-images/coriander-seeds.jpg';
  if (text.includes('coconut') || text.includes('copra')) return '/assets/product-images/coconut-copra.jpg';
  if (text.includes('bran') || text.includes('husk') || text.includes('straw') || text.includes('feed')) {
    return '/assets/product-images/paddy-straw-husk.jpg';
  }

  return createAgriArtwork({
    palette: 'foodGrains',
    motif: 'grains',
    label: vp?.productName || vp?.cropName || 'Agri Product',
    tag: vp?.cropName ? 'RAW LOT' : 'PROCESSED',
  });
}

/**
 * Maps Vendor finished and raw categories to Customer marketplace categories.
 */
export function mapVendorCategoryToCustomerCategory(category = '', productName = '', sourceRawMaterial = '') {
  const cat = String(category).trim().toLowerCase();
  const raw = String(sourceRawMaterial).trim().toLowerCase();
  const name = String(productName).trim().toLowerCase();

  // If already matches a Customer category verbatim
  if (
    category === 'Food Grains' ||
    category === 'Pulses' ||
    category === 'Oil Seeds' ||
    category === 'Commercial Crops' ||
    category === 'Spices – Raw' ||
    category === 'Other Raw Agricultural Materials'
  ) {
    return category;
  }

  // Exact vendor category mappings
  if (
    cat.includes('food grains') ||
    cat.includes('cereal') ||
    cat.includes('flour') ||
    cat.includes('semolina') ||
    cat.includes('grit')
  ) {
    return 'Food Grains';
  }
  if (cat.includes('oil')) {
    return 'Oil Seeds';
  }
  if (cat.includes('spice') || cat.includes('condiment')) {
    return 'Spices – Raw';
  }
  if (cat.includes('fibre') || cat.includes('commercial')) {
    return 'Commercial Crops';
  }
  if (cat.includes('by-product') || cat.includes('feed')) {
    return 'Other Raw Agricultural Materials';
  }
  if (cat.includes('pulse') || cat.includes('dal') || cat.includes('gram')) {
    return 'Pulses';
  }

  // Keyword inferences from source raw material, variety, or product name
  if (
    raw.includes('paddy') ||
    raw.includes('wheat') ||
    raw.includes('maize') ||
    cat.includes('paddy') ||
    cat.includes('wheat') ||
    cat.includes('maize') ||
    name.includes('rice') ||
    name.includes('wheat') ||
    name.includes('maize') ||
    name.includes('paddy')
  ) {
    return 'Food Grains';
  }
  if (
    raw.includes('groundnut') ||
    cat.includes('groundnut') ||
    name.includes('groundnut') ||
    name.includes('oil') ||
    raw.includes('soybean') ||
    raw.includes('mustard') ||
    raw.includes('sunflower')
  ) {
    return 'Oil Seeds';
  }
  if (
    raw.includes('chilli') ||
    raw.includes('turmeric') ||
    cat.includes('chilli') ||
    cat.includes('turmeric') ||
    name.includes('chilli') ||
    name.includes('turmeric') ||
    name.includes('spice')
  ) {
    return 'Spices – Raw';
  }
  if (raw.includes('cotton') || cat.includes('cotton') || name.includes('cotton')) {
    return 'Commercial Crops';
  }
  if (
    raw.includes('toor') ||
    raw.includes('chana') ||
    raw.includes('moong') ||
    name.includes('gram') ||
    name.includes('dal') ||
    name.includes('toor')
  ) {
    return 'Pulses';
  }

  return 'Other Raw Agricultural Materials';
}

/**
 * Maps a Vendor Finished Product object to Customer product schema.
 */
export function mapVendorProductToCustomerProduct(vp) {
  const category = mapVendorCategoryToCustomerCategory(
    vp.category,
    vp.productName,
    vp.sourceRawMaterial
  );
  const image = resolveVendorProductImage(vp);
  const sellingPrice = Number(vp.sellingPrice) || 0;
  const originalPrice =
    Number(vp.originalPrice) || Math.round(sellingPrice * 1.1) || sellingPrice;
  const availableQuantity = Math.max(0, Number(vp.availableQuantity) || 0);

  // Determine origin location based on vendor facility / brand
  let location = 'Kurnool';
  if (vp.location) {
    location = vp.location;
  } else if (vp.brandName && vp.brandName.includes('Guntur')) {
    location = 'Guntur';
  } else if (vp.brandName && vp.brandName.includes('Nandyal')) {
    location = 'Nandyal';
  }

  // Display name formatting (e.g. "Rice (Rayalaseema Gold)")
  const displayName =
    vp.brandName && !vp.productName.includes(vp.brandName)
      ? `${vp.productName} (${vp.brandName})`
      : vp.productName;

  return {
    id: vp.id,
    name: displayName,
    rawProductName: vp.productName,
    brandName: vp.brandName || '',
    category,
    vendorCategory: vp.category,
    sourceRawMaterial: vp.sourceRawMaterial || '',
    productType: 'Finished Product',
    sourceType: 'Vendor Finished Product',
    isRawMaterial: false,
    isFinishedProduct: true,
    isVendorProduct: true,
    sellerId: vp.sellerId || 'SEL-VND-01',
    sellerName: vp.brandName
      ? `Sri Rayalaseema Agro Processors (${vp.brandName})`
      : 'Sri Rayalaseema Agro Processors',
    sellerCategory: 'Vendor',
    location,
    state: vp.state || 'Andhra Pradesh',
    price: sellingPrice,
    originalPrice,
    unit: vp.unit || 'Quintal',
    availableQuantity,
    minOrderQty: Number(vp.minOrderQty) || 1,
    qualityGrade: vp.qualityGrade || 'Grade A (Commercial)',
    isPopular: vp.isPopular ?? true,
    isRecentlyAdded: vp.isRecentlyAdded ?? false,
    isBestPrice:
      vp.isBestPrice ??
      (vp.profitMargin ? Number(vp.profitMargin) < 22 : false),
    addedDate: vp.manufacturingDate || vp.addedDate || '2026-10-10',
    batchCode: vp.batchNumber || vp.batchCode || vp.id,
    description:
      vp.description ||
      `${vp.productName} processed and packaged by ${vp.brandName || 'Vendor'}.`,
    packagingType: vp.packagingType || '',
    packageSize: vp.packageSize || '',
    status: vp.status || 'Active',
    expiryDate: vp.expiryDate || '',
    image,
  };
}

/**
 * Maps a Vendor Raw Material Inventory item to Customer product schema.
 */
export function mapRawMaterialToCustomerProduct(stock) {
  const category = mapVendorCategoryToCustomerCategory(
    stock.cropName,
    stock.cropVariety,
    stock.cropName
  );
  const image = resolveVendorProductImage(stock);
  const price = Math.round(Number(stock.averageCost) || 0);
  const originalPrice =
    Math.round((Number(stock.averageCost) || 0) * 1.05) || price;
  const availableQuantity = Math.max(0, Number(stock.availableQuantity) || 0);

  // Formatted display name (e.g. "Paddy - BPT 5204 (Sona Masoori)")
  let displayName = stock.cropName;
  if (stock.cropName === 'Other crops') {
    displayName = stock.cropVariety || 'Raw Agricultural Lot';
  } else if (stock.cropVariety && stock.cropVariety !== stock.cropName) {
    displayName = `${stock.cropName} - ${stock.cropVariety}`;
  }

  // Location resolution
  let location = 'Kurnool';
  if (stock.storageLocation?.includes('Guntur')) {
    location = 'Guntur';
  } else if (stock.storageLocation?.includes('Nandyal') || stock.supplierName?.includes('Nandyal')) {
    location = 'Nandyal';
  } else if (stock.storageLocation?.includes('Kurnool')) {
    location = 'Kurnool';
  }

  // Stock status
  const effectiveStatus =
    availableQuantity <= 0
      ? 'Exhausted'
      : availableQuantity <= Number(stock.minimumThreshold || 15)
      ? 'Low Stock'
      : 'In Stock';

  return {
    id: stock.id,
    name: displayName,
    rawProductName: stock.cropName,
    cropVariety: stock.cropVariety || '',
    category,
    vendorCategory: stock.cropName,
    productType: 'Raw Material',
    sourceType: 'Vendor Raw Material',
    isRawMaterial: true,
    isFinishedProduct: false,
    isVendorProduct: true,
    sellerId: stock.supplierId || 'SEL-VND-01',
    sellerName: 'Sri Rayalaseema Agro Processors',
    sellerCategory: 'Vendor',
    sourceSupplierName: stock.supplierName || '',
    sourceSupplierCategory: stock.supplierCategory || '',
    location,
    state: 'Andhra Pradesh',
    storageLocation: stock.storageLocation || '',
    price,
    originalPrice,
    unit: stock.unit || 'Quintal',
    availableQuantity,
    minOrderQty: 1,
    qualityGrade: stock.qualityGrade || 'Grade A (Standard FAQ)',
    isPopular: availableQuantity > 40,
    isRecentlyAdded: stock.purchaseDate ? stock.purchaseDate >= '2026-10-25' : false,
    isBestPrice: price < 5000,
    addedDate: stock.purchaseDate || '2026-10-10',
    batchCode: stock.batchNumber || stock.id,
    description: `Traceable raw material batch ${stock.batchNumber} (${stock.cropVariety}, ${stock.qualityGrade}) sourced from ${stock.supplierCategory} ${stock.supplierName}. Stored at ${stock.storageLocation}.`,
    status: effectiveStatus,
    image,
  };
}

/**
 * Filters only Active and non-expired vendor finished products eligible for sale.
 */
export function getEligibleVendorProducts(vendorProductsList) {
  if (!Array.isArray(vendorProductsList)) return [];
  return vendorProductsList.filter((p) => {
    // Only Active products
    if (p.status !== 'Active') return false;
    // Check expiry against reference system date if expiry date is present
    if (p.expiryDate && dayjs(p.expiryDate).isBefore(dayjs('2026-11-05'), 'day')) {
      return false;
    }
    return true;
  });
}

/**
 * Filters active raw material inventory batches.
 */
export function getEligibleRawMaterials(rawInventoryList) {
  if (!Array.isArray(rawInventoryList)) return [];
  return rawInventoryList.filter((item) => {
    // Exclude deleted or archived records if any
    if (item.status === 'Deleted' || item.status === 'Archived') return false;
    return true;
  });
}

/**
 * Combines Customer base products with mapped Vendor Finished Products and Raw Material Inventory.
 * Guarantees uniqueness by ID.
 */
export function getCombinedCustomerProducts(vendorProductsRaw, vendorInventoryRaw) {
  const rawFinishedList =
    vendorProductsRaw || readStorage(STORAGE_KEYS.PRODUCTS, VENDOR_INITIAL_PRODUCTS);
  const eligibleVendorProducts = getEligibleVendorProducts(rawFinishedList);
  const mappedVendorProducts = eligibleVendorProducts.map(mapVendorProductToCustomerProduct);

  const rawInventoryList =
    vendorInventoryRaw || readStorage(STORAGE_KEYS.INVENTORY, VENDOR_INITIAL_INVENTORY);
  const eligibleRawMaterials = getEligibleRawMaterials(rawInventoryList);
  const mappedRawMaterials = eligibleRawMaterials.map(mapRawMaterialToCustomerProduct);

  const seenIds = new Set();
  const combined = [];

  // 1. Add Customer base products
  for (const prod of CUSTOMER_INITIAL_PRODUCTS) {
    if (!seenIds.has(prod.id)) {
      seenIds.add(prod.id);
      combined.push({
        ...prod,
        productType: 'Raw Agricultural Commodity',
        sourceType: 'Customer Base',
        isRawMaterial: true,
        isFinishedProduct: false,
      });
    }
  }

  // 2. Add mapped Vendor Finished Products
  for (const prod of mappedVendorProducts) {
    if (!seenIds.has(prod.id)) {
      seenIds.add(prod.id);
      combined.push(prod);
    }
  }

  // 3. Add mapped Vendor Raw Material Inventory
  for (const prod of mappedRawMaterials) {
    if (!seenIds.has(prod.id)) {
      seenIds.add(prod.id);
      combined.push(prod);
    }
  }

  return combined;
}
