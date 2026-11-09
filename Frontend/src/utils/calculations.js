import { UNIT_DIMENSIONS } from './constants';

/**
 * Enterprise Agricultural ERP Business Calculations
 * Strictly follows all formulas specified in the Master Development Prompt.
 */

export function safeNumber(val, fallback = 0) {
  const num = Number(val);
  return Number.isFinite(num) ? num : fallback;
}

export function round2(val) {
  const num = safeNumber(val, 0);
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

/**
 * Unit conversion helper
 * Converts a quantity from `fromUnit` to `toUnit` if both share the mass dimension.
 * Returns null if units are incompatible (e.g., Quintal to Litre).
 */
export function convertQuantityUnit(quantity, fromUnit, toUnit) {
  const qty = safeNumber(quantity, 0);
  if (!fromUnit || !toUnit || fromUnit === toUnit) return qty;

  const fromDim = UNIT_DIMENSIONS[fromUnit];
  const toDim = UNIT_DIMENSIONS[toUnit];

  if (!fromDim || !toDim || fromDim.dimension !== toDim.dimension) {
    return null;
  }

  if (fromDim.dimension === 'mass') {
    const inKg = qty * fromDim.toBaseKg;
    return round2(inKg / toDim.toBaseKg);
  }

  return qty;
}

export function areUnitsCompatible(unitA, unitB) {
  if (!unitA || !unitB) return false;
  if (unitA === unitB) return true;
  const dimA = UNIT_DIMENSIONS[unitA];
  const dimB = UNIT_DIMENSIONS[unitB];
  return Boolean(dimA && dimB && dimA.dimension === dimB.dimension);
}

/**
 * Purchase Calculations (Screens 5 & 6)
 * Subtotal = Purchased Quantity * Price per Unit
 * Total Purchase Amount = Sum of Item Subtotals + Applicable Charges
 */
export function calculatePurchaseTotals(items = [], charges = {}) {
  const lineItems = items.map((item) => {
    const qty = Math.max(0, safeNumber(item.purchasedQuantity ?? item.quantity, 0));
    const rate = Math.max(0, safeNumber(item.pricePerUnit ?? item.rate, 0));
    const subtotal = round2(qty * rate);
    return {
      ...item,
      purchasedQuantity: qty,
      pricePerUnit: rate,
      subtotal,
    };
  });

  const itemsSubtotal = round2(lineItems.reduce((sum, item) => sum + item.subtotal, 0));
  const totalQuantity = round2(lineItems.reduce((sum, item) => sum + item.purchasedQuantity, 0));

  const transportation = Math.max(0, safeNumber(charges.transportationCharges, 0));
  const loading = Math.max(0, safeNumber(charges.loadingCharges, 0));
  const unloading = Math.max(0, safeNumber(charges.unloadingCharges, 0));
  const hamali = Math.max(0, safeNumber(charges.hamali, 0));
  const commission = Math.max(0, safeNumber(charges.commission, 0));
  const other = Math.max(0, safeNumber(charges.otherCharges, 0));

  const totalCharges = round2(transportation + loading + unloading + hamali + commission + other);
  const totalPurchaseAmount = round2(itemsSubtotal + totalCharges);

  return {
    lineItems,
    totalQuantity,
    itemsSubtotal,
    totalCharges,
    totalPurchaseAmount,
    chargeBreakdown: {
      transportationCharges: transportation,
      loadingCharges: loading,
      unloadingCharges: unloading,
      hamali,
      commission,
      otherCharges: other,
    },
  };
}

/**
 * Product Processing Calculations (Screen 9)
 * - Total Input Quantity = Entered Input Quantity
 * - Actual Output Quantity = Entered Output Quantity
 * - Wastage Quantity = Total Input Quantity - Actual Output Quantity (when units compatible)
 * - Wastage Percentage = (Wastage Quantity / Total Input Quantity) * 100
 * - Total Processing Expenses = Sum of all processing expenses
 * - Allocated Raw Material Cost = Input Quantity * Batch Average Cost per Unit
 * - Total Batch Cost = Allocated Raw Material Cost + Total Processing Expenses
 * - Cost per Unit of Finished Product = Total Batch Cost / Actual Output Quantity (safe against 0)
 */
export function calculateProcessingMetrics({
  inputQuantity = 0,
  inputUnit = 'Quintal',
  batchUnitCost = 0,
  outputs = [],
  expenses = {},
  manualWastageQuantity = null,
}) {
  const totalInputQuantity = Math.max(0, safeNumber(inputQuantity, 0));
  const rawMaterialCost = round2(totalInputQuantity * Math.max(0, safeNumber(batchUnitCost, 0)));

  const processingCharges = Math.max(0, safeNumber(expenses.processingCharges, 0));
  const labourCharges = Math.max(0, safeNumber(expenses.labourCharges, 0));
  const electricityCharges = Math.max(0, safeNumber(expenses.electricityCharges, 0));
  const packagingCharges = Math.max(0, safeNumber(expenses.packagingCharges, 0));
  const transportationCharges = Math.max(0, safeNumber(expenses.transportationCharges, 0));
  const otherExpenses = Math.max(0, safeNumber(expenses.otherExpenses, 0));

  const totalProcessingExpenses = round2(
    processingCharges +
      labourCharges +
      electricityCharges +
      packagingCharges +
      transportationCharges +
      otherExpenses
  );

  // Sum outputs in primary output unit and also convert to inputUnit if compatible
  let totalOutputInInputUnit = 0;
  let allUnitsCompatible = outputs.length > 0;
  let rawOutputSum = 0;

  outputs.forEach((out) => {
    const outQty = Math.max(0, safeNumber(out.outputQuantity, 0));
    rawOutputSum = round2(rawOutputSum + outQty);
    const outUnit = out.outputUnit || inputUnit;
    if (areUnitsCompatible(outUnit, inputUnit)) {
      const converted = convertQuantityUnit(outQty, outUnit, inputUnit);
      totalOutputInInputUnit = round2(totalOutputInInputUnit + (converted ?? 0));
    } else {
      allUnitsCompatible = false;
    }
  });

  let wastageQuantity = 0;
  let wastagePercentage = 0;

  if (allUnitsCompatible && totalInputQuantity > 0) {
    wastageQuantity = Math.max(0, round2(totalInputQuantity - totalOutputInInputUnit));
    wastagePercentage = round2((wastageQuantity / totalInputQuantity) * 100);
  } else if (manualWastageQuantity !== null && manualWastageQuantity !== '' && totalInputQuantity > 0) {
    wastageQuantity = Math.max(0, safeNumber(manualWastageQuantity, 0));
    wastagePercentage = round2((wastageQuantity / totalInputQuantity) * 100);
  }

  const totalBatchCost = round2(rawMaterialCost + totalProcessingExpenses);
  const primaryOutputQuantity = rawOutputSum;
  const costPerUnit = primaryOutputQuantity > 0 ? round2(totalBatchCost / primaryOutputQuantity) : 0;

  return {
    totalInputQuantity,
    inputUnit,
    actualOutputQuantity: primaryOutputQuantity,
    totalOutputInInputUnit: allUnitsCompatible ? totalOutputInInputUnit : null,
    allUnitsCompatible,
    wastageQuantity,
    wastagePercentage,
    allocatedRawMaterialCost: rawMaterialCost,
    totalProcessingExpenses,
    totalBatchCost,
    costPerUnit,
    expenseBreakdown: {
      processingCharges,
      labourCharges,
      electricityCharges,
      packagingCharges,
      transportationCharges,
      otherExpenses,
    },
  };
}

/**
 * Finished Product Profit Margin % (Screen 10)
 * Profit Margin % = ((Selling Price - Production Cost) / Selling Price) * 100, where selling price > 0
 */
export function calculateProfitMargin(sellingPrice, productionCost) {
  const sell = safeNumber(sellingPrice, 0);
  const cost = safeNumber(productionCost, 0);
  if (sell <= 0) return 0;
  return round2(((sell - cost) / sell) * 100);
}

/**
 * Sales Entry Calculations (Screen 11)
 * Subtotal = Selling Quantity * Price per Unit
 * Final Amount = Item Subtotals - Discount + Applicable Tax + Delivery Charges + Other Charges
 */
export function calculateSalesTotals(items = [], adjustments = {}) {
  const lineItems = items.map((item) => {
    const qty = Math.max(0, safeNumber(item.sellingQuantity ?? item.quantity, 0));
    const price = Math.max(0, safeNumber(item.pricePerUnit ?? item.unitPrice, 0));
    const subtotal = round2(qty * price);
    return {
      ...item,
      sellingQuantity: qty,
      pricePerUnit: price,
      subtotal,
    };
  });

  const subtotal = round2(lineItems.reduce((sum, i) => sum + i.subtotal, 0));
  const totalQuantity = round2(lineItems.reduce((sum, i) => sum + i.sellingQuantity, 0));

  const discount = Math.max(0, safeNumber(adjustments.discount, 0));
  const tax = Math.max(0, safeNumber(adjustments.tax, 0));
  const deliveryCharges = Math.max(0, safeNumber(adjustments.deliveryCharges, 0));
  const otherCharges = Math.max(0, safeNumber(adjustments.otherCharges, 0));

  const taxableBase = Math.max(0, round2(subtotal - discount));
  const finalAmount = round2(taxableBase + tax + deliveryCharges + otherCharges);

  return {
    lineItems,
    totalQuantity,
    subtotal,
    discount,
    taxableBase,
    tax,
    deliveryCharges,
    otherCharges,
    finalAmount,
  };
}

