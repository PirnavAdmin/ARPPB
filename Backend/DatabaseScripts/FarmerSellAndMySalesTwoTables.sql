-- ======================================================================================
-- ARPPB - Farmer Module: Separate Tables & Perfectly Matched Stored Procedures
-- Table 1: farmer_sell_products
-- Table 2: farmer_my_sales
-- ======================================================================================

-- --------------------------------------------------------------------------------------
-- 1. Table: farmer_sell_products
-- --------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `farmer_sell_products` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `sale_code` VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    `farmer_id` BIGINT NOT NULL,
    `crop_id` BIGINT NOT NULL,
    `buyer_category` VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    `buyer_name` VARCHAR(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    `buyer_mobile` VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    `crop_name` VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    `crop_variety` VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    `quality_grade` VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
    `selling_quantity` DECIMAL(12, 2) NOT NULL,
    `unit` VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Quintals',
    `price_per_unit` DECIMAL(12, 2) NOT NULL,
    `total_amount` DECIMAL(14, 2) NOT NULL,
    `pickup_location` VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    `expected_pickup_date` DATETIME NOT NULL,
    `notes` TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
    `status` VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Pending OTP Confirmation',
    `otp_code` VARCHAR(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
    `otp_status` VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Pending',
    `otp_expires_at` DATETIME NULL,
    `confirmed_at` DATETIME NULL,
    `is_active` TINYINT(1) NOT NULL DEFAULT 1,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `ux_farmer_sell_products_code` (`sale_code`),
    KEY `ix_farmer_sell_products_farmer` (`farmer_id`),
    KEY `ix_farmer_sell_products_crop` (`crop_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------------------------------------
-- 2. Table: farmer_my_sales
-- --------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `farmer_my_sales` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `sell_product_id` BIGINT NULL,
    `sale_code` VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    `farmer_id` BIGINT NOT NULL,
    `crop_id` BIGINT NOT NULL,
    `crop_name` VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    `crop_variety` VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    `quality_grade` VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
    `buyer_category` VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    `buyer_name` VARCHAR(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    `buyer_mobile` VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    `quantity_dispatched` DECIMAL(12, 2) NOT NULL,
    `unit` VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Quintals',
    `selling_rate` DECIMAL(12, 2) NOT NULL,
    `total_revenue` DECIMAL(14, 2) NOT NULL,
    `status` VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Confirmed',
    `payment_status` VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Pending',
    `delivery_status` VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Scheduled',
    `pickup_location` VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    `expected_payment_date` DATETIME NULL,
    `confirmed_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `notes` TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
    `is_active` TINYINT(1) NOT NULL DEFAULT 1,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `ux_farmer_my_sales_code` (`sale_code`),
    KEY `ix_farmer_my_sales_farmer` (`farmer_id`),
    KEY `ix_farmer_my_sales_crop` (`crop_id`),
    KEY `ix_farmer_my_sales_sell_id` (`sell_product_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ======================================================================================
-- STORED PROCEDURES FOR TABLE 1: farmer_sell_products
-- ======================================================================================

DROP PROCEDURE IF EXISTS `sp_FarmerSellGetCropOptions`;
DELIMITER $$
CREATE PROCEDURE `sp_FarmerSellGetCropOptions`(
    IN p_farmer_id BIGINT
)
BEGIN
    SELECT 
        fc.id,
        fc.crop_code AS cropCode,
        fc.crop_name AS cropName,
        fc.crop_category AS cropCategory,
        fc.crop_variety AS cropVariety,
        fc.quality_grade AS qualityGrade,
        fc.available_quantity AS availableQuantity,
        fc.unit,
        fc.expected_selling_price AS expectedSellingPrice,
        fc.storage_location AS storageLocation
    FROM farmer_crops fc
    WHERE fc.farmer_id = p_farmer_id
      AND fc.is_active = 1
      AND fc.available_quantity > 0
    ORDER BY fc.crop_name ASC;
END$$
DELIMITER ;

DROP PROCEDURE IF EXISTS `sp_FarmerSellCreateOrder`;
DELIMITER $$
CREATE PROCEDURE `sp_FarmerSellCreateOrder`(
    IN p_sale_code VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_farmer_id BIGINT,
    IN p_crop_id BIGINT,
    IN p_buyer_category VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_buyer_name VARCHAR(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_buyer_mobile VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_crop_name VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_crop_variety VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_quality_grade VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_selling_quantity DECIMAL(12, 2),
    IN p_unit VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_price_per_unit DECIMAL(12, 2),
    IN p_total_amount DECIMAL(14, 2),
    IN p_pickup_location VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_expected_pickup_date DATETIME,
    IN p_notes TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_status VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_otp_code VARCHAR(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_otp_status VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_otp_expires_at DATETIME
)
BEGIN
    DECLARE v_new_id BIGINT;

    INSERT INTO farmer_sell_products (
        sale_code, farmer_id, crop_id, buyer_category, buyer_name, buyer_mobile,
        crop_name, crop_variety, quality_grade, selling_quantity, unit,
        price_per_unit, total_amount, pickup_location, expected_pickup_date, notes,
        status, otp_code, otp_status, otp_expires_at, is_active, created_at, updated_at
    ) VALUES (
        p_sale_code, p_farmer_id, p_crop_id, p_buyer_category, p_buyer_name, p_buyer_mobile,
        p_crop_name, p_crop_variety, p_quality_grade, p_selling_quantity, p_unit,
        p_price_per_unit, p_total_amount, p_pickup_location, p_expected_pickup_date, p_notes,
        p_status, p_otp_code, p_otp_status, p_otp_expires_at, 1, UTC_TIMESTAMP(), UTC_TIMESTAMP()
    );

    SET v_new_id = LAST_INSERT_ID();

    SELECT 
        fsp.id,
        fsp.sale_code AS SaleCode,
        fsp.farmer_id AS FarmerId,
        fsp.crop_id AS CropId,
        fsp.buyer_category AS BuyerCategory,
        fsp.buyer_name AS BuyerName,
        fsp.buyer_mobile AS BuyerMobile,
        fsp.crop_name AS CropName,
        fsp.crop_variety AS CropVariety,
        fsp.quality_grade AS QualityGrade,
        fsp.selling_quantity AS SellingQuantity,
        fsp.unit AS Unit,
        fsp.price_per_unit AS PricePerUnit,
        fsp.total_amount AS TotalAmount,
        fsp.pickup_location AS PickupLocation,
        fsp.expected_pickup_date AS ExpectedPickupDate,
        fsp.notes AS Notes,
        fsp.status AS Status,
        fsp.otp_code AS OtpCode,
        fsp.otp_status AS OtpStatus,
        fsp.otp_expires_at AS OtpExpiresAt,
        fsp.confirmed_at AS ConfirmedAt,
        fsp.created_at AS CreatedAt
    FROM farmer_sell_products fsp
    WHERE fsp.id = v_new_id;
END$$
DELIMITER ;

DROP PROCEDURE IF EXISTS `sp_FarmerSellVerifyOtpAndDeductStock`;
DELIMITER $$
CREATE PROCEDURE `sp_FarmerSellVerifyOtpAndDeductStock`(
    IN p_sale_id BIGINT,
    IN p_farmer_id BIGINT,
    IN p_otp_code VARCHAR(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
)
BEGIN
    DECLARE v_status VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    DECLARE v_otp_status VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    DECLARE v_otp_code VARCHAR(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    DECLARE v_otp_expires_at DATETIME;
    DECLARE v_crop_id BIGINT;
    DECLARE v_quantity DECIMAL(12, 2);
    DECLARE v_crop_stock DECIMAL(12, 2);
    DECLARE v_now DATETIME;
    DECLARE v_sale_code VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    DECLARE v_crop_name VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    DECLARE v_crop_variety VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    DECLARE v_quality_grade VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    DECLARE v_buyer_category VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    DECLARE v_buyer_name VARCHAR(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    DECLARE v_buyer_mobile VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    DECLARE v_unit VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    DECLARE v_price_per_unit DECIMAL(12, 2);
    DECLARE v_total_amount DECIMAL(14, 2);
    DECLARE v_pickup_location VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    DECLARE v_expected_pickup_date DATETIME;
    DECLARE v_notes TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

    SET v_now = UTC_TIMESTAMP();

    -- 1. Fetch from farmer_sell_products
    SELECT 
        status, otp_status, otp_code, otp_expires_at, crop_id, selling_quantity,
        sale_code, crop_name, crop_variety, quality_grade, buyer_category, buyer_name,
        buyer_mobile, unit, price_per_unit, total_amount, pickup_location, expected_pickup_date, notes
    INTO 
        v_status, v_otp_status, v_otp_code, v_otp_expires_at, v_crop_id, v_quantity,
        v_sale_code, v_crop_name, v_crop_variety, v_quality_grade, v_buyer_category, v_buyer_name,
        v_buyer_mobile, v_unit, v_price_per_unit, v_total_amount, v_pickup_location, v_expected_pickup_date, v_notes
    FROM farmer_sell_products
    WHERE id = p_sale_id AND farmer_id = p_farmer_id AND is_active = 1
    FOR UPDATE;

    IF v_status IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Sell order not found.';
    END IF;

    IF v_status = 'Confirmed' OR v_otp_status = 'Verified' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Order has already been verified and confirmed.';
    END IF;

    IF v_otp_expires_at < v_now THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'OTP has expired. Please request a new OTP.';
    END IF;

    IF v_otp_code <> p_otp_code THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid OTP code entered. Please check and try again.';
    END IF;

    -- 2. Deduct crop stock atomically
    SELECT available_quantity INTO v_crop_stock
    FROM farmer_crops
    WHERE id = v_crop_id AND farmer_id = p_farmer_id
    FOR UPDATE;

    IF v_crop_stock < v_quantity THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Insufficient crop stock to fulfill this order.';
    END IF;

    UPDATE farmer_crops
    SET available_quantity = available_quantity - v_quantity,
        updated_at = v_now
    WHERE id = v_crop_id;

    -- 3. Update farmer_sell_products
    UPDATE farmer_sell_products
    SET status = 'Confirmed',
        otp_status = 'Verified',
        confirmed_at = v_now,
        updated_at = v_now
    WHERE id = p_sale_id;

    -- 4. INSERT INTO TABLE 2: farmer_my_sales (The Confirmed Sales & Settlement Ledger Table)
    INSERT INTO farmer_my_sales (
        sell_product_id, sale_code, farmer_id, crop_id, crop_name, crop_variety,
        quality_grade, buyer_category, buyer_name, buyer_mobile, quantity_dispatched,
        unit, selling_rate, total_revenue, status, payment_status, delivery_status,
        pickup_location, expected_payment_date, confirmed_at, notes, is_active,
        created_at, updated_at
    ) VALUES (
        p_sale_id, v_sale_code, p_farmer_id, v_crop_id, v_crop_name, v_crop_variety,
        v_quality_grade, v_buyer_category, v_buyer_name, v_buyer_mobile, v_quantity,
        v_unit, v_price_per_unit, v_total_amount, 'Confirmed', 'Pending', 'Scheduled',
        v_pickup_location, v_expected_pickup_date, v_now, v_notes, 1,
        v_now, v_now
    );

    -- 5. Return updated sell product order
    SELECT 
        fsp.id,
        fsp.sale_code AS SaleCode,
        fsp.farmer_id AS FarmerId,
        fsp.crop_id AS CropId,
        fsp.buyer_category AS BuyerCategory,
        fsp.buyer_name AS BuyerName,
        fsp.buyer_mobile AS BuyerMobile,
        fsp.crop_name AS CropName,
        fsp.crop_variety AS CropVariety,
        fsp.quality_grade AS QualityGrade,
        fsp.selling_quantity AS SellingQuantity,
        fsp.unit AS Unit,
        fsp.price_per_unit AS PricePerUnit,
        fsp.total_amount AS TotalAmount,
        fsp.pickup_location AS PickupLocation,
        fsp.expected_pickup_date AS ExpectedPickupDate,
        fsp.notes AS Notes,
        fsp.status AS Status,
        fsp.otp_code AS OtpCode,
        fsp.otp_status AS OtpStatus,
        fsp.otp_expires_at AS OtpExpiresAt,
        fsp.confirmed_at AS ConfirmedAt,
        fsp.created_at AS CreatedAt
    FROM farmer_sell_products fsp
    WHERE fsp.id = p_sale_id;
END$$
DELIMITER ;

DROP PROCEDURE IF EXISTS `sp_FarmerSellResendOtp`;
DELIMITER $$
CREATE PROCEDURE `sp_FarmerSellResendOtp`(
    IN p_sale_id BIGINT,
    IN p_farmer_id BIGINT,
    IN p_otp_code VARCHAR(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_otp_expires_at DATETIME
)
BEGIN
    DECLARE v_status VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

    SELECT status INTO v_status
    FROM farmer_sell_products
    WHERE id = p_sale_id AND farmer_id = p_farmer_id AND is_active = 1;

    IF v_status IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Sell order not found.';
    END IF;

    IF v_status = 'Confirmed' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Order has already been confirmed. Cannot resend OTP.';
    END IF;

    UPDATE farmer_sell_products
    SET otp_code = p_otp_code,
        otp_status = 'Pending',
        otp_expires_at = p_otp_expires_at,
        updated_at = UTC_TIMESTAMP()
    WHERE id = p_sale_id;

    SELECT 
        fsp.id,
        fsp.sale_code AS SaleCode,
        fsp.farmer_id AS FarmerId,
        fsp.crop_id AS CropId,
        fsp.buyer_category AS BuyerCategory,
        fsp.buyer_name AS BuyerName,
        fsp.buyer_mobile AS BuyerMobile,
        fsp.crop_name AS CropName,
        fsp.crop_variety AS CropVariety,
        fsp.quality_grade AS QualityGrade,
        fsp.selling_quantity AS SellingQuantity,
        fsp.unit AS Unit,
        fsp.price_per_unit AS PricePerUnit,
        fsp.total_amount AS TotalAmount,
        fsp.pickup_location AS PickupLocation,
        fsp.expected_pickup_date AS ExpectedPickupDate,
        fsp.notes AS Notes,
        fsp.status AS Status,
        fsp.otp_code AS OtpCode,
        fsp.otp_status AS OtpStatus,
        fsp.otp_expires_at AS OtpExpiresAt,
        fsp.confirmed_at AS ConfirmedAt,
        fsp.created_at AS CreatedAt
    FROM farmer_sell_products fsp
    WHERE fsp.id = p_sale_id;
END$$
DELIMITER ;

-- ======================================================================================
-- STORED PROCEDURES FOR TABLE 2: farmer_my_sales
-- ======================================================================================

DROP PROCEDURE IF EXISTS `sp_FarmerMySalesGetSummary`;
DELIMITER $$
CREATE PROCEDURE `sp_FarmerMySalesGetSummary`(
    IN p_farmer_id BIGINT
)
BEGIN
    DECLARE v_total_orders INT DEFAULT 0;
    DECLARE v_qty_dispatched DECIMAL(12, 2) DEFAULT 0.00;
    DECLARE v_revenue DECIMAL(14, 2) DEFAULT 0.00;
    DECLARE v_pending_otps INT DEFAULT 0;
    DECLARE v_unit VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'qtl';

    -- 1. Confirmed statistics from farmer_my_sales
    SELECT 
        COUNT(id),
        COALESCE(SUM(quantity_dispatched), 0.00),
        COALESCE(SUM(total_revenue), 0.00)
    INTO 
        v_total_orders,
        v_qty_dispatched,
        v_revenue
    FROM farmer_my_sales
    WHERE farmer_id = p_farmer_id AND is_active = 1;

    -- 2. Pending OTP count from farmer_sell_products
    SELECT COUNT(id) INTO v_pending_otps
    FROM farmer_sell_products
    WHERE farmer_id = p_farmer_id 
      AND status = 'Pending OTP Confirmation'
      AND is_active = 1;

    -- Return 4 KPI cards data
    SELECT 
        v_total_orders AS TotalOrders,
        v_qty_dispatched AS QuantityDispatched,
        v_unit AS DispatchedUnit,
        v_revenue AS ConfirmedRevenue,
        v_pending_otps AS PendingOtpOrders;
END$$
DELIMITER ;

DROP PROCEDURE IF EXISTS `sp_FarmerMySalesGetList`;
DELIMITER $$
CREATE PROCEDURE `sp_FarmerMySalesGetList`(
    IN p_farmer_id BIGINT,
    IN p_buyer_category VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_crop_name VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_status VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_otp_status VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_search VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
)
BEGIN
    SELECT * FROM (
        SELECT 
            fms.id AS Id,
            fms.sale_code AS TransactionId,
            fms.confirmed_at AS Date,
            fms.buyer_name AS BuyerName,
            fms.buyer_mobile AS BuyerMobile,
            fms.buyer_category AS BuyerCategory,
            fms.crop_id AS CropId,
            fms.crop_name AS CropName,
            fms.crop_variety AS CropVariety,
            fms.quantity_dispatched AS Quantity,
            fms.unit AS Unit,
            fms.selling_rate AS Rate,
            fms.total_revenue AS TotalAmount,
            fms.status AS ConfirmationStatus,
            'Verified' AS OtpStatus,
            fms.expected_payment_date AS ExpectedPaymentDate,
            fms.pickup_location AS PickupLocation,
            fms.quality_grade AS QualityGrade,
            fms.notes AS Notes,
            fms.confirmed_at AS ConfirmedAt
        FROM farmer_my_sales fms
        WHERE fms.farmer_id = p_farmer_id AND fms.is_active = 1

        UNION ALL

        SELECT 
            fsp.id AS Id,
            fsp.sale_code AS TransactionId,
            fsp.created_at AS Date,
            fsp.buyer_name AS BuyerName,
            fsp.buyer_mobile AS BuyerMobile,
            fsp.buyer_category AS BuyerCategory,
            fsp.crop_id AS CropId,
            fsp.crop_name AS CropName,
            fsp.crop_variety AS CropVariety,
            fsp.selling_quantity AS Quantity,
            fsp.unit AS Unit,
            fsp.price_per_unit AS Rate,
            fsp.total_amount AS TotalAmount,
            fsp.status AS ConfirmationStatus,
            fsp.otp_status AS OtpStatus,
            fsp.expected_pickup_date AS ExpectedPaymentDate,
            fsp.pickup_location AS PickupLocation,
            fsp.quality_grade AS QualityGrade,
            fsp.notes AS Notes,
            fsp.confirmed_at AS ConfirmedAt
        FROM farmer_sell_products fsp
        WHERE fsp.farmer_id = p_farmer_id 
          AND fsp.status = 'Pending OTP Confirmation'
          AND fsp.is_active = 1
    ) AS all_sales
    WHERE (p_buyer_category IS NULL OR p_buyer_category = '' OR all_sales.BuyerCategory = p_buyer_category)
      AND (p_crop_name IS NULL OR p_crop_name = '' OR all_sales.CropName = p_crop_name)
      AND (p_status IS NULL OR p_status = '' OR all_sales.ConfirmationStatus = p_status OR (p_status = 'Pending Confirmation' AND all_sales.ConfirmationStatus LIKE 'Pending%'))
      AND (p_otp_status IS NULL OR p_otp_status = '' OR all_sales.OtpStatus = p_otp_status)
      AND (p_search IS NULL OR p_search = '' OR 
           all_sales.TransactionId LIKE CONCAT('%', p_search, '%') OR
           all_sales.BuyerName LIKE CONCAT('%', p_search, '%') OR
           all_sales.CropName LIKE CONCAT('%', p_search, '%'))
    ORDER BY all_sales.Date DESC;
END$$
DELIMITER ;

DROP PROCEDURE IF EXISTS `sp_FarmerMySalesGetById`;
DELIMITER $$
CREATE PROCEDURE `sp_FarmerMySalesGetById`(
    IN p_sale_id BIGINT,
    IN p_farmer_id BIGINT
)
BEGIN
    IF EXISTS (SELECT 1 FROM farmer_my_sales WHERE id = p_sale_id AND farmer_id = p_farmer_id AND is_active = 1) THEN
        SELECT 
            fms.id AS Id,
            fms.sale_code AS SaleCode,
            fms.farmer_id AS FarmerId,
            fms.crop_id AS CropId,
            fms.buyer_category AS BuyerCategory,
            fms.buyer_name AS BuyerName,
            fms.buyer_mobile AS BuyerMobile,
            fms.crop_name AS CropName,
            fms.crop_variety AS CropVariety,
            fms.quality_grade AS QualityGrade,
            fms.quantity_dispatched AS SellingQuantity,
            fms.unit AS Unit,
            fms.selling_rate AS PricePerUnit,
            fms.total_revenue AS TotalAmount,
            fms.pickup_location AS PickupLocation,
            fms.expected_payment_date AS ExpectedPickupDate,
            fms.notes AS Notes,
            fms.status AS Status,
            NULL AS OtpCode,
            'Verified' AS OtpStatus,
            NULL AS OtpExpiresAt,
            fms.confirmed_at AS ConfirmedAt,
            fms.created_at AS CreatedAt
        FROM farmer_my_sales fms
        WHERE fms.id = p_sale_id AND fms.farmer_id = p_farmer_id AND fms.is_active = 1;
    ELSE
        SELECT 
            fsp.id AS Id,
            fsp.sale_code AS SaleCode,
            fsp.farmer_id AS FarmerId,
            fsp.crop_id AS CropId,
            fsp.buyer_category AS BuyerCategory,
            fsp.buyer_name AS BuyerName,
            fsp.buyer_mobile AS BuyerMobile,
            fsp.crop_name AS CropName,
            fsp.crop_variety AS CropVariety,
            fsp.quality_grade AS QualityGrade,
            fsp.selling_quantity AS SellingQuantity,
            fsp.unit AS Unit,
            fsp.price_per_unit AS PricePerUnit,
            fsp.total_amount AS TotalAmount,
            fsp.pickup_location AS PickupLocation,
            fsp.expected_pickup_date AS ExpectedPickupDate,
            fsp.notes AS Notes,
            fsp.status AS Status,
            fsp.otp_code AS OtpCode,
            fsp.otp_status AS OtpStatus,
            fsp.otp_expires_at AS OtpExpiresAt,
            fsp.confirmed_at AS ConfirmedAt,
            fsp.created_at AS CreatedAt
        FROM farmer_sell_products fsp
        WHERE fsp.id = p_sale_id AND fsp.farmer_id = p_farmer_id AND fsp.is_active = 1;
    END IF;
END$$
DELIMITER ;
