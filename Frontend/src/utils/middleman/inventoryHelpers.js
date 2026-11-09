/**
 * Inventory Helpers for Batch Management and Low Stock Thresholds
 */

export const LOW_STOCK_THRESHOLDS = {
  Paddy: 50, // Quintals
  Wheat: 40,
  Maize: 35,
  Groundnut: 25,
  Cotton: 30,
  Chilli: 15,
  default: 30,
};

/**
 * Determine if crop or batch is low stock
 */
export const isLowStock = (cropName, availableQuantity) => {
  const threshold = LOW_STOCK_THRESHOLDS[cropName] || LOW_STOCK_THRESHOLDS.default;
  return Number(availableQuantity) <= threshold;
};

/**
 * Aggregate batches by crop to calculate total available, sold, and purchased
 */
export const aggregateInventoryByCrop = (batches = []) => {
  const map = {};

  batches.forEach((batch) => {
    const crop = batch.cropName;
    if (!map[crop]) {
      map[crop] = {
        cropName: crop,
        unit: batch.unit || 'Quintal',
        totalPurchased: 0,
        totalSold: 0,
        availableQuantity: 0,
        totalValue: 0,
        batchCount: 0,
      };
    }

    map[crop].totalPurchased += Number(batch.purchasedQuantity) || 0;
    map[crop].totalSold += Number(batch.soldQuantity) || 0;
    map[crop].availableQuantity += Number(batch.availableQuantity) || 0;
    map[crop].totalValue += (Number(batch.availableQuantity) || 0) * (Number(batch.averageCost) || 0);
    map[crop].batchCount += 1;
  });

  return Object.values(map);
};

