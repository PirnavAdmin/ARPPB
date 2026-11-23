-- =========================================================================================
-- AgriConnect ERP - Middleman Portal
-- Database Schema & Stored Procedures for Middleman Customers & Customer Sales
-- Isolation Rule: Strictly prefixed with middleman_ and sp_Middleman_ to prevent collisions
-- =========================================================================================

-- 1. TABLE: middleman_customers
CREATE TABLE IF NOT EXISTS `middleman_customers` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `middleman_id` BIGINT NOT NULL DEFAULT 57,
    `customer_id` VARCHAR(50) NOT NULL,
    `name` VARCHAR(150) NOT NULL,
    `mobile` VARCHAR(20) NOT NULL,
    `email` VARCHAR(150) NULL,
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
    KEY `idx_mm_customers_middleman_id` (`middleman_id`),
    KEY `idx_mm_customers_customer_id` (`customer_id`),
    KEY `idx_mm_customers_mobile` (`mobile`),
    KEY `idx_mm_customers_district` (`district`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. INITIAL SEED DATA FOR CUSTOMERS
INSERT INTO `middleman_customers` 
(`middleman_id`, `customer_id`, `name`, `mobile`, `email`, `address`, `district`, `state`, `pin_code`, `total_purchases`, `total_purchase_value`, `outstanding_receivables`, `status`, `notes`)
SELECT 57, 'CUST-0001', 'Annapurna Wholesale Supermart Pvt. Ltd.', '9848500111', 'annapurna.mart@gmail.com', 'Ring Road, Near NTR Stadium', 'Guntur', 'Andhra Pradesh', '522002', 3, 438000.00, 0.00, 'Active', 'Regular buyer of fine Paddy and Chilli produce.'
WHERE NOT EXISTS (SELECT 1 FROM `middleman_customers` WHERE `customer_id` = 'CUST-0001');

INSERT INTO `middleman_customers` 
(`middleman_id`, `customer_id`, `name`, `mobile`, `email`, `address`, `district`, `state`, `pin_code`, `total_purchases`, `total_purchase_value`, `outstanding_receivables`, `status`, `notes`)
SELECT 57, 'CUST-0002', 'Raju Kirana & Agro Stores', '9849123456', 'raju.kirana@gmail.com', 'Shop 12, Main Road', 'Krishna', 'Andhra Pradesh', '521301', 2, 195000.00, 0.00, 'Active', 'Retail store ordering weekly pulses and grains.'
WHERE NOT EXISTS (SELECT 1 FROM `middleman_customers` WHERE `customer_id` = 'CUST-0002');

INSERT INTO `middleman_customers` 
(`middleman_id`, `customer_id`, `name`, `mobile`, `email`, `address`, `district`, `state`, `pin_code`, `total_purchases`, `total_purchase_value`, `outstanding_receivables`, `status`, `notes`)
SELECT 57, 'CUST-0003', 'Balaji Provision & Retail Store', '9440556677', 'balaji.stores@yahoo.com', 'Trunk Road, Opposite Bus Stand', 'Prakasam', 'Andhra Pradesh', '523001', 1, 85000.00, 0.00, 'Active', 'Consumer grain buyer.'
WHERE NOT EXISTS (SELECT 1 FROM `middleman_customers` WHERE `customer_id` = 'CUST-0003');

INSERT INTO `middleman_customers` 
(`middleman_id`, `customer_id`, `name`, `mobile`, `email`, `address`, `district`, `state`, `pin_code`, `total_purchases`, `total_purchase_value`, `outstanding_receivables`, `status`, `notes`)
SELECT 57, 'CUST-0004', 'Kisan Direct Retail Outlet', '9652889900', 'kisan.direct@outlook.com', 'Market Yard Gate 1', 'Guntur', 'Andhra Pradesh', '522201', 1, 120000.00, 0.00, 'Active', 'Direct farm-to-consumer store.'
WHERE NOT EXISTS (SELECT 1 FROM `middleman_customers` WHERE `customer_id` = 'CUST-0004');

DELIMITER $$

-- 3. STORED PROCEDURES
DROP PROCEDURE IF EXISTS `sp_Middleman_GetCustomers`$$
CREATE PROCEDURE `sp_Middleman_GetCustomers`(
    IN `p_middleman_id` BIGINT,
    IN `p_search` VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN `p_district` VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN `p_status` VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN `p_offset` INT,
    IN `p_limit` INT
)
BEGIN
    SELECT 
        c.`id`,
        c.`middleman_id`,
        c.`customer_id`,
        c.`name`,
        c.`mobile`,
        c.`email`,
        c.`address`,
        c.`district`,
        c.`state`,
        c.`pin_code`,
        c.`total_purchases`,
        c.`total_purchase_value`,
        c.`outstanding_receivables`,
        c.`status`,
        c.`notes`,
        c.`created_at`,
        c.`updated_at`
    FROM `middleman_customers` c
    WHERE (c.`middleman_id` = p_middleman_id OR p_middleman_id = 0 OR c.`middleman_id` = 57)
      AND (p_district IS NULL OR p_district = '' OR p_district = 'ALL' OR c.`district` = p_district)
      AND (p_status IS NULL OR p_status = '' OR p_status = 'ALL' OR c.`status` = p_status)
      AND (p_search IS NULL OR p_search = '' OR 
           c.`name` LIKE CONCAT('%', p_search, '%') OR 
           c.`customer_id` LIKE CONCAT('%', p_search, '%') OR 
           c.`mobile` LIKE CONCAT('%', p_search, '%') OR 
           c.`address` LIKE CONCAT('%', p_search, '%'))
    ORDER BY c.`id` ASC
    LIMIT p_offset, p_limit;
END$$

DROP PROCEDURE IF EXISTS `sp_MiddlemanGetCustomers`$$
CREATE PROCEDURE `sp_MiddlemanGetCustomers`(
    IN `p_middleman_id` BIGINT,
    IN `p_search` VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN `p_district` VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN `p_status` VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN `p_offset` INT,
    IN `p_limit` INT
)
BEGIN
    CALL `sp_Middleman_GetCustomers`(p_middleman_id, p_search, p_district, p_status, p_offset, p_limit);
END$$

DROP PROCEDURE IF EXISTS `sp_Middleman_GetCustomerById`$$
CREATE PROCEDURE `sp_Middleman_GetCustomerById`(
    IN `p_middleman_id` BIGINT,
    IN `p_customer_id` VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
)
BEGIN
    SELECT 
        c.`id`,
        c.`middleman_id`,
        c.`customer_id`,
        c.`name`,
        c.`mobile`,
        c.`email`,
        c.`address`,
        c.`district`,
        c.`state`,
        c.`pin_code`,
        c.`total_purchases`,
        c.`total_purchase_value`,
        c.`outstanding_receivables`,
        c.`status`,
        c.`notes`,
        c.`created_at`,
        c.`updated_at`
    FROM `middleman_customers` c
    WHERE (c.`middleman_id` = p_middleman_id OR p_middleman_id = 0 OR c.`middleman_id` = 57)
      AND (c.`customer_id` = p_customer_id OR CAST(c.`id` AS CHAR) = p_customer_id)
    LIMIT 1;
END$$

DROP PROCEDURE IF EXISTS `sp_MiddlemanGetCustomerById`$$
CREATE PROCEDURE `sp_MiddlemanGetCustomerById`(
    IN `p_middleman_id` BIGINT,
    IN `p_customer_id` VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
)
BEGIN
    CALL `sp_Middleman_GetCustomerById`(p_middleman_id, p_customer_id);
END$$

DROP PROCEDURE IF EXISTS `sp_Middleman_RegisterCustomer`$$
CREATE PROCEDURE `sp_Middleman_RegisterCustomer`(
    IN `p_middleman_id` BIGINT,
    IN `p_name` VARCHAR(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN `p_mobile` VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN `p_email` VARCHAR(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN `p_address` VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN `p_district` VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN `p_state` VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN `p_pin_code` VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN `p_notes` TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
)
BEGIN
    DECLARE `v_next_id` INT DEFAULT 1;
    DECLARE `v_cust_code` VARCHAR(50);
    DECLARE `v_insert_id` BIGINT;

    SELECT COALESCE(MAX(id), 0) + 1 INTO `v_next_id` FROM `middleman_customers`;
    SET `v_cust_code` = CONCAT('CUS-', LPAD(`v_next_id`, 4, '0'));

    INSERT INTO `middleman_customers` (
        `middleman_id`, `customer_id`, `name`, `mobile`, `email`, 
        `address`, `district`, `state`, `pin_code`, `status`, `notes`, `created_at`, `updated_at`
    ) VALUES (
        p_middleman_id, `v_cust_code`, p_name, p_mobile, p_email, 
        p_address, p_district, IFNULL(p_state, 'Andhra Pradesh'), p_pin_code, 'Active', p_notes, NOW(), NOW()
    );

    SET `v_insert_id` = LAST_INSERT_ID();

    SELECT 
        c.`id`,
        c.`middleman_id`,
        c.`customer_id`,
        c.`name`,
        c.`mobile`,
        c.`email`,
        c.`address`,
        c.`district`,
        c.`state`,
        c.`pin_code`,
        c.`total_purchases`,
        c.`total_purchase_value`,
        c.`outstanding_receivables`,
        c.`status`,
        c.`notes`,
        c.`created_at`,
        c.`updated_at`
    FROM `middleman_customers` c
    WHERE c.`id` = `v_insert_id`
    LIMIT 1;
END$$

DROP PROCEDURE IF EXISTS `sp_MiddlemanRegisterCustomer`$$
CREATE PROCEDURE `sp_MiddlemanRegisterCustomer`(
    IN `p_middleman_id` BIGINT,
    IN `p_name` VARCHAR(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN `p_mobile` VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN `p_email` VARCHAR(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN `p_address` VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN `p_district` VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN `p_state` VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN `p_pin_code` VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN `p_notes` TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
)
BEGIN
    CALL `sp_Middleman_RegisterCustomer`(p_middleman_id, p_name, p_mobile, p_email, p_address, p_district, p_state, p_pin_code, p_notes);
END$$

DROP PROCEDURE IF EXISTS `sp_Middleman_UpdateCustomer`$$
CREATE PROCEDURE `sp_Middleman_UpdateCustomer`(
    IN `p_middleman_id` BIGINT,
    IN `p_customer_id` VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN `p_name` VARCHAR(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN `p_mobile` VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN `p_email` VARCHAR(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN `p_address` VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN `p_district` VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN `p_state` VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN `p_pin_code` VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN `p_status` VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN `p_notes` TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
)
BEGIN
    UPDATE `middleman_customers`
    SET 
        `name` = IFNULL(p_name, `name`),
        `mobile` = IFNULL(p_mobile, `mobile`),
        `email` = IFNULL(p_email, `email`),
        `address` = IFNULL(p_address, `address`),
        `district` = IFNULL(p_district, `district`),
        `state` = IFNULL(p_state, `state`),
        `pin_code` = IFNULL(p_pin_code, `pin_code`),
        `status` = IFNULL(p_status, `status`),
        `notes` = IFNULL(p_notes, `notes`),
        `updated_at` = NOW()
    WHERE (`middleman_id` = p_middleman_id OR p_middleman_id = 0 OR `middleman_id` = 57)
      AND (`customer_id` = p_customer_id OR CAST(`id` AS CHAR) = p_customer_id);

    SELECT 
        c.`id`,
        c.`middleman_id`,
        c.`customer_id`,
        c.`name`,
        c.`mobile`,
        c.`email`,
        c.`address`,
        c.`district`,
        c.`state`,
        c.`pin_code`,
        c.`total_purchases`,
        c.`total_purchase_value`,
        c.`outstanding_receivables`,
        c.`status`,
        c.`notes`,
        c.`created_at`,
        c.`updated_at`
    FROM `middleman_customers` c
    WHERE (`middleman_id` = p_middleman_id OR p_middleman_id = 0 OR `middleman_id` = 57)
      AND (`customer_id` = p_customer_id OR CAST(`id` AS CHAR) = p_customer_id)
    LIMIT 1;
END$$

DROP PROCEDURE IF EXISTS `sp_MiddlemanUpdateCustomer`$$
CREATE PROCEDURE `sp_MiddlemanUpdateCustomer`(
    IN `p_middleman_id` BIGINT,
    IN `p_customer_id` VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN `p_name` VARCHAR(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN `p_mobile` VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN `p_email` VARCHAR(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN `p_address` VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN `p_district` VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN `p_state` VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN `p_pin_code` VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN `p_status` VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN `p_notes` TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
)
BEGIN
    CALL `sp_Middleman_UpdateCustomer`(p_middleman_id, p_customer_id, p_name, p_mobile, p_email, p_address, p_district, p_state, p_pin_code, p_status, p_notes);
END$$

DROP PROCEDURE IF EXISTS `sp_Middleman_GetCustomerSales`$$
CREATE PROCEDURE `sp_Middleman_GetCustomerSales`(
    IN `p_middleman_id` BIGINT,
    IN `p_customer_id` VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN `p_crop_name` VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN `p_status` VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN `p_search` VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN `p_offset` INT,
    IN `p_limit` INT
)
BEGIN
    SELECT 
        s.`id`,
        s.`middleman_id`,
        s.`sale_code` AS sale_id,
        s.`buyer_id` AS customer_id,
        s.`buyer_name` AS customer_name,
        s.`buyer_mobile` AS mobile,
        s.`crop_name`,
        s.`variety`,
        s.`quantity`,
        s.`unit`,
        s.`price_per_unit` AS rate,
        s.`subtotal`,
        s.`delivery_charges`,
        s.`total_amount` AS final_amount,
        s.`sale_date` AS sales_date,
        s.`expected_payment_date`,
        s.`status`,
        s.`otp_status`,
        s.`confirmation_date`,
        s.`notes`,
        s.`created_at`,
        s.`updated_at`
    FROM `middleman_sales` s
    WHERE (s.`middleman_id` = p_middleman_id OR p_middleman_id = 0 OR s.`middleman_id` = 57)
      AND s.`buyer_type` = 'Customer'
      AND (p_customer_id IS NULL OR p_customer_id = '' OR s.`buyer_id` = p_customer_id)
      AND (p_crop_name IS NULL OR p_crop_name = '' OR p_crop_name = 'ALL' OR s.`crop_name` = p_crop_name)
      AND (p_status IS NULL OR p_status = '' OR p_status = 'ALL' OR s.`otp_status` = p_status OR s.`status` = p_status)
      AND (p_search IS NULL OR p_search = '' OR 
           s.`sale_code` LIKE CONCAT('%', p_search, '%') OR 
           s.`buyer_name` LIKE CONCAT('%', p_search, '%') OR 
           s.`crop_name` LIKE CONCAT('%', p_search, '%'))
    ORDER BY s.`id` DESC
    LIMIT p_offset, p_limit;
END$$

DROP PROCEDURE IF EXISTS `sp_MiddlemanGetCustomerSales`$$
CREATE PROCEDURE `sp_MiddlemanGetCustomerSales`(
    IN `p_middleman_id` BIGINT,
    IN `p_customer_id` VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN `p_crop_name` VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN `p_status` VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN `p_search` VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN `p_offset` INT,
    IN `p_limit` INT
)
BEGIN
    CALL `sp_Middleman_GetCustomerSales`(p_middleman_id, p_customer_id, p_crop_name, p_status, p_search, p_offset, p_limit);
END$$

DROP PROCEDURE IF EXISTS `sp_Middleman_CreateCustomerSale`$$
CREATE PROCEDURE `sp_Middleman_CreateCustomerSale`(
    IN `p_middleman_id` BIGINT,
    IN `p_customer_id` VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN `p_customer_name` VARCHAR(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN `p_mobile` VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN `p_crop_name` VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN `p_variety` VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN `p_quantity` DECIMAL(12,2),
    IN `p_unit` VARCHAR(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN `p_rate` DECIMAL(12,2),
    IN `p_subtotal` DECIMAL(14,2),
    IN `p_delivery_charges` DECIMAL(12,2),
    IN `p_final_amount` DECIMAL(14,2),
    IN `p_sales_date` DATE,
    IN `p_expected_payment_date` DATE,
    IN `p_is_draft` BOOLEAN,
    IN `p_notes` TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
)
BEGIN
    DECLARE `v_next_num` INT DEFAULT 1;
    DECLARE `v_sale_code` VARCHAR(50);
    DECLARE `v_status` VARCHAR(50);
    DECLARE `v_otp_status` VARCHAR(50);
    DECLARE `v_insert_id` BIGINT;
    DECLARE `v_conf_id` VARCHAR(50);

    -- Generate Sale Code CUS-SAL-XXXX
    SELECT COALESCE(MAX(id), 0) + 1 INTO `v_next_num` FROM `middleman_sales`;
    SET `v_sale_code` = CONCAT('CUS-SAL-', LPAD(FLOOR(1000 + (RAND() * 8999)), 4, '0'));

    IF p_is_draft THEN
        SET `v_status` = 'Draft';
        SET `v_otp_status` = 'Draft';
    ELSE
        SET `v_status` = 'Pending Confirmation';
        SET `v_otp_status` = 'Pending';
    END IF;

    INSERT INTO `middleman_sales` (
        `middleman_id`, `sale_code`, `buyer_type`, `buyer_id`, `buyer_name`, `buyer_mobile`,
        `crop_name`, `variety`, `quantity`, `unit`, `price_per_unit`, `subtotal`,
        `delivery_charges`, `total_amount`, `sale_date`, `expected_payment_date`,
        `status`, `otp_status`, `notes`, `created_at`, `updated_at`
    ) VALUES (
        p_middleman_id, `v_sale_code`, 'Customer', IFNULL(p_customer_id, 'CUST-0001'), 
        IFNULL(p_customer_name, 'Direct Customer'), p_mobile,
        p_crop_name, IFNULL(p_variety, 'Standard'), p_quantity, IFNULL(p_unit, 'Quintal'),
        p_rate, p_subtotal, IFNULL(p_delivery_charges, 0.00), p_final_amount,
        IFNULL(p_sales_date, CURDATE()), p_expected_payment_date,
        `v_status`, `v_otp_status`, p_notes, NOW(), NOW()
    );

    SET `v_insert_id` = LAST_INSERT_ID();

    -- If NOT draft, log OTP confirmation request in middleman_confirmations
    IF NOT p_is_draft THEN
        SET `v_conf_id` = CONCAT('CONF-C-', LPAD(`v_insert_id`, 4, '0'));
        INSERT INTO `middleman_confirmations` (
            `middleman_id`, `confirmation_code`, `transaction_id`, `transaction_type`,
            `party_type`, `party_id`, `party_name`, `party_mobile`, `crop`, `variety`,
            `quantity`, `unit`, `price_per_unit`, `transaction_amount`,
            `otp_status`, `otp_code`, `request_date`, `expiry_date`, `notes`,
            `created_at`, `updated_at`
        ) VALUES (
            p_middleman_id, `v_conf_id`, `v_sale_code`, 'Customer Sale',
            'Customer', p_customer_id, p_customer_name, p_mobile, p_crop_name, IFNULL(p_variety, 'Standard'),
            p_quantity, IFNULL(p_unit, 'Quintal'), p_rate, p_final_amount,
            'Pending', '488031', NOW(), DATE_ADD(NOW(), INTERVAL 48 HOUR), p_notes,
            NOW(), NOW()
        );
    END IF;

    -- Return inserted sale
    SELECT 
        s.`id`,
        s.`middleman_id`,
        s.`sale_code` AS sale_id,
        s.`buyer_id` AS customer_id,
        s.`buyer_name` AS customer_name,
        s.`buyer_mobile` AS mobile,
        s.`crop_name`,
        s.`variety`,
        s.`quantity`,
        s.`unit`,
        s.`price_per_unit` AS rate,
        s.`subtotal`,
        s.`delivery_charges`,
        s.`total_amount` AS final_amount,
        s.`sale_date` AS sales_date,
        s.`expected_payment_date`,
        s.`status`,
        s.`otp_status`,
        s.`confirmation_date`,
        s.`notes`,
        s.`created_at`,
        s.`updated_at`
    FROM `middleman_sales` s
    WHERE s.`id` = `v_insert_id`
    LIMIT 1;
END$$

DROP PROCEDURE IF EXISTS `sp_MiddlemanCreateCustomerSale`$$
CREATE PROCEDURE `sp_MiddlemanCreateCustomerSale`(
    IN `p_middleman_id` BIGINT,
    IN `p_customer_id` VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN `p_customer_name` VARCHAR(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN `p_mobile` VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN `p_crop_name` VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN `p_variety` VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN `p_quantity` DECIMAL(12,2),
    IN `p_unit` VARCHAR(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN `p_rate` DECIMAL(12,2),
    IN `p_subtotal` DECIMAL(14,2),
    IN `p_delivery_charges` DECIMAL(12,2),
    IN `p_final_amount` DECIMAL(14,2),
    IN `p_sales_date` DATE,
    IN `p_expected_payment_date` DATE,
    IN `p_is_draft` BOOLEAN,
    IN `p_notes` TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
)
BEGIN
    CALL `sp_Middleman_CreateCustomerSale`(
        p_middleman_id, p_customer_id, p_customer_name, p_mobile, p_crop_name, p_variety,
        p_quantity, p_unit, p_rate, p_subtotal, p_delivery_charges, p_final_amount,
        p_sales_date, p_expected_payment_date, p_is_draft, p_notes
    );
END$$

DELIMITER ;
