-- ============================================================================
-- ARPPB: Middleman Inventory Stored Procedures & Seed Data (MariaDB 11+)
-- Run against database: u819242402_arppb
-- ============================================================================
USE `u819242402_arppb`;

-- ----------------------------------------------------------------------------
-- 1. ADD MISSING COLUMNS IF NEEDED
-- ----------------------------------------------------------------------------
DELIMITER $$
CREATE PROCEDURE `sp_AddInventoryColumnsIfNotExist`()
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.COLUMNS 
        WHERE TABLE_SCHEMA = 'u819242402_arppb' 
          AND TABLE_NAME = 'middleman_inventory' 
          AND COLUMN_NAME = 'purchase_rate'
    ) THEN
        ALTER TABLE `middleman_inventory` ADD COLUMN `purchase_rate` DECIMAL(12,2) NOT NULL DEFAULT 0.00 AFTER `unit`;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.COLUMNS 
        WHERE TABLE_SCHEMA = 'u819242402_arppb' 
          AND TABLE_NAME = 'middleman_inventory' 
          AND COLUMN_NAME = 'allocated_charges'
    ) THEN
        ALTER TABLE `middleman_inventory` ADD COLUMN `allocated_charges` DECIMAL(12,2) NOT NULL DEFAULT 0.00 AFTER `purchase_rate`;
    END IF;
END$$
DELIMITER ;

CALL `sp_AddInventoryColumnsIfNotExist`();
DROP PROCEDURE IF EXISTS `sp_AddInventoryColumnsIfNotExist`;

-- ----------------------------------------------------------------------------
-- 2. SEED / UPSERT 6 ACTIVE INVENTORY BATCHES FOR MIDDLEMAN 57 (MATCHING UI EXACTLY)
-- Total Purchased: 770 Qtl | Total Sold: 520 Qtl | Available: 250 Qtl | Low Stock: 2
-- ----------------------------------------------------------------------------

-- Remove any old test batches for middleman 57 or 4 that conflict with STK-0001..STK-0006
DELETE FROM `middleman_inventory` WHERE `stock_code` IN ('STK-0001', 'STK-0002', 'STK-0003', 'STK-0004', 'STK-0005', 'STK-0006', 'STK-0057-0001', 'STK-0057-0002', 'STK-0057-0003');

INSERT INTO `middleman_inventory` (
    `middleman_id`, `stock_code`, `crop_name`, `crop_variety`, `supplier_id`, `supplier_name`, `supplier_category`,
    `purchase_id`, `batch_number`, `purchase_date`, `purchased_quantity`, `processed_quantity`, `sold_quantity`,
    `available_quantity`, `minimum_threshold`, `unit`, `purchase_rate`, `allocated_charges`, `average_cost`,
    `total_purchase_cost`, `quality_grade`, `storage_location`, `status`, `created_at`, `updated_at`
) VALUES
(
    57, 'STK-0001', 'Chilli', 'Teja (S17)', 'FAR-0001', 'M. Chenna Reddy', 'Farmer',
    'PUR-0001', 'BATCH-CHL-001', '2026-10-12', 120.00, 0.00, 75.00,
    45.00, 20.00, 'Quintal', 19500.00, 14000.00, 19616.67,
    2354000.00, 'Grade A', 'Shed B-2, Guntur AMC Warehouse', 'In Stock', NOW(6), NOW(6)
),
(
    57, 'STK-0002', 'Paddy', 'BPT 5204 (Samba Mahsuri)', 'FAR-0002', 'B. Srinivasulu', 'Farmer',
    'PUR-0002', 'BATCH-PAD-002', '2026-10-18', 250.00, 0.00, 160.00,
    90.00, 30.00, 'Quintal', 2350.00, 11000.00, 2394.00,
    598500.00, 'Grade A', 'Shed A-1, Bapatla Central Godown', 'In Stock', NOW(6), NOW(6)
),
(
    57, 'STK-0003', 'Maize', 'Kaveri 50', 'FAR-0003', 'G. Rama Krishna', 'Farmer',
    'PUR-0003', 'BATCH-MAZ-003', '2026-10-22', 180.00, 0.00, 130.00,
    50.00, 25.00, 'Quintal', 2150.00, 8000.00, 2194.44,
    395000.00, 'Standard', 'Shed C-4, Guntur AMC Warehouse', 'In Stock', NOW(6), NOW(6)
),
(
    57, 'STK-0004', 'Cotton', 'Bunny Bt', 'FAR-0004', 'K. Tirupathi Rao', 'Farmer',
    'PUR-0004', 'BATCH-COT-004', '2026-10-28', 90.00, 0.00, 60.00,
    30.00, 15.00, 'Quintal', 7400.00, 12000.00, 7533.33,
    678000.00, 'Grade A', 'Ginning Yard Platform 3', 'In Stock', NOW(6), NOW(6)
),
(
    57, 'STK-0005', 'Wheat', 'Sharbati', 'FAR-0005', 'V. Satyanarayana', 'Farmer',
    'PUR-0006', 'BATCH-WHT-005', '2026-10-15', 70.00, 0.00, 55.00,
    15.00, 20.00, 'Quintal', 2650.00, 7000.00, 2750.00,
    192500.00, 'Grade A', 'Shed A-3, Kovvur Godown', 'Low Stock', NOW(6), NOW(6)
),
(
    57, 'STK-0006', 'Groundnut', 'Kadiri 6', 'FAR-0003', 'G. Rama Krishna', 'Farmer',
    'PUR-0007', 'BATCH-GNT-006', '2026-10-25', 60.00, 0.00, 40.00,
    20.00, 25.00, 'Quintal', 6800.00, 9000.00, 6950.00,
    417000.00, 'Grade A', 'Shed D-1, Tenali Godown', 'Low Stock', NOW(6), NOW(6)
);

-- ----------------------------------------------------------------------------
-- 3. STORED PROCEDURES
-- ----------------------------------------------------------------------------

-- Procedure 1: sp_MiddlemanGetInventorySummary
DROP PROCEDURE IF EXISTS `sp_MiddlemanGetInventorySummary`;
DELIMITER $$
CREATE PROCEDURE `sp_MiddlemanGetInventorySummary`(
    IN p_middleman_id BIGINT
)
BEGIN
    SELECT 
        p_middleman_id AS MiddlemanId,
        COALESCE(SUM(`purchased_quantity`), 0.00) AS TotalPurchasedStock,
        COALESCE(SUM(`sold_quantity`), 0.00) AS TotalSoldStock,
        COALESCE(SUM(`available_quantity`), 0.00) AS AvailableStock,
        COALESCE(SUM(CASE WHEN LOWER(`status`) = 'low stock' OR `available_quantity` <= `minimum_threshold` THEN 1 ELSE 0 END), 0) AS LowStockBatches,
        COUNT(*) AS TotalBatches
    FROM `middleman_inventory`
    WHERE `middleman_id` = p_middleman_id;
END$$
DELIMITER ;

-- Procedure 2: sp_MiddlemanGetInventoryBatches
DROP PROCEDURE IF EXISTS `sp_MiddlemanGetInventoryBatches`;
DELIMITER $$
CREATE PROCEDURE `sp_MiddlemanGetInventoryBatches`(
    IN p_middleman_id BIGINT,
    IN p_search VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_crop VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_quality VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_status VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_offset INT,
    IN p_limit INT
)
BEGIN
    SELECT 
        `id` AS Id,
        `middleman_id` AS MiddlemanId,
        `stock_code` AS StockCode,
        `crop_name` AS CropName,
        `crop_variety` AS CropVariety,
        `supplier_id` AS SupplierId,
        `supplier_name` AS SupplierName,
        `supplier_category` AS SupplierCategory,
        `purchase_id` AS PurchaseId,
        `batch_number` AS BatchNumber,
        `purchase_date` AS PurchaseDate,
        `purchased_quantity` AS PurchasedQuantity,
        `processed_quantity` AS ProcessedQuantity,
        `sold_quantity` AS SoldQuantity,
        `available_quantity` AS AvailableQuantity,
        `minimum_threshold` AS MinimumThreshold,
        `unit` AS Unit,
        `purchase_rate` AS PurchaseRate,
        `allocated_charges` AS AllocatedCharges,
        `average_cost` AS AverageCost,
        `total_purchase_cost` AS TotalPurchaseCost,
        `quality_grade` AS QualityGrade,
        `storage_location` AS StorageLocation,
        `status` AS Status,
        `created_at` AS CreatedAt,
        `updated_at` AS UpdatedAt
    FROM `middleman_inventory`
    WHERE `middleman_id` = p_middleman_id
      AND (p_crop IS NULL OR p_crop = '' OR UPPER(p_crop) = 'ALL' OR LOWER(`crop_name`) = LOWER(p_crop))
      AND (p_quality IS NULL OR p_quality = '' OR UPPER(p_quality) = 'ALL' OR LOWER(`quality_grade`) = LOWER(p_quality))
      AND (p_status IS NULL OR p_status = '' OR UPPER(p_status) = 'ALL' OR LOWER(`status`) = LOWER(p_status))
      AND (
          p_search IS NULL OR p_search = '' OR
          LOWER(`stock_code`) LIKE CONCAT('%', LOWER(p_search), '%') OR
          LOWER(`crop_name`) LIKE CONCAT('%', LOWER(p_search), '%') OR
          LOWER(COALESCE(`crop_variety`,'')) LIKE CONCAT('%', LOWER(p_search), '%') OR
          LOWER(COALESCE(`supplier_name`,'')) LIKE CONCAT('%', LOWER(p_search), '%') OR
          LOWER(COALESCE(`purchase_id`,'')) LIKE CONCAT('%', LOWER(p_search), '%')
      )
    ORDER BY `id` ASC
    LIMIT p_limit OFFSET p_offset;
END$$
DELIMITER ;

-- Procedure 3: sp_MiddlemanGetInventoryBatchById
DROP PROCEDURE IF EXISTS `sp_MiddlemanGetInventoryBatchById`;
DELIMITER $$
CREATE PROCEDURE `sp_MiddlemanGetInventoryBatchById`(
    IN p_middleman_id BIGINT,
    IN p_batch_id VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
)
BEGIN
    SELECT 
        `id` AS Id,
        `middleman_id` AS MiddlemanId,
        `stock_code` AS StockCode,
        `crop_name` AS CropName,
        `crop_variety` AS CropVariety,
        `supplier_id` AS SupplierId,
        `supplier_name` AS SupplierName,
        `supplier_category` AS SupplierCategory,
        `purchase_id` AS PurchaseId,
        `batch_number` AS BatchNumber,
        `purchase_date` AS PurchaseDate,
        `purchased_quantity` AS PurchasedQuantity,
        `processed_quantity` AS ProcessedQuantity,
        `sold_quantity` AS SoldQuantity,
        `available_quantity` AS AvailableQuantity,
        `minimum_threshold` AS MinimumThreshold,
        `unit` AS Unit,
        `purchase_rate` AS PurchaseRate,
        `allocated_charges` AS AllocatedCharges,
        `average_cost` AS AverageCost,
        `total_purchase_cost` AS TotalPurchaseCost,
        `quality_grade` AS QualityGrade,
        `storage_location` AS StorageLocation,
        `status` AS Status,
        `created_at` AS CreatedAt,
        `updated_at` AS UpdatedAt
    FROM `middleman_inventory`
    WHERE `middleman_id` = p_middleman_id
      AND (`stock_code` = p_batch_id OR CAST(`id` AS CHAR) = p_batch_id)
    LIMIT 1;
END$$
DELIMITER ;

-- Procedure 4: sp_MiddlemanUpdateInventoryBatch
DROP PROCEDURE IF EXISTS `sp_MiddlemanUpdateInventoryBatch`;
DELIMITER $$
CREATE PROCEDURE `sp_MiddlemanUpdateInventoryBatch`(
    IN p_middleman_id BIGINT,
    IN p_id BIGINT,
    IN p_available_quantity DECIMAL(12,2),
    IN p_sold_quantity DECIMAL(12,2),
    IN p_storage_location VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_minimum_threshold DECIMAL(12,2),
    IN p_status VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
)
BEGIN
    UPDATE `middleman_inventory`
    SET 
        `available_quantity` = COALESCE(p_available_quantity, `available_quantity`),
        `sold_quantity` = COALESCE(p_sold_quantity, `sold_quantity`),
        `storage_location` = COALESCE(p_storage_location, `storage_location`),
        `minimum_threshold` = COALESCE(p_minimum_threshold, `minimum_threshold`),
        `status` = COALESCE(p_status, `status`),
        `updated_at` = NOW(6)
    WHERE `id` = p_id AND `middleman_id` = p_middleman_id;

    SELECT 
        `id` AS Id,
        `middleman_id` AS MiddlemanId,
        `stock_code` AS StockCode,
        `crop_name` AS CropName,
        `crop_variety` AS CropVariety,
        `supplier_id` AS SupplierId,
        `supplier_name` AS SupplierName,
        `supplier_category` AS SupplierCategory,
        `purchase_id` AS PurchaseId,
        `batch_number` AS BatchNumber,
        `purchase_date` AS PurchaseDate,
        `purchased_quantity` AS PurchasedQuantity,
        `processed_quantity` AS ProcessedQuantity,
        `sold_quantity` AS SoldQuantity,
        `available_quantity` AS AvailableQuantity,
        `minimum_threshold` AS MinimumThreshold,
        `unit` AS Unit,
        `purchase_rate` AS PurchaseRate,
        `allocated_charges` AS AllocatedCharges,
        `average_cost` AS AverageCost,
        `total_purchase_cost` AS TotalPurchaseCost,
        `quality_grade` AS QualityGrade,
        `storage_location` AS StorageLocation,
        `status` AS Status,
        `created_at` AS CreatedAt,
        `updated_at` AS UpdatedAt
    FROM `middleman_inventory`
    WHERE `id` = p_id AND `middleman_id` = p_middleman_id;
END$$
DELIMITER ;
