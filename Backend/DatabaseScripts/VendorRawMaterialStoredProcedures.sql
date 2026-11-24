-- ============================================================================
-- Vendor Raw Material Inventory Stored Procedures
-- Stored procedures for direct raw material inwarding, querying, and ledger
-- Author: Backend Team
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. sp_Vendor_CreateRawMaterialStock
-- Creates a new raw material batch and logs the initial stock inward movement
-- ----------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS `sp_Vendor_CreateRawMaterialStock`;
DELIMITER $$
CREATE PROCEDURE `sp_Vendor_CreateRawMaterialStock`(
    IN p_vendor_id BIGINT,
    IN p_crop_name VARCHAR(100),
    IN p_crop_variety VARCHAR(100),
    IN p_supplier_name VARCHAR(150),
    IN p_supplier_category VARCHAR(30),
    IN p_purchase_id VARCHAR(50),
    IN p_batch_number VARCHAR(50),
    IN p_purchase_date DATETIME(6),
    IN p_purchased_quantity DECIMAL(12,2),
    IN p_unit VARCHAR(20),
    IN p_average_cost DECIMAL(14,2),
    IN p_quality_grade VARCHAR(100),
    IN p_min_threshold DECIMAL(12,2)
)
BEGIN
    DECLARE v_new_stock_id BIGINT;
    DECLARE v_stock_count INT DEFAULT 0;
    DECLARE v_mov_count INT DEFAULT 0;
    DECLARE v_stock_code VARCHAR(50);
    DECLARE v_batch_num VARCHAR(50);
    DECLARE v_mov_code VARCHAR(50);
    DECLARE v_crop_clean VARCHAR(100);

    SET v_crop_clean = TRIM(p_crop_name);

    IF p_purchase_date IS NULL THEN
        SET p_purchase_date = CURRENT_TIMESTAMP(6);
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
        SET p_purchase_id = CONCAT('PUR-', DATE_FORMAT(CURRENT_TIMESTAMP, '%Y%m%d'), '-', LPAD(v_stock_count + 1, 3, '0'));
    END IF;

    INSERT INTO `vendor_raw_material_stocks` (
        `VendorId`, `StockCode`, `CropName`, `CropVariety`, `SupplierName`,
        `SupplierCategory`, `PurchaseId`, `BatchNumber`, `PurchaseDate`,
        `PurchasedQuantity`, `ProcessedQuantity`, `AvailableQuantity`, `Unit`,
        `AverageCost`, `QualityGrade`, `Status`, `MinThresholdQuantity`,
        `CreatedAt`, `UpdatedAt`
    ) VALUES (
        p_vendor_id, v_stock_code, v_crop_clean, COALESCE(p_crop_variety, 'Standard'), COALESCE(p_supplier_name, 'Direct Procurement'),
        p_supplier_category, p_purchase_id, v_batch_num, p_purchase_date,
        p_purchased_quantity, 0.00, p_purchased_quantity, p_unit,
        p_average_cost, p_quality_grade, 'In Stock', p_min_threshold,
        CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)
    );

    SET v_new_stock_id = LAST_INSERT_ID();

    -- Log inward movement
    SELECT COUNT(*) INTO v_mov_count FROM `vendor_stock_movements`;
    SET v_mov_code = CONCAT('MOV-', LPAD(v_mov_count + 1, 4, '0'));

    INSERT INTO `vendor_stock_movements` (
        `StockId`, `MovementCode`, `MovementDate`, `BatchNumber`, `CropName`,
        `MovementType`, `ReferenceId`, `QuantityChange`, `Unit`, `BalanceAfter`,
        `Remarks`, `CreatedAt`
    ) VALUES (
        v_new_stock_id, v_mov_code, CURRENT_TIMESTAMP(6), v_batch_num, v_crop_clean,
        'Purchase Inward', p_purchase_id, p_purchased_quantity, p_unit, p_purchased_quantity,
        CONCAT('Stock inward for ', v_crop_clean, ' (', p_supplier_category, ' purchase from ', COALESCE(p_supplier_name, 'Direct Procurement'), ')'),
        CURRENT_TIMESTAMP(6)
    );

    -- Return the newly created stock record
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
    WHERE s.`Id` = v_new_stock_id;
END$$
DELIMITER ;

-- ----------------------------------------------------------------------------
-- 2. sp_Vendor_GetRawMaterialStocks
-- ----------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS `sp_Vendor_GetRawMaterialStocks`;
DELIMITER $$
CREATE PROCEDURE `sp_Vendor_GetRawMaterialStocks`(
    IN p_vendor_id BIGINT,
    IN p_search VARCHAR(100),
    IN p_crop VARCHAR(100),
    IN p_supplier_type VARCHAR(30),
    IN p_grade VARCHAR(100),
    IN p_status VARCHAR(30)
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
      AND (p_crop IS NULL OR p_crop = '' OR p_crop = 'All' OR s.`CropName` = p_crop)
      AND (p_supplier_type IS NULL OR p_supplier_type = '' OR p_supplier_type = 'All' OR s.`SupplierCategory` = p_supplier_type)
      AND (p_grade IS NULL OR p_grade = '' OR p_grade = 'All' OR s.`QualityGrade` = p_grade)
      AND (p_status IS NULL OR p_status = '' OR p_status = 'All' OR s.`Status` = p_status)
      AND (
          p_search IS NULL OR p_search = '' OR
          s.`StockCode` LIKE CONCAT('%', p_search, '%') OR
          s.`CropName` LIKE CONCAT('%', p_search, '%') OR
          s.`BatchNumber` LIKE CONCAT('%', p_search, '%') OR
          s.`SupplierName` LIKE CONCAT('%', p_search, '%') OR
          s.`PurchaseId` LIKE CONCAT('%', p_search, '%')
      )
    ORDER BY s.`PurchaseDate` DESC;
END$$
DELIMITER ;

