-- ============================================================================
-- ARPPB: Vendor Portal Database Schema Migration & Stored Procedure Fixes
-- File: Backend/DatabaseScripts/VendorDatabaseSchemaFixes.sql
-- Description: 
--   1. Add missing Bank, PAN, Mandal, and Address columns to vendor_farmers, vendor_middlemen, and vendor_customers.
--   2. Update Partner Stored Procedures (GetById, Create, Update) to persist and return all details.
--   3. Synchronize customer sales (vp_sales) and customer directory orders (vendor_customer_orders).
--   4. Update Purchase Status to synchronize payments and ledger entries (vp_ledger_entries).
--   5. Update Processing Output to credit Finished Products stock and create batches in vp_finished_product_batches.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. SCHEMA MIGRATION: ADD MISSING COLUMNS
-- ----------------------------------------------------------------------------

-- A. Table: vendor_middlemen
ALTER TABLE `vendor_middlemen`
  ADD COLUMN IF NOT EXISTS `BankAccountNumber` VARCHAR(50) NULL AFTER `PinCode`,
  ADD COLUMN IF NOT EXISTS `AccountHolderName` VARCHAR(150) NULL AFTER `BankAccountNumber`,
  ADD COLUMN IF NOT EXISTS `BankName` VARCHAR(100) NULL AFTER `AccountHolderName`,
  ADD COLUMN IF NOT EXISTS `IfscCode` VARCHAR(20) NULL AFTER `BankName`,
  ADD COLUMN IF NOT EXISTS `BranchName` VARCHAR(100) NULL AFTER `IfscCode`;

-- B. Table: vendor_customers
ALTER TABLE `vendor_customers`
  ADD COLUMN IF NOT EXISTS `Pan` VARCHAR(20) NULL AFTER `Gstin`,
  ADD COLUMN IF NOT EXISTS `OpeningBalance` DECIMAL(14,2) NOT NULL DEFAULT 0.00 AFTER `CreditLimit`,
  ADD COLUMN IF NOT EXISTS `BankAccountNumber` VARCHAR(50) NULL AFTER `OpeningBalance`,
  ADD COLUMN IF NOT EXISTS `AccountHolderName` VARCHAR(150) NULL AFTER `BankAccountNumber`,
  ADD COLUMN IF NOT EXISTS `BankName` VARCHAR(100) NULL AFTER `AccountHolderName`,
  ADD COLUMN IF NOT EXISTS `IfscCode` VARCHAR(20) NULL AFTER `BankName`,
  ADD COLUMN IF NOT EXISTS `BranchName` VARCHAR(100) NULL AFTER `IfscCode`;

-- C. Table: vendor_farmers
ALTER TABLE `vendor_farmers`
  ADD COLUMN IF NOT EXISTS `AccountHolderName` VARCHAR(150) NULL AFTER `BankName`,
  ADD COLUMN IF NOT EXISTS `BranchName` VARCHAR(100) NULL AFTER `AccountHolderName`,
  ADD COLUMN IF NOT EXISTS `Mandal` VARCHAR(100) NULL AFTER `Village`,
  ADD COLUMN IF NOT EXISTS `Address` VARCHAR(500) NULL AFTER `Mandal`;

-- ----------------------------------------------------------------------------
-- 2. PARTNERS STORED PROCEDURES (FARMERS, MIDDLEMEN, CUSTOMERS)
-- ----------------------------------------------------------------------------

DELIMITER $$

-- Farmer GetById
DROP PROCEDURE IF EXISTS `sp_VendorPartners_GetFarmerById`$$
CREATE PROCEDURE `sp_VendorPartners_GetFarmerById`(
    IN p_vendor_id BIGINT,
    IN p_farmer_id_or_code VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
)
BEGIN
    DECLARE v_farmer_id BIGINT DEFAULT NULL;

    SELECT f.`Id` INTO v_farmer_id
    FROM `vendor_farmers` f
    WHERE f.`VendorId` = p_vendor_id
      AND (f.`FarmerCode` = p_farmer_id_or_code OR CAST(f.`Id` AS CHAR) = p_farmer_id_or_code)
    LIMIT 1;

    -- Result Set 1: Farmer Detail
    SELECT
        f.`Id`,
        f.`FarmerCode`,
        f.`FullName`,
        f.`FatherOrSpouseName`,
        f.`MobileNumber`,
        f.`Email`,
        f.`Village`,
        f.`Mandal`,
        f.`District`,
        f.`State`,
        f.`Address`,
        f.`PinCode`,
        f.`LandAcres`,
        f.`RegisteredCrops`,
        f.`BankAccountNumber`,
        f.`IfscCode`,
        f.`BankName`,
        f.`AccountHolderName`,
        f.`BranchName`,
        f.`AadhaarNumber`,
        f.`Status`,
        f.`RegisteredAt`
    FROM `vendor_farmers` f
    WHERE f.`Id` = v_farmer_id;

    -- Result Set 2: Purchases
    SELECT
        p.`Id`,
        p.`PurchaseCode`,
        p.`BillNumber`,
        p.`CropName`,
        p.`CropVariety`,
        p.`Quantity`,
        p.`Unit`,
        p.`RatePerUnit`,
        p.`TotalAmount`,
        p.`DueAmount`,
        p.`PaymentStatus`,
        p.`PurchaseDate`
    FROM `vendor_farmer_purchases` p
    WHERE p.`FarmerId` = v_farmer_id
    ORDER BY p.`PurchaseDate` DESC;

    -- Result Set 3: Payments
    SELECT
        pay.`Id`,
        pay.`PaymentCode`,
        pay.`VoucherNumber`,
        pay.`Amount`,
        pay.`PaymentMethod`,
        pay.`PaymentDate`,
        pay.`ReferenceNumber`,
        pay.`Status`,
        pay.`Notes`
    FROM `vendor_farmer_payments` pay
    WHERE pay.`FarmerId` = v_farmer_id
    ORDER BY pay.`PaymentDate` DESC;

    -- Result Set 4: OTP Logs
    SELECT
        o.`Id`,
        o.`OtpCode`,
        o.`Purpose`,
        o.`ActionDetails`,
        o.`Status`,
        o.`VerifiedAt`,
        o.`CreatedAt`
    FROM `vendor_farmer_otp_logs` o
    WHERE o.`FarmerId` = v_farmer_id
    ORDER BY o.`CreatedAt` DESC;
END$$

-- Farmer Create
DROP PROCEDURE IF EXISTS `sp_VendorPartners_CreateFarmer`$$
CREATE PROCEDURE `sp_VendorPartners_CreateFarmer`(
    IN p_vendor_id BIGINT,
    IN p_full_name VARCHAR(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_father_or_spouse_name VARCHAR(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_mobile_number VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_email VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_village VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_district VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_state VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_pin_code VARCHAR(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_land_acres DECIMAL(10,2),
    IN p_registered_crops VARCHAR(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_bank_account_number VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    IN p_ifsc_code VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    IN p_bank_name VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    IN p_aadhaar_number VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    IN p_account_holder_name VARCHAR(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    IN p_branch_name VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    IN p_mandal VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    IN p_address VARCHAR(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL
)
BEGIN
    DECLARE v_count INT DEFAULT 0;
    DECLARE v_code VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

    SELECT COUNT(*) INTO v_count FROM `vendor_farmers` WHERE `VendorId` = p_vendor_id;
    SET v_code = CONCAT('FARM-', LPAD(v_count + 1, 4, '0'));

    INSERT INTO `vendor_farmers` (
        `VendorId`, `FarmerCode`, `FullName`, `FatherOrSpouseName`, `MobileNumber`, `Email`,
        `Village`, `Mandal`, `District`, `State`, `Address`, `PinCode`, `LandAcres`, `RegisteredCrops`,
        `BankAccountNumber`, `IfscCode`, `BankName`, `AccountHolderName`, `BranchName`, `AadhaarNumber`, `Status`,
        `RegisteredAt`, `CreatedAt`, `UpdatedAt`
    ) VALUES (
        p_vendor_id, v_code, p_full_name, p_father_or_spouse_name, p_mobile_number, p_email,
        p_village, p_mandal, p_district, p_state, p_address, p_pin_code, p_land_acres, p_registered_crops,
        p_bank_account_number, p_ifsc_code, p_bank_name, p_account_holder_name, p_branch_name, p_aadhaar_number, 'Active',
        UTC_TIMESTAMP(6), UTC_TIMESTAMP(6), UTC_TIMESTAMP(6)
    );

    CALL `sp_VendorPartners_GetFarmerById`(p_vendor_id, v_code);
END$$

-- Farmer Update
DROP PROCEDURE IF EXISTS `sp_VendorPartners_UpdateFarmer`$$
CREATE PROCEDURE `sp_VendorPartners_UpdateFarmer`(
    IN p_vendor_id BIGINT,
    IN p_farmer_id_or_code VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_full_name VARCHAR(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_father_or_spouse_name VARCHAR(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_mobile_number VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_email VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_village VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_district VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_state VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_pin_code VARCHAR(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_land_acres DECIMAL(10,2),
    IN p_registered_crops VARCHAR(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_bank_account_number VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    IN p_ifsc_code VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    IN p_bank_name VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    IN p_aadhaar_number VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    IN p_status VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    IN p_account_holder_name VARCHAR(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    IN p_branch_name VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    IN p_mandal VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    IN p_address VARCHAR(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL
)
BEGIN
    DECLARE v_farmer_id BIGINT DEFAULT NULL;
    DECLARE v_code VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL;

    SELECT `Id`, `FarmerCode` INTO v_farmer_id, v_code
    FROM `vendor_farmers`
    WHERE `VendorId` = p_vendor_id
      AND (`FarmerCode` = p_farmer_id_or_code OR CAST(`Id` AS CHAR) = p_farmer_id_or_code)
    LIMIT 1;

    IF v_farmer_id IS NOT NULL THEN
        UPDATE `vendor_farmers`
        SET `FullName` = p_full_name,
            `FatherOrSpouseName` = p_father_or_spouse_name,
            `MobileNumber` = p_mobile_number,
            `Email` = p_email,
            `Village` = p_village,
            `Mandal` = COALESCE(p_mandal, `Mandal`),
            `District` = p_district,
            `State` = p_state,
            `Address` = COALESCE(p_address, `Address`),
            `PinCode` = p_pin_code,
            `LandAcres` = p_land_acres,
            `RegisteredCrops` = p_registered_crops,
            `BankAccountNumber` = COALESCE(p_bank_account_number, `BankAccountNumber`),
            `IfscCode` = COALESCE(p_ifsc_code, `IfscCode`),
            `BankName` = COALESCE(p_bank_name, `BankName`),
            `AccountHolderName` = COALESCE(p_account_holder_name, `AccountHolderName`),
            `BranchName` = COALESCE(p_branch_name, `BranchName`),
            `AadhaarNumber` = COALESCE(p_aadhaar_number, `AadhaarNumber`),
            `Status` = COALESCE(NULLIF(p_status, ''), `Status`),
            `UpdatedAt` = UTC_TIMESTAMP(6)
        WHERE `Id` = v_farmer_id;
    END IF;

    CALL `sp_VendorPartners_GetFarmerById`(p_vendor_id, COALESCE(v_code, p_farmer_id_or_code));
END$$

-- Middleman GetById
DROP PROCEDURE IF EXISTS `sp_VendorPartners_GetMiddlemanById`$$
CREATE PROCEDURE `sp_VendorPartners_GetMiddlemanById`(
    IN p_vendor_id BIGINT,
    IN p_middleman_id_or_code VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
)
BEGIN
    DECLARE v_mid_id BIGINT DEFAULT NULL;

    SELECT m.`Id` INTO v_mid_id
    FROM `vendor_middlemen` m
    WHERE m.`VendorId` = p_vendor_id
      AND (m.`MiddlemanCode` = p_middleman_id_or_code OR CAST(m.`Id` AS CHAR) = p_middleman_id_or_code)
    LIMIT 1;

    -- Result Set 1: Middleman Detail
    SELECT
        m.`Id`,
        m.`MiddlemanCode`,
        m.`FullName`,
        m.`Email`,
        m.`MobileNumber`,
        m.`BusinessName`,
        m.`Gstin`,
        m.`Pan`,
        m.`MarketYardLocation`,
        m.`District`,
        m.`State`,
        m.`PinCode`,
        m.`OpeningBalance`,
        m.`BankAccountNumber`,
        m.`AccountHolderName`,
        m.`BankName`,
        m.`IfscCode`,
        m.`BranchName`,
        m.`Status`,
        m.`RegisteredAt`
    FROM `vendor_middlemen` m
    WHERE m.`Id` = v_mid_id;

    -- Result Set 2: Purchases
    SELECT
        p.`Id`,
        p.`PurchaseCode`,
        p.`BillNumber`,
        p.`CropName`,
        p.`CropVariety`,
        p.`Quantity`,
        p.`Unit`,
        p.`RatePerUnit`,
        p.`TotalAmount`,
        p.`DueAmount`,
        p.`PaymentStatus`,
        p.`PurchaseDate`
    FROM `vendor_middleman_purchases` p
    WHERE p.`MiddlemanId` = v_mid_id
    ORDER BY p.`PurchaseDate` DESC;

    -- Result Set 3: Payments
    SELECT
        pay.`Id`,
        pay.`PaymentCode`,
        pay.`VoucherNumber`,
        pay.`Amount`,
        pay.`PaymentMethod`,
        pay.`PaymentDate`,
        pay.`ReferenceNumber`,
        pay.`Status`,
        pay.`Notes`
    FROM `vendor_middleman_payments` pay
    WHERE pay.`MiddlemanId` = v_mid_id
    ORDER BY pay.`PaymentDate` DESC;

    -- Result Set 4: OTP Logs
    SELECT
        o.`Id`,
        o.`OtpCode`,
        o.`Purpose`,
        o.`ActionDetails`,
        o.`Status`,
        o.`VerifiedAt`,
        o.`CreatedAt`
    FROM `vendor_middleman_otp_logs` o
    WHERE o.`MiddlemanId` = v_mid_id
    ORDER BY o.`CreatedAt` DESC;
END$$

-- Middleman Create
DROP PROCEDURE IF EXISTS `sp_VendorPartners_CreateMiddleman`$$
CREATE PROCEDURE `sp_VendorPartners_CreateMiddleman`(
    IN p_vendor_id BIGINT,
    IN p_full_name VARCHAR(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_email VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_mobile_number VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_business_name VARCHAR(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_gstin VARCHAR(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_pan VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_market_yard_location VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_district VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_state VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_pin_code VARCHAR(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_opening_balance DECIMAL(14,2),
    IN p_bank_account_number VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    IN p_account_holder_name VARCHAR(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    IN p_bank_name VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    IN p_ifsc_code VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    IN p_branch_name VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL
)
BEGIN
    DECLARE v_count INT DEFAULT 0;
    DECLARE v_code VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

    SELECT COUNT(*) INTO v_count FROM `vendor_middlemen` WHERE `VendorId` = p_vendor_id;
    SET v_code = CONCAT('MID-', LPAD(v_count + 1, 4, '0'));

    INSERT INTO `vendor_middlemen` (
        `VendorId`, `MiddlemanCode`, `FullName`, `Email`, `MobileNumber`, `BusinessName`,
        `Gstin`, `Pan`, `MarketYardLocation`, `District`, `State`, `PinCode`,
        `OpeningBalance`, `BankAccountNumber`, `AccountHolderName`, `BankName`, `IfscCode`, `BranchName`,
        `Status`, `RegisteredAt`, `CreatedAt`, `UpdatedAt`
    ) VALUES (
        p_vendor_id, v_code, p_full_name, p_email, p_mobile_number, p_business_name,
        p_gstin, p_pan, p_market_yard_location, p_district, p_state, p_pin_code,
        p_opening_balance, p_bank_account_number, p_account_holder_name, p_bank_name, p_ifsc_code, p_branch_name,
        'Active', UTC_TIMESTAMP(6), UTC_TIMESTAMP(6), UTC_TIMESTAMP(6)
    );

    CALL `sp_VendorPartners_GetMiddlemanById`(p_vendor_id, v_code);
END$$

-- Middleman Update
DROP PROCEDURE IF EXISTS `sp_VendorPartners_UpdateMiddleman`$$
CREATE PROCEDURE `sp_VendorPartners_UpdateMiddleman`(
    IN p_vendor_id BIGINT,
    IN p_middleman_id_or_code VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_full_name VARCHAR(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_email VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_mobile_number VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_business_name VARCHAR(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_gstin VARCHAR(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_pan VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_market_yard_location VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_district VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_state VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_pin_code VARCHAR(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_opening_balance DECIMAL(14,2),
    IN p_status VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_bank_account_number VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    IN p_account_holder_name VARCHAR(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    IN p_bank_name VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    IN p_ifsc_code VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    IN p_branch_name VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL
)
BEGIN
    DECLARE v_mid_id BIGINT DEFAULT NULL;
    DECLARE v_code VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL;

    SELECT `Id`, `MiddlemanCode` INTO v_mid_id, v_code
    FROM `vendor_middlemen`
    WHERE `VendorId` = p_vendor_id
      AND (`MiddlemanCode` = p_middleman_id_or_code OR CAST(`Id` AS CHAR) = p_middleman_id_or_code)
    LIMIT 1;

    IF v_mid_id IS NOT NULL THEN
        UPDATE `vendor_middlemen`
        SET `FullName` = p_full_name,
            `Email` = p_email,
            `MobileNumber` = p_mobile_number,
            `BusinessName` = p_business_name,
            `Gstin` = COALESCE(NULLIF(p_gstin, ''), `Gstin`),
            `Pan` = COALESCE(NULLIF(p_pan, ''), `Pan`),
            `MarketYardLocation` = p_market_yard_location,
            `District` = p_district,
            `State` = p_state,
            `PinCode` = p_pin_code,
            `OpeningBalance` = p_opening_balance,
            `BankAccountNumber` = COALESCE(p_bank_account_number, `BankAccountNumber`),
            `AccountHolderName` = COALESCE(p_account_holder_name, `AccountHolderName`),
            `BankName` = COALESCE(p_bank_name, `BankName`),
            `IfscCode` = COALESCE(p_ifsc_code, `IfscCode`),
            `BranchName` = COALESCE(p_branch_name, `BranchName`),
            `Status` = COALESCE(NULLIF(p_status, ''), `Status`),
            `UpdatedAt` = UTC_TIMESTAMP(6)
        WHERE `Id` = v_mid_id;
    END IF;

    CALL `sp_VendorPartners_GetMiddlemanById`(p_vendor_id, COALESCE(v_code, p_middleman_id_or_code));
END$$

-- Customer GetById (Unites vendor_customer_orders and vp_sales)
DROP PROCEDURE IF EXISTS `sp_VendorPartners_GetCustomerById`$$
CREATE PROCEDURE `sp_VendorPartners_GetCustomerById`(
    IN p_vendor_id BIGINT,
    IN p_customer_id_or_code VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
)
BEGIN
    DECLARE v_cust_id BIGINT DEFAULT NULL;
    DECLARE v_cust_code VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL;

    SELECT c.`Id`, c.`CustomerCode` INTO v_cust_id, v_cust_code
    FROM `vendor_customers` c
    WHERE c.`VendorId` = p_vendor_id
      AND (c.`CustomerCode` = p_customer_id_or_code OR CAST(c.`Id` AS CHAR) = p_customer_id_or_code)
    LIMIT 1;

    -- Result Set 1: Customer Detail
    SELECT
        c.`Id`,
        c.`CustomerCode`,
        c.`CustomerName`,
        c.`BusinessName`,
        c.`CustomerType`,
        c.`MobileNumber`,
        c.`Email`,
        c.`Address`,
        c.`District`,
        c.`State`,
        c.`PinCode`,
        c.`Gstin`,
        c.`Pan`,
        c.`CreditLimit`,
        c.`OpeningBalance`,
        c.`BankAccountNumber`,
        c.`AccountHolderName`,
        c.`BankName`,
        c.`IfscCode`,
        c.`BranchName`,
        c.`Status`
    FROM `vendor_customers` c
    WHERE c.`Id` = v_cust_id;

    -- Result Set 2: Orders (Union vendor_customer_orders + vp_sales)
    SELECT
        u.`Id`,
        u.`OrderCode`,
        u.`ProductName`,
        u.`Quantity`,
        u.`Unit`,
        u.`TotalAmount`,
        u.`DueAmount`,
        u.`OrderStatus`,
        u.`OrderDate`
    FROM (
        SELECT
            o.`Id` AS `Id`,
            o.`OrderCode` AS `OrderCode`,
            o.`ProductName` AS `ProductName`,
            o.`Quantity` AS `Quantity`,
            o.`Unit` AS `Unit`,
            o.`TotalAmount` AS `TotalAmount`,
            o.`DueAmount` AS `DueAmount`,
            o.`OrderStatus` AS `OrderStatus`,
            o.`OrderDate` AS `OrderDate`
        FROM `vendor_customer_orders` o
        WHERE o.`CustomerId` = v_cust_id

        UNION ALL

        SELECT
            s.`id` AS `Id`,
            s.`order_code` AS `OrderCode`,
            COALESCE((
                SELECT GROUP_CONCAT(CONCAT(si.product_name, ' (', si.quantity, ' ', si.unit, ')') SEPARATOR ', ')
                FROM `vp_sale_items` si
                WHERE si.sale_id = s.id
            ), 'General Produce') AS `ProductName`,
            COALESCE((
                SELECT SUM(si.quantity)
                FROM `vp_sale_items` si
                WHERE si.sale_id = s.id
            ), 0.00) AS `Quantity`,
            COALESCE((
                SELECT si.unit
                FROM `vp_sale_items` si
                WHERE si.sale_id = s.id
                LIMIT 1
            ), 'Quintal') AS `Unit`,
            s.`total_amount` AS `TotalAmount`,
            (s.`total_amount` - s.`amount_received`) AS `DueAmount`,
            s.`order_status` AS `OrderStatus`,
            s.`created_at` AS `OrderDate`
        FROM `vp_sales` s
        WHERE s.`vendor_id` = p_vendor_id
          AND (s.`customer_user_id` = v_cust_id OR s.`customer_code` = v_cust_code)
          AND NOT EXISTS (
              SELECT 1 FROM `vendor_customer_orders` ex
              WHERE ex.`OrderCode` = s.`order_code`
          )
    ) u
    ORDER BY u.`OrderDate` DESC;
END$$

-- Customer Create
DROP PROCEDURE IF EXISTS `sp_VendorPartners_CreateCustomer`$$
CREATE PROCEDURE `sp_VendorPartners_CreateCustomer`(
    IN p_vendor_id BIGINT,
    IN p_customer_name VARCHAR(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_business_name VARCHAR(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_customer_type VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_mobile_number VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_email VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_address VARCHAR(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_district VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_state VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_pin_code VARCHAR(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_gstin VARCHAR(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_credit_limit DECIMAL(14,2),
    IN p_pan VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    IN p_opening_balance DECIMAL(14,2) DEFAULT 0.00,
    IN p_bank_account_number VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    IN p_account_holder_name VARCHAR(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    IN p_bank_name VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    IN p_ifsc_code VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    IN p_branch_name VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL
)
BEGIN
    DECLARE v_count INT DEFAULT 0;
    DECLARE v_code VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

    SELECT COUNT(*) INTO v_count FROM `vendor_customers` WHERE `VendorId` = p_vendor_id;
    SET v_code = CONCAT('CUST-', LPAD(v_count + 1, 4, '0'));

    INSERT INTO `vendor_customers` (
        `VendorId`, `CustomerCode`, `CustomerName`, `BusinessName`, `CustomerType`,
        `MobileNumber`, `Email`, `Address`, `District`, `State`, `PinCode`,
        `Gstin`, `Pan`, `CreditLimit`, `OpeningBalance`,
        `BankAccountNumber`, `AccountHolderName`, `BankName`, `IfscCode`, `BranchName`,
        `Status`, `CreatedAt`, `UpdatedAt`
    ) VALUES (
        p_vendor_id, v_code, p_customer_name, p_business_name, p_customer_type,
        p_mobile_number, p_email, p_address, p_district, p_state, p_pin_code,
        p_gstin, p_pan, p_credit_limit, p_opening_balance,
        p_bank_account_number, p_account_holder_name, p_bank_name, p_ifsc_code, p_branch_name,
        'Active', UTC_TIMESTAMP(6), UTC_TIMESTAMP(6)
    );

    CALL `sp_VendorPartners_GetCustomerById`(p_vendor_id, v_code);
END$$

-- Customer Update
DROP PROCEDURE IF EXISTS `sp_VendorPartners_UpdateCustomer`$$
CREATE PROCEDURE `sp_VendorPartners_UpdateCustomer`(
    IN p_vendor_id BIGINT,
    IN p_customer_id_or_code VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_customer_name VARCHAR(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_business_name VARCHAR(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_customer_type VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_mobile_number VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_email VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_address VARCHAR(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_district VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_state VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_pin_code VARCHAR(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_gstin VARCHAR(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_credit_limit DECIMAL(14,2),
    IN p_status VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_pan VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    IN p_opening_balance DECIMAL(14,2) DEFAULT 0.00,
    IN p_bank_account_number VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    IN p_account_holder_name VARCHAR(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    IN p_bank_name VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    IN p_ifsc_code VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    IN p_branch_name VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL
)
BEGIN
    DECLARE v_cust_id BIGINT DEFAULT NULL;
    DECLARE v_code VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL;

    SELECT `Id`, `CustomerCode` INTO v_cust_id, v_code
    FROM `vendor_customers`
    WHERE `VendorId` = p_vendor_id
      AND (`CustomerCode` = p_customer_id_or_code OR CAST(`Id` AS CHAR) = p_customer_id_or_code)
    LIMIT 1;

    IF v_cust_id IS NOT NULL THEN
        UPDATE `vendor_customers`
        SET `CustomerName` = p_customer_name,
            `BusinessName` = p_business_name,
            `CustomerType` = p_customer_type,
            `MobileNumber` = p_mobile_number,
            `Email` = p_email,
            `Address` = p_address,
            `District` = p_district,
            `State` = p_state,
            `PinCode` = p_pin_code,
            `Gstin` = p_gstin,
            `Pan` = COALESCE(NULLIF(p_pan, ''), `Pan`),
            `CreditLimit` = p_credit_limit,
            `OpeningBalance` = COALESCE(p_opening_balance, `OpeningBalance`),
            `BankAccountNumber` = COALESCE(p_bank_account_number, `BankAccountNumber`),
            `AccountHolderName` = COALESCE(p_account_holder_name, `AccountHolderName`),
            `BankName` = COALESCE(p_bank_name, `BankName`),
            `IfscCode` = COALESCE(p_ifsc_code, `IfscCode`),
            `BranchName` = COALESCE(p_branch_name, `BranchName`),
            `Status` = COALESCE(NULLIF(p_status, ''), `Status`),
            `UpdatedAt` = UTC_TIMESTAMP(6)
        WHERE `Id` = v_cust_id;
    END IF;

    CALL `sp_VendorPartners_GetCustomerById`(p_vendor_id, COALESCE(v_code, p_customer_id_or_code));
END$$

-- ----------------------------------------------------------------------------
-- 3. PURCHASES & PAYMENTS SYNCHRONIZATION
-- ----------------------------------------------------------------------------

-- Update Purchase Status with Ledger and Payment Sync
DROP PROCEDURE IF EXISTS `sp_Vendor_UpdatePurchaseStatus`$$
CREATE PROCEDURE `sp_Vendor_UpdatePurchaseStatus`(
    IN p_vendor_id BIGINT,
    IN p_purchase_id VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_supplier_category VARCHAR(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_payment_status VARCHAR(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_due_amount DECIMAL(14,2)
)
BEGIN
    DECLARE v_purchase_code VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL;
    DECLARE v_party_id BIGINT DEFAULT NULL;
    DECLARE v_total_amount DECIMAL(14,2) DEFAULT 0;
    DECLARE v_old_due DECIMAL(14,2) DEFAULT 0;
    DECLARE v_new_due DECIMAL(14,2) DEFAULT 0;
    DECLARE v_pay_amt DECIMAL(14,2) DEFAULT 0;
    DECLARE v_vch_code VARCHAR(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL;
    DECLARE v_pay_code VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL;
    DECLARE v_pay_cnt INT DEFAULT 0;

    IF LOWER(p_supplier_category) = 'middleman' THEN
        SELECT p.`PurchaseCode`, p.`MiddlemanId`, p.`TotalAmount`, p.`DueAmount`
        INTO v_purchase_code, v_party_id, v_total_amount, v_old_due
        FROM `vendor_middleman_purchases` p
        INNER JOIN `vendor_middlemen` m ON p.`MiddlemanId` = m.`Id`
        WHERE m.`VendorId` = p_vendor_id
          AND (CAST(p.`Id` AS CHAR) = p_purchase_id OR p.`PurchaseCode` = p_purchase_id)
        LIMIT 1;

        IF v_purchase_code IS NOT NULL THEN
            IF p_due_amount IS NOT NULL THEN
                SET v_new_due = p_due_amount;
            ELSEIF LOWER(p_payment_status) = 'paid' THEN
                SET v_new_due = 0.00;
            ELSE
                SET v_new_due = v_old_due;
            END IF;

            UPDATE `vendor_middleman_purchases`
            SET `PaymentStatus` = COALESCE(p_payment_status, `PaymentStatus`),
                `DueAmount` = v_new_due
            WHERE `PurchaseCode` = v_purchase_code;

            -- Record Payment if due decreased
            IF v_new_due < v_old_due THEN
                SET v_pay_amt = v_old_due - v_new_due;
                SELECT COUNT(*) INTO v_pay_cnt FROM `vendor_middleman_payments`;
                SET v_pay_code = CONCAT('PAY-M-', LPAD(v_pay_cnt + 1, 4, '0'));
                SET v_vch_code = CONCAT('VCH-PAY-', LPAD(v_pay_cnt + 1, 4, '0'));

                INSERT INTO `vendor_middleman_payments` (
                    `MiddlemanId`, `PaymentCode`, `VoucherNumber`, `Amount`,
                    `PaymentMethod`, `PaymentDate`, `ReferenceNumber`, `Status`,
                    `Notes`, `CreatedAt`
                ) VALUES (
                    v_party_id, v_pay_code, v_vch_code, v_pay_amt,
                    'RTGS/NEFT', UTC_TIMESTAMP(6), v_purchase_code, 'Completed',
                    CONCAT('Payment settlement for ', v_purchase_code, ' (Status: ', p_payment_status, ')'),
                    UTC_TIMESTAMP(6)
                );
            END IF;

            -- Update vp_ledger_entries
            UPDATE `vp_ledger_entries`
            SET `status` = COALESCE(p_payment_status, `status`),
                `settled_amount` = v_total_amount - v_new_due,
                `updated_at` = UTC_TIMESTAMP(6)
            WHERE `vendor_id` = p_vendor_id AND `transaction_code` = v_purchase_code;
        END IF;

    ELSE
        SELECT p.`PurchaseCode`, p.`FarmerId`, p.`TotalAmount`, p.`DueAmount`
        INTO v_purchase_code, v_party_id, v_total_amount, v_old_due
        FROM `vendor_farmer_purchases` p
        INNER JOIN `vendor_farmers` f ON p.`FarmerId` = f.`Id`
        WHERE f.`VendorId` = p_vendor_id
          AND (CAST(p.`Id` AS CHAR) = p_purchase_id OR p.`PurchaseCode` = p_purchase_id)
        LIMIT 1;

        IF v_purchase_code IS NOT NULL THEN
            IF p_due_amount IS NOT NULL THEN
                SET v_new_due = p_due_amount;
            ELSEIF LOWER(p_payment_status) = 'paid' THEN
                SET v_new_due = 0.00;
            ELSE
                SET v_new_due = v_old_due;
            END IF;

            UPDATE `vendor_farmer_purchases`
            SET `PaymentStatus` = COALESCE(p_payment_status, `PaymentStatus`),
                `DueAmount` = v_new_due
            WHERE `PurchaseCode` = v_purchase_code;

            -- Record Payment if due decreased
            IF v_new_due < v_old_due THEN
                SET v_pay_amt = v_old_due - v_new_due;
                SELECT COUNT(*) INTO v_pay_cnt FROM `vendor_farmer_payments`;
                SET v_pay_code = CONCAT('PAY-F-', LPAD(v_pay_cnt + 1, 4, '0'));
                SET v_vch_code = CONCAT('VCH-PAY-', LPAD(v_pay_cnt + 1, 4, '0'));

                INSERT INTO `vendor_farmer_payments` (
                    `FarmerId`, `PaymentCode`, `VoucherNumber`, `Amount`,
                    `PaymentMethod`, `PaymentDate`, `ReferenceNumber`, `Status`,
                    `Notes`, `CreatedAt`
                ) VALUES (
                    v_party_id, v_pay_code, v_vch_code, v_pay_amt,
                    'Bank Transfer', UTC_TIMESTAMP(6), v_purchase_code, 'Completed',
                    CONCAT('Payment settlement for ', v_purchase_code, ' (Status: ', p_payment_status, ')'),
                    UTC_TIMESTAMP(6)
                );
            END IF;

            -- Update vp_ledger_entries
            UPDATE `vp_ledger_entries`
            SET `status` = COALESCE(p_payment_status, `status`),
                `settled_amount` = v_total_amount - v_new_due,
                `updated_at` = UTC_TIMESTAMP(6)
            WHERE `vendor_id` = p_vendor_id AND `transaction_code` = v_purchase_code;
        END IF;
    END IF;

    -- Return updated purchase
    CALL `sp_Vendor_GetPurchaseById`(p_vendor_id, p_purchase_id, p_supplier_category);
END$$

-- ----------------------------------------------------------------------------
-- 4. PROCESSING OUTPUT TO FINISHED PRODUCTS SYNCHRONIZATION
-- ----------------------------------------------------------------------------

-- Add Processing Output and Credit Finished Products Inventory
DROP PROCEDURE IF EXISTS `sp_Vendor_AddProcessingOutput`$$
CREATE PROCEDURE `sp_Vendor_AddProcessingOutput`(
    IN p_processing_batch_id BIGINT,
    IN p_output_product_name VARCHAR(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_output_quantity DECIMAL(12,2),
    IN p_unit VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_output_type VARCHAR(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
)
BEGIN
    DECLARE v_vendor_id BIGINT DEFAULT 1;
    DECLARE v_batch_num VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL;
    DECLARE v_proc_code VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL;
    DECLARE v_raw_name VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'Raw Produce';
    DECLARE v_unit_cost DECIMAL(14,2) DEFAULT 0.00;
    DECLARE v_prod_id BIGINT DEFAULT NULL;
    DECLARE v_prod_code VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL;
    DECLARE v_fp_batch_code VARCHAR(40) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL;
    DECLARE v_prod_cnt INT DEFAULT 0;
    DECLARE v_mov_cnt INT DEFAULT 0;
    DECLARE v_avail_qty DECIMAL(12,2) DEFAULT 0.00;

    -- Insert Output record
    INSERT INTO `vendor_processing_outputs` (
        `ProcessingBatchId`, `OutputProductName`, `OutputQuantity`, `Unit`, `OutputType`, `CreatedAt`
    ) VALUES (
        p_processing_batch_id, TRIM(p_output_product_name), p_output_quantity, p_unit, p_output_type, UTC_TIMESTAMP(6)
    );

    -- Get processing batch metadata
    SELECT `VendorId`, `BatchNumber`, `ProcessingCode`, `RawMaterialName`, `UnitCost`
    INTO v_vendor_id, v_batch_num, v_proc_code, v_raw_name, v_unit_cost
    FROM `vendor_processing_batches`
    WHERE `Id` = p_processing_batch_id
    LIMIT 1;

    -- Only credit finished goods for non-waste outputs
    IF LOWER(p_output_type) NOT LIKE '%waste%' AND LOWER(p_output_type) NOT LIKE '%husk%' AND p_output_quantity > 0 THEN
        -- Check if finished product exists in vendor_finished_products
        SELECT `Id`, `ProductCode`, `AvailableQuantity`
        INTO v_prod_id, v_prod_code, v_avail_qty
        FROM `vendor_finished_products`
        WHERE `VendorId` = v_vendor_id
          AND LOWER(TRIM(`ProductName`)) = LOWER(TRIM(p_output_product_name))
        LIMIT 1;

        IF v_prod_id IS NOT NULL THEN
            UPDATE `vendor_finished_products`
            SET `AvailableQuantity` = `AvailableQuantity` + p_output_quantity,
                `UpdatedAt` = UTC_TIMESTAMP(6)
            WHERE `Id` = v_prod_id;

            SET v_avail_qty = v_avail_qty + p_output_quantity;
        ELSE
            SELECT COUNT(*) INTO v_prod_cnt FROM `vendor_finished_products` WHERE `VendorId` = v_vendor_id;
            SET v_prod_code = CONCAT('PROD-', LPAD(v_prod_cnt + 1, 4, '0'));
            SET v_avail_qty = p_output_quantity;

            INSERT INTO `vendor_finished_products` (
                `VendorId`, `ProductCode`, `ProductName`, `Category`, `SourceRawMaterial`,
                `BrandName`, `Packaging`, `AvailableQuantity`, `SoldQuantity`, `Unit`,
                `MfgDate`, `ExpiryDate`, `ProductionCost`, `SellingPrice`, `ProfitMarginPercentage`,
                `MinThresholdQuantity`, `Status`, `CreatedAt`, `UpdatedAt`
            ) VALUES (
                v_vendor_id, v_prod_code, TRIM(p_output_product_name), 'Processed Foods', v_raw_name,
                'Vendor Brand', 'Bulk Bag (50kg)', p_output_quantity, 0.00, p_unit,
                UTC_TIMESTAMP(6), DATE_ADD(UTC_TIMESTAMP(6), INTERVAL 12 MONTH), v_unit_cost, ROUND(v_unit_cost * 1.25, 2), 20.00,
                10.00, 'Active', UTC_TIMESTAMP(6), UTC_TIMESTAMP(6)
            );

            SET v_prod_id = LAST_INSERT_ID();
        END IF;

        -- Record Finished Product Movement
        SELECT COUNT(*) INTO v_mov_cnt FROM `vendor_finished_product_movements`;
        INSERT INTO `vendor_finished_product_movements` (
            `FinishedProductId`, `MovementCode`, `MovementType`, `ReferenceId`,
            `QuantityChange`, `Unit`, `BalanceAfter`, `MovementDate`, `Remarks`, `CreatedAt`
        ) VALUES (
            v_prod_id, CONCAT('FMOV-', LPAD(v_mov_cnt + 1, 4, '0')),
            'Processing Output Inward', COALESCE(v_proc_code, 'PROCESSING'),
            p_output_quantity, p_unit, v_avail_qty, UTC_TIMESTAMP(6),
            CONCAT('Inward from Processing Batch ', COALESCE(v_proc_code, ''), ' (', COALESCE(v_batch_num, ''), ')'),
            UTC_TIMESTAMP(6)
        );

        -- Also register / update batch in vp_finished_product_batches for Sell Products catalog
        SET v_fp_batch_code = CONCAT('FP-', UPPER(LEFT(REPLACE(p_output_product_name, ' ', ''), 4)), '-', LPAD(p_processing_batch_id, 3, '0'));

        INSERT INTO `vp_finished_product_batches` (
            `vendor_id`, `batch_code`, `product_name`, `processing_batch_ref`,
            `unit`, `quantity_available`, `cost_per_unit`, `suggested_price`,
            `status`, `created_at`, `updated_at`
        ) VALUES (
            v_vendor_id, v_fp_batch_code, TRIM(p_output_product_name), COALESCE(v_proc_code, v_batch_num),
            p_unit, p_output_quantity, v_unit_cost, ROUND(v_unit_cost * 1.25, 2),
            'Active', UTC_TIMESTAMP(6), UTC_TIMESTAMP(6)
        )
        ON DUPLICATE KEY UPDATE
            `quantity_available` = `quantity_available` + VALUES(`quantity_available`),
            `cost_per_unit` = VALUES(`cost_per_unit`),
            `suggested_price` = VALUES(`suggested_price`),
            `updated_at` = UTC_TIMESTAMP(6);
    END IF;
END$$

DELIMITER ;
