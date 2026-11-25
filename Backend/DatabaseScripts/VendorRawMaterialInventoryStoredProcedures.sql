-- ============================================================================
-- Vendor Raw Material Inventory, Product Processing, and Finished Products SPs
-- Author: Backend Team
-- ============================================================================

DROP PROCEDURE IF EXISTS `sp_Vendor_GetRawMaterialOverview`;
DROP PROCEDURE IF EXISTS `sp_Vendor_GetRawMaterialStocks`;
DROP PROCEDURE IF EXISTS `sp_Vendor_GetRawMaterialStockById`;
DROP PROCEDURE IF EXISTS `sp_Vendor_CreateRawMaterialStock`;
DROP PROCEDURE IF EXISTS `sp_Vendor_GetStockMovements`;

DROP PROCEDURE IF EXISTS `sp_Vendor_GetProcessingOverview`;
DROP PROCEDURE IF EXISTS `sp_Vendor_GetProcessingBatches`;
DROP PROCEDURE IF EXISTS `sp_Vendor_GetProcessingBatchById`;
DROP PROCEDURE IF EXISTS `sp_Vendor_CreateProcessingBatch`;
DROP PROCEDURE IF EXISTS `sp_Vendor_AddProcessingOutput`;

DROP PROCEDURE IF EXISTS `sp_Vendor_GetFinishedProductsOverview`;
DROP PROCEDURE IF EXISTS `sp_Vendor_GetFinishedProducts`;
DROP PROCEDURE IF EXISTS `sp_Vendor_GetFinishedProductById`;
DROP PROCEDURE IF EXISTS `sp_Vendor_CreateFinishedProduct`;
DROP PROCEDURE IF EXISTS `sp_Vendor_UpdateFinishedProduct`;
DROP PROCEDURE IF EXISTS `sp_Vendor_AdjustFinishedProductStock`;
DROP PROCEDURE IF EXISTS `sp_Vendor_GetFinishedProductMovements`;
DROP PROCEDURE IF EXISTS `sp_Vendor_ToggleFinishedProductStatus`;

DELIMITER $$

-- ============================================================================
-- 1. RAW MATERIAL INVENTORY
-- ============================================================================

CREATE PROCEDURE `sp_Vendor_GetRawMaterialOverview`(
    IN p_vendor_id BIGINT
)
BEGIN
    -- Result Set 1: KPI summary
    SELECT
        COALESCE(SUM(s.`PurchasedQuantity`), 0) AS TotalStockQuantity,
        'Qtl' AS StockUnit,
        COUNT(s.`Id`) AS TotalTraceableBatches,
        COALESCE(SUM(s.`AvailableQuantity`), 0) AS AvailableQuantity,
        COALESCE(SUM(s.`AvailableQuantity` * s.`AverageCost`), 0) AS ValuationAmount,
        COALESCE(SUM(s.`ProcessedQuantity`), 0) AS ProcessedQuantity,
        COALESCE(SUM(CASE WHEN s.`AvailableQuantity` <= s.`MinThresholdQuantity` OR LOWER(s.`Status`) = 'low stock' THEN 1 ELSE 0 END), 0) AS LowStockItemsCount
    FROM `vendor_raw_material_stocks` s
    WHERE s.`VendorId` = p_vendor_id;

    -- Result Set 2: Low stock alerts
    SELECT
        s.`StockCode` AS StockId,
        s.`CropName`,
        s.`BatchNumber`,
        s.`AvailableQuantity` AS QuantityLeft,
        s.`Unit`
    FROM `vendor_raw_material_stocks` s
    WHERE s.`VendorId` = p_vendor_id
      AND (s.`AvailableQuantity` <= s.`MinThresholdQuantity` OR LOWER(s.`Status`) = 'low stock')
    ORDER BY s.`AvailableQuantity` ASC;
END$$

CREATE PROCEDURE `sp_Vendor_GetRawMaterialStocks`(
    IN p_vendor_id BIGINT,
    IN p_search VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_crop VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_supplier_type VARCHAR(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_grade VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_status VARCHAR(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
)
BEGIN
    SELECT
        s.`Id`,
        s.`StockCode` AS StockId,
        s.`CropName`,
        s.`CropVariety`,
        s.`SupplierName`,
        s.`SupplierCategory`,
        s.`PurchaseId`,
        s.`BatchNumber`,
        s.`PurchaseDate`,
        s.`PurchasedQuantity`,
        s.`ProcessedQuantity`,
        s.`AvailableQuantity`,
        s.`Unit`,
        s.`AverageCost`,
        s.`QualityGrade`,
        s.`Status`
    FROM `vendor_raw_material_stocks` s
    WHERE s.`VendorId` = p_vendor_id
      AND (p_crop IS NULL OR p_crop = '' OR LOWER(p_crop) = 'all' OR LOWER(s.`CropName`) = LOWER(p_crop))
      AND (p_supplier_type IS NULL OR p_supplier_type = '' OR LOWER(p_supplier_type) = 'all' OR LOWER(s.`SupplierCategory`) = LOWER(p_supplier_type))
      AND (p_grade IS NULL OR p_grade = '' OR LOWER(p_grade) = 'all' OR LOWER(s.`QualityGrade`) LIKE CONCAT('%', LOWER(p_grade), '%'))
      AND (p_status IS NULL OR p_status = '' OR LOWER(p_status) = 'all' OR LOWER(s.`Status`) = LOWER(p_status))
      AND (
          p_search IS NULL OR p_search = '' OR
          LOWER(s.`StockCode`) LIKE CONCAT('%', LOWER(p_search), '%') OR
          LOWER(s.`CropName`) LIKE CONCAT('%', LOWER(p_search), '%') OR
          LOWER(s.`CropVariety`) LIKE CONCAT('%', LOWER(p_search), '%') OR
          LOWER(s.`BatchNumber`) LIKE CONCAT('%', LOWER(p_search), '%') OR
          LOWER(s.`SupplierName`) LIKE CONCAT('%', LOWER(p_search), '%') OR
          LOWER(s.`PurchaseId`) LIKE CONCAT('%', LOWER(p_search), '%')
      )
    ORDER BY s.`PurchaseDate` DESC;
END$$

CREATE PROCEDURE `sp_Vendor_GetRawMaterialStockById`(
    IN p_vendor_id BIGINT,
    IN p_stock_id_or_code VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
)
BEGIN
    SELECT
        s.`Id`,
        s.`StockCode` AS StockId,
        s.`CropName`,
        s.`CropVariety`,
        s.`SupplierName`,
        s.`SupplierCategory`,
        s.`PurchaseId`,
        s.`BatchNumber`,
        s.`PurchaseDate`,
        s.`PurchasedQuantity`,
        s.`ProcessedQuantity`,
        s.`AvailableQuantity`,
        s.`Unit`,
        s.`AverageCost`,
        s.`QualityGrade`,
        s.`Status`
    FROM `vendor_raw_material_stocks` s
    WHERE s.`VendorId` = p_vendor_id
      AND (s.`StockCode` = p_stock_id_or_code OR CAST(s.`Id` AS CHAR) = p_stock_id_or_code)
    LIMIT 1;
END$$

CREATE PROCEDURE `sp_Vendor_CreateRawMaterialStock`(
    IN p_vendor_id BIGINT,
    IN p_crop_name VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_crop_variety VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_supplier_name VARCHAR(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_supplier_category VARCHAR(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_purchase_id VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_batch_number VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_purchase_date DATETIME(6),
    IN p_purchased_quantity DECIMAL(12,2),
    IN p_unit VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_average_cost DECIMAL(14,2),
    IN p_quality_grade VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_min_threshold DECIMAL(12,2)
)
BEGIN
    DECLARE v_new_stock_id BIGINT;
    DECLARE v_stock_count INT DEFAULT 0;
    DECLARE v_mov_count INT DEFAULT 0;
    DECLARE v_stock_code VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    DECLARE v_batch_num VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    DECLARE v_mov_code VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    DECLARE v_crop_clean VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

    SET v_crop_clean = TRIM(p_crop_name);

    IF p_purchase_date IS NULL THEN
        SET p_purchase_date = UTC_TIMESTAMP(6);
    END IF;

    IF p_unit IS NULL OR TRIM(p_unit) = '' THEN
        SET p_unit = 'Quintal';
    END IF;

    IF p_supplier_category IS NULL OR TRIM(p_supplier_category) = '' THEN
        SET p_supplier_category = 'Farmer';
    END IF;

    IF p_quality_grade IS NULL OR TRIM(p_quality_grade) = '' THEN
        SET p_quality_grade = 'Grade A (Standard FAQ)';
    END IF;

    IF p_min_threshold IS NULL OR p_min_threshold <= 0 THEN
        SET p_min_threshold = 15.00;
    END IF;

    SELECT COUNT(*) INTO v_stock_count FROM `vendor_raw_material_stocks`;
    SET v_stock_code = CONCAT('STK-', LPAD(v_stock_count + 1, 4, '0'));

    IF p_batch_number IS NULL OR TRIM(p_batch_number) = '' THEN
        SET v_batch_num = CONCAT('BCH-', UPPER(LEFT(REPLACE(v_crop_clean, ' ', ''), 3)), '-', LPAD(v_stock_count + 1, 3, '0'));
    ELSE
        SET v_batch_num = TRIM(p_batch_number);
    END IF;

    IF p_purchase_id IS NULL OR TRIM(p_purchase_id) = '' THEN
        SET p_purchase_id = CONCAT('PUR-', DATE_FORMAT(UTC_TIMESTAMP, '%Y%m%d'), '-', LPAD(v_stock_count + 1, 3, '0'));
    END IF;

    INSERT INTO `vendor_raw_material_stocks` (
        `VendorId`, `StockCode`, `CropName`, `CropVariety`, `SupplierName`,
        `SupplierCategory`, `PurchaseId`, `BatchNumber`, `PurchaseDate`,
        `PurchasedQuantity`, `ProcessedQuantity`, `AvailableQuantity`, `Unit`,
        `AverageCost`, `QualityGrade`, `Status`, `MinThresholdQuantity`,
        `CreatedAt`, `UpdatedAt`
    ) VALUES (
        p_vendor_id, v_stock_code, v_crop_clean, COALESCE(NULLIF(TRIM(p_crop_variety), ''), 'Standard'), COALESCE(NULLIF(TRIM(p_supplier_name), ''), 'Direct Procurement'),
        p_supplier_category, p_purchase_id, v_batch_num, p_purchase_date,
        p_purchased_quantity, 0.00, p_purchased_quantity, p_unit,
        p_average_cost, p_quality_grade, 'In Stock', p_min_threshold,
        UTC_TIMESTAMP(6), UTC_TIMESTAMP(6)
    );

    SET v_new_stock_id = LAST_INSERT_ID();

    SELECT COUNT(*) INTO v_mov_count FROM `vendor_stock_movements`;
    SET v_mov_code = CONCAT('MOV-', LPAD(v_mov_count + 1, 4, '0'));

    INSERT INTO `vendor_stock_movements` (
        `StockId`, `MovementCode`, `MovementDate`, `BatchNumber`, `CropName`,
        `MovementType`, `ReferenceId`, `QuantityChange`, `Unit`, `BalanceAfter`,
        `Remarks`, `CreatedAt`
    ) VALUES (
        v_new_stock_id, v_mov_code, UTC_TIMESTAMP(6), v_batch_num, v_crop_clean,
        'Purchase Inward', p_purchase_id, p_purchased_quantity, p_unit, p_purchased_quantity,
        CONCAT('Stock inward for ', v_crop_clean, ' (', p_supplier_category, ' purchase from ', COALESCE(NULLIF(TRIM(p_supplier_name), ''), 'Direct Procurement'), ')'),
        UTC_TIMESTAMP(6)
    );

    CALL `sp_Vendor_GetRawMaterialStockById`(p_vendor_id, v_stock_code);
END$$

CREATE PROCEDURE `sp_Vendor_GetStockMovements`(
    IN p_vendor_id BIGINT
)
BEGIN
    SELECT
        m.`Id`,
        m.`MovementCode` AS MovementId,
        m.`MovementDate`,
        m.`BatchNumber`,
        m.`CropName`,
        m.`MovementType`,
        m.`ReferenceId`,
        m.`QuantityChange`,
        m.`Unit`,
        m.`BalanceAfter`,
        m.`Remarks`
    FROM `vendor_stock_movements` m
    INNER JOIN `vendor_raw_material_stocks` s ON s.`Id` = m.`StockId`
    WHERE s.`VendorId` = p_vendor_id
    ORDER BY m.`MovementDate` DESC;
END$$

-- ============================================================================
-- 2. PRODUCT PROCESSING MANAGEMENT
-- ============================================================================

CREATE PROCEDURE `sp_Vendor_GetProcessingOverview`(
    IN p_vendor_id BIGINT
)
BEGIN
    SELECT
        COUNT(b.`Id`) AS TotalBatches,
        COALESCE(SUM(CASE WHEN LOWER(b.`Status`) = 'draft' THEN 1 ELSE 0 END), 0) AS DraftProcessingCount,
        COALESCE(SUM(CASE WHEN LOWER(b.`Status`) = 'completed' THEN 1 ELSE 0 END), 0) AS CompletedBatchesCount,
        COALESCE(SUM(b.`InputQuantity`), 0) AS TotalInputQuantity,
        'Qtl' AS InputUnit,
        (SELECT COALESCE(SUM(o.`OutputQuantity`), 0) FROM `vendor_processing_outputs` o INNER JOIN `vendor_processing_batches` pb ON pb.`Id` = o.`ProcessingBatchId` WHERE pb.`VendorId` = p_vendor_id) AS TotalOutputQuantity,
        COALESCE(SUM(b.`WastageQuantity`), 0) AS TotalWastageQuantity,
        'Qtl' AS WastageUnit,
        COALESCE(SUM(b.`ProcessingExpenses`), 0) AS TotalProcessingExpenses
    FROM `vendor_processing_batches` b
    WHERE b.`VendorId` = p_vendor_id;
END$$

CREATE PROCEDURE `sp_Vendor_GetProcessingBatches`(
    IN p_vendor_id BIGINT,
    IN p_search VARCHAR(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_raw_material VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_status VARCHAR(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
)
BEGIN
    -- Result Set 1: Matching Batches
    SELECT
        b.`Id`,
        b.`ProcessingCode` AS ProcessingId,
        b.`BatchNumber`,
        b.`ProcessingDate`,
        b.`RawMaterialName`,
        b.`SourceStockId`,
        b.`InputQuantity`,
        b.`Unit` AS InputUnit,
        b.`WastageQuantity`,
        b.`WastagePercentage`,
        b.`ProcessingExpenses`,
        b.`TotalBatchCost`,
        b.`UnitCost`,
        b.`UnitCostLabel`,
        b.`Status`,
        b.`Notes`
    FROM `vendor_processing_batches` b
    WHERE b.`VendorId` = p_vendor_id
      AND (p_raw_material IS NULL OR p_raw_material = '' OR LOWER(p_raw_material) = 'all' OR LOWER(b.`RawMaterialName`) = LOWER(p_raw_material))
      AND (p_status IS NULL OR p_status = '' OR LOWER(p_status) = 'all' OR LOWER(b.`Status`) = LOWER(p_status))
      AND (
          p_search IS NULL OR p_search = '' OR
          LOWER(b.`ProcessingCode`) LIKE CONCAT('%', LOWER(p_search), '%') OR
          LOWER(b.`BatchNumber`) LIKE CONCAT('%', LOWER(p_search), '%') OR
          LOWER(b.`RawMaterialName`) LIKE CONCAT('%', LOWER(p_search), '%') OR
          EXISTS (
              SELECT 1 FROM `vendor_processing_outputs` o
              WHERE o.`ProcessingBatchId` = b.`Id`
                AND LOWER(o.`OutputProductName`) LIKE CONCAT('%', LOWER(p_search), '%')
          )
      )
    ORDER BY b.`ProcessingDate` DESC;

    -- Result Set 2: Outputs for all vendor batches
    SELECT
        o.`Id`,
        o.`ProcessingBatchId`,
        o.`OutputProductName`,
        o.`OutputQuantity`,
        o.`Unit`,
        o.`OutputType`
    FROM `vendor_processing_outputs` o
    INNER JOIN `vendor_processing_batches` b ON b.`Id` = o.`ProcessingBatchId`
    WHERE b.`VendorId` = p_vendor_id
    ORDER BY o.`Id`;
END$$

CREATE PROCEDURE `sp_Vendor_GetProcessingBatchById`(
    IN p_vendor_id BIGINT,
    IN p_processing_id_or_code VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
)
BEGIN
    DECLARE v_batch_id BIGINT DEFAULT NULL;

    SELECT b.`Id` INTO v_batch_id
    FROM `vendor_processing_batches` b
    WHERE b.`VendorId` = p_vendor_id
      AND (b.`ProcessingCode` = p_processing_id_or_code OR CAST(b.`Id` AS CHAR) = p_processing_id_or_code)
    LIMIT 1;

    -- Result Set 1: Batch
    SELECT
        b.`Id`,
        b.`ProcessingCode` AS ProcessingId,
        b.`BatchNumber`,
        b.`ProcessingDate`,
        b.`RawMaterialName`,
        b.`SourceStockId`,
        b.`InputQuantity`,
        b.`Unit` AS InputUnit,
        b.`WastageQuantity`,
        b.`WastagePercentage`,
        b.`ProcessingExpenses`,
        b.`TotalBatchCost`,
        b.`UnitCost`,
        b.`UnitCostLabel`,
        b.`Status`,
        b.`Notes`
    FROM `vendor_processing_batches` b
    WHERE b.`Id` = v_batch_id;

    -- Result Set 2: Outputs
    SELECT
        o.`Id`,
        o.`ProcessingBatchId`,
        o.`OutputProductName`,
        o.`OutputQuantity`,
        o.`Unit`,
        o.`OutputType`
    FROM `vendor_processing_outputs` o
    WHERE o.`ProcessingBatchId` = v_batch_id
    ORDER BY o.`Id`;
END$$

CREATE PROCEDURE `sp_Vendor_CreateProcessingBatch`(
    IN p_vendor_id BIGINT,
    IN p_raw_material_name VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_source_stock_id VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_input_quantity DECIMAL(12,2),
    IN p_unit VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_total_output_quantity DECIMAL(12,2),
    IN p_processing_expenses DECIMAL(14,2),
    IN p_notes VARCHAR(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
)
BEGIN
    DECLARE v_count INT DEFAULT 0;
    DECLARE v_proc_code VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    DECLARE v_batch_number VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    DECLARE v_stock_id BIGINT DEFAULT NULL;
    DECLARE v_stock_code VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    DECLARE v_stock_batch VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    DECLARE v_stock_crop VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    DECLARE v_avg_cost DECIMAL(14,2) DEFAULT 0;
    DECLARE v_avail_qty DECIMAL(12,2) DEFAULT 0;
    DECLARE v_min_thresh DECIMAL(12,2) DEFAULT 15;
    DECLARE v_raw_cost DECIMAL(14,2) DEFAULT 0;
    DECLARE v_wastage_qty DECIMAL(12,2) DEFAULT 0;
    DECLARE v_wastage_pct DECIMAL(6,2) DEFAULT 0;
    DECLARE v_total_cost DECIMAL(14,2) DEFAULT 0;
    DECLARE v_unit_cost DECIMAL(14,2) DEFAULT 0;
    DECLARE v_new_batch_id BIGINT;
    DECLARE v_mov_count INT DEFAULT 0;

    SELECT COUNT(*) INTO v_count FROM `vendor_processing_batches` WHERE `VendorId` = p_vendor_id;
    SET v_proc_code = CONCAT('PROC-', LPAD(v_count + 1, 4, '0'));
    SET v_batch_number = CONCAT('PRC-', UPPER(LEFT(TRIM(p_raw_material_name), 3)), '-2026-', LPAD(v_count + 1, 3, '0'));

    SELECT `Id`, `StockCode`, `BatchNumber`, `CropName`, `AverageCost`, `AvailableQuantity`, `MinThresholdQuantity`
    INTO v_stock_id, v_stock_code, v_stock_batch, v_stock_crop, v_avg_cost, v_avail_qty, v_min_thresh
    FROM `vendor_raw_material_stocks`
    WHERE `VendorId` = p_vendor_id
      AND (`StockCode` = p_source_stock_id OR `BatchNumber` = p_source_stock_id)
    LIMIT 1;

    IF v_stock_id IS NOT NULL THEN
        SET v_raw_cost = p_input_quantity * v_avg_cost;
        SET v_avail_qty = GREATEST(0, v_avail_qty - p_input_quantity);

        UPDATE `vendor_raw_material_stocks`
        SET `ProcessedQuantity` = `ProcessedQuantity` + p_input_quantity,
            `AvailableQuantity` = v_avail_qty,
            `Status` = CASE
                WHEN v_avail_qty = 0 THEN 'Depleted'
                WHEN v_avail_qty <= v_min_thresh THEN 'Low Stock'
                ELSE `Status`
            END,
            `UpdatedAt` = UTC_TIMESTAMP(6)
        WHERE `Id` = v_stock_id;
    END IF;

    SET v_wastage_qty = GREATEST(0, p_input_quantity - p_total_output_quantity);
    SET v_wastage_pct = CASE WHEN p_input_quantity > 0 THEN ROUND((v_wastage_qty / p_input_quantity) * 100, 2) ELSE 0 END;
    SET v_total_cost = v_raw_cost + p_processing_expenses;
    SET v_unit_cost = CASE WHEN p_total_output_quantity > 0 THEN ROUND(v_total_cost / p_total_output_quantity, 2) ELSE 0 END;

    INSERT INTO `vendor_processing_batches` (
        `VendorId`, `ProcessingCode`, `BatchNumber`, `RawMaterialName`, `SourceStockId`,
        `InputQuantity`, `Unit`, `WastageQuantity`, `WastagePercentage`,
        `ProcessingExpenses`, `TotalBatchCost`, `UnitCost`, `UnitCostLabel`,
        `Status`, `ProcessingDate`, `Notes`, `CreatedAt`, `UpdatedAt`
    ) VALUES (
        p_vendor_id, v_proc_code, v_batch_number, TRIM(p_raw_material_name), TRIM(p_source_stock_id),
        p_input_quantity, p_unit, v_wastage_qty, v_wastage_pct,
        p_processing_expenses, v_total_cost, v_unit_cost, CONCAT('₹/', p_unit),
        'Completed', UTC_TIMESTAMP(6), p_notes, UTC_TIMESTAMP(6), UTC_TIMESTAMP(6)
    );

    SET v_new_batch_id = LAST_INSERT_ID();

    IF v_stock_id IS NOT NULL THEN
        SELECT COUNT(*) INTO v_mov_count FROM `vendor_stock_movements`;
        INSERT INTO `vendor_stock_movements` (
            `StockId`, `MovementCode`, `MovementDate`, `BatchNumber`, `CropName`,
            `MovementType`, `ReferenceId`, `QuantityChange`, `Unit`, `BalanceAfter`,
            `Remarks`, `CreatedAt`
        ) VALUES (
            v_stock_id, CONCAT('MOV-', LPAD(v_mov_count + 1, 4, '0')), UTC_TIMESTAMP(6),
            CONCAT(v_stock_batch, ' / ', v_stock_code), v_stock_crop,
            'Processing Issue', v_proc_code, -p_input_quantity, p_unit, v_avail_qty,
            CONCAT('Issued ', p_input_quantity, ' ', p_unit, ' to Processing Batch ', v_proc_code, ' (', v_batch_number, ')'),
            UTC_TIMESTAMP(6)
        );
    END IF;

    SELECT v_new_batch_id AS BatchId, v_proc_code AS ProcessingCode;
END$$

CREATE PROCEDURE `sp_Vendor_AddProcessingOutput`(
    IN p_processing_batch_id BIGINT,
    IN p_output_product_name VARCHAR(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_output_quantity DECIMAL(12,2),
    IN p_unit VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_output_type VARCHAR(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
)
BEGIN
    INSERT INTO `vendor_processing_outputs` (
        `ProcessingBatchId`, `OutputProductName`, `OutputQuantity`, `Unit`, `OutputType`, `CreatedAt`
    ) VALUES (
        p_processing_batch_id, TRIM(p_output_product_name), p_output_quantity, p_unit, p_output_type, UTC_TIMESTAMP(6)
    );
END$$

-- ============================================================================
-- 3. FINISHED PRODUCTS INVENTORY
-- ============================================================================

CREATE PROCEDURE `sp_Vendor_GetFinishedProductsOverview`(
    IN p_vendor_id BIGINT
)
BEGIN
    SELECT
        COUNT(p.`Id`) AS TotalProductTypes,
        (SELECT COUNT(*) FROM `vendor_processing_batches` b WHERE b.`VendorId` = p_vendor_id) AS ActiveBatchesCount,
        COALESCE(SUM(p.`AvailableQuantity`), 0) AS TotalFinishedStock,
        COALESCE(SUM(p.`SoldQuantity`), 0) AS TotalSoldQuantity,
        COALESCE(SUM(CASE WHEN p.`AvailableQuantity` <= p.`MinThresholdQuantity` THEN 1 ELSE 0 END), 0) AS LowStockProductsCount
    FROM `vendor_finished_products` p
    WHERE p.`VendorId` = p_vendor_id;
END$$

CREATE PROCEDURE `sp_Vendor_GetFinishedProducts`(
    IN p_vendor_id BIGINT,
    IN p_search VARCHAR(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_category VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_source_raw_material VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_status VARCHAR(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
)
BEGIN
    SELECT
        p.`Id`,
        p.`ProductCode` AS ProductId,
        p.`ProductName`,
        p.`Category`,
        p.`SourceRawMaterial`,
        p.`BrandName`,
        p.`Packaging`,
        p.`AvailableQuantity`,
        p.`SoldQuantity`,
        p.`Unit`,
        p.`MfgDate`,
        p.`ExpiryDate`,
        p.`ProductionCost`,
        p.`SellingPrice`,
        p.`ProfitMarginPercentage`,
        p.`Status`,
        CASE WHEN p.`AvailableQuantity` <= p.`MinThresholdQuantity` THEN 1 ELSE 0 END AS IsLowStock,
        p.`ImageUrl`
    FROM `vendor_finished_products` p
    WHERE p.`VendorId` = p_vendor_id
      AND (p_category IS NULL OR p_category = '' OR LOWER(p_category) = 'all' OR LOWER(p.`Category`) = LOWER(p_category))
      AND (p_source_raw_material IS NULL OR p_source_raw_material = '' OR LOWER(p_source_raw_material) = 'all' OR LOWER(p.`SourceRawMaterial`) = LOWER(p_source_raw_material))
      AND (p_status IS NULL OR p_status = '' OR LOWER(p_status) = 'all' OR LOWER(p.`Status`) = LOWER(p_status))
      AND (
          p_search IS NULL OR p_search = '' OR
          LOWER(p.`ProductCode`) LIKE CONCAT('%', LOWER(p_search), '%') OR
          LOWER(p.`ProductName`) LIKE CONCAT('%', LOWER(p_search), '%') OR
          LOWER(p.`BrandName`) LIKE CONCAT('%', LOWER(p_search), '%') OR
          LOWER(p.`Category`) LIKE CONCAT('%', LOWER(p_search), '%')
      )
    ORDER BY p.`ProductCode`;
END$$

CREATE PROCEDURE `sp_Vendor_GetFinishedProductById`(
    IN p_vendor_id BIGINT,
    IN p_product_id_or_code VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
)
BEGIN
    SELECT
        p.`Id`,
        p.`ProductCode` AS ProductId,
        p.`ProductName`,
        p.`Category`,
        p.`SourceRawMaterial`,
        p.`BrandName`,
        p.`Packaging`,
        p.`AvailableQuantity`,
        p.`SoldQuantity`,
        p.`Unit`,
        p.`MfgDate`,
        p.`ExpiryDate`,
        p.`ProductionCost`,
        p.`SellingPrice`,
        p.`ProfitMarginPercentage`,
        p.`Status`,
        CASE WHEN p.`AvailableQuantity` <= p.`MinThresholdQuantity` THEN 1 ELSE 0 END AS IsLowStock,
        p.`ImageUrl`
    FROM `vendor_finished_products` p
    WHERE p.`VendorId` = p_vendor_id
      AND (p.`ProductCode` = p_product_id_or_code OR CAST(p.`Id` AS CHAR) = p_product_id_or_code)
    LIMIT 1;
END$$

CREATE PROCEDURE `sp_Vendor_CreateFinishedProduct`(
    IN p_vendor_id BIGINT,
    IN p_product_name VARCHAR(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_category VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_source_raw_material VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_brand_name VARCHAR(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_packaging VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_initial_quantity DECIMAL(12,2),
    IN p_unit VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_mfg_date DATETIME(6),
    IN p_expiry_date DATETIME(6),
    IN p_production_cost DECIMAL(14,2),
    IN p_selling_price DECIMAL(14,2),
    IN p_min_threshold_quantity DECIMAL(12,2),
    IN p_image_url VARCHAR(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
)
BEGIN
    DECLARE v_count INT DEFAULT 0;
    DECLARE v_prod_code VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    DECLARE v_margin DECIMAL(6,2) DEFAULT 0;
    DECLARE v_new_id BIGINT;

    SELECT COUNT(*) INTO v_count FROM `vendor_finished_products` WHERE `VendorId` = p_vendor_id;
    SET v_prod_code = CONCAT('PROD-', LPAD(v_count + 1, 4, '0'));
    SET v_margin = CASE WHEN p_selling_price > 0 THEN ROUND(((p_selling_price - p_production_cost) / p_selling_price) * 100, 2) ELSE 0 END;

    INSERT INTO `vendor_finished_products` (
        `VendorId`, `ProductCode`, `ProductName`, `Category`, `SourceRawMaterial`,
        `BrandName`, `Packaging`, `AvailableQuantity`, `SoldQuantity`, `Unit`,
        `MfgDate`, `ExpiryDate`, `ProductionCost`, `SellingPrice`, `ProfitMarginPercentage`,
        `MinThresholdQuantity`, `Status`, `ImageUrl`, `CreatedAt`, `UpdatedAt`
    ) VALUES (
        p_vendor_id, v_prod_code, TRIM(p_product_name), TRIM(p_category), TRIM(p_source_raw_material),
        TRIM(p_brand_name), TRIM(p_packaging), p_initial_quantity, 0.00, p_unit,
        p_mfg_date, p_expiry_date, p_production_cost, p_selling_price, v_margin,
        p_min_threshold_quantity, 'Active', p_image_url, UTC_TIMESTAMP(6), UTC_TIMESTAMP(6)
    );

    SET v_new_id = LAST_INSERT_ID();

    IF p_initial_quantity > 0 THEN
        INSERT INTO `vendor_finished_product_movements` (
            `FinishedProductId`, `MovementCode`, `MovementType`, `ReferenceId`,
            `QuantityChange`, `Unit`, `BalanceAfter`, `MovementDate`, `Remarks`, `CreatedAt`
        ) VALUES (
            v_new_id, CONCAT('FMOV-', LPAD(v_count + 1, 4, '0')), 'Initial Stock Inward', 'INIT-SETUP',
            p_initial_quantity, p_unit, p_initial_quantity, UTC_TIMESTAMP(6), 'Initial SKU stock registration', UTC_TIMESTAMP(6)
        );
    END IF;

    CALL `sp_Vendor_GetFinishedProductById`(p_vendor_id, v_prod_code);
END$$

CREATE PROCEDURE `sp_Vendor_UpdateFinishedProduct`(
    IN p_vendor_id BIGINT,
    IN p_product_id_or_code VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_product_name VARCHAR(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_category VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_source_raw_material VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_brand_name VARCHAR(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_packaging VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_mfg_date DATETIME(6),
    IN p_expiry_date DATETIME(6),
    IN p_production_cost DECIMAL(14,2),
    IN p_selling_price DECIMAL(14,2),
    IN p_min_threshold_quantity DECIMAL(12,2),
    IN p_status VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_image_url VARCHAR(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
)
BEGIN
    DECLARE v_prod_id BIGINT DEFAULT NULL;
    DECLARE v_code VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL;
    DECLARE v_margin DECIMAL(6,2) DEFAULT 0;

    SELECT `Id`, `ProductCode` INTO v_prod_id, v_code
    FROM `vendor_finished_products`
    WHERE `VendorId` = p_vendor_id
      AND (`ProductCode` = p_product_id_or_code OR CAST(`Id` AS CHAR) = p_product_id_or_code)
    LIMIT 1;

    IF v_prod_id IS NOT NULL THEN
        SET v_margin = CASE WHEN p_selling_price > 0 THEN ROUND(((p_selling_price - p_production_cost) / p_selling_price) * 100, 2) ELSE 0 END;

        UPDATE `vendor_finished_products`
        SET `ProductName` = TRIM(p_product_name),
            `Category` = TRIM(p_category),
            `SourceRawMaterial` = TRIM(p_source_raw_material),
            `BrandName` = TRIM(p_brand_name),
            `Packaging` = TRIM(p_packaging),
            `MfgDate` = p_mfg_date,
            `ExpiryDate` = p_expiry_date,
            `ProductionCost` = p_production_cost,
            `SellingPrice` = p_selling_price,
            `ProfitMarginPercentage` = v_margin,
            `MinThresholdQuantity` = p_min_threshold_quantity,
            `Status` = COALESCE(NULLIF(p_status, ''), `Status`),
            `ImageUrl` = COALESCE(NULLIF(p_image_url, ''), `ImageUrl`),
            `UpdatedAt` = UTC_TIMESTAMP(6)
        WHERE `Id` = v_prod_id;
    END IF;

    CALL `sp_Vendor_GetFinishedProductById`(p_vendor_id, COALESCE(v_code, p_product_id_or_code));
END$$

CREATE PROCEDURE `sp_Vendor_AdjustFinishedProductStock`(
    IN p_vendor_id BIGINT,
    IN p_product_id_or_code VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_quantity_adjustment DECIMAL(12,2),
    IN p_reference_id VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_reason VARCHAR(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
)
BEGIN
    DECLARE v_prod_id BIGINT DEFAULT NULL;
    DECLARE v_unit VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    DECLARE v_avail_qty DECIMAL(12,2) DEFAULT 0;
    DECLARE v_mov_count INT DEFAULT 0;

    SELECT `Id`, `Unit`, `AvailableQuantity`
    INTO v_prod_id, v_unit, v_avail_qty
    FROM `vendor_finished_products`
    WHERE `VendorId` = p_vendor_id
      AND (`ProductCode` = p_product_id_or_code OR CAST(`Id` AS CHAR) = p_product_id_or_code)
    LIMIT 1;

    IF v_prod_id IS NULL THEN
        SELECT 0 AS Adjusted;
    ELSE
        SET v_avail_qty = GREATEST(0, v_avail_qty + p_quantity_adjustment);

        UPDATE `vendor_finished_products`
        SET `AvailableQuantity` = v_avail_qty,
            `UpdatedAt` = UTC_TIMESTAMP(6)
        WHERE `Id` = v_prod_id;

        SELECT COUNT(*) INTO v_mov_count FROM `vendor_finished_product_movements`;
        INSERT INTO `vendor_finished_product_movements` (
            `FinishedProductId`, `MovementCode`, `MovementType`, `ReferenceId`,
            `QuantityChange`, `Unit`, `BalanceAfter`, `MovementDate`, `Remarks`, `CreatedAt`
        ) VALUES (
            v_prod_id, CONCAT('FMOV-', LPAD(v_mov_count + 1, 4, '0')),
            CASE WHEN p_quantity_adjustment >= 0 THEN 'Stock Adjustment Inward' ELSE 'Stock Adjustment Deduction' END,
            COALESCE(NULLIF(p_reference_id, ''), 'MANUAL-ADJ'),
            p_quantity_adjustment, v_unit, v_avail_qty, UTC_TIMESTAMP(6), TRIM(p_reason), UTC_TIMESTAMP(6)
        );

        SELECT 1 AS Adjusted;
    END IF;
END$$

CREATE PROCEDURE `sp_Vendor_GetFinishedProductMovements`(
    IN p_vendor_id BIGINT,
    IN p_product_id_or_code VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
)
BEGIN
    SELECT
        m.`Id`,
        m.`MovementCode`,
        m.`MovementType`,
        m.`ReferenceId`,
        m.`QuantityChange`,
        m.`Unit`,
        m.`BalanceAfter`,
        m.`MovementDate`,
        m.`Remarks`
    FROM `vendor_finished_product_movements` m
    INNER JOIN `vendor_finished_products` p ON p.`Id` = m.`FinishedProductId`
    WHERE p.`VendorId` = p_vendor_id
      AND (p.`ProductCode` = p_product_id_or_code OR CAST(p.`Id` AS CHAR) = p_product_id_or_code)
    ORDER BY m.`MovementDate` DESC;
END$$

CREATE PROCEDURE `sp_Vendor_ToggleFinishedProductStatus`(
    IN p_vendor_id BIGINT,
    IN p_product_id_or_code VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
)
BEGIN
    DECLARE v_prod_id BIGINT DEFAULT NULL;

    SELECT `Id` INTO v_prod_id
    FROM `vendor_finished_products`
    WHERE `VendorId` = p_vendor_id
      AND (`ProductCode` = p_product_id_or_code OR CAST(`Id` AS CHAR) = p_product_id_or_code)
    LIMIT 1;

    IF v_prod_id IS NULL THEN
        SELECT 0 AS Toggled;
    ELSE
        UPDATE `vendor_finished_products`
        SET `Status` = CASE WHEN LOWER(`Status`) = 'active' THEN 'Inactive' ELSE 'Active' END,
            `UpdatedAt` = UTC_TIMESTAMP(6)
        WHERE `Id` = v_prod_id;

        SELECT 1 AS Toggled;
    END IF;
END$$

DELIMITER ;
