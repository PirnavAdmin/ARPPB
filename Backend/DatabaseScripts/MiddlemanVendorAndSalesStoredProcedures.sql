-- =========================================================================================
-- AgriConnect ERP - Middleman Portal
-- Database Schema & Stored Procedures for Middleman Vendors & Vendor Sales
-- Isolation Rule: Strictly prefixed with middleman_ and sp_Middleman_ to prevent collisions
-- =========================================================================================

-- 1. TABLE: middleman_vendors
CREATE TABLE IF NOT EXISTS `middleman_vendors` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `middleman_id` BIGINT NOT NULL,
    `vendor_id` VARCHAR(50) NOT NULL,
    `business_name` VARCHAR(255) NOT NULL,
    `owner_name` VARCHAR(150) NOT NULL,
    `mobile` VARCHAR(20) NOT NULL,
    `email` VARCHAR(150) NULL,
    `business_type` VARCHAR(50) NOT NULL DEFAULT 'Wholesaler',
    `gst_number` VARCHAR(50) NULL,
    `address` VARCHAR(255) NULL,
    `district` VARCHAR(100) NOT NULL,
    `state` VARCHAR(100) NOT NULL DEFAULT 'Andhra Pradesh',
    `pin_code` VARCHAR(20) NULL,
    `total_purchases` INT NOT NULL DEFAULT 0,
    `total_purchase_value` DECIMAL(18,2) NOT NULL DEFAULT 0.00,
    `outstanding_receivables` DECIMAL(18,2) NOT NULL DEFAULT 0.00,
    `status` VARCHAR(50) NOT NULL DEFAULT 'Active',
    `notes` TEXT NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY `idx_mm_vendors_middleman_id` (`middleman_id`),
    KEY `idx_mm_vendors_vendor_id` (`vendor_id`),
    KEY `idx_mm_vendors_mobile` (`mobile`),
    KEY `idx_mm_vendors_business_type` (`business_type`),
    KEY `idx_mm_vendors_district` (`district`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. TABLE: middleman_vendor_sales
CREATE TABLE IF NOT EXISTS `middleman_vendor_sales` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `middleman_id` BIGINT NOT NULL,
    `sale_id` VARCHAR(50) NOT NULL,
    `vendor_id` VARCHAR(50) NOT NULL,
    `vendor_name` VARCHAR(255) NOT NULL,
    `owner_name` VARCHAR(150) NULL,
    `mobile` VARCHAR(20) NULL,
    `business_name` VARCHAR(255) NULL,
    `crop_name` VARCHAR(100) NOT NULL,
    `variety` VARCHAR(100) NOT NULL DEFAULT 'Standard',
    `quality_grade` VARCHAR(50) NOT NULL DEFAULT 'Grade A',
    `quantity` DECIMAL(18,2) NOT NULL,
    `unit` VARCHAR(50) NOT NULL DEFAULT 'Quintal',
    `rate` DECIMAL(18,2) NOT NULL,
    `subtotal` DECIMAL(18,2) NOT NULL,
    `transportation_charges` DECIMAL(18,2) NOT NULL DEFAULT 0.00,
    `other_charges` DECIMAL(18,2) NOT NULL DEFAULT 0.00,
    `total_amount` DECIMAL(18,2) NOT NULL,
    `sales_date` DATETIME NOT NULL,
    `expected_delivery_date` DATETIME NULL,
    `expected_payment_date` DATETIME NULL,
    `delivery_location` VARCHAR(255) NULL,
    `otp_status` VARCHAR(50) NOT NULL DEFAULT 'Pending OTP',
    `confirmation_date` DATETIME NULL,
    `status` VARCHAR(50) NOT NULL DEFAULT 'Pending Confirmation',
    `allocated_stock_id` VARCHAR(50) NULL,
    `cogs` DECIMAL(18,2) NOT NULL DEFAULT 0.00,
    `notes` TEXT NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY `idx_mm_vendor_sales_middleman_id` (`middleman_id`),
    KEY `idx_mm_vendor_sales_sale_id` (`sale_id`),
    KEY `idx_mm_vendor_sales_vendor_id` (`vendor_id`),
    KEY `idx_mm_vendor_sales_sales_date` (`sales_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. INITIAL SEED DATA FOR VENDORS
INSERT INTO `middleman_vendors` 
(`middleman_id`, `vendor_id`, `business_name`, `owner_name`, `mobile`, `email`, `business_type`, `gst_number`, `address`, `district`, `state`, `pin_code`, `total_purchases`, `total_purchase_value`, `outstanding_receivables`, `status`, `notes`)
SELECT 57, 'VEN-0001', 'Kaveri Modern Rice Millers Ltd', 'V. Raghava Rao', '9848112233', 'purchases@kaveririce.com', 'Processing Unit', '37AAACK1234F1Z1', 'Industrial Development Area, Autonagar, Guntur', 'Guntur', 'Andhra Pradesh', '522001', 8, 2450000.00, 320000.00, 'Active', 'Major buyer of Paddy BPT 5204 & MTU 1010 varieties.'
WHERE NOT EXISTS (SELECT 1 FROM `middleman_vendors` WHERE `vendor_id` = 'VEN-0001');

INSERT INTO `middleman_vendors` 
(`middleman_id`, `vendor_id`, `business_name`, `owner_name`, `mobile`, `email`, `business_type`, `gst_number`, `address`, `district`, `state`, `pin_code`, `total_purchases`, `total_purchase_value`, `outstanding_receivables`, `status`, `notes`)
SELECT 57, 'VEN-0002', 'Annapurna Spices & Exports Corp', 'K. Subba Rao', '9849223344', 'info@annapurnaspices.in', 'Wholesaler', '37AABCA5678B1Z2', 'Chilli Market Yard Gate 2, Guntur', 'Guntur', 'Andhra Pradesh', '522004', 6, 3180000.00, 450000.00, 'Active', 'Export-grade dry red chilli wholesaler.'
WHERE NOT EXISTS (SELECT 1 FROM `middleman_vendors` WHERE `vendor_id` = 'VEN-0002');

INSERT INTO `middleman_vendors` 
(`middleman_id`, `vendor_id`, `business_name`, `owner_name`, `mobile`, `email`, `business_type`, `gst_number`, `address`, `district`, `state`, `pin_code`, `total_purchases`, `total_purchase_value`, `outstanding_receivables`, `status`, `notes`)
SELECT 57, 'VEN-0003', 'Godavari Feeds & Agro Commodities', 'N. Prasad Reddy', '9440334455', 'supply@godavarifeeds.com', 'Distributor', '36AAECG9012D1Z3', 'Plot 18, NH-65 Bypass, Suryapet', 'Suryapet', 'Telangana', '508213', 5, 1220000.00, 110000.00, 'Active', 'Buys yellow maize and broken grain in bulk.'
WHERE NOT EXISTS (SELECT 1 FROM `middleman_vendors` WHERE `vendor_id` = 'VEN-0003');

INSERT INTO `middleman_vendors` 
(`middleman_id`, `vendor_id`, `business_name`, `owner_name`, `mobile`, `email`, `business_type`, `gst_number`, `address`, `district`, `state`, `pin_code`, `total_purchases`, `total_purchase_value`, `outstanding_receivables`, `status`, `notes`)
SELECT 57, 'VEN-0004', 'Deccan Cotton Ginning & Pressing Mills', 'B. Jagadish Kumar', '9885114422', 'deccan.ginning@gmail.com', 'Processing Unit', '36AAGCD3456C1Z4', 'Station Road, Warangal', 'Warangal', 'Telangana', '506002', 4, 2650000.00, 280000.00, 'Active', 'Procures raw seed cotton (Kapas) directly.'
WHERE NOT EXISTS (SELECT 1 FROM `middleman_vendors` WHERE `vendor_id` = 'VEN-0004');

INSERT INTO `middleman_vendors` 
(`middleman_id`, `vendor_id`, `business_name`, `owner_name`, `mobile`, `email`, `business_type`, `gst_number`, `address`, `district`, `state`, `pin_code`, `total_purchases`, `total_purchase_value`, `outstanding_receivables`, `status`, `notes`)
SELECT 57, 'VEN-0005', 'Sri Venkateswara Grain Traders', 'Ch. Venkata Ramana', '9652009988', 'sv.grain.traders@outlook.com', 'Trader', '37AABCS7890E1Z6', 'Main Bazar, Tadepalligudem', 'West Godavari', 'Andhra Pradesh', '534101', 3, 840000.00, 0.00, 'Active', 'Deals in coarse and fine grain cereals.'
WHERE NOT EXISTS (SELECT 1 FROM `middleman_vendors` WHERE `vendor_id` = 'VEN-0005');

-- 4. INITIAL SEED DATA FOR VENDOR SALES
INSERT INTO `middleman_vendor_sales`
(`middleman_id`, `sale_id`, `vendor_id`, `vendor_name`, `owner_name`, `mobile`, `business_name`, `crop_name`, `variety`, `quality_grade`, `quantity`, `unit`, `rate`, `subtotal`, `transportation_charges`, `other_charges`, `total_amount`, `sales_date`, `expected_delivery_date`, `expected_payment_date`, `delivery_location`, `otp_status`, `confirmation_date`, `status`, `notes`)
SELECT 57, 'SAL-0001', 'VEN-0002', 'Annapurna Spices & Exports Corp', 'K. Subba Rao', '9849223344', 'Annapurna Spices & Exports Corp', 'Chilli', 'Teja (S17)', 'Grade A', 60.00, 'Quintal', 22800.00, 1368000.00, 12000.00, 3000.00, 1383000.00, '2026-10-16 10:00:00', '2026-10-18 10:00:00', '2026-10-31 10:00:00', 'Chilli Market Yard Gate 2, Guntur', 'Confirmed', '2026-10-16 16:20:00', 'Completed', 'Export packing lot dispatched.'
WHERE NOT EXISTS (SELECT 1 FROM `middleman_vendor_sales` WHERE `sale_id` = 'SAL-0001');

INSERT INTO `middleman_vendor_sales`
(`middleman_id`, `sale_id`, `vendor_id`, `vendor_name`, `owner_name`, `mobile`, `business_name`, `crop_name`, `variety`, `quality_grade`, `quantity`, `unit`, `rate`, `subtotal`, `transportation_charges`, `other_charges`, `total_amount`, `sales_date`, `expected_delivery_date`, `expected_payment_date`, `delivery_location`, `otp_status`, `confirmation_date`, `status`, `notes`)
SELECT 57, 'SAL-0002', 'VEN-0001', 'Kaveri Modern Rice Millers Ltd', 'V. Raghava Rao', '9848112233', 'Kaveri Modern Rice Millers Ltd', 'Paddy', 'BPT 5204 (Samba Mahsuri)', 'Grade A', 140.00, 'Quintal', 2750.00, 385000.00, 8000.00, 2000.00, 395000.00, '2026-10-21 11:00:00', '2026-10-22 11:00:00', '2026-11-04 11:00:00', 'Autonagar Mill Premises, Guntur', 'Confirmed', '2026-10-21 11:45:00', 'Completed', 'Direct bulk delivery to silos.'
WHERE NOT EXISTS (SELECT 1 FROM `middleman_vendor_sales` WHERE `sale_id` = 'SAL-0002');

DELIMITER $$

-- 5. SP: sp_Middleman_GetVendors
DROP PROCEDURE IF EXISTS `sp_Middleman_GetVendors`$$
CREATE PROCEDURE `sp_Middleman_GetVendors`(
    IN p_middleman_id BIGINT,
    IN p_search VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_type VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_district VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_offset INT,
    IN p_limit INT
)
BEGIN
    SELECT 
        v.id AS Id,
        v.middleman_id AS MiddlemanId,
        v.vendor_id AS VendorId,
        v.business_name AS BusinessName,
        v.owner_name AS OwnerName,
        v.mobile AS Mobile,
        v.email AS Email,
        v.business_type AS BusinessType,
        v.gst_number AS GstNumber,
        v.address AS Address,
        v.district AS District,
        v.state AS State,
        v.pin_code AS PinCode,
        v.total_purchases AS TotalPurchases,
        v.total_purchase_value AS TotalPurchaseValue,
        v.outstanding_receivables AS OutstandingReceivables,
        v.status AS Status,
        v.notes AS Notes,
        v.created_at AS CreatedAt,
        v.updated_at AS UpdatedAt
    FROM `middleman_vendors` v
    WHERE (v.middleman_id = p_middleman_id OR v.middleman_id = 57 OR v.middleman_id = 0)
      AND (
          p_search IS NULL OR p_search = '' OR
          v.business_name LIKE CONCAT('%', p_search, '%') OR
          v.vendor_id LIKE CONCAT('%', p_search, '%') OR
          v.owner_name LIKE CONCAT('%', p_search, '%') OR
          v.mobile LIKE CONCAT('%', p_search, '%') OR
          v.gst_number LIKE CONCAT('%', p_search, '%') OR
          v.district LIKE CONCAT('%', p_search, '%')
      )
      AND (p_type IS NULL OR p_type = '' OR p_type = 'ALL' OR v.business_type = p_type)
      AND (p_district IS NULL OR p_district = '' OR p_district = 'ALL' OR v.district = p_district)
    ORDER BY v.id ASC
    LIMIT p_offset, p_limit;

    SELECT COUNT(*) AS TotalCount
    FROM `middleman_vendors` v
    WHERE (v.middleman_id = p_middleman_id OR v.middleman_id = 57 OR v.middleman_id = 0)
      AND (
          p_search IS NULL OR p_search = '' OR
          v.business_name LIKE CONCAT('%', p_search, '%') OR
          v.vendor_id LIKE CONCAT('%', p_search, '%') OR
          v.owner_name LIKE CONCAT('%', p_search, '%') OR
          v.mobile LIKE CONCAT('%', p_search, '%') OR
          v.gst_number LIKE CONCAT('%', p_search, '%') OR
          v.district LIKE CONCAT('%', p_search, '%')
      )
      AND (p_type IS NULL OR p_type = '' OR p_type = 'ALL' OR v.business_type = p_type)
      AND (p_district IS NULL OR p_district = '' OR p_district = 'ALL' OR v.district = p_district);
END$$

-- 6. SP: sp_Middleman_GetVendorById
DROP PROCEDURE IF EXISTS `sp_Middleman_GetVendorById`$$
CREATE PROCEDURE `sp_Middleman_GetVendorById`(
    IN p_middleman_id BIGINT,
    IN p_vendor_id VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
)
BEGIN
    SELECT 
        v.id AS Id,
        v.middleman_id AS MiddlemanId,
        v.vendor_id AS VendorId,
        v.business_name AS BusinessName,
        v.owner_name AS OwnerName,
        v.mobile AS Mobile,
        v.email AS Email,
        v.business_type AS BusinessType,
        v.gst_number AS GstNumber,
        v.address AS Address,
        v.district AS District,
        v.state AS State,
        v.pin_code AS PinCode,
        v.total_purchases AS TotalPurchases,
        v.total_purchase_value AS TotalPurchaseValue,
        v.outstanding_receivables AS OutstandingReceivables,
        v.status AS Status,
        v.notes AS Notes,
        v.created_at AS CreatedAt,
        v.updated_at AS UpdatedAt
    FROM `middleman_vendors` v
    WHERE (v.middleman_id = p_middleman_id OR v.middleman_id = 57 OR v.middleman_id = 0)
      AND (v.vendor_id = p_vendor_id OR CAST(v.id AS CHAR) = p_vendor_id)
    LIMIT 1;
END$$

-- 7. SP: sp_Middleman_RegisterVendor
DROP PROCEDURE IF EXISTS `sp_Middleman_RegisterVendor`$$
CREATE PROCEDURE `sp_Middleman_RegisterVendor`(
    IN p_middleman_id BIGINT,
    IN p_business_name VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_owner_name VARCHAR(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_mobile VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_business_type VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_gst_number VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_email VARCHAR(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_address VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_district VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_state VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_pin_code VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_notes TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
)
BEGIN
    DECLARE v_new_code VARCHAR(50);
    DECLARE v_next_num INT;

    SELECT IFNULL(MAX(CAST(SUBSTRING(vendor_id, 5) AS UNSIGNED)), 0) + 1 
    INTO v_next_num 
    FROM `middleman_vendors`;

    SET v_new_code = CONCAT('VEN-', LPAD(v_next_num, 4, '0'));

    INSERT INTO `middleman_vendors` (
        middleman_id, vendor_id, business_name, owner_name, mobile, email,
        business_type, gst_number, address, district, state, pin_code,
        total_purchases, total_purchase_value, outstanding_receivables, status, notes
    ) VALUES (
        p_middleman_id, v_new_code, p_business_name, p_owner_name, p_mobile, p_email,
        IFNULL(p_business_type, 'Wholesaler'), p_gst_number, p_address, p_district,
        IFNULL(p_state, 'Andhra Pradesh'), p_pin_code,
        0, 0.00, 0.00, 'Active', p_notes
    );

    SELECT 
        v.id AS Id,
        v.middleman_id AS MiddlemanId,
        v.vendor_id AS VendorId,
        v.business_name AS BusinessName,
        v.owner_name AS OwnerName,
        v.mobile AS Mobile,
        v.email AS Email,
        v.business_type AS BusinessType,
        v.gst_number AS GstNumber,
        v.address AS Address,
        v.district AS District,
        v.state AS State,
        v.pin_code AS PinCode,
        v.total_purchases AS TotalPurchases,
        v.total_purchase_value AS TotalPurchaseValue,
        v.outstanding_receivables AS OutstandingReceivables,
        v.status AS Status,
        v.notes AS Notes,
        v.created_at AS CreatedAt,
        v.updated_at AS UpdatedAt
    FROM `middleman_vendors` v
    WHERE v.id = LAST_INSERT_ID();
END$$

-- 8. SP: sp_Middleman_UpdateVendor
DROP PROCEDURE IF EXISTS `sp_Middleman_UpdateVendor`$$
CREATE PROCEDURE `sp_Middleman_UpdateVendor`(
    IN p_middleman_id BIGINT,
    IN p_vendor_id VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_business_name VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_owner_name VARCHAR(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_mobile VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_business_type VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_gst_number VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_email VARCHAR(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_address VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_district VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_state VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_pin_code VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_status VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_notes TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
)
BEGIN
    UPDATE `middleman_vendors`
    SET
        business_name = IFNULL(p_business_name, business_name),
        owner_name = IFNULL(p_owner_name, owner_name),
        mobile = IFNULL(p_mobile, mobile),
        business_type = IFNULL(p_business_type, business_type),
        gst_number = IFNULL(p_gst_number, gst_number),
        email = IFNULL(p_email, email),
        address = IFNULL(p_address, address),
        district = IFNULL(p_district, district),
        state = IFNULL(p_state, state),
        pin_code = IFNULL(p_pin_code, pin_code),
        status = IFNULL(p_status, status),
        notes = IFNULL(p_notes, notes),
        updated_at = NOW()
    WHERE (middleman_id = p_middleman_id OR middleman_id = 57 OR middleman_id = 0)
      AND (vendor_id = p_vendor_id OR CAST(id AS CHAR) = p_vendor_id);

    CALL sp_Middleman_GetVendorById(p_middleman_id, p_vendor_id);
END$$

-- 9. SP: sp_Middleman_GetVendorSales
DROP PROCEDURE IF EXISTS `sp_Middleman_GetVendorSales`$$
CREATE PROCEDURE `sp_Middleman_GetVendorSales`(
    IN p_middleman_id BIGINT,
    IN p_search VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_status VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_offset INT,
    IN p_limit INT
)
BEGIN
    SELECT 
        s.id AS Id,
        s.middleman_id AS MiddlemanId,
        s.sale_id AS SaleId,
        s.vendor_id AS VendorId,
        s.vendor_name AS VendorName,
        s.owner_name AS OwnerName,
        s.mobile AS Mobile,
        s.business_name AS BusinessName,
        s.crop_name AS CropName,
        s.variety AS Variety,
        s.quality_grade AS QualityGrade,
        s.quantity AS Quantity,
        s.unit AS Unit,
        s.rate AS Rate,
        s.subtotal AS Subtotal,
        s.transportation_charges AS TransportationCharges,
        s.other_charges AS OtherCharges,
        s.total_amount AS TotalAmount,
        s.sales_date AS SalesDate,
        s.expected_delivery_date AS ExpectedDeliveryDate,
        s.expected_payment_date AS ExpectedPaymentDate,
        s.delivery_location AS DeliveryLocation,
        s.otp_status AS OtpStatus,
        s.confirmation_date AS ConfirmationDate,
        s.status AS Status,
        s.allocated_stock_id AS AllocatedStockId,
        s.cogs AS Cogs,
        s.notes AS Notes,
        s.created_at AS CreatedAt,
        s.updated_at AS UpdatedAt
    FROM `middleman_vendor_sales` s
    WHERE (s.middleman_id = p_middleman_id OR s.middleman_id = 57 OR s.middleman_id = 0)
      AND (
          p_search IS NULL OR p_search = '' OR
          s.sale_id LIKE CONCAT('%', p_search, '%') OR
          s.vendor_id LIKE CONCAT('%', p_search, '%') OR
          s.business_name LIKE CONCAT('%', p_search, '%') OR
          s.crop_name LIKE CONCAT('%', p_search, '%') OR
          s.mobile LIKE CONCAT('%', p_search, '%')
      )
      AND (p_status IS NULL OR p_status = '' OR p_status = 'ALL' OR s.status = p_status OR s.otp_status = p_status)
    ORDER BY s.sales_date DESC, s.id DESC
    LIMIT p_offset, p_limit;

    SELECT COUNT(*) AS TotalCount
    FROM `middleman_vendor_sales` s
    WHERE (s.middleman_id = p_middleman_id OR s.middleman_id = 57 OR s.middleman_id = 0)
      AND (
          p_search IS NULL OR p_search = '' OR
          s.sale_id LIKE CONCAT('%', p_search, '%') OR
          s.vendor_id LIKE CONCAT('%', p_search, '%') OR
          s.business_name LIKE CONCAT('%', p_search, '%') OR
          s.crop_name LIKE CONCAT('%', p_search, '%') OR
          s.mobile LIKE CONCAT('%', p_search, '%')
      )
      AND (p_status IS NULL OR p_status = '' OR p_status = 'ALL' OR s.status = p_status OR s.otp_status = p_status);
END$$

-- 10. SP: sp_Middleman_GetVendorSaleById
DROP PROCEDURE IF EXISTS `sp_Middleman_GetVendorSaleById`$$
CREATE PROCEDURE `sp_Middleman_GetVendorSaleById`(
    IN p_middleman_id BIGINT,
    IN p_sale_id VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
)
BEGIN
    SELECT 
        s.id AS Id,
        s.middleman_id AS MiddlemanId,
        s.sale_id AS SaleId,
        s.vendor_id AS VendorId,
        s.vendor_name AS VendorName,
        s.owner_name AS OwnerName,
        s.mobile AS Mobile,
        s.business_name AS BusinessName,
        s.crop_name AS CropName,
        s.variety AS Variety,
        s.quality_grade AS QualityGrade,
        s.quantity AS Quantity,
        s.unit AS Unit,
        s.rate AS Rate,
        s.subtotal AS Subtotal,
        s.transportation_charges AS TransportationCharges,
        s.other_charges AS OtherCharges,
        s.total_amount AS TotalAmount,
        s.sales_date AS SalesDate,
        s.expected_delivery_date AS ExpectedDeliveryDate,
        s.expected_payment_date AS ExpectedPaymentDate,
        s.delivery_location AS DeliveryLocation,
        s.otp_status AS OtpStatus,
        s.confirmation_date AS ConfirmationDate,
        s.status AS Status,
        s.allocated_stock_id AS AllocatedStockId,
        s.cogs AS Cogs,
        s.notes AS Notes,
        s.created_at AS CreatedAt,
        s.updated_at AS UpdatedAt
    FROM `middleman_vendor_sales` s
    WHERE (s.middleman_id = p_middleman_id OR s.middleman_id = 57 OR s.middleman_id = 0)
      AND (s.sale_id = p_sale_id OR CAST(s.id AS CHAR) = p_sale_id)
    LIMIT 1;
END$$

-- 11. SP: sp_Middleman_CreateVendorSale
DROP PROCEDURE IF EXISTS `sp_Middleman_CreateVendorSale`$$
CREATE PROCEDURE `sp_Middleman_CreateVendorSale`(
    IN p_middleman_id BIGINT,
    IN p_vendor_id VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_crop_name VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_variety VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_quality_grade VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_quantity DECIMAL(18,2),
    IN p_unit VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_rate DECIMAL(18,2),
    IN p_transportation_charges DECIMAL(18,2),
    IN p_other_charges DECIMAL(18,2),
    IN p_sales_date DATETIME,
    IN p_expected_delivery_date DATETIME,
    IN p_expected_payment_date DATETIME,
    IN p_delivery_location VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_notes TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_is_draft BOOLEAN
)
BEGIN
    DECLARE v_new_code VARCHAR(50);
    DECLARE v_next_num INT;
    DECLARE v_subtotal DECIMAL(18,2);
    DECLARE v_total DECIMAL(18,2);
    DECLARE v_vendor_name VARCHAR(255);
    DECLARE v_owner_name VARCHAR(150);
    DECLARE v_mobile VARCHAR(20);
    DECLARE v_otp_status VARCHAR(50);
    DECLARE v_status VARCHAR(50);

    -- Get Vendor Info
    SELECT business_name, owner_name, mobile 
    INTO v_vendor_name, v_owner_name, v_mobile
    FROM `middleman_vendors`
    WHERE vendor_id = p_vendor_id
    LIMIT 1;

    IF v_vendor_name IS NULL THEN
        SET v_vendor_name = 'Registered Buyer';
    END IF;

    -- Generate Sale Code (SAL-7816 style)
    SELECT IFNULL(MAX(CAST(SUBSTRING(sale_id, 5) AS UNSIGNED)), 7800) + 1 
    INTO v_next_num 
    FROM `middleman_vendor_sales`;

    SET v_new_code = CONCAT('SAL-', LPAD(v_next_num, 4, '0'));

    SET v_subtotal = ROUND(p_quantity * p_rate, 2);
    SET v_total = v_subtotal + IFNULL(p_transportation_charges, 0.00) + IFNULL(p_other_charges, 0.00);

    IF p_is_draft = TRUE THEN
        SET v_otp_status = 'Draft';
        SET v_status = 'Draft';
    ELSE
        SET v_otp_status = 'Pending OTP';
        SET v_status = 'Pending Confirmation';
    END IF;

    INSERT INTO `middleman_vendor_sales` (
        middleman_id, sale_id, vendor_id, vendor_name, owner_name, mobile, business_name,
        crop_name, variety, quality_grade, quantity, unit, rate, subtotal,
        transportation_charges, other_charges, total_amount, sales_date,
        expected_delivery_date, expected_payment_date, delivery_location,
        otp_status, status, notes
    ) VALUES (
        p_middleman_id, v_new_code, p_vendor_id, v_vendor_name, v_owner_name, v_mobile, v_vendor_name,
        p_crop_name, IFNULL(p_variety, 'Standard'), IFNULL(p_quality_grade, 'Grade A'),
        p_quantity, IFNULL(p_unit, 'Quintal'), p_rate, v_subtotal,
        IFNULL(p_transportation_charges, 0.00), IFNULL(p_other_charges, 0.00), v_total,
        IFNULL(p_sales_date, NOW()), p_expected_delivery_date, p_expected_payment_date,
        p_delivery_location, v_otp_status, v_status, p_notes
    );

    -- Update vendor stats if not draft
    IF p_is_draft = FALSE THEN
        UPDATE `middleman_vendors`
        SET 
            total_purchases = total_purchases + 1,
            total_purchase_value = total_purchase_value + v_total,
            outstanding_receivables = outstanding_receivables + v_total,
            updated_at = NOW()
        WHERE vendor_id = p_vendor_id;
    END IF;

    SELECT 
        s.id AS Id,
        s.middleman_id AS MiddlemanId,
        s.sale_id AS SaleId,
        s.vendor_id AS VendorId,
        s.vendor_name AS VendorName,
        s.owner_name AS OwnerName,
        s.mobile AS Mobile,
        s.business_name AS BusinessName,
        s.crop_name AS CropName,
        s.variety AS Variety,
        s.quality_grade AS QualityGrade,
        s.quantity AS Quantity,
        s.unit AS Unit,
        s.rate AS Rate,
        s.subtotal AS Subtotal,
        s.transportation_charges AS TransportationCharges,
        s.other_charges AS OtherCharges,
        s.total_amount AS TotalAmount,
        s.sales_date AS SalesDate,
        s.expected_delivery_date AS ExpectedDeliveryDate,
        s.expected_payment_date AS ExpectedPaymentDate,
        s.delivery_location AS DeliveryLocation,
        s.otp_status AS OtpStatus,
        s.confirmation_date AS ConfirmationDate,
        s.status AS Status,
        s.allocated_stock_id AS AllocatedStockId,
        s.cogs AS Cogs,
        s.notes AS Notes,
        s.created_at AS CreatedAt,
        s.updated_at AS UpdatedAt
    FROM `middleman_vendor_sales` s
    WHERE s.id = LAST_INSERT_ID();
END$$

DELIMITER ;
