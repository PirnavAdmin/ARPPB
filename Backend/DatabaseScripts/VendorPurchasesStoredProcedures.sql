-- ============================================================================
-- ARPPB: Vendor Purchases Stored Procedures (MySQL 8+ / MariaDB 11+)
-- Script: VendorPurchasesStoredProcedures.sql
-- Description: Stored procedures for Vendor Purchases management, procurement summary,
--              unified purchase listing across Farmers and Middlemen, purchase creation,
--              status updates, and invoice lookup.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. sp_Vendor_GetPurchasesSummary
-- ----------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS `sp_Vendor_GetPurchasesSummary`;
DELIMITER $$
CREATE PROCEDURE `sp_Vendor_GetPurchasesSummary`(
    IN p_vendor_id BIGINT,
    IN p_from_date DATETIME(6),
    IN p_to_date DATETIME(6)
)
BEGIN
    SELECT
        -- Farmer Procurement Metrics
        COALESCE((
            SELECT COUNT(*)
            FROM `vendor_farmer_purchases` p
            INNER JOIN `vendor_farmers` f ON p.`FarmerId` = f.`Id`
            WHERE f.`VendorId` = p_vendor_id
              AND (p_from_date IS NULL OR p.`PurchaseDate` >= p_from_date)
              AND (p_to_date IS NULL OR p.`PurchaseDate` < p_to_date)
        ), 0) AS FarmerPurchaseCount,

        COALESCE((
            SELECT SUM(p.`Quantity`)
            FROM `vendor_farmer_purchases` p
            INNER JOIN `vendor_farmers` f ON p.`FarmerId` = f.`Id`
            WHERE f.`VendorId` = p_vendor_id
              AND (p_from_date IS NULL OR p.`PurchaseDate` >= p_from_date)
              AND (p_to_date IS NULL OR p.`PurchaseDate` < p_to_date)
        ), 0.00) AS FarmerPurchaseQuantity,

        COALESCE((
            SELECT SUM(p.`TotalAmount`)
            FROM `vendor_farmer_purchases` p
            INNER JOIN `vendor_farmers` f ON p.`FarmerId` = f.`Id`
            WHERE f.`VendorId` = p_vendor_id
              AND (p_from_date IS NULL OR p.`PurchaseDate` >= p_from_date)
              AND (p_to_date IS NULL OR p.`PurchaseDate` < p_to_date)
        ), 0.00) AS FarmerPurchaseAmount,

        COALESCE((
            SELECT SUM(p.`DueAmount`)
            FROM `vendor_farmer_purchases` p
            INNER JOIN `vendor_farmers` f ON p.`FarmerId` = f.`Id`
            WHERE f.`VendorId` = p_vendor_id
              AND (p_from_date IS NULL OR p.`PurchaseDate` >= p_from_date)
              AND (p_to_date IS NULL OR p.`PurchaseDate` < p_to_date)
        ), 0.00) AS FarmerDueAmount,

        -- Middleman Procurement Metrics
        COALESCE((
            SELECT COUNT(*)
            FROM `vendor_middleman_purchases` p
            INNER JOIN `vendor_middlemen` m ON p.`MiddlemanId` = m.`Id`
            WHERE m.`VendorId` = p_vendor_id
              AND (p_from_date IS NULL OR p.`PurchaseDate` >= p_from_date)
              AND (p_to_date IS NULL OR p.`PurchaseDate` < p_to_date)
        ), 0) AS MiddlemanPurchaseCount,

        COALESCE((
            SELECT SUM(p.`Quantity`)
            FROM `vendor_middleman_purchases` p
            INNER JOIN `vendor_middlemen` m ON p.`MiddlemanId` = m.`Id`
            WHERE m.`VendorId` = p_vendor_id
              AND (p_from_date IS NULL OR p.`PurchaseDate` >= p_from_date)
              AND (p_to_date IS NULL OR p.`PurchaseDate` < p_to_date)
        ), 0.00) AS MiddlemanPurchaseQuantity,

        COALESCE((
            SELECT SUM(p.`TotalAmount`)
            FROM `vendor_middleman_purchases` p
            INNER JOIN `vendor_middlemen` m ON p.`MiddlemanId` = m.`Id`
            WHERE m.`VendorId` = p_vendor_id
              AND (p_from_date IS NULL OR p.`PurchaseDate` >= p_from_date)
              AND (p_to_date IS NULL OR p.`PurchaseDate` < p_to_date)
        ), 0.00) AS MiddlemanPurchaseAmount,

        COALESCE((
            SELECT SUM(p.`DueAmount`)
            FROM `vendor_middleman_purchases` p
            INNER JOIN `vendor_middlemen` m ON p.`MiddlemanId` = m.`Id`
            WHERE m.`VendorId` = p_vendor_id
              AND (p_from_date IS NULL OR p.`PurchaseDate` >= p_from_date)
              AND (p_to_date IS NULL OR p.`PurchaseDate` < p_to_date)
        ), 0.00) AS MiddlemanDueAmount;
END$$
DELIMITER ;

-- ----------------------------------------------------------------------------
-- 2. sp_Vendor_GetPurchases
-- ----------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS `sp_Vendor_GetPurchases`;
DELIMITER $$
CREATE PROCEDURE `sp_Vendor_GetPurchases`(
    IN p_vendor_id BIGINT,
    IN p_supplier_category VARCHAR(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,   -- 'All', 'Farmer', 'Middleman'
    IN p_payment_status VARCHAR(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,       -- 'All', 'Pending', 'Paid', 'Partial'
    IN p_crop VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_search VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_from_date DATETIME(6),
    IN p_to_date DATETIME(6),
    IN p_page_number INT,
    IN p_page_size INT
)
BEGIN
    DECLARE v_offset INT DEFAULT 0;
    IF p_page_number < 1 THEN SET p_page_number = 1; END IF;
    IF p_page_size < 1 THEN SET p_page_size = 20; END IF;
    SET v_offset = (p_page_number - 1) * p_page_size;

    -- Temporary table to hold unified purchases
    DROP TEMPORARY TABLE IF EXISTS tmp_vendor_purchases;
    CREATE TEMPORARY TABLE tmp_vendor_purchases (
        `Id` BIGINT,
        `PurchaseCode` VARCHAR(50),
        `SupplierCategory` VARCHAR(30),
        `SupplierId` BIGINT,
        `SupplierCode` VARCHAR(50),
        `SupplierName` VARCHAR(150),
        `MobileNumber` VARCHAR(20),
        `BillNumber` VARCHAR(50),
        `CropName` VARCHAR(100),
        `CropVariety` VARCHAR(100),
        `Quantity` DECIMAL(12,2),
        `Unit` VARCHAR(20),
        `RatePerUnit` DECIMAL(12,2),
        `TotalAmount` DECIMAL(14,2),
        `DueAmount` DECIMAL(14,2),
        `PaidAmount` DECIMAL(14,2),
        `PaymentStatus` VARCHAR(30),
        `PurchaseDate` DATETIME(6),
        `CreatedAt` DATETIME(6)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

    -- Farmer Purchases
    IF p_supplier_category IS NULL OR LOWER(p_supplier_category) = 'all' OR LOWER(p_supplier_category) = 'farmer' THEN
        INSERT INTO tmp_vendor_purchases
        SELECT
            p.`Id`,
            p.`PurchaseCode`,
            'Farmer' AS SupplierCategory,
            f.`Id` AS SupplierId,
            f.`FarmerCode` AS SupplierCode,
            f.`FullName` AS SupplierName,
            f.`MobileNumber` AS MobileNumber,
            p.`BillNumber`,
            p.`CropName`,
            p.`CropVariety`,
            p.`Quantity`,
            p.`Unit`,
            p.`RatePerUnit`,
            p.`TotalAmount`,
            p.`DueAmount`,
            (p.`TotalAmount` - p.`DueAmount`) AS PaidAmount,
            p.`PaymentStatus`,
            p.`PurchaseDate`,
            p.`CreatedAt`
        FROM `vendor_farmer_purchases` p
        INNER JOIN `vendor_farmers` f ON p.`FarmerId` = f.`Id`
        WHERE f.`VendorId` = p_vendor_id
          AND (p_payment_status IS NULL OR LOWER(p_payment_status) = 'all' OR LOWER(p.`PaymentStatus`) = LOWER(p_payment_status))
          AND (p_crop IS NULL OR LOWER(p_crop) = 'all' OR LOWER(p.`CropName`) LIKE CONCAT('%', LOWER(p_crop), '%'))
          AND (p_from_date IS NULL OR p.`PurchaseDate` >= p_from_date)
          AND (p_to_date IS NULL OR p.`PurchaseDate` < p_to_date)
          AND (p_search IS NULL OR p_search = '' OR
               LOWER(p.`PurchaseCode`) LIKE CONCAT('%', LOWER(p_search), '%') OR
               LOWER(p.`BillNumber`) LIKE CONCAT('%', LOWER(p_search), '%') OR
               LOWER(f.`FullName`) LIKE CONCAT('%', LOWER(p_search), '%') OR
               LOWER(f.`MobileNumber`) LIKE CONCAT('%', LOWER(p_search), '%') OR
               LOWER(p.`CropName`) LIKE CONCAT('%', LOWER(p_search), '%'));
    END IF;

    -- Middleman Purchases
    IF p_supplier_category IS NULL OR LOWER(p_supplier_category) = 'all' OR LOWER(p_supplier_category) = 'middleman' THEN
        INSERT INTO tmp_vendor_purchases
        SELECT
            p.`Id`,
            p.`PurchaseCode`,
            'Middleman' AS SupplierCategory,
            m.`Id` AS SupplierId,
            m.`MiddlemanCode` AS SupplierCode,
            m.`FullName` AS SupplierName,
            m.`MobileNumber` AS MobileNumber,
            p.`BillNumber`,
            p.`CropName`,
            p.`CropVariety`,
            p.`Quantity`,
            p.`Unit`,
            p.`RatePerUnit`,
            p.`TotalAmount`,
            p.`DueAmount`,
            (p.`TotalAmount` - p.`DueAmount`) AS PaidAmount,
            p.`PaymentStatus`,
            p.`PurchaseDate`,
            p.`CreatedAt`
        FROM `vendor_middleman_purchases` p
        INNER JOIN `vendor_middlemen` m ON p.`MiddlemanId` = m.`Id`
        WHERE m.`VendorId` = p_vendor_id
          AND (p_payment_status IS NULL OR LOWER(p_payment_status) = 'all' OR LOWER(p.`PaymentStatus`) = LOWER(p_payment_status))
          AND (p_crop IS NULL OR LOWER(p_crop) = 'all' OR LOWER(p.`CropName`) LIKE CONCAT('%', LOWER(p_crop), '%'))
          AND (p_from_date IS NULL OR p.`PurchaseDate` >= p_from_date)
          AND (p_to_date IS NULL OR p.`PurchaseDate` < p_to_date)
          AND (p_search IS NULL OR p_search = '' OR
               LOWER(p.`PurchaseCode`) LIKE CONCAT('%', LOWER(p_search), '%') OR
               LOWER(p.`BillNumber`) LIKE CONCAT('%', LOWER(p_search), '%') OR
               LOWER(m.`FullName`) LIKE CONCAT('%', LOWER(p_search), '%') OR
               LOWER(m.`MobileNumber`) LIKE CONCAT('%', LOWER(p_search), '%') OR
               LOWER(p.`CropName`) LIKE CONCAT('%', LOWER(p_search), '%'));
    END IF;

    -- Total Count
    SELECT COUNT(*) AS TotalCount FROM tmp_vendor_purchases;

    -- Paginated Items
    SELECT *
    FROM tmp_vendor_purchases
    ORDER BY `PurchaseDate` DESC, `Id` DESC
    LIMIT p_page_size OFFSET v_offset;

    DROP TEMPORARY TABLE IF EXISTS tmp_vendor_purchases;
END$$
DELIMITER ;

-- ----------------------------------------------------------------------------
-- 3. sp_Vendor_GetPurchaseById
-- ----------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS `sp_Vendor_GetPurchaseById`;
DELIMITER $$
CREATE PROCEDURE `sp_Vendor_GetPurchaseById`(
    IN p_vendor_id BIGINT,
    IN p_purchase_id VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_supplier_category VARCHAR(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
)
BEGIN
    IF LOWER(p_supplier_category) = 'middleman' THEN
        SELECT
            p.`Id`,
            p.`PurchaseCode`,
            'Middleman' AS SupplierCategory,
            m.`Id` AS SupplierId,
            m.`MiddlemanCode` AS SupplierCode,
            m.`FullName` AS SupplierName,
            m.`BusinessName` AS SupplierBusinessName,
            m.`MobileNumber` AS MobileNumber,
            m.`Email` AS Email,
            m.`Gstin`,
            m.`MarketYardLocation` AS VillageOrMarket,
            m.`District`,
            m.`State`,
            p.`BillNumber`,
            p.`CropName`,
            p.`CropVariety`,
            p.`Quantity`,
            p.`Unit`,
            p.`RatePerUnit`,
            p.`TotalAmount`,
            p.`DueAmount`,
            (p.`TotalAmount` - p.`DueAmount`) AS PaidAmount,
            p.`PaymentStatus`,
            p.`PurchaseDate`,
            p.`CreatedAt`
        FROM `vendor_middleman_purchases` p
        INNER JOIN `vendor_middlemen` m ON p.`MiddlemanId` = m.`Id`
        WHERE m.`VendorId` = p_vendor_id 
          AND (CAST(p.`Id` AS CHAR) = p_purchase_id OR p.`PurchaseCode` = p_purchase_id)
        LIMIT 1;
    ELSE
        SELECT
            p.`Id`,
            p.`PurchaseCode`,
            'Farmer' AS SupplierCategory,
            f.`Id` AS SupplierId,
            f.`FarmerCode` AS SupplierCode,
            f.`FullName` AS SupplierName,
            f.`FullName` AS SupplierBusinessName,
            f.`MobileNumber` AS MobileNumber,
            f.`Email` AS Email,
            '' AS Gstin,
            f.`Village` AS VillageOrMarket,
            f.`District`,
            f.`State`,
            p.`BillNumber`,
            p.`CropName`,
            p.`CropVariety`,
            p.`Quantity`,
            p.`Unit`,
            p.`RatePerUnit`,
            p.`TotalAmount`,
            p.`DueAmount`,
            (p.`TotalAmount` - p.`DueAmount`) AS PaidAmount,
            p.`PaymentStatus`,
            p.`PurchaseDate`,
            p.`CreatedAt`
        FROM `vendor_farmer_purchases` p
        INNER JOIN `vendor_farmers` f ON p.`FarmerId` = f.`Id`
        WHERE f.`VendorId` = p_vendor_id 
          AND (CAST(p.`Id` AS CHAR) = p_purchase_id OR p.`PurchaseCode` = p_purchase_id)
        LIMIT 1;
    END IF;
END$$
DELIMITER ;

-- ----------------------------------------------------------------------------
-- 4. sp_Vendor_CreateFarmerPurchase
-- ----------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS `sp_Vendor_CreateFarmerPurchase`;
DELIMITER $$
CREATE PROCEDURE `sp_Vendor_CreateFarmerPurchase`(
    IN p_vendor_id BIGINT,
    IN p_farmer_id BIGINT,
    IN p_purchase_code VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_bill_number VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_crop_name VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_crop_variety VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_quantity DECIMAL(12,2),
    IN p_unit VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_rate_per_unit DECIMAL(12,2),
    IN p_total_amount DECIMAL(14,2),
    IN p_due_amount DECIMAL(14,2),
    IN p_payment_status VARCHAR(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_purchase_date DATETIME(6)
)
BEGIN
    DECLARE v_new_id BIGINT;
    DECLARE v_farmer_name VARCHAR(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    DECLARE v_farmer_code VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    DECLARE v_farmer_mobile VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    DECLARE v_stock_id BIGINT;
    DECLARE v_stock_code VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    DECLARE v_batch_num VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    DECLARE v_mov_code VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    DECLARE v_stock_cnt INT DEFAULT 0;
    DECLARE v_mov_cnt INT DEFAULT 0;
    DECLARE v_vch_cnt INT DEFAULT 0;
    DECLARE v_vch_code VARCHAR(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    DECLARE v_otpc_cnt INT DEFAULT 0;
    DECLARE v_otpc_code VARCHAR(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

    -- Validate farmer belongs to this vendor
    IF NOT EXISTS (SELECT 1 FROM `vendor_farmers` WHERE `Id` = p_farmer_id AND `VendorId` = p_vendor_id) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Farmer not found for this vendor.';
    END IF;

    IF p_purchase_date IS NULL THEN
        SET p_purchase_date = CURRENT_TIMESTAMP(6);
    END IF;

    INSERT INTO `vendor_farmer_purchases` (
        `FarmerId`, `PurchaseCode`, `BillNumber`, `CropName`, `CropVariety`,
        `Quantity`, `Unit`, `RatePerUnit`, `TotalAmount`, `DueAmount`,
        `PaymentStatus`, `PurchaseDate`, `CreatedAt`
    ) VALUES (
        p_farmer_id, p_purchase_code, p_bill_number, p_crop_name, p_crop_variety,
        p_quantity, p_unit, p_rate_per_unit, p_total_amount, p_due_amount,
        p_payment_status, p_purchase_date, CURRENT_TIMESTAMP(6)
    );

    SET v_new_id = LAST_INSERT_ID();

    -- Fetch farmer details
    SELECT `FullName`, `FarmerCode`, `MobileNumber`
      INTO v_farmer_name, v_farmer_code, v_farmer_mobile
      FROM `vendor_farmers`
     WHERE `Id` = p_farmer_id;

    -- Auto-inward to vendor_raw_material_stocks
    SELECT COUNT(*) INTO v_stock_cnt FROM `vendor_raw_material_stocks`;
    SET v_stock_code = CONCAT('STK-', LPAD(v_stock_cnt + 1, 4, '0'));
    SET v_batch_num = CONCAT('BCH-', UPPER(LEFT(REPLACE(p_crop_name, ' ', ''), 3)), '-', LPAD(v_stock_cnt + 1, 3, '0'));

    INSERT INTO `vendor_raw_material_stocks` (
        `VendorId`, `StockCode`, `CropName`, `CropVariety`, `SupplierName`,
        `SupplierCategory`, `PurchaseId`, `BatchNumber`, `PurchaseDate`,
        `PurchasedQuantity`, `ProcessedQuantity`, `AvailableQuantity`, `Unit`,
        `AverageCost`, `QualityGrade`, `Status`, `MinThresholdQuantity`,
        `CreatedAt`, `UpdatedAt`
    ) VALUES (
        p_vendor_id, v_stock_code, p_crop_name, COALESCE(p_crop_variety, 'Standard'), COALESCE(v_farmer_name, 'Farmer'),
        'Farmer', p_purchase_code, v_batch_num, p_purchase_date,
        p_quantity, 0.00, p_quantity, p_unit,
        p_rate_per_unit, 'Grade A (Standard FAQ)', 'In Stock', 15.00,
        CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)
    );

    SET v_stock_id = LAST_INSERT_ID();

    -- Inward stock movement log
    SELECT COUNT(*) INTO v_mov_cnt FROM `vendor_stock_movements`;
    SET v_mov_code = CONCAT('MOV-', LPAD(v_mov_cnt + 1, 4, '0'));

    INSERT INTO `vendor_stock_movements` (
        `StockId`, `MovementCode`, `MovementDate`, `BatchNumber`, `CropName`,
        `MovementType`, `ReferenceId`, `QuantityChange`, `Unit`, `BalanceAfter`,
        `Remarks`, `CreatedAt`
    ) VALUES (
        v_stock_id, v_mov_code, CURRENT_TIMESTAMP(6), v_batch_num, p_crop_name,
        'Purchase Inward', p_purchase_code, p_quantity, p_unit, p_quantity,
        CONCAT('Stock inward for ', p_crop_name, ' (Farmer purchase from ', COALESCE(v_farmer_name, 'Farmer'), ')'),
        CURRENT_TIMESTAMP(6)
    );

    -- Cross-populate vp_ledger_entries for financial ledger persistence
    SELECT COUNT(*) INTO v_vch_cnt FROM `vp_ledger_entries`;
    SET v_vch_code = CONCAT('VCH-', LPAD(v_vch_cnt + 1, 4, '0'));

    INSERT INTO `vp_ledger_entries` (
        `vendor_id`, `voucher_code`, `transaction_code`, `entry_date`,
        `description`, `party_name`, `party_code`, `party_category`,
        `ledger_category`, `debit`, `credit`, `expected_payment_date`,
        `status`, `settled_amount`, `created_at`, `updated_at`
    ) VALUES (
        p_vendor_id, v_vch_code, p_purchase_code, p_purchase_date,
        CONCAT('Farmer Procurement - ', p_crop_name, ' (', p_quantity, ' ', p_unit, ')'),
        COALESCE(v_farmer_name, 'Farmer'), v_farmer_code, 'Farmer',
        'Purchase', 0.00, p_total_amount, DATE(p_purchase_date),
        CASE WHEN p_due_amount <= 0 THEN 'Paid' WHEN p_due_amount < p_total_amount THEN 'Partial' ELSE 'Unpaid' END,
        p_total_amount - p_due_amount, CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)
    );

    -- Cross-populate vp_otp_confirmations and vendor_farmer_otp_logs
    SELECT COUNT(*) INTO v_otpc_cnt FROM `vp_otp_confirmations`;
    SET v_otpc_code = CONCAT('OTP-', LPAD(v_otpc_cnt + 1, 4, '0'));

    INSERT INTO `vp_otp_confirmations` (
        `vendor_id`, `confirmation_code`, `transaction_code`, `party_category`,
        `party_name`, `party_code`, `mobile`, `transaction_type`,
        `product`, `quantity`, `unit`, `amount`,
        `otp_hash`, `otp_status`, `attempts`, `sent_at`,
        `expires_at`, `confirmed_at`, `created_at`, `updated_at`
    ) VALUES (
        p_vendor_id, v_otpc_code, p_purchase_code, 'Farmer',
        COALESCE(v_farmer_name, 'Farmer'), v_farmer_code, COALESCE(v_farmer_mobile, ''), 'Procurement Inward',
        p_crop_name, p_quantity, p_unit, p_total_amount,
        SHA2('123456', 256), 'Verified', 1, CURRENT_TIMESTAMP(6),
        DATE_ADD(CURRENT_TIMESTAMP(6), INTERVAL 30 MINUTE), CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)
    );

    INSERT INTO `vendor_farmer_otp_logs` (
        `FarmerId`, `OtpCode`, `Purpose`, `ActionDetails`, `Status`, `VerifiedAt`, `CreatedAt`
    ) VALUES (
        p_farmer_id, '123456', 'Purchase Confirmation',
        CONCAT('Procurement inward of ', p_quantity, ' ', p_unit, ' ', p_crop_name, ' (', p_purchase_code, ')'),
        'Verified', CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)
    );

    -- Initial payment record if paid
    IF (p_total_amount - p_due_amount) > 0 THEN
        INSERT INTO `vendor_farmer_payments` (
            `FarmerId`, `PaymentCode`, `VoucherNumber`, `Amount`,
            `PaymentMethod`, `PaymentDate`, `ReferenceNumber`, `Status`,
            `Notes`, `CreatedAt`
        ) VALUES (
            p_farmer_id, CONCAT('PAY-F-', LPAD(v_new_id, 4, '0')), v_vch_code, p_total_amount - p_due_amount,
            'Bank Transfer', p_purchase_date, p_purchase_code, 'Completed',
            CONCAT('Initial payment for purchase ', p_purchase_code), CURRENT_TIMESTAMP(6)
        );
    END IF;

    -- Return newly created purchase row
    SELECT
        p.`Id`,
        p.`PurchaseCode`,
        'Farmer' AS SupplierCategory,
        f.`Id` AS SupplierId,
        f.`FarmerCode` AS SupplierCode,
        f.`FullName` AS SupplierName,
        f.`MobileNumber` AS MobileNumber,
        p.`BillNumber`,
        p.`CropName`,
        p.`CropVariety`,
        p.`Quantity`,
        p.`Unit`,
        p.`RatePerUnit`,
        p.`TotalAmount`,
        p.`DueAmount`,
        (p.`TotalAmount` - p.`DueAmount`) AS PaidAmount,
        p.`PaymentStatus`,
        p.`PurchaseDate`,
        p.`CreatedAt`
    FROM `vendor_farmer_purchases` p
    INNER JOIN `vendor_farmers` f ON p.`FarmerId` = f.`Id`
    WHERE p.`Id` = v_new_id;
END$$
DELIMITER ;

-- ----------------------------------------------------------------------------
-- 5. sp_Vendor_CreateMiddlemanPurchase
-- ----------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS `sp_Vendor_CreateMiddlemanPurchase`;
DELIMITER $$
CREATE PROCEDURE `sp_Vendor_CreateMiddlemanPurchase`(
    IN p_vendor_id BIGINT,
    IN p_middleman_id BIGINT,
    IN p_purchase_code VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_bill_number VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_crop_name VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_crop_variety VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_quantity DECIMAL(12,2),
    IN p_unit VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_rate_per_unit DECIMAL(12,2),
    IN p_total_amount DECIMAL(14,2),
    IN p_due_amount DECIMAL(14,2),
    IN p_payment_status VARCHAR(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_purchase_date DATETIME(6)
)
BEGIN
    DECLARE v_new_id BIGINT;
    DECLARE v_agency_name VARCHAR(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    DECLARE v_mid_code VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    DECLARE v_mid_mobile VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    DECLARE v_stock_id BIGINT;
    DECLARE v_stock_code VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    DECLARE v_batch_num VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    DECLARE v_mov_code VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    DECLARE v_stock_cnt INT DEFAULT 0;
    DECLARE v_mov_cnt INT DEFAULT 0;
    DECLARE v_vch_cnt INT DEFAULT 0;
    DECLARE v_vch_code VARCHAR(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    DECLARE v_otpc_cnt INT DEFAULT 0;
    DECLARE v_otpc_code VARCHAR(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

    -- Validate middleman belongs to this vendor
    IF NOT EXISTS (SELECT 1 FROM `vendor_middlemen` WHERE `Id` = p_middleman_id AND `VendorId` = p_vendor_id) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Middleman not found for this vendor.';
    END IF;

    IF p_purchase_date IS NULL THEN
        SET p_purchase_date = CURRENT_TIMESTAMP(6);
    END IF;

    INSERT INTO `vendor_middleman_purchases` (
        `MiddlemanId`, `PurchaseCode`, `BillNumber`, `CropName`, `CropVariety`,
        `Quantity`, `Unit`, `RatePerUnit`, `TotalAmount`, `DueAmount`,
        `PaymentStatus`, `PurchaseDate`, `CreatedAt`
    ) VALUES (
        p_middleman_id, p_purchase_code, p_bill_number, p_crop_name, p_crop_variety,
        p_quantity, p_unit, p_rate_per_unit, p_total_amount, p_due_amount,
        p_payment_status, p_purchase_date, CURRENT_TIMESTAMP(6)
    );

    SET v_new_id = LAST_INSERT_ID();

    -- Fetch middleman details
    SELECT COALESCE(`BusinessName`, `FullName`), `MiddlemanCode`, `MobileNumber`
      INTO v_agency_name, v_mid_code, v_mid_mobile
      FROM `vendor_middlemen`
     WHERE `Id` = p_middleman_id;

    -- Auto-inward to vendor_raw_material_stocks
    SELECT COUNT(*) INTO v_stock_cnt FROM `vendor_raw_material_stocks`;
    SET v_stock_code = CONCAT('STK-', LPAD(v_stock_cnt + 1, 4, '0'));
    SET v_batch_num = CONCAT('BCH-', UPPER(LEFT(REPLACE(p_crop_name, ' ', ''), 3)), '-', LPAD(v_stock_cnt + 1, 3, '0'));

    INSERT INTO `vendor_raw_material_stocks` (
        `VendorId`, `StockCode`, `CropName`, `CropVariety`, `SupplierName`,
        `SupplierCategory`, `PurchaseId`, `BatchNumber`, `PurchaseDate`,
        `PurchasedQuantity`, `ProcessedQuantity`, `AvailableQuantity`, `Unit`,
        `AverageCost`, `QualityGrade`, `Status`, `MinThresholdQuantity`,
        `CreatedAt`, `UpdatedAt`
    ) VALUES (
        p_vendor_id, v_stock_code, p_crop_name, COALESCE(p_crop_variety, 'Standard'), COALESCE(v_agency_name, 'Middleman'),
        'Middleman', p_purchase_code, v_batch_num, p_purchase_date,
        p_quantity, 0.00, p_quantity, p_unit,
        p_rate_per_unit, 'Grade A (Standard FAQ)', 'In Stock', 15.00,
        CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)
    );

    SET v_stock_id = LAST_INSERT_ID();

    -- Inward stock movement log
    SELECT COUNT(*) INTO v_mov_cnt FROM `vendor_stock_movements`;
    SET v_mov_code = CONCAT('MOV-', LPAD(v_mov_cnt + 1, 4, '0'));

    INSERT INTO `vendor_stock_movements` (
        `StockId`, `MovementCode`, `MovementDate`, `BatchNumber`, `CropName`,
        `MovementType`, `ReferenceId`, `QuantityChange`, `Unit`, `BalanceAfter`,
        `Remarks`, `CreatedAt`
    ) VALUES (
        v_stock_id, v_mov_code, CURRENT_TIMESTAMP(6), v_batch_num, p_crop_name,
        'Purchase Inward', p_purchase_code, p_quantity, p_unit, p_quantity,
        CONCAT('Stock inward for ', p_crop_name, ' (Middleman purchase from ', COALESCE(v_agency_name, 'Middleman'), ')'),
        CURRENT_TIMESTAMP(6)
    );

    -- Cross-populate vp_ledger_entries for financial ledger persistence
    SELECT COUNT(*) INTO v_vch_cnt FROM `vp_ledger_entries`;
    SET v_vch_code = CONCAT('VCH-', LPAD(v_vch_cnt + 1, 4, '0'));

    INSERT INTO `vp_ledger_entries` (
        `vendor_id`, `voucher_code`, `transaction_code`, `entry_date`,
        `description`, `party_name`, `party_code`, `party_category`,
        `ledger_category`, `debit`, `credit`, `expected_payment_date`,
        `status`, `settled_amount`, `created_at`, `updated_at`
    ) VALUES (
        p_vendor_id, v_vch_code, p_purchase_code, p_purchase_date,
        CONCAT('Middleman Procurement - ', p_crop_name, ' (', p_quantity, ' ', p_unit, ')'),
        COALESCE(v_agency_name, 'Middleman'), v_mid_code, 'Middleman',
        'Purchase', 0.00, p_total_amount, DATE(p_purchase_date),
        CASE WHEN p_due_amount <= 0 THEN 'Paid' WHEN p_due_amount < p_total_amount THEN 'Partial' ELSE 'Unpaid' END,
        p_total_amount - p_due_amount, CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)
    );

    -- Cross-populate vp_otp_confirmations and vendor_middleman_otp_logs
    SELECT COUNT(*) INTO v_otpc_cnt FROM `vp_otp_confirmations`;
    SET v_otpc_code = CONCAT('OTP-', LPAD(v_otpc_cnt + 1, 4, '0'));

    INSERT INTO `vp_otp_confirmations` (
        `vendor_id`, `confirmation_code`, `transaction_code`, `party_category`,
        `party_name`, `party_code`, `mobile`, `transaction_type`,
        `product`, `quantity`, `unit`, `amount`,
        `otp_hash`, `otp_status`, `attempts`, `sent_at`,
        `expires_at`, `confirmed_at`, `created_at`, `updated_at`
    ) VALUES (
        p_vendor_id, v_otpc_code, p_purchase_code, 'Middleman',
        COALESCE(v_agency_name, 'Middleman'), v_mid_code, COALESCE(v_mid_mobile, ''), 'Procurement Inward',
        p_crop_name, p_quantity, p_unit, p_total_amount,
        SHA2('123456', 256), 'Verified', 1, CURRENT_TIMESTAMP(6),
        DATE_ADD(CURRENT_TIMESTAMP(6), INTERVAL 30 MINUTE), CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)
    );

    INSERT INTO `vendor_middleman_otp_logs` (
        `MiddlemanId`, `OtpCode`, `Purpose`, `ActionDetails`, `Status`, `VerifiedAt`, `CreatedAt`
    ) VALUES (
        p_middleman_id, '123456', 'Purchase Confirmation',
        CONCAT('Procurement inward of ', p_quantity, ' ', p_unit, ' ', p_crop_name, ' (', p_purchase_code, ')'),
        'Verified', CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)
    );

    -- Initial payment record if paid
    IF (p_total_amount - p_due_amount) > 0 THEN
        INSERT INTO `vendor_middleman_payments` (
            `MiddlemanId`, `PaymentCode`, `VoucherNumber`, `Amount`,
            `PaymentMethod`, `PaymentDate`, `ReferenceNumber`, `Status`,
            `Notes`, `CreatedAt`
        ) VALUES (
            p_middleman_id, CONCAT('PAY-M-', LPAD(v_new_id, 4, '0')), v_vch_code, p_total_amount - p_due_amount,
            'RTGS/NEFT', p_purchase_date, p_purchase_code, 'Completed',
            CONCAT('Initial payment for purchase ', p_purchase_code), CURRENT_TIMESTAMP(6)
        );
    END IF;

    -- Return newly created purchase row
    SELECT
        p.`Id`,
        p.`PurchaseCode`,
        'Middleman' AS SupplierCategory,
        m.`Id` AS SupplierId,
        m.`MiddlemanCode` AS SupplierCode,
        m.`FullName` AS SupplierName,
        m.`MobileNumber` AS MobileNumber,
        p.`BillNumber`,
        p.`CropName`,
        p.`CropVariety`,
        p.`Quantity`,
        p.`Unit`,
        p.`RatePerUnit`,
        p.`TotalAmount`,
        p.`DueAmount`,
        (p.`TotalAmount` - p.`DueAmount`) AS PaidAmount,
        p.`PaymentStatus`,
        p.`PurchaseDate`,
        p.`CreatedAt`
    FROM `vendor_middleman_purchases` p
    INNER JOIN `vendor_middlemen` m ON p.`MiddlemanId` = m.`Id`
    WHERE p.`Id` = v_new_id;
END$$
DELIMITER ;

-- ----------------------------------------------------------------------------
-- 6. sp_Vendor_UpdatePurchaseStatus
-- ----------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS `sp_Vendor_UpdatePurchaseStatus`;
DELIMITER $$
CREATE PROCEDURE `sp_Vendor_UpdatePurchaseStatus`(
    IN p_vendor_id BIGINT,
    IN p_purchase_id VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_supplier_category VARCHAR(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_payment_status VARCHAR(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_due_amount DECIMAL(14,2)
)
BEGIN
    IF LOWER(p_supplier_category) = 'middleman' THEN
        UPDATE `vendor_middleman_purchases` p
        INNER JOIN `vendor_middlemen` m ON p.`MiddlemanId` = m.`Id`
        SET
            p.`PaymentStatus` = COALESCE(p_payment_status, p.`PaymentStatus`),
            p.`DueAmount` = COALESCE(p_due_amount, p.`DueAmount`)
        WHERE m.`VendorId` = p_vendor_id
          AND (CAST(p.`Id` AS CHAR) = p_purchase_id OR p.`PurchaseCode` = p_purchase_id);
    ELSE
        UPDATE `vendor_farmer_purchases` p
        INNER JOIN `vendor_farmers` f ON p.`FarmerId` = f.`Id`
        SET
            p.`PaymentStatus` = COALESCE(p_payment_status, p.`PaymentStatus`),
            p.`DueAmount` = COALESCE(p_due_amount, p.`DueAmount`)
        WHERE f.`VendorId` = p_vendor_id
          AND (CAST(p.`Id` AS CHAR) = p_purchase_id OR p.`PurchaseCode` = p_purchase_id);
    END IF;

    -- Synchronize vp_ledger_entries
    UPDATE `vp_ledger_entries`
       SET settled_amount = IF(p_due_amount IS NOT NULL, credit - p_due_amount, settled_amount),
           status = IF(p_due_amount = 0, 'Paid', IF(p_due_amount > 0 AND p_due_amount < credit, 'Partial', status)),
           updated_at = UTC_TIMESTAMP(6)
     WHERE vendor_id = p_vendor_id AND (transaction_code = p_purchase_id OR CAST(id AS CHAR) = p_purchase_id);

    -- Return updated purchase
    CALL `sp_Vendor_GetPurchaseById`(p_vendor_id, p_purchase_id, p_supplier_category);
END$$
DELIMITER ;
