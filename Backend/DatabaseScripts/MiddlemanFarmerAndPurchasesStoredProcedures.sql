-- ============================================================================
-- ARPPB: Middleman Farmer Management & Purchase Stored Procedures (MariaDB 11+)
-- Run against database: u819242402_arppb
-- All tables prefixed with: middleman_
-- All stored procedures prefixed with: sp_Middleman
-- Zero collision with other teammates' tables or procedures.
-- ============================================================================
USE `u819242402_arppb`;

-- ----------------------------------------------------------------------------
-- 1. CREATE TABLE: middleman_farmers
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `middleman_farmers` (
    `id` BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `middleman_id` BIGINT NOT NULL,
    `farmer_code` VARCHAR(50) NOT NULL,
    `name` VARCHAR(150) NOT NULL,
    `mobile` VARCHAR(20) NOT NULL,
    `email` VARCHAR(150) NULL,
    `village` VARCHAR(100) NOT NULL,
    `mandal` VARCHAR(100) NULL,
    `district` VARCHAR(100) NOT NULL,
    `state` VARCHAR(100) NOT NULL DEFAULT 'Andhra Pradesh',
    `pincode` VARCHAR(20) NULL,
    `complete_address` VARCHAR(500) NULL,
    `crops` TEXT NOT NULL,
    `notes` TEXT NULL,
    `total_purchases` INT NOT NULL DEFAULT 0,
    `total_quantity_purchased` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    `total_purchase_value` DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    `outstanding_payables` DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    `pending_confirmations` INT NOT NULL DEFAULT 0,
    `status` VARCHAR(50) NOT NULL DEFAULT 'Active',
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    INDEX `idx_mf_middleman_id` (`middleman_id`),
    INDEX `idx_mf_farmer_code` (`farmer_code`),
    INDEX `idx_mf_mobile` (`mobile`),
    INDEX `idx_mf_district` (`district`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 2. ENSURE COLUMNS ON middleman_purchases
-- ----------------------------------------------------------------------------
DELIMITER $$
CREATE PROCEDURE `sp_AddMiddlemanPurchaseColumnsIfNotExist`()
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.COLUMNS 
        WHERE TABLE_SCHEMA = 'u819242402_arppb' 
          AND TABLE_NAME = 'middleman_purchases' 
          AND COLUMN_NAME = 'transportation_charges'
    ) THEN
        ALTER TABLE `middleman_purchases` ADD COLUMN `transportation_charges` DECIMAL(12,2) NOT NULL DEFAULT 0.00 AFTER `subtotal`;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.COLUMNS 
        WHERE TABLE_SCHEMA = 'u819242402_arppb' 
          AND TABLE_NAME = 'middleman_purchases' 
          AND COLUMN_NAME = 'loading_charges'
    ) THEN
        ALTER TABLE `middleman_purchases` ADD COLUMN `loading_charges` DECIMAL(12,2) NOT NULL DEFAULT 0.00 AFTER `transportation_charges`;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.COLUMNS 
        WHERE TABLE_SCHEMA = 'u819242402_arppb' 
          AND TABLE_NAME = 'middleman_purchases' 
          AND COLUMN_NAME = 'other_charges'
    ) THEN
        ALTER TABLE `middleman_purchases` ADD COLUMN `other_charges` DECIMAL(12,2) NOT NULL DEFAULT 0.00 AFTER `loading_charges`;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.COLUMNS 
        WHERE TABLE_SCHEMA = 'u819242402_arppb' 
          AND TABLE_NAME = 'middleman_purchases' 
          AND COLUMN_NAME = 'quality_grade'
    ) THEN
        ALTER TABLE `middleman_purchases` ADD COLUMN `quality_grade` VARCHAR(50) NOT NULL DEFAULT 'Grade A' AFTER `variety`;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.COLUMNS 
        WHERE TABLE_SCHEMA = 'u819242402_arppb' 
          AND TABLE_NAME = 'middleman_purchases' 
          AND COLUMN_NAME = 'pickup_location'
    ) THEN
        ALTER TABLE `middleman_purchases` ADD COLUMN `pickup_location` VARCHAR(255) NULL AFTER `expected_payment_date`;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.COLUMNS 
        WHERE TABLE_SCHEMA = 'u819242402_arppb' 
          AND TABLE_NAME = 'middleman_purchases' 
          AND COLUMN_NAME = 'delivery_date'
    ) THEN
        ALTER TABLE `middleman_purchases` ADD COLUMN `delivery_date` DATE NULL AFTER `pickup_location`;
    END IF;
END$$
DELIMITER ;

CALL `sp_AddMiddlemanPurchaseColumnsIfNotExist`();
DROP PROCEDURE IF EXISTS `sp_AddMiddlemanPurchaseColumnsIfNotExist`;

-- ----------------------------------------------------------------------------
-- 3. SEED 6 ACTIVE FARMERS FOR MIDDLEMAN 57 (MATCHING SCREENSHOT 100%)
-- ----------------------------------------------------------------------------
DELETE FROM `middleman_farmers` WHERE `middleman_id` = 57 OR `farmer_code` IN ('FAR-0001', 'FAR-0002', 'FAR-0003', 'FAR-0004', 'FAR-0005', 'FAR-0006');

INSERT INTO `middleman_farmers` (
    `middleman_id`, `farmer_code`, `name`, `mobile`, `email`, `village`, `mandal`, `district`,
    `state`, `pincode`, `complete_address`, `crops`, `notes`, `total_purchases`, `total_quantity_purchased`,
    `total_purchase_value`, `outstanding_payables`, `pending_confirmations`, `status`, `created_at`, `updated_at`
) VALUES
(
    57, 'FAR-0001', 'M. Chenna Reddy', '9849123450', 'chenna.reddy@gmail.com',
    'Pedanandipadu', 'Pedanandipadu', 'Guntur', 'Andhra Pradesh', '522235',
    'Door No. 3-45, Main Bazar, Pedanandipadu Village, Guntur Dist.',
    'Chilli,Cotton,Paddy', 'Premium Teja chilli producer. Consistent Grade-A quality.',
    6, 450.00, 1825000.00, 175000.00, 0, 'Active', NOW(6), NOW(6)
),
(
    57, 'FAR-0002', 'B. Srinivasulu', '9440187654', '',
    'Appikatla', 'Bapatla', 'Bapatla', 'Andhra Pradesh', '522310',
    'H.No. 1-12, Rythu Sangham Street, Appikatla, Bapatla Dist.',
    'Paddy,Maize', 'Cultivates BPT 5204 fine rice paddy.',
    4, 380.00, 912000.00, 0.00, 1, 'Active', NOW(6), NOW(6)
),
(
    57, 'FAR-0003', 'G. Rama Krishna', '9989345612', 'gramakrishna.farmer@yahoo.com',
    'Vemuru', 'Vemuru', 'Guntur', 'Andhra Pradesh', '522261',
    'Near Sub Station, Vemuru, Guntur Dist.',
    'Maize,Groundnut', 'High-yield hybrid maize grower.',
    5, 290.00, 685000.00, 45000.00, 0, 'Active', NOW(6), NOW(6)
),
(
    57, 'FAR-0004', 'K. Tirupathi Rao', '9701238901', '',
    'Jannaram', 'Jannaram', 'Mancherial', 'Telangana', '504205',
    'Plot No 14, Agricultural Market Road, Jannaram.',
    'Cotton,Paddy', 'Long-staple cotton specialist.',
    3, 210.00, 1470000.00, 0.00, 0, 'Active', NOW(6), NOW(6)
),
(
    57, 'FAR-0005', 'V. Satyanarayana', '9491234567', 'vsatya.farmer@gmail.com',
    'Kovvur', 'Kovvur', 'East Godavari', 'Andhra Pradesh', '534350',
    'Godavari Bund Road, Kovvur, East Godavari Dist.',
    'Wheat,Paddy', 'Organic and premium grain cultivator.',
    4, 270.00, 715500.00, 35000.00, 0, 'Active', NOW(6), NOW(6)
),
(
    57, 'FAR-0006', 'P. Ravindra Reddy', '9848012345', '',
    'Tenali', 'Tenali', 'Guntur', 'Andhra Pradesh', '522201',
    'Bose Road, Tenali, Guntur Dist.',
    'Groundnut,Chilli', 'Specializes in bold seed groundnut pods.',
    2, 140.00, 952000.00, 0.00, 0, 'Active', NOW(6), NOW(6)
);

-- ----------------------------------------------------------------------------
-- 4. STORED PROCEDURES: FARMER MANAGEMENT
-- ----------------------------------------------------------------------------

-- Procedure 1: sp_MiddlemanGetFarmers
DROP PROCEDURE IF EXISTS `sp_MiddlemanGetFarmers`;
DELIMITER $$
CREATE PROCEDURE `sp_MiddlemanGetFarmers`(
    IN p_middleman_id BIGINT,
    IN p_search VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_crop VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_district VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_status VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_offset INT,
    IN p_limit INT
)
BEGIN
    SELECT 
        `id` AS Id,
        `middleman_id` AS MiddlemanId,
        `farmer_code` AS FarmerId,
        `name` AS Name,
        `mobile` AS Mobile,
        `email` AS Email,
        `village` AS Village,
        `mandal` AS Mandal,
        `district` AS District,
        `state` AS State,
        `pincode` AS PinCode,
        `complete_address` AS CompleteAddress,
        `crops` AS Crops,
        `notes` AS Notes,
        `total_purchases` AS TotalPurchases,
        `total_quantity_purchased` AS TotalQuantityPurchased,
        `total_purchase_value` AS TotalPurchaseValue,
        `outstanding_payables` AS OutstandingPayables,
        `pending_confirmations` AS PendingConfirmations,
        `status` AS Status,
        `created_at` AS CreatedAt,
        `updated_at` AS UpdatedAt
    FROM `middleman_farmers`
    WHERE `middleman_id` = p_middleman_id
      AND (p_crop IS NULL OR p_crop = '' OR UPPER(p_crop) = 'ALL' OR LOWER(`crops`) LIKE CONCAT('%', LOWER(p_crop), '%'))
      AND (p_district IS NULL OR p_district = '' OR UPPER(p_district) = 'ALL' OR LOWER(`district`) = LOWER(p_district))
      AND (p_status IS NULL OR p_status = '' OR UPPER(p_status) = 'ALL' OR LOWER(`status`) = LOWER(p_status))
      AND (
          p_search IS NULL OR p_search = '' OR
          LOWER(`name`) LIKE CONCAT('%', LOWER(p_search), '%') OR
          LOWER(`farmer_code`) LIKE CONCAT('%', LOWER(p_search), '%') OR
          LOWER(`mobile`) LIKE CONCAT('%', LOWER(p_search), '%') OR
          LOWER(`village`) LIKE CONCAT('%', LOWER(p_search), '%') OR
          LOWER(`district`) LIKE CONCAT('%', LOWER(p_search), '%')
      )
    ORDER BY `id` ASC
    LIMIT p_limit OFFSET p_offset;
END$$
DELIMITER ;

-- Procedure 2: sp_MiddlemanGetFarmerById
DROP PROCEDURE IF EXISTS `sp_MiddlemanGetFarmerById`;
DELIMITER $$
CREATE PROCEDURE `sp_MiddlemanGetFarmerById`(
    IN p_middleman_id BIGINT,
    IN p_farmer_code VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
)
BEGIN
    SELECT 
        `id` AS Id,
        `middleman_id` AS MiddlemanId,
        `farmer_code` AS FarmerId,
        `name` AS Name,
        `mobile` AS Mobile,
        `email` AS Email,
        `village` AS Village,
        `mandal` AS Mandal,
        `district` AS District,
        `state` AS State,
        `pincode` AS PinCode,
        `complete_address` AS CompleteAddress,
        `crops` AS Crops,
        `notes` AS Notes,
        `total_purchases` AS TotalPurchases,
        `total_quantity_purchased` AS TotalQuantityPurchased,
        `total_purchase_value` AS TotalPurchaseValue,
        `outstanding_payables` AS OutstandingPayables,
        `pending_confirmations` AS PendingConfirmations,
        `status` AS Status,
        `created_at` AS CreatedAt,
        `updated_at` AS UpdatedAt
    FROM `middleman_farmers`
    WHERE `middleman_id` = p_middleman_id
      AND (`farmer_code` = p_farmer_code OR CAST(`id` AS CHAR) = p_farmer_code)
    LIMIT 1;
END$$
DELIMITER ;

-- Procedure 3: sp_MiddlemanRegisterFarmer
DROP PROCEDURE IF EXISTS `sp_MiddlemanRegisterFarmer`;
DELIMITER $$
CREATE PROCEDURE `sp_MiddlemanRegisterFarmer`(
    IN p_middleman_id BIGINT,
    IN p_name VARCHAR(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_mobile VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_email VARCHAR(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_village VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_mandal VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_district VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_state VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_pincode VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_address VARCHAR(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_crops TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_notes TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
)
BEGIN
    DECLARE v_count INT;
    DECLARE v_new_code VARCHAR(50);

    SELECT COUNT(*) INTO v_count FROM `middleman_farmers`;
    SET v_new_code = CONCAT('FAR-', LPAD(v_count + 1, 4, '0'));

    INSERT INTO `middleman_farmers` (
        `middleman_id`, `farmer_code`, `name`, `mobile`, `email`,
        `village`, `mandal`, `district`, `state`, `pincode`,
        `complete_address`, `crops`, `notes`, `status`, `created_at`, `updated_at`
    ) VALUES (
        p_middleman_id, v_new_code, p_name, p_mobile, p_email,
        p_village, p_mandal, p_district, COALESCE(p_state, 'Andhra Pradesh'), p_pincode,
        p_address, p_crops, p_notes, 'Active', NOW(6), NOW(6)
    );

    SELECT 
        `id` AS Id,
        `middleman_id` AS MiddlemanId,
        `farmer_code` AS FarmerId,
        `name` AS Name,
        `mobile` AS Mobile,
        `email` AS Email,
        `village` AS Village,
        `mandal` AS Mandal,
        `district` AS District,
        `state` AS State,
        `pincode` AS PinCode,
        `complete_address` AS CompleteAddress,
        `crops` AS Crops,
        `notes` AS Notes,
        `total_purchases` AS TotalPurchases,
        `total_quantity_purchased` AS TotalQuantityPurchased,
        `total_purchase_value` AS TotalPurchaseValue,
        `outstanding_payables` AS OutstandingPayables,
        `pending_confirmations` AS PendingConfirmations,
        `status` AS Status,
        `created_at` AS CreatedAt,
        `updated_at` AS UpdatedAt
    FROM `middleman_farmers`
    WHERE `id` = LAST_INSERT_ID();
END$$
DELIMITER ;

-- Procedure 4: sp_MiddlemanGetFarmerHistory
DROP PROCEDURE IF EXISTS `sp_MiddlemanGetFarmerHistory`;
DELIMITER $$
CREATE PROCEDURE `sp_MiddlemanGetFarmerHistory`(
    IN p_middleman_id BIGINT,
    IN p_farmer_code VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
)
BEGIN
    -- Return purchases with this farmer
    SELECT 
        `id` AS Id,
        `purchase_code` AS PurchaseId,
        `crop_name` AS CropName,
        `variety` AS Variety,
        `quantity` AS Quantity,
        `unit` AS Unit,
        `rate` AS Rate,
        `total_amount` AS TotalAmount,
        `purchase_date` AS PurchaseDate,
        `status` AS Status,
        `otp_status` AS OtpStatus
    FROM `middleman_purchases`
    WHERE `middleman_id` = p_middleman_id
      AND `farmer_id` = p_farmer_code
    ORDER BY `purchase_date` DESC;

    -- Return ledger vouchers with this farmer
    SELECT 
        `id` AS Id,
        `ledger_code` AS LedgerId,
        `date` AS Date,
        `transaction_id` AS TransactionId,
        `category` AS Category,
        `debit` AS Debit,
        `credit` AS Credit,
        `outstanding_amount` AS OutstandingAmount,
        `settled_amount` AS SettledAmount,
        `status` AS Status
    FROM `middleman_ledger`
    WHERE `middleman_id` = p_middleman_id
      AND `party_id` = p_farmer_code
    ORDER BY `date` DESC;
END$$
DELIMITER ;

-- ----------------------------------------------------------------------------
-- 5. STORED PROCEDURES: PURCHASE FROM FARMERS
-- ----------------------------------------------------------------------------

-- Procedure 5: sp_MiddlemanCreatePurchase
DROP PROCEDURE IF EXISTS `sp_MiddlemanCreatePurchase`;
DELIMITER $$
CREATE PROCEDURE `sp_MiddlemanCreatePurchase`(
    IN p_middleman_id BIGINT,
    IN p_farmer_id VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_farmer_name VARCHAR(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_farmer_mobile VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_crop_name VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_variety VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_quality_grade VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_quantity DECIMAL(12,2),
    IN p_unit VARCHAR(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_rate DECIMAL(12,2),
    IN p_transport_charges DECIMAL(12,2),
    IN p_loading_charges DECIMAL(12,2),
    IN p_other_charges DECIMAL(12,2),
    IN p_purchase_date DATE,
    IN p_expected_payment_date DATE,
    IN p_pickup_location VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_delivery_date DATE,
    IN p_notes TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_is_draft BOOLEAN
)
BEGIN
    DECLARE v_count INT;
    DECLARE v_code VARCHAR(50);
    DECLARE v_subtotal DECIMAL(14,2);
    DECLARE v_additional DECIMAL(12,2);
    DECLARE v_total DECIMAL(14,2);
    DECLARE v_status VARCHAR(50);
    DECLARE v_otp_status VARCHAR(50);

    SELECT COUNT(*) INTO v_count FROM `middleman_purchases`;
    SET v_code = CONCAT('PUR-', LPAD(v_count + 1, 4, '0'));

    SET v_subtotal = ROUND(p_quantity * p_rate, 2);
    SET v_additional = ROUND(COALESCE(p_transport_charges, 0) + COALESCE(p_loading_charges, 0) + COALESCE(p_other_charges, 0), 2);
    SET v_total = v_subtotal + v_additional;

    IF p_is_draft THEN
        SET v_status = 'Draft';
        SET v_otp_status = 'Draft';
    ELSE
        SET v_status = 'Pending Confirmation';
        SET v_otp_status = 'Pending OTP';
    END IF;

    INSERT INTO `middleman_purchases` (
        `middleman_id`, `purchase_code`, `farmer_id`, `farmer_name`, `farmer_mobile`,
        `crop_name`, `variety`, `quality_grade`, `quantity`, `unit`, `rate`,
        `subtotal`, `transportation_charges`, `loading_charges`, `other_charges`,
        `additional_charges`, `total_amount`, `purchase_date`, `expected_payment_date`,
        `pickup_location`, `delivery_date`, `status`, `otp_status`, `notes`,
        `created_at`, `updated_at`
    ) VALUES (
        p_middleman_id, v_code, p_farmer_id, p_farmer_name, p_farmer_mobile,
        p_crop_name, COALESCE(p_variety, 'Standard'), COALESCE(p_quality_grade, 'Grade A'),
        p_quantity, COALESCE(p_unit, 'Quintal'), p_rate,
        v_subtotal, COALESCE(p_transport_charges, 0), COALESCE(p_loading_charges, 0), COALESCE(p_other_charges, 0),
        v_additional, v_total, COALESCE(p_purchase_date, CURDATE()), p_expected_payment_date,
        p_pickup_location, p_delivery_date, v_status, v_otp_status, p_notes,
        NOW(6), NOW(6)
    );

    -- If not draft, update farmer total purchases count & pending confirmations
    IF NOT p_is_draft THEN
        UPDATE `middleman_farmers`
        SET `total_purchases` = `total_purchases` + 1,
            `total_quantity_purchased` = `total_quantity_purchased` + p_quantity,
            `total_purchase_value` = `total_purchase_value` + v_total,
            `pending_confirmations` = `pending_confirmations` + 1,
            `updated_at` = NOW(6)
        WHERE `middleman_id` = p_middleman_id AND `farmer_code` = p_farmer_id;
    END IF;

    SELECT 
        `id` AS Id,
        `middleman_id` AS MiddlemanId,
        `purchase_code` AS PurchaseId,
        `farmer_id` AS FarmerId,
        `farmer_name` AS FarmerName,
        `farmer_mobile` AS FarmerMobile,
        `crop_name` AS CropName,
        `variety` AS Variety,
        `quality_grade` AS QualityGrade,
        `quantity` AS Quantity,
        `unit` AS Unit,
        `rate` AS Rate,
        `subtotal` AS Subtotal,
        `transportation_charges` AS TransportationCharges,
        `loading_charges` AS LoadingCharges,
        `other_charges` AS OtherCharges,
        `additional_charges` AS AdditionalCharges,
        `total_amount` AS TotalAmount,
        `purchase_date` AS PurchaseDate,
        `expected_payment_date` AS ExpectedPaymentDate,
        `pickup_location` AS PickupLocation,
        `delivery_date` AS DeliveryDate,
        `status` AS Status,
        `otp_status` AS OtpStatus,
        `notes` AS Notes,
        `created_at` AS CreatedAt,
        `updated_at` AS UpdatedAt
    FROM `middleman_purchases`
    WHERE `id` = LAST_INSERT_ID();
END$$
DELIMITER ;

-- Procedure 6: sp_MiddlemanGetPurchases
DROP PROCEDURE IF EXISTS `sp_MiddlemanGetPurchases`;
DELIMITER $$
CREATE PROCEDURE `sp_MiddlemanGetPurchases`(
    IN p_middleman_id BIGINT,
    IN p_status VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_search VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_offset INT,
    IN p_limit INT
)
BEGIN
    SELECT 
        `id` AS Id,
        `middleman_id` AS MiddlemanId,
        `purchase_code` AS PurchaseId,
        `farmer_id` AS FarmerId,
        `farmer_name` AS FarmerName,
        `farmer_mobile` AS FarmerMobile,
        `crop_name` AS CropName,
        `variety` AS Variety,
        `quality_grade` AS QualityGrade,
        `quantity` AS Quantity,
        `unit` AS Unit,
        `rate` AS Rate,
        `subtotal` AS Subtotal,
        `transportation_charges` AS TransportationCharges,
        `loading_charges` AS LoadingCharges,
        `other_charges` AS OtherCharges,
        `additional_charges` AS AdditionalCharges,
        `total_amount` AS TotalAmount,
        `purchase_date` AS PurchaseDate,
        `expected_payment_date` AS ExpectedPaymentDate,
        `pickup_location` AS PickupLocation,
        `delivery_date` AS DeliveryDate,
        `status` AS Status,
        `otp_status` AS OtpStatus,
        `notes` AS Notes,
        `created_at` AS CreatedAt,
        `updated_at` AS UpdatedAt
    FROM `middleman_purchases`
    WHERE `middleman_id` = p_middleman_id
      AND (p_status IS NULL OR p_status = '' OR UPPER(p_status) = 'ALL' OR LOWER(`status`) = LOWER(p_status) OR LOWER(`otp_status`) = LOWER(p_status))
      AND (
          p_search IS NULL OR p_search = '' OR
          LOWER(`purchase_code`) LIKE CONCAT('%', LOWER(p_search), '%') OR
          LOWER(`farmer_name`) LIKE CONCAT('%', LOWER(p_search), '%') OR
          LOWER(`crop_name`) LIKE CONCAT('%', LOWER(p_search), '%')
      )
    ORDER BY `purchase_date` DESC, `id` DESC
    LIMIT p_limit OFFSET p_offset;
END$$
DELIMITER ;
