-- ============================================================================
-- Vendor Partners (Farmers, Middlemen, Customers) Stored Procedures
-- Author: Backend Team
-- ============================================================================

DROP PROCEDURE IF EXISTS `sp_VendorPartners_GetFarmersOverview`;
DROP PROCEDURE IF EXISTS `sp_VendorPartners_GetFarmers`;
DROP PROCEDURE IF EXISTS `sp_VendorPartners_GetFarmerById`;
DROP PROCEDURE IF EXISTS `sp_VendorPartners_CreateFarmer`;
DROP PROCEDURE IF EXISTS `sp_VendorPartners_UpdateFarmer`;
DROP PROCEDURE IF EXISTS `sp_VendorPartners_ToggleFarmerStatus`;
DROP PROCEDURE IF EXISTS `sp_VendorPartners_GetFarmerTransactions`;
DROP PROCEDURE IF EXISTS `sp_VendorPartners_GetFarmerPayments`;
DROP PROCEDURE IF EXISTS `sp_VendorPartners_GetFarmerOtpLogs`;

DROP PROCEDURE IF EXISTS `sp_VendorPartners_GetMiddlemenOverview`;
DROP PROCEDURE IF EXISTS `sp_VendorPartners_GetMiddlemen`;
DROP PROCEDURE IF EXISTS `sp_VendorPartners_GetMiddlemanById`;
DROP PROCEDURE IF EXISTS `sp_VendorPartners_CreateMiddleman`;
DROP PROCEDURE IF EXISTS `sp_VendorPartners_UpdateMiddleman`;
DROP PROCEDURE IF EXISTS `sp_VendorPartners_ToggleMiddlemanStatus`;
DROP PROCEDURE IF EXISTS `sp_VendorPartners_GetMiddlemanTransactions`;
DROP PROCEDURE IF EXISTS `sp_VendorPartners_GetMiddlemanPayments`;
DROP PROCEDURE IF EXISTS `sp_VendorPartners_GetMiddlemanOtpLogs`;

DROP PROCEDURE IF EXISTS `sp_VendorPartners_GetCustomersOverview`;
DROP PROCEDURE IF EXISTS `sp_VendorPartners_GetCustomers`;
DROP PROCEDURE IF EXISTS `sp_VendorPartners_GetCustomerById`;
DROP PROCEDURE IF EXISTS `sp_VendorPartners_CreateCustomer`;
DROP PROCEDURE IF EXISTS `sp_VendorPartners_UpdateCustomer`;
DROP PROCEDURE IF EXISTS `sp_VendorPartners_ToggleCustomerStatus`;

DELIMITER $$

-- ============================================================================
-- 1. FARMERS DIRECTORY & PROFILE
-- ============================================================================

CREATE PROCEDURE `sp_VendorPartners_GetFarmersOverview`(
    IN p_vendor_id BIGINT
)
BEGIN
    SELECT
        COUNT(DISTINCT f.`Id`) AS TotalFarmers,
        COALESCE(SUM(CASE WHEN LOWER(f.`Status`) = 'active' THEN 1 ELSE 0 END), 0) AS ActiveFarmers,
        COALESCE(SUM(CASE WHEN LOWER(f.`Status`) <> 'active' THEN 1 ELSE 0 END), 0) AS InactiveFarmers,
        (SELECT COUNT(*) FROM `vendor_farmer_purchases` p INNER JOIN `vendor_farmers` vf ON vf.`Id` = p.`FarmerId` WHERE vf.`VendorId` = p_vendor_id) AS TotalPurchases,
        (SELECT COALESCE(SUM(p.`Quantity`), 0) FROM `vendor_farmer_purchases` p INNER JOIN `vendor_farmers` vf ON vf.`Id` = p.`FarmerId` WHERE vf.`VendorId` = p_vendor_id) AS TotalQuantityProcured,
        'Qtl' AS QuantityUnit,
        (SELECT COALESCE(SUM(p.`TotalAmount`), 0) FROM `vendor_farmer_purchases` p INNER JOIN `vendor_farmers` vf ON vf.`Id` = p.`FarmerId` WHERE vf.`VendorId` = p_vendor_id) AS TotalPurchaseAmount,
        (SELECT COALESCE(SUM(p.`DueAmount`), 0) FROM `vendor_farmer_purchases` p INNER JOIN `vendor_farmers` vf ON vf.`Id` = p.`FarmerId` WHERE vf.`VendorId` = p_vendor_id) AS TotalPayablesDue
    FROM `vendor_farmers` f
    WHERE f.`VendorId` = p_vendor_id;
END$$

CREATE PROCEDURE `sp_VendorPartners_GetFarmers`(
    IN p_vendor_id BIGINT,
    IN p_search VARCHAR(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_district VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_state VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_crop VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_status VARCHAR(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
)
BEGIN
    SELECT
        f.`Id`,
        f.`FarmerCode`,
        f.`FullName` AS FarmerName,
        f.`FatherOrSpouseName`,
        f.`RegisteredCrops`,
        f.`MobileNumber`,
        f.`Village`,
        f.`District`,
        f.`State`,
        COUNT(p.`Id`) AS TotalPurchases,
        COALESCE(SUM(p.`Quantity`), 0) AS TotalPurchaseQuantity,
        'Qtl' AS QuantityUnit,
        COALESCE(SUM(p.`TotalAmount`), 0) AS TotalPurchaseAmount,
        COALESCE(SUM(p.`DueAmount`), 0) AS DueAmount,
        f.`Status`
    FROM `vendor_farmers` f
    LEFT JOIN `vendor_farmer_purchases` p ON p.`FarmerId` = f.`Id`
    WHERE f.`VendorId` = p_vendor_id
      AND (p_district IS NULL OR p_district = '' OR LOWER(p_district) = 'all' OR LOWER(f.`District`) = LOWER(p_district))
      AND (p_state IS NULL OR p_state = '' OR LOWER(p_state) = 'all' OR LOWER(f.`State`) = LOWER(p_state))
      AND (p_status IS NULL OR p_status = '' OR LOWER(p_status) = 'all' OR LOWER(f.`Status`) = LOWER(p_status))
      AND (p_crop IS NULL OR p_crop = '' OR LOWER(p_crop) = 'all' OR LOWER(f.`RegisteredCrops`) LIKE CONCAT('%', LOWER(p_crop), '%'))
      AND (
          p_search IS NULL OR p_search = '' OR
          LOWER(f.`FarmerCode`) LIKE CONCAT('%', LOWER(p_search), '%') OR
          LOWER(f.`FullName`) LIKE CONCAT('%', LOWER(p_search), '%') OR
          LOWER(f.`MobileNumber`) LIKE CONCAT('%', LOWER(p_search), '%') OR
          LOWER(f.`Village`) LIKE CONCAT('%', LOWER(p_search), '%') OR
          LOWER(f.`District`) LIKE CONCAT('%', LOWER(p_search), '%')
      )
    GROUP BY
        f.`Id`, f.`FarmerCode`, f.`FullName`, f.`FatherOrSpouseName`, f.`RegisteredCrops`,
        f.`MobileNumber`, f.`Village`, f.`District`, f.`State`, f.`Status`
    ORDER BY f.`FarmerCode`;
END$$

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
        f.`District`,
        f.`State`,
        f.`PinCode`,
        f.`LandAcres`,
        f.`RegisteredCrops`,
        f.`BankAccountNumber`,
        f.`IfscCode`,
        f.`BankName`,
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
    IN p_bank_account_number VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_ifsc_code VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_bank_name VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_aadhaar_number VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
)
BEGIN
    DECLARE v_count INT DEFAULT 0;
    DECLARE v_code VARCHAR(50);

    SELECT COUNT(*) INTO v_count FROM `vendor_farmers` WHERE `VendorId` = p_vendor_id;
    SET v_code = CONCAT('FARM-', LPAD(v_count + 1, 4, '0'));

    INSERT INTO `vendor_farmers` (
        `VendorId`, `FarmerCode`, `FullName`, `FatherOrSpouseName`, `MobileNumber`, `Email`,
        `Village`, `District`, `State`, `PinCode`, `LandAcres`, `RegisteredCrops`,
        `BankAccountNumber`, `IfscCode`, `BankName`, `AadhaarNumber`, `Status`,
        `RegisteredAt`, `CreatedAt`, `UpdatedAt`
    ) VALUES (
        p_vendor_id, v_code, p_full_name, p_father_or_spouse_name, p_mobile_number, p_email,
        p_village, p_district, p_state, p_pin_code, p_land_acres, p_registered_crops,
        p_bank_account_number, p_ifsc_code, p_bank_name, p_aadhaar_number, 'Active',
        UTC_TIMESTAMP(6), UTC_TIMESTAMP(6), UTC_TIMESTAMP(6)
    );

    CALL `sp_VendorPartners_GetFarmerById`(p_vendor_id, v_code);
END$$

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
    IN p_bank_account_number VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_ifsc_code VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_bank_name VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_aadhaar_number VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_status VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
)
BEGIN
    DECLARE v_farmer_id BIGINT DEFAULT NULL;
    DECLARE v_code VARCHAR(50) DEFAULT NULL;

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
            `District` = p_district,
            `State` = p_state,
            `PinCode` = p_pin_code,
            `LandAcres` = p_land_acres,
            `RegisteredCrops` = p_registered_crops,
            `BankAccountNumber` = p_bank_account_number,
            `IfscCode` = p_ifsc_code,
            `BankName` = p_bank_name,
            `AadhaarNumber` = p_aadhaar_number,
            `Status` = COALESCE(NULLIF(p_status, ''), `Status`),
            `UpdatedAt` = UTC_TIMESTAMP(6)
        WHERE `Id` = v_farmer_id;
    END IF;

    CALL `sp_VendorPartners_GetFarmerById`(p_vendor_id, COALESCE(v_code, p_farmer_id_or_code));
END$$

CREATE PROCEDURE `sp_VendorPartners_ToggleFarmerStatus`(
    IN p_vendor_id BIGINT,
    IN p_farmer_id_or_code VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
)
BEGIN
    DECLARE v_farmer_id BIGINT DEFAULT NULL;

    SELECT `Id` INTO v_farmer_id
    FROM `vendor_farmers`
    WHERE `VendorId` = p_vendor_id
      AND (`FarmerCode` = p_farmer_id_or_code OR CAST(`Id` AS CHAR) = p_farmer_id_or_code)
    LIMIT 1;

    IF v_farmer_id IS NULL THEN
        SELECT 0 AS Toggled;
    ELSE
        UPDATE `vendor_farmers`
        SET `Status` = CASE WHEN LOWER(`Status`) = 'active' THEN 'Inactive' ELSE 'Active' END,
            `UpdatedAt` = UTC_TIMESTAMP(6)
        WHERE `Id` = v_farmer_id;

        SELECT 1 AS Toggled;
    END IF;
END$$

CREATE PROCEDURE `sp_VendorPartners_GetFarmerTransactions`(
    IN p_vendor_id BIGINT,
    IN p_farmer_id_or_code VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
)
BEGIN
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
    INNER JOIN `vendor_farmers` f ON f.`Id` = p.`FarmerId`
    WHERE f.`VendorId` = p_vendor_id
      AND (f.`FarmerCode` = p_farmer_id_or_code OR CAST(f.`Id` AS CHAR) = p_farmer_id_or_code)
    ORDER BY p.`PurchaseDate` DESC;
END$$

CREATE PROCEDURE `sp_VendorPartners_GetFarmerPayments`(
    IN p_vendor_id BIGINT,
    IN p_farmer_id_or_code VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
)
BEGIN
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
    INNER JOIN `vendor_farmers` f ON f.`Id` = pay.`FarmerId`
    WHERE f.`VendorId` = p_vendor_id
      AND (f.`FarmerCode` = p_farmer_id_or_code OR CAST(f.`Id` AS CHAR) = p_farmer_id_or_code)
    ORDER BY pay.`PaymentDate` DESC;
END$$

CREATE PROCEDURE `sp_VendorPartners_GetFarmerOtpLogs`(
    IN p_vendor_id BIGINT,
    IN p_farmer_id_or_code VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
)
BEGIN
    SELECT
        o.`Id`,
        o.`OtpCode`,
        o.`Purpose`,
        o.`ActionDetails`,
        o.`Status`,
        o.`VerifiedAt`,
        o.`CreatedAt`
    FROM `vendor_farmer_otp_logs` o
    INNER JOIN `vendor_farmers` f ON f.`Id` = o.`FarmerId`
    WHERE f.`VendorId` = p_vendor_id
      AND (f.`FarmerCode` = p_farmer_id_or_code OR CAST(f.`Id` AS CHAR) = p_farmer_id_or_code)
    ORDER BY o.`CreatedAt` DESC;
END$$

-- ============================================================================
-- 2. MIDDLEMEN DIRECTORY & PROFILE
-- ============================================================================

CREATE PROCEDURE `sp_VendorPartners_GetMiddlemenOverview`(
    IN p_vendor_id BIGINT
)
BEGIN
    SELECT
        COUNT(DISTINCT m.`Id`) AS TotalMiddlemen,
        COALESCE(SUM(CASE WHEN LOWER(m.`Status`) = 'active' THEN 1 ELSE 0 END), 0) AS ActiveMiddlemen,
        COALESCE(SUM(CASE WHEN LOWER(m.`Status`) <> 'active' THEN 1 ELSE 0 END), 0) AS InactiveMiddlemen,
        (SELECT COUNT(*) FROM `vendor_middleman_purchases` p INNER JOIN `vendor_middlemen` vm ON vm.`Id` = p.`MiddlemanId` WHERE vm.`VendorId` = p_vendor_id) AS TotalTransactions,
        (SELECT COALESCE(SUM(p.`Quantity`), 0) FROM `vendor_middleman_purchases` p INNER JOIN `vendor_middlemen` vm ON vm.`Id` = p.`MiddlemanId` WHERE vm.`VendorId` = p_vendor_id) AS TotalQuantityProcured,
        'Qtl' AS QuantityUnit,
        (SELECT COALESCE(SUM(p.`TotalAmount`), 0) FROM `vendor_middleman_purchases` p INNER JOIN `vendor_middlemen` vm ON vm.`Id` = p.`MiddlemanId` WHERE vm.`VendorId` = p_vendor_id) AS TotalTransactionAmount,
        (SELECT COALESCE(SUM(p.`DueAmount`), 0) FROM `vendor_middleman_purchases` p INNER JOIN `vendor_middlemen` vm ON vm.`Id` = p.`MiddlemanId` WHERE vm.`VendorId` = p_vendor_id) AS TotalPayablesDue
    FROM `vendor_middlemen` m
    WHERE m.`VendorId` = p_vendor_id;
END$$

CREATE PROCEDURE `sp_VendorPartners_GetMiddlemen`(
    IN p_vendor_id BIGINT,
    IN p_search VARCHAR(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_district VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_state VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_status VARCHAR(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
)
BEGIN
    SELECT
        m.`Id`,
        m.`MiddlemanCode`,
        m.`FullName` AS MiddlemanName,
        m.`Email`,
        m.`MobileNumber`,
        m.`BusinessName`,
        m.`Gstin`,
        m.`MarketYardLocation`,
        m.`District`,
        m.`State`,
        COUNT(p.`Id`) AS TotalTransactions,
        COALESCE(SUM(p.`Quantity`), 0) AS TotalTransactionQuantity,
        'Qtl' AS QuantityUnit,
        COALESCE(SUM(p.`TotalAmount`), 0) AS TotalTransactionAmount,
        COALESCE(SUM(p.`DueAmount`), 0) AS DueAmount,
        m.`Status`
    FROM `vendor_middlemen` m
    LEFT JOIN `vendor_middleman_purchases` p ON p.`MiddlemanId` = m.`Id`
    WHERE m.`VendorId` = p_vendor_id
      AND (p_district IS NULL OR p_district = '' OR LOWER(p_district) = 'all' OR LOWER(m.`District`) = LOWER(p_district))
      AND (p_state IS NULL OR p_state = '' OR LOWER(p_state) = 'all' OR LOWER(m.`State`) = LOWER(p_state))
      AND (p_status IS NULL OR p_status = '' OR LOWER(p_status) = 'all' OR LOWER(m.`Status`) = LOWER(p_status))
      AND (
          p_search IS NULL OR p_search = '' OR
          LOWER(m.`MiddlemanCode`) LIKE CONCAT('%', LOWER(p_search), '%') OR
          LOWER(m.`FullName`) LIKE CONCAT('%', LOWER(p_search), '%') OR
          LOWER(m.`BusinessName`) LIKE CONCAT('%', LOWER(p_search), '%') OR
          LOWER(m.`MobileNumber`) LIKE CONCAT('%', LOWER(p_search), '%') OR
          LOWER(m.`Gstin`) LIKE CONCAT('%', LOWER(p_search), '%')
      )
    GROUP BY
        m.`Id`, m.`MiddlemanCode`, m.`FullName`, m.`Email`, m.`MobileNumber`,
        m.`BusinessName`, m.`Gstin`, m.`MarketYardLocation`, m.`District`, m.`State`, m.`Status`
    ORDER BY m.`MiddlemanCode`;
END$$

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
    IN p_opening_balance DECIMAL(14,2)
)
BEGIN
    DECLARE v_count INT DEFAULT 0;
    DECLARE v_code VARCHAR(50);

    SELECT COUNT(*) INTO v_count FROM `vendor_middlemen` WHERE `VendorId` = p_vendor_id;
    SET v_code = CONCAT('MID-', LPAD(v_count + 1, 4, '0'));

    INSERT INTO `vendor_middlemen` (
        `VendorId`, `MiddlemanCode`, `FullName`, `Email`, `MobileNumber`, `BusinessName`,
        `Gstin`, `Pan`, `MarketYardLocation`, `District`, `State`, `PinCode`,
        `OpeningBalance`, `Status`, `RegisteredAt`, `CreatedAt`, `UpdatedAt`
    ) VALUES (
        p_vendor_id, v_code, p_full_name, p_email, p_mobile_number, p_business_name,
        p_gstin, p_pan, p_market_yard_location, p_district, p_state, p_pin_code,
        p_opening_balance, 'Active', UTC_TIMESTAMP(6), UTC_TIMESTAMP(6), UTC_TIMESTAMP(6)
    );

    CALL `sp_VendorPartners_GetMiddlemanById`(p_vendor_id, v_code);
END$$

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
    IN p_status VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
)
BEGIN
    DECLARE v_mid_id BIGINT DEFAULT NULL;
    DECLARE v_code VARCHAR(50) DEFAULT NULL;

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
            `Status` = COALESCE(NULLIF(p_status, ''), `Status`),
            `UpdatedAt` = UTC_TIMESTAMP(6)
        WHERE `Id` = v_mid_id;
    END IF;

    CALL `sp_VendorPartners_GetMiddlemanById`(p_vendor_id, COALESCE(v_code, p_middleman_id_or_code));
END$$

CREATE PROCEDURE `sp_VendorPartners_ToggleMiddlemanStatus`(
    IN p_vendor_id BIGINT,
    IN p_middleman_id_or_code VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
)
BEGIN
    DECLARE v_mid_id BIGINT DEFAULT NULL;

    SELECT `Id` INTO v_mid_id
    FROM `vendor_middlemen`
    WHERE `VendorId` = p_vendor_id
      AND (`MiddlemanCode` = p_middleman_id_or_code OR CAST(`Id` AS CHAR) = p_middleman_id_or_code)
    LIMIT 1;

    IF v_mid_id IS NULL THEN
        SELECT 0 AS Toggled;
    ELSE
        UPDATE `vendor_middlemen`
        SET `Status` = CASE WHEN LOWER(`Status`) = 'active' THEN 'Inactive' ELSE 'Active' END,
            `UpdatedAt` = UTC_TIMESTAMP(6)
        WHERE `Id` = v_mid_id;

        SELECT 1 AS Toggled;
    END IF;
END$$

CREATE PROCEDURE `sp_VendorPartners_GetMiddlemanTransactions`(
    IN p_vendor_id BIGINT,
    IN p_middleman_id_or_code VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
)
BEGIN
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
    INNER JOIN `vendor_middlemen` m ON m.`Id` = p.`MiddlemanId`
    WHERE m.`VendorId` = p_vendor_id
      AND (m.`MiddlemanCode` = p_middleman_id_or_code OR CAST(m.`Id` AS CHAR) = p_middleman_id_or_code)
    ORDER BY p.`PurchaseDate` DESC;
END$$

CREATE PROCEDURE `sp_VendorPartners_GetMiddlemanPayments`(
    IN p_vendor_id BIGINT,
    IN p_middleman_id_or_code VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
)
BEGIN
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
    INNER JOIN `vendor_middlemen` m ON m.`Id` = pay.`MiddlemanId`
    WHERE m.`VendorId` = p_vendor_id
      AND (m.`MiddlemanCode` = p_middleman_id_or_code OR CAST(m.`Id` AS CHAR) = p_middleman_id_or_code)
    ORDER BY pay.`PaymentDate` DESC;
END$$

CREATE PROCEDURE `sp_VendorPartners_GetMiddlemanOtpLogs`(
    IN p_vendor_id BIGINT,
    IN p_middleman_id_or_code VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
)
BEGIN
    SELECT
        o.`Id`,
        o.`OtpCode`,
        o.`Purpose`,
        o.`ActionDetails`,
        o.`Status`,
        o.`VerifiedAt`,
        o.`CreatedAt`
    FROM `vendor_middleman_otp_logs` o
    INNER JOIN `vendor_middlemen` m ON m.`Id` = o.`MiddlemanId`
    WHERE m.`VendorId` = p_vendor_id
      AND (m.`MiddlemanCode` = p_middleman_id_or_code OR CAST(m.`Id` AS CHAR) = p_middleman_id_or_code)
    ORDER BY o.`CreatedAt` DESC;
END$$

-- ============================================================================
-- 3. CUSTOMERS DIRECTORY & PROFILE
-- ============================================================================

CREATE PROCEDURE `sp_VendorPartners_GetCustomersOverview`(
    IN p_vendor_id BIGINT
)
BEGIN
    SELECT
        COUNT(DISTINCT c.`Id`) AS TotalCustomers,
        COALESCE(SUM(CASE WHEN LOWER(c.`Status`) = 'active' THEN 1 ELSE 0 END), 0) AS ActiveCustomers,
        COALESCE(SUM(CASE WHEN LOWER(c.`Status`) <> 'active' THEN 1 ELSE 0 END), 0) AS InactiveCustomers,
        (SELECT COUNT(*) FROM `vendor_customer_orders` o INNER JOIN `vendor_customers` vc ON vc.`Id` = o.`CustomerId` WHERE vc.`VendorId` = p_vendor_id) AS TotalOrders,
        (SELECT COALESCE(SUM(o.`TotalAmount`), 0) FROM `vendor_customer_orders` o INNER JOIN `vendor_customers` vc ON vc.`Id` = o.`CustomerId` WHERE vc.`VendorId` = p_vendor_id) AS TotalSalesAmount,
        (SELECT COALESCE(SUM(o.`DueAmount`), 0) FROM `vendor_customer_orders` o INNER JOIN `vendor_customers` vc ON vc.`Id` = o.`CustomerId` WHERE vc.`VendorId` = p_vendor_id) AS TotalReceivablesDue
    FROM `vendor_customers` c
    WHERE c.`VendorId` = p_vendor_id;
END$$

CREATE PROCEDURE `sp_VendorPartners_GetCustomers`(
    IN p_vendor_id BIGINT,
    IN p_search VARCHAR(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_district VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_state VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_status VARCHAR(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
)
BEGIN
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
        COUNT(o.`Id`) AS TotalOrders,
        COALESCE(SUM(o.`Quantity`), 0) AS TotalPurchaseQuantity,
        COALESCE(MAX(o.`Unit`), 'Quintal') AS QuantityUnit,
        COALESCE(SUM(o.`TotalAmount`), 0) AS TotalSalesAmount,
        COALESCE(SUM(o.`DueAmount`), 0) AS ReceivableAmount,
        c.`Status`
    FROM `vendor_customers` c
    LEFT JOIN `vendor_customer_orders` o ON o.`CustomerId` = c.`Id`
    WHERE c.`VendorId` = p_vendor_id
      AND (p_district IS NULL OR p_district = '' OR LOWER(p_district) = 'all' OR LOWER(c.`District`) = LOWER(p_district))
      AND (p_state IS NULL OR p_state = '' OR LOWER(p_state) = 'all' OR LOWER(c.`State`) = LOWER(p_state))
      AND (p_status IS NULL OR p_status = '' OR LOWER(p_status) = 'all' OR LOWER(c.`Status`) = LOWER(p_status))
      AND (
          p_search IS NULL OR p_search = '' OR
          LOWER(c.`CustomerCode`) LIKE CONCAT('%', LOWER(p_search), '%') OR
          LOWER(c.`CustomerName`) LIKE CONCAT('%', LOWER(p_search), '%') OR
          LOWER(c.`BusinessName`) LIKE CONCAT('%', LOWER(p_search), '%') OR
          LOWER(c.`MobileNumber`) LIKE CONCAT('%', LOWER(p_search), '%') OR
          LOWER(c.`District`) LIKE CONCAT('%', LOWER(p_search), '%')
      )
    GROUP BY
        c.`Id`, c.`CustomerCode`, c.`CustomerName`, c.`BusinessName`, c.`CustomerType`,
        c.`MobileNumber`, c.`Email`, c.`Address`, c.`District`, c.`State`, c.`Status`
    ORDER BY c.`CustomerCode`;
END$$

CREATE PROCEDURE `sp_VendorPartners_GetCustomerById`(
    IN p_vendor_id BIGINT,
    IN p_customer_id_or_code VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
)
BEGIN
    DECLARE v_cust_id BIGINT DEFAULT NULL;

    SELECT c.`Id` INTO v_cust_id
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
        c.`CreditLimit`,
        c.`Status`
    FROM `vendor_customers` c
    WHERE c.`Id` = v_cust_id;

    -- Result Set 2: Orders
    SELECT
        o.`Id`,
        o.`OrderCode`,
        o.`ProductName`,
        o.`Quantity`,
        o.`Unit`,
        o.`TotalAmount`,
        o.`DueAmount`,
        o.`OrderStatus`,
        o.`OrderDate`
    FROM `vendor_customer_orders` o
    WHERE o.`CustomerId` = v_cust_id
    ORDER BY o.`OrderDate` DESC;
END$$

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
    IN p_credit_limit DECIMAL(14,2)
)
BEGIN
    DECLARE v_count INT DEFAULT 0;
    DECLARE v_code VARCHAR(50);

    SELECT COUNT(*) INTO v_count FROM `vendor_customers` WHERE `VendorId` = p_vendor_id;
    SET v_code = CONCAT('CUST-', LPAD(v_count + 1, 4, '0'));

    INSERT INTO `vendor_customers` (
        `VendorId`, `CustomerCode`, `CustomerName`, `BusinessName`, `CustomerType`,
        `MobileNumber`, `Email`, `Address`, `District`, `State`, `PinCode`,
        `Gstin`, `CreditLimit`, `Status`, `CreatedAt`, `UpdatedAt`
    ) VALUES (
        p_vendor_id, v_code, p_customer_name, p_business_name, p_customer_type,
        p_mobile_number, p_email, p_address, p_district, p_state, p_pin_code,
        p_gstin, p_credit_limit, 'Active', UTC_TIMESTAMP(6), UTC_TIMESTAMP(6)
    );

    CALL `sp_VendorPartners_GetCustomerById`(p_vendor_id, v_code);
END$$

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
    IN p_status VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
)
BEGIN
    DECLARE v_cust_id BIGINT DEFAULT NULL;
    DECLARE v_code VARCHAR(50) DEFAULT NULL;

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
            `CreditLimit` = p_credit_limit,
            `Status` = COALESCE(NULLIF(p_status, ''), `Status`),
            `UpdatedAt` = UTC_TIMESTAMP(6)
        WHERE `Id` = v_cust_id;
    END IF;

    CALL `sp_VendorPartners_GetCustomerById`(p_vendor_id, COALESCE(v_code, p_customer_id_or_code));
END$$

CREATE PROCEDURE `sp_VendorPartners_ToggleCustomerStatus`(
    IN p_vendor_id BIGINT,
    IN p_customer_id_or_code VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
)
BEGIN
    DECLARE v_cust_id BIGINT DEFAULT NULL;

    SELECT `Id` INTO v_cust_id
    FROM `vendor_customers`
    WHERE `VendorId` = p_vendor_id
      AND (`CustomerCode` = p_customer_id_or_code OR CAST(`Id` AS CHAR) = p_customer_id_or_code)
    LIMIT 1;

    IF v_cust_id IS NULL THEN
        SELECT 0 AS Toggled;
    ELSE
        UPDATE `vendor_customers`
        SET `Status` = CASE WHEN LOWER(`Status`) = 'active' THEN 'Inactive' ELSE 'Active' END,
            `UpdatedAt` = UTC_TIMESTAMP(6)
        WHERE `Id` = v_cust_id;

        SELECT 1 AS Toggled;
    END IF;
END$$

DELIMITER ;
