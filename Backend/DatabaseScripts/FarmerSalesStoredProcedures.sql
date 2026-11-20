-- ============================================================================
-- ARPPB: Farmer Sales Stored Procedures (MySQL / MariaDB)
-- Run against database: u819242402_arppb
-- ============================================================================
USE `u819242402_arppb`;

-- ----------------------------------------------------------------------------
-- 1. Ensure farmer_sales table exists
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `farmer_sales` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `sale_code` VARCHAR(50) NOT NULL,
    `farmer_id` BIGINT NOT NULL,
    `crop_id` BIGINT NOT NULL,
    `buyer_category` VARCHAR(50) NOT NULL,
    `buyer_name` VARCHAR(150) NOT NULL,
    `buyer_mobile` VARCHAR(15) NOT NULL,
    `crop_name` VARCHAR(100) NOT NULL,
    `crop_variety` VARCHAR(150) NOT NULL,
    `quality_grade` VARCHAR(100) NULL,
    `selling_quantity` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    `unit` VARCHAR(30) NOT NULL DEFAULT 'Quintals',
    `price_per_unit` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    `total_amount` DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
    `pickup_location` VARCHAR(255) NOT NULL,
    `expected_pickup_date` DATE NOT NULL,
    `notes` TEXT NULL,
    `status` VARCHAR(50) NOT NULL DEFAULT 'Pending OTP Confirmation',
    `otp_code` VARCHAR(10) NULL,
    `otp_status` VARCHAR(20) NOT NULL DEFAULT 'Pending',
    `otp_expires_at` DATETIME NULL,
    `confirmed_at` DATETIME NULL,
    `is_active` TINYINT(1) NOT NULL DEFAULT 1,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY `uk_sale_code` (`sale_code`),
    INDEX `idx_sales_farmer_id` (`farmer_id`),
    INDEX `idx_sales_crop_id` (`crop_id`),
    INDEX `idx_sales_status` (`status`),
    INDEX `idx_sales_buyer_mobile` (`buyer_mobile`),

    CONSTRAINT `fk_farmer_sales_farmer`
        FOREIGN KEY (`farmer_id`)
        REFERENCES `Farmers` (`Id`)
        ON DELETE CASCADE,

    CONSTRAINT `fk_farmer_sales_crop`
        FOREIGN KEY (`crop_id`)
        REFERENCES `farmer_crops` (`id`)
        ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- Procedure 1: sp_FarmerGetAvailableCropsForSale
-- Returns farmer's active crops with available stock > 0
-- ----------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS `sp_FarmerGetAvailableCropsForSale`;
DELIMITER $$
CREATE PROCEDURE `sp_FarmerGetAvailableCropsForSale`(
    IN p_farmer_id BIGINT
)
BEGIN
    SELECT 
        `id` AS Id,
        `crop_code` AS CropCode,
        `crop_name` AS CropName,
        `crop_category` AS CropCategory,
        `crop_variety` AS CropVariety,
        `quality_grade` AS QualityGrade,
        `available_quantity` AS AvailableQuantity,
        `unit` AS Unit,
        `expected_selling_price` AS ExpectedSellingPrice,
        `storage_location` AS StorageLocation
    FROM `farmer_crops`
    WHERE `farmer_id` = p_farmer_id
      AND `is_active` = 1
      AND `available_quantity` > 0
    ORDER BY `created_at` DESC;
END$$
DELIMITER ;

-- ----------------------------------------------------------------------------
-- Procedure 2: sp_FarmerCreateSale
-- Creates new sale in 'Pending OTP Confirmation' status
-- ----------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS `sp_FarmerCreateSale`;
DELIMITER $$
CREATE PROCEDURE `sp_FarmerCreateSale`(
    IN p_sale_code VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_farmer_id BIGINT,
    IN p_crop_id BIGINT,
    IN p_buyer_category VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_buyer_name VARCHAR(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_buyer_mobile VARCHAR(15) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_crop_name VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_crop_variety VARCHAR(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_quality_grade VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_selling_quantity DECIMAL(12, 2),
    IN p_unit VARCHAR(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_price_per_unit DECIMAL(12, 2),
    IN p_total_amount DECIMAL(14, 2),
    IN p_pickup_location VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_expected_pickup_date DATE,
    IN p_notes TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_status VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_otp_code VARCHAR(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_otp_status VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_otp_expires_at DATETIME
)
BEGIN
    INSERT INTO `farmer_sales` (
        `sale_code`, `farmer_id`, `crop_id`, `buyer_category`, `buyer_name`, `buyer_mobile`,
        `crop_name`, `crop_variety`, `quality_grade`, `selling_quantity`, `unit`,
        `price_per_unit`, `total_amount`, `pickup_location`, `expected_pickup_date`,
        `notes`, `status`, `otp_code`, `otp_status`, `otp_expires_at`,
        `confirmed_at`, `is_active`, `created_at`, `updated_at`
    ) VALUES (
        p_sale_code, p_farmer_id, p_crop_id, p_buyer_category, p_buyer_name, p_buyer_mobile,
        p_crop_name, p_crop_variety, p_quality_grade, p_selling_quantity, p_unit,
        p_price_per_unit, p_total_amount, p_pickup_location, p_expected_pickup_date,
        p_notes, p_status, p_otp_code, p_otp_status, p_otp_expires_at,
        NULL, 1, UTC_TIMESTAMP(), UTC_TIMESTAMP()
    );

    SELECT 
        `id` AS Id,
        `sale_code` AS SaleCode,
        `farmer_id` AS FarmerId,
        `crop_id` AS CropId,
        `buyer_category` AS BuyerCategory,
        `buyer_name` AS BuyerName,
        `buyer_mobile` AS BuyerMobile,
        `crop_name` AS CropName,
        `crop_variety` AS CropVariety,
        `quality_grade` AS QualityGrade,
        `selling_quantity` AS SellingQuantity,
        `unit` AS Unit,
        `price_per_unit` AS PricePerUnit,
        `total_amount` AS TotalAmount,
        `pickup_location` AS PickupLocation,
        `expected_pickup_date` AS ExpectedPickupDate,
        `notes` AS Notes,
        `status` AS Status,
        `otp_code` AS OtpCode,
        `otp_status` AS OtpStatus,
        `otp_expires_at` AS OtpExpiresAt,
        `confirmed_at` AS ConfirmedAt,
        `is_active` AS IsActive,
        `created_at` AS CreatedAt,
        `updated_at` AS UpdatedAt
    FROM `farmer_sales`
    WHERE `id` = LAST_INSERT_ID();
END$$
DELIMITER ;

-- ----------------------------------------------------------------------------
-- Procedure 3: sp_FarmerVerifySaleOtpAndDeductStock
-- Atomically verifies OTP, confirms sale, and deducts crop stock
-- ----------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS `sp_FarmerVerifySaleOtpAndDeductStock`;
DELIMITER $$
CREATE PROCEDURE `sp_FarmerVerifySaleOtpAndDeductStock`(
    IN p_sale_id BIGINT,
    IN p_farmer_id BIGINT,
    IN p_otp_code VARCHAR(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
)
BEGIN
    DECLARE v_crop_id BIGINT;
    DECLARE v_selling_quantity DECIMAL(12, 2);
    DECLARE v_status VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    DECLARE v_otp_code VARCHAR(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    DECLARE v_otp_status VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    DECLARE v_otp_expires_at DATETIME;
    DECLARE v_available_quantity DECIMAL(12, 2);
    DECLARE v_sold_quantity DECIMAL(12, 2);

    -- 1. Lock and validate sale record
    SELECT 
        `crop_id`, `selling_quantity`, `status`, `otp_code`, `otp_status`, `otp_expires_at`
    INTO 
        v_crop_id, v_selling_quantity, v_status, v_otp_code, v_otp_status, v_otp_expires_at
    FROM `farmer_sales`
    WHERE `id` = p_sale_id AND `farmer_id` = p_farmer_id AND `is_active` = 1
    FOR UPDATE;

    IF v_crop_id IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Sale order not found.';
    END IF;

    IF v_status = 'Confirmed' OR v_otp_status = 'Verified' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'This sale order has already been confirmed.';
    END IF;

    IF v_status = 'Cancelled' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'This sale order has been cancelled.';
    END IF;

    IF v_otp_expires_at IS NOT NULL AND v_otp_expires_at < UTC_TIMESTAMP() THEN
        UPDATE `farmer_sales` SET `otp_status` = 'Expired', `updated_at` = UTC_TIMESTAMP() WHERE `id` = p_sale_id;
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'OTP has expired. Please request a new OTP.';
    END IF;

    IF v_otp_code IS NULL OR TRIM(v_otp_code) <> TRIM(p_otp_code) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid OTP. Please enter the correct 6-digit code.';
    END IF;

    -- 2. Lock and validate crop inventory
    SELECT `available_quantity`, `sold_quantity`
    INTO v_available_quantity, v_sold_quantity
    FROM `farmer_crops`
    WHERE `id` = v_crop_id AND `farmer_id` = p_farmer_id AND `is_active` = 1
    FOR UPDATE;

    IF v_available_quantity IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Associated crop inventory not found.';
    END IF;

    IF v_available_quantity < v_selling_quantity THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Insufficient crop stock remaining to fulfill sale.';
    END IF;

    -- 3. Confirm sale
    UPDATE `farmer_sales`
    SET `status` = 'Confirmed',
        `otp_status` = 'Verified',
        `confirmed_at` = UTC_TIMESTAMP(),
        `updated_at` = UTC_TIMESTAMP()
    WHERE `id` = p_sale_id;

    -- 4. Deduct crop stock atomically
    UPDATE `farmer_crops`
    SET `available_quantity` = `available_quantity` - v_selling_quantity,
        `sold_quantity` = `sold_quantity` + v_selling_quantity,
        `status` = CASE WHEN (`available_quantity` - v_selling_quantity) <= 0 THEN 'Out of Stock' ELSE `status` END,
        `updated_at` = UTC_TIMESTAMP()
    WHERE `id` = v_crop_id;

    -- 5. Return updated sale record
    SELECT 
        `id` AS Id,
        `sale_code` AS SaleCode,
        `farmer_id` AS FarmerId,
        `crop_id` AS CropId,
        `buyer_category` AS BuyerCategory,
        `buyer_name` AS BuyerName,
        `buyer_mobile` AS BuyerMobile,
        `crop_name` AS CropName,
        `crop_variety` AS CropVariety,
        `quality_grade` AS QualityGrade,
        `selling_quantity` AS SellingQuantity,
        `unit` AS Unit,
        `price_per_unit` AS PricePerUnit,
        `total_amount` AS TotalAmount,
        `pickup_location` AS PickupLocation,
        `expected_pickup_date` AS ExpectedPickupDate,
        `notes` AS Notes,
        `status` AS Status,
        `otp_code` AS OtpCode,
        `otp_status` AS OtpStatus,
        `otp_expires_at` AS OtpExpiresAt,
        `confirmed_at` AS ConfirmedAt,
        `is_active` AS IsActive,
        `created_at` AS CreatedAt,
        `updated_at` AS UpdatedAt
    FROM `farmer_sales`
    WHERE `id` = p_sale_id;
END$$
DELIMITER ;

-- ----------------------------------------------------------------------------
-- Procedure 4: sp_FarmerResendSaleOtp
-- Updates OTP code and expires_at for pending sale
-- ----------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS `sp_FarmerResendSaleOtp`;
DELIMITER $$
CREATE PROCEDURE `sp_FarmerResendSaleOtp`(
    IN p_sale_id BIGINT,
    IN p_farmer_id BIGINT,
    IN p_new_otp VARCHAR(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_otp_expires_at DATETIME
)
BEGIN
    DECLARE v_status VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

    SELECT `status` INTO v_status
    FROM `farmer_sales`
    WHERE `id` = p_sale_id AND `farmer_id` = p_farmer_id AND `is_active` = 1;

    IF v_status IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Sale order not found.';
    END IF;

    IF v_status = 'Confirmed' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Sale order has already been confirmed.';
    END IF;

    IF v_status = 'Cancelled' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Sale order has been cancelled.';
    END IF;

    UPDATE `farmer_sales`
    SET `otp_code` = p_new_otp,
        `otp_status` = 'Pending',
        `otp_expires_at` = p_otp_expires_at,
        `updated_at` = UTC_TIMESTAMP()
    WHERE `id` = p_sale_id;

    SELECT 
        `id` AS Id,
        `sale_code` AS SaleCode,
        `farmer_id` AS FarmerId,
        `crop_id` AS CropId,
        `buyer_category` AS BuyerCategory,
        `buyer_name` AS BuyerName,
        `buyer_mobile` AS BuyerMobile,
        `crop_name` AS CropName,
        `crop_variety` AS CropVariety,
        `quality_grade` AS QualityGrade,
        `selling_quantity` AS SellingQuantity,
        `unit` AS Unit,
        `price_per_unit` AS PricePerUnit,
        `total_amount` AS TotalAmount,
        `pickup_location` AS PickupLocation,
        `expected_pickup_date` AS ExpectedPickupDate,
        `notes` AS Notes,
        `status` AS Status,
        `otp_code` AS OtpCode,
        `otp_status` AS OtpStatus,
        `otp_expires_at` AS OtpExpiresAt,
        `confirmed_at` AS ConfirmedAt,
        `is_active` AS IsActive,
        `created_at` AS CreatedAt,
        `updated_at` AS UpdatedAt
    FROM `farmer_sales`
    WHERE `id` = p_sale_id;
END$$
DELIMITER ;

-- ----------------------------------------------------------------------------
-- Procedure 5: sp_FarmerGetSales
-- Lists sales for farmer with optional status filter
-- ----------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS `sp_FarmerGetSales`;
DELIMITER $$
CREATE PROCEDURE `sp_FarmerGetSales`(
    IN p_farmer_id BIGINT,
    IN p_status VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
)
BEGIN
    SELECT 
        `id` AS Id,
        `sale_code` AS SaleCode,
        `farmer_id` AS FarmerId,
        `crop_id` AS CropId,
        `buyer_category` AS BuyerCategory,
        `buyer_name` AS BuyerName,
        `buyer_mobile` AS BuyerMobile,
        `crop_name` AS CropName,
        `crop_variety` AS CropVariety,
        `quality_grade` AS QualityGrade,
        `selling_quantity` AS SellingQuantity,
        `unit` AS Unit,
        `price_per_unit` AS PricePerUnit,
        `total_amount` AS TotalAmount,
        `pickup_location` AS PickupLocation,
        `expected_pickup_date` AS ExpectedPickupDate,
        `notes` AS Notes,
        `status` AS Status,
        `otp_code` AS OtpCode,
        `otp_status` AS OtpStatus,
        `otp_expires_at` AS OtpExpiresAt,
        `confirmed_at` AS ConfirmedAt,
        `is_active` AS IsActive,
        `created_at` AS CreatedAt,
        `updated_at` AS UpdatedAt
    FROM `farmer_sales`
    WHERE `farmer_id` = p_farmer_id
      AND `is_active` = 1
      AND (p_status IS NULL OR p_status = '' OR UPPER(p_status) = 'ALL' OR LOWER(`status`) = LOWER(p_status))
    ORDER BY `created_at` DESC;
END$$
DELIMITER ;

-- ----------------------------------------------------------------------------
-- Procedure 6: sp_FarmerGetSaleById
-- Retrieves single sale record for farmer
-- ----------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS `sp_FarmerGetSaleById`;
DELIMITER $$
CREATE PROCEDURE `sp_FarmerGetSaleById`(
    IN p_sale_id BIGINT,
    IN p_farmer_id BIGINT
)
BEGIN
    SELECT 
        `id` AS Id,
        `sale_code` AS SaleCode,
        `farmer_id` AS FarmerId,
        `crop_id` AS CropId,
        `buyer_category` AS BuyerCategory,
        `buyer_name` AS BuyerName,
        `buyer_mobile` AS BuyerMobile,
        `crop_name` AS CropName,
        `crop_variety` AS CropVariety,
        `quality_grade` AS QualityGrade,
        `selling_quantity` AS SellingQuantity,
        `unit` AS Unit,
        `price_per_unit` AS PricePerUnit,
        `total_amount` AS TotalAmount,
        `pickup_location` AS PickupLocation,
        `expected_pickup_date` AS ExpectedPickupDate,
        `notes` AS Notes,
        `status` AS Status,
        `otp_code` AS OtpCode,
        `otp_status` AS OtpStatus,
        `otp_expires_at` AS OtpExpiresAt,
        `confirmed_at` AS ConfirmedAt,
        `is_active` AS IsActive,
        `created_at` AS CreatedAt,
        `updated_at` AS UpdatedAt
    FROM `farmer_sales`
    WHERE `id` = p_sale_id
      AND `farmer_id` = p_farmer_id
      AND `is_active` = 1
    LIMIT 1;
END$$
DELIMITER ;
