/**
 * Core Financial and Inventory Calculation Utilities for Middleman Portal
 * Strictly adheres to enterprise business logic & FIFO cost accounting.
 */

/**
 * Calculate Purchase Subtotal & Total Amount
 * @param {Object} params - { quantity, rate, transportation, loading, otherCharges }
 */
export const calculatePurchaseTotals = ({
  quantity = 0,
  rate = 0,
  transportation = 0,
  loading = 0,
  otherCharges = 0,
}) => {
  const qty = Math.max(0, Number(quantity) || 0);
  const price = Math.max(0, Number(rate) || 0);
  const trans = Math.max(0, Number(transportation) || 0);
  const load = Math.max(0, Number(loading) || 0);
  const other = Math.max(0, Number(otherCharges) || 0);

  const subtotal = Math.round(qty * price * 100) / 100;
  const additionalCharges = Math.round((trans + load + other) * 100) / 100;
  const totalAmount = Math.round((subtotal + additionalCharges) * 100) / 100;

  // Average landed cost per unit including all direct purchase charges
  const averageCostPerUnit = qty > 0 ? Math.round((totalAmount / qty) * 100) / 100 : price;

  return {
    subtotal,
    transportation: trans,
    loading: load,
    otherCharges: other,
    additionalCharges,
    totalAmount,
    averageCostPerUnit,
  };
};

/**
 * Calculate Vendor Sale Subtotal & Total Amount
 * @param {Object} params - { quantity, rate, transportation, otherCharges }
 */
export const calculateVendorSaleTotals = ({
  quantity = 0,
  rate = 0,
  transportation = 0,
  otherCharges = 0,
}) => {
  const qty = Math.max(0, Number(quantity) || 0);
  const price = Math.max(0, Number(rate) || 0);
  const trans = Math.max(0, Number(transportation) || 0);
  const other = Math.max(0, Number(otherCharges) || 0);

  const subtotal = Math.round(qty * price * 100) / 100;
  const additionalCharges = Math.round((trans + other) * 100) / 100;
  const totalAmount = Math.round((subtotal + additionalCharges) * 100) / 100;

  return {
    subtotal,
    transportation: trans,
    otherCharges: other,
    additionalCharges,
    totalAmount,
  };
};

/**
 * Calculate Customer Sale Subtotal & Final Amount
 * @param {Object} params - { quantity, price, deliveryCharges }
 */
export const calculateCustomerSaleTotals = ({
  quantity = 0,
  price = 0,
  deliveryCharges = 0,
}) => {
  const qty = Math.max(0, Number(quantity) || 0);
  const rate = Math.max(0, Number(price) || 0);
  const delivery = Math.max(0, Number(deliveryCharges) || 0);

  const subtotal = Math.round(qty * rate * 100) / 100;
  const finalAmount = Math.round((subtotal + delivery) * 100) / 100;

  return {
    subtotal,
    deliveryCharges: delivery,
    finalAmount,
  };
};

/**
 * FIFO Inventory Allocation and Cost of Goods Sold (COGS) Calculator
 * Consumes available batches in chronological order (FIFO)
 * @param {Array} batches - List of available inventory batches for a specific crop
 * @param {number} requestedQuantity
 * @returns {Object} { allocatedBatches, cogs, totalAllocated, remainingUnfilled }
 */
export const allocateInventoryFIFO = (batches = [], requestedQuantity = 0) => {
  let remainingToFulfill = Math.max(0, Number(requestedQuantity) || 0);
  let totalCogs = 0;
  let totalAllocated = 0;
  const allocatedBatches = [];

  // Sort batches by purchase date ascending (FIFO)
  const sortedBatches = [...batches]
    .filter((b) => (b.availableQuantity || 0) > 0)
    .sort((a, b) => new Date(a.purchaseDate) - new Date(b.purchaseDate));

  for (const batch of sortedBatches) {
    if (remainingToFulfill <= 0) break;

    const available = batch.availableQuantity || 0;
    const take = Math.min(available, remainingToFulfill);
    const avgCost = Number(batch.averageCost) || Number(batch.purchaseRate) || 0;
    const batchCogs = Math.round(take * avgCost * 100) / 100;

    allocatedBatches.push({
      stockId: batch.stockId,
      cropName: batch.cropName,
      variety: batch.variety,
      allocatedQuantity: take,
      averageCost: avgCost,
      cogs: batchCogs,
    });

    totalCogs += batchCogs;
    totalAllocated += take;
    remainingToFulfill -= take;
  }

  return {
    allocatedBatches,
    cogs: Math.round(totalCogs * 100) / 100,
    totalAllocated,
    remainingUnfilled: Math.max(0, remainingToFulfill),
  };
};

/**
 * Calculate Gross Profit based on COGS and other operating expenses
 * Gross Profit = Total Confirmed Sales - Cost of Goods Sold - Other Expenses
 */
export const calculateGrossProfit = (salesValue = 0, cogs = 0, otherExpenses = 0) => {
  const sales = Number(salesValue) || 0;
  const cost = Number(cogs) || 0;
  const exp = Number(otherExpenses) || 0;
  const grossProfit = Math.round((sales - cost - exp) * 100) / 100;
  const marginPercentage = sales > 0 ? Math.round((grossProfit / sales) * 1000) / 10 : 0;

  return {
    salesValue: sales,
    cogs: cost,
    otherExpenses: exp,
    grossProfit,
    marginPercentage,
  };
};

/**
 * Calculate Receivables, Payables, and Net Outstanding Balance
 */
export const calculateOutstandingPosition = (receivables = 0, payables = 0) => {
  const recv = Math.max(0, Number(receivables) || 0);
  const pay = Math.max(0, Number(payables) || 0);
  const netOutstanding = Math.round((recv - pay) * 100) / 100;

  return {
    expectedReceivables: recv,
    expectedPayables: pay,
    netOutstanding,
  };
};

