-- ============================================================================
-- ARPPB: Vendor Dashboard Stored Procedures (MySQL 8+ / MariaDB 11+)
-- Script: VendorDashboardStoredProcedures.sql
-- Description: Stored procedures for Vendor Dashboard KPIs, financial summary,
--              purchase & sales trends, crop inventory, transactions, cross-entity
--              search, and OTP verification.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. sp_VendorDashboard_GetSummary
-- ----------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS `sp_VendorDashboard_GetSummary`;
DELIMITER $$
CREATE PROCEDURE `sp_VendorDashboard_GetSummary`(
    IN p_vendor_id BIGINT,
    IN p_from_date DATETIME(6),
    IN p_to_date DATETIME(6)
)
BEGIN
    -- Result Set 1: Overall KPIs and Financial Summary
    SELECT 
        -- Partner Counts
        (SELECT COUNT(*) FROM `vendor_farmers` WHERE `VendorId` = p_vendor_id) AS TotalFarmers,
        (SELECT COUNT(*) FROM `vendor_farmers` WHERE `VendorId` = p_vendor_id AND LOWER(`Status`) = 'active') AS ActiveFarmers,
        (SELECT COUNT(*) FROM `vendor_middlemen` WHERE `VendorId` = p_vendor_id) AS TotalMiddlemen,
        (SELECT COUNT(*) FROM `vendor_middlemen` WHERE `VendorId` = p_vendor_id AND LOWER(`Status`) = 'active') AS ActiveMiddlemen,
        (SELECT COUNT(*) FROM `vendor_customers` WHERE `VendorId` = p_vendor_id) AS TotalCustomers,

        -- Farmer Purchases in Range
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

        -- Middleman Purchases in Range
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

        -- Customer Sales in Range
        COALESCE((
            SELECT COUNT(*) 
            FROM `vendor_customer_orders` o
            INNER JOIN `vendor_customers` c ON o.`CustomerId` = c.`Id`
            WHERE c.`VendorId` = p_vendor_id
              AND (p_from_date IS NULL OR o.`OrderDate` >= p_from_date)
              AND (p_to_date IS NULL OR o.`OrderDate` < p_to_date)
        ), 0) AS TotalOrders,
        COALESCE((
            SELECT SUM(o.`Quantity`) 
            FROM `vendor_customer_orders` o
            INNER JOIN `vendor_customers` c ON o.`CustomerId` = c.`Id`
            WHERE c.`VendorId` = p_vendor_id
              AND (p_from_date IS NULL OR o.`OrderDate` >= p_from_date)
              AND (p_to_date IS NULL OR o.`OrderDate` < p_to_date)
        ), 0.00) AS SalesVolume,
        COALESCE((
            SELECT SUM(o.`TotalAmount`) 
            FROM `vendor_customer_orders` o
            INNER JOIN `vendor_customers` c ON o.`CustomerId` = c.`Id`
            WHERE c.`VendorId` = p_vendor_id
              AND (p_from_date IS NULL OR o.`OrderDate` >= p_from_date)
              AND (p_to_date IS NULL OR o.`OrderDate` < p_to_date)
        ), 0.00) AS TotalSales,

        -- Processing Expenses in Range
        COALESCE((
            SELECT SUM(`ProcessingExpenses`) 
            FROM `vendor_processing_batches`
            WHERE `VendorId` = p_vendor_id
              AND (p_from_date IS NULL OR `ProcessingDate` >= p_from_date)
              AND (p_to_date IS NULL OR `ProcessingDate` < p_to_date)
        ), 0.00) AS ProcessingExpenses,

        -- Estimated Cost of Goods Sold (orders matched to finished product production cost)
        COALESCE((
            SELECT SUM(o.`Quantity` * COALESCE(cost_lookup.`ProductionCost`, 0.00))
            FROM `vendor_customer_orders` o
            INNER JOIN `vendor_customers` c ON o.`CustomerId` = c.`Id`
            LEFT JOIN (
                SELECT `ProductName`, MIN(`ProductionCost`) AS `ProductionCost`
                FROM `vendor_finished_products`
                WHERE `VendorId` = p_vendor_id
                GROUP BY `ProductName`
            ) cost_lookup ON o.`ProductName` COLLATE utf8mb4_unicode_ci = cost_lookup.`ProductName` COLLATE utf8mb4_unicode_ci
            WHERE c.`VendorId` = p_vendor_id
              AND (p_from_date IS NULL OR o.`OrderDate` >= p_from_date)
              AND (p_to_date IS NULL OR o.`OrderDate` < p_to_date)
        ), 0.00) AS RawMaterialCost;

    -- Result Set 2: Purchase Trend Grouped By Date
    SELECT 
        dates.`PeriodStart`,
        COALESCE(SUM(dates.`FarmerAmount`), 0.00) AS FarmerPurchaseAmount,
        COALESCE(SUM(dates.`FarmerQty`), 0.00) AS FarmerPurchaseQuantity,
        COALESCE(SUM(dates.`MiddlemanAmount`), 0.00) AS MiddlemanPurchaseAmount,
        COALESCE(SUM(dates.`MiddlemanQty`), 0.00) AS MiddlemanPurchaseQuantity
    FROM (
        SELECT 
            DATE(p.`PurchaseDate`) AS PeriodStart,
            p.`TotalAmount` AS FarmerAmount,
            p.`Quantity` AS FarmerQty,
            0.00 AS MiddlemanAmount,
            0.00 AS MiddlemanQty
        FROM `vendor_farmer_purchases` p
        INNER JOIN `vendor_farmers` f ON p.`FarmerId` = f.`Id`
        WHERE f.`VendorId` = p_vendor_id
          AND (p_from_date IS NULL OR p.`PurchaseDate` >= p_from_date)
          AND (p_to_date IS NULL OR p.`PurchaseDate` < p_to_date)
        UNION ALL
        SELECT 
            DATE(p.`PurchaseDate`) AS PeriodStart,
            0.00 AS FarmerAmount,
            0.00 AS FarmerQty,
            p.`TotalAmount` AS MiddlemanAmount,
            p.`Quantity` AS MiddlemanQty
        FROM `vendor_middleman_purchases` p
        INNER JOIN `vendor_middlemen` m ON p.`MiddlemanId` = m.`Id`
        WHERE m.`VendorId` = p_vendor_id
          AND (p_from_date IS NULL OR p.`PurchaseDate` >= p_from_date)
          AND (p_to_date IS NULL OR p.`PurchaseDate` < p_to_date)
    ) dates
    GROUP BY dates.`PeriodStart`
    ORDER BY dates.`PeriodStart` ASC;

    -- Result Set 3: Raw Material Inventory Grouped By Crop
    SELECT 
        `CropName`,
        `Unit`,
        COALESCE(SUM(`AvailableQuantity`), 0.00) AS AvailableQuantity
    FROM `vendor_raw_material_stocks`
    WHERE `VendorId` = p_vendor_id
    GROUP BY `CropName`, `Unit`
    ORDER BY AvailableQuantity DESC;

    -- Result Set 4: Finished Products Inventory List
    SELECT 
        `ProductCode` AS ProductId,
        `ProductName`,
        `BrandName`,
        `AvailableQuantity`,
        `SoldQuantity`,
        `Unit`,
        `SellingPrice`,
        `MinThresholdQuantity`,
        (`AvailableQuantity` <= `MinThresholdQuantity`) AS IsLowStock
    FROM `vendor_finished_products`
    WHERE `VendorId` = p_vendor_id
    ORDER BY `ProductName` ASC;

    -- Result Set 5: Sales Revenue Trend Grouped By Date
    SELECT 
        DATE(o.`OrderDate`) AS PeriodStart,
        COALESCE(SUM(o.`TotalAmount`), 0.00) AS Revenue
    FROM `vendor_customer_orders` o
    INNER JOIN `vendor_customers` c ON o.`CustomerId` = c.`Id`
    WHERE c.`VendorId` = p_vendor_id
      AND (p_from_date IS NULL OR o.`OrderDate` >= p_from_date)
      AND (p_to_date IS NULL OR o.`OrderDate` < p_to_date)
    GROUP BY DATE(o.`OrderDate`)
    ORDER BY PeriodStart ASC;

    -- Result Set 6: Sales Product Revenue Breakdown
    SELECT 
        o.`ProductName`,
        COALESCE(SUM(o.`TotalAmount`), 0.00) AS Revenue
    FROM `vendor_customer_orders` o
    INNER JOIN `vendor_customers` c ON o.`CustomerId` = c.`Id`
    WHERE c.`VendorId` = p_vendor_id
      AND (p_from_date IS NULL OR o.`OrderDate` >= p_from_date)
      AND (p_to_date IS NULL OR o.`OrderDate` < p_to_date)
    GROUP BY o.`ProductName`
    ORDER BY Revenue DESC;
END$$
DELIMITER ;

-- ----------------------------------------------------------------------------
-- 2. sp_VendorDashboard_GetTransactions
-- ----------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS `sp_VendorDashboard_GetTransactions`;
DELIMITER $$
CREATE PROCEDURE `sp_VendorDashboard_GetTransactions`(
    IN p_vendor_id BIGINT,
    IN p_from_date DATETIME(6),
    IN p_to_date DATETIME(6),
    IN p_type VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_status VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_search VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_offset INT,
    IN p_limit INT
)
BEGIN
    DROP TEMPORARY TABLE IF EXISTS `tmp_vendor_txns`;

    CREATE TEMPORARY TABLE `tmp_vendor_txns` (
        `TransactionId` VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
        `Date` DATETIME(6),
        `PartyName` VARCHAR(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
        `Type` VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
        `Product` VARCHAR(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
        `Quantity` DECIMAL(12,2),
        `Unit` VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
        `Amount` DECIMAL(14,2),
        `DueAmount` DECIMAL(14,2),
        `Status` VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
        `OtpStatus` VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
        `ExpectedPaymentDate` DATETIME(6)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

    INSERT INTO `tmp_vendor_txns`
    SELECT 
        t.TransactionId,
        t.`Date`,
        t.PartyName,
        t.`Type`,
        t.Product,
        t.Quantity,
        t.Unit,
        t.Amount,
        t.DueAmount,
        t.`Status`,
        'NotTracked' AS OtpStatus,
        NULL AS ExpectedPaymentDate
    FROM (
        -- Farmer Purchases
        SELECT 
            p.`PurchaseCode` AS TransactionId,
            p.`PurchaseDate` AS `Date`,
            f.`FullName` AS PartyName,
            'Farmer Purchase' AS `Type`,
            p.`CropName` AS Product,
            p.`Quantity`,
            p.`Unit`,
            p.`TotalAmount` AS Amount,
            p.`DueAmount`,
            p.`PaymentStatus` AS `Status`
        FROM `vendor_farmer_purchases` p
        INNER JOIN `vendor_farmers` f ON p.`FarmerId` = f.`Id`
        WHERE f.`VendorId` = p_vendor_id

        UNION ALL

        -- Middleman Purchases
        SELECT 
            p.`PurchaseCode` AS TransactionId,
            p.`PurchaseDate` AS `Date`,
            m.`BusinessName` AS PartyName,
            'Middleman Purchase' AS `Type`,
            p.`CropName` AS Product,
            p.`Quantity`,
            p.`Unit`,
            p.`TotalAmount` AS Amount,
            p.`DueAmount`,
            p.`PaymentStatus` AS `Status`
        FROM `vendor_middleman_purchases` p
        INNER JOIN `vendor_middlemen` m ON p.`MiddlemanId` = m.`Id`
        WHERE m.`VendorId` = p_vendor_id

        UNION ALL

        -- Customer Sales
        SELECT 
            o.`OrderCode` AS TransactionId,
            o.`OrderDate` AS `Date`,
            c.`CustomerName` AS PartyName,
            'Customer Sale' AS `Type`,
            o.`ProductName` AS Product,
            o.`Quantity`,
            o.`Unit`,
            o.`TotalAmount` AS Amount,
            o.`DueAmount`,
            o.`OrderStatus` AS `Status`
        FROM `vendor_customer_orders` o
        INNER JOIN `vendor_customers` c ON o.`CustomerId` = c.`Id`
        WHERE c.`VendorId` = p_vendor_id

        UNION ALL

        -- Processing Batches
        SELECT 
            b.`ProcessingCode` AS TransactionId,
            b.`ProcessingDate` AS `Date`,
            'Vendor Processing' AS PartyName,
            'Processing' AS `Type`,
            b.`RawMaterialName` AS Product,
            b.`InputQuantity` AS Quantity,
            b.`Unit`,
            b.`TotalBatchCost` AS Amount,
            NULL AS DueAmount,
            b.`Status` AS `Status`
        FROM `vendor_processing_batches` b
        WHERE b.`VendorId` = p_vendor_id
    ) t
    WHERE (p_from_date IS NULL OR t.`Date` >= p_from_date)
      AND (p_to_date IS NULL OR t.`Date` < p_to_date)
      AND (p_type IS NULL OR p_type = '' OR LOWER(p_type) = 'all' OR LOWER(t.`Type`) COLLATE utf8mb4_unicode_ci = LOWER(p_type) COLLATE utf8mb4_unicode_ci)
      AND (p_status IS NULL OR p_status = '' OR LOWER(p_status) = 'all' OR LOWER(t.`Status`) COLLATE utf8mb4_unicode_ci = LOWER(p_status) COLLATE utf8mb4_unicode_ci)
      AND (p_search IS NULL OR p_search = '' OR 
           t.TransactionId COLLATE utf8mb4_unicode_ci LIKE CONCAT('%', p_search, '%') COLLATE utf8mb4_unicode_ci OR
           t.PartyName COLLATE utf8mb4_unicode_ci LIKE CONCAT('%', p_search, '%') COLLATE utf8mb4_unicode_ci OR
           t.Product COLLATE utf8mb4_unicode_ci LIKE CONCAT('%', p_search, '%') COLLATE utf8mb4_unicode_ci);

    -- Result Set 1: Paged items
    SELECT * 
    FROM `tmp_vendor_txns`
    ORDER BY `Date` DESC
    LIMIT p_limit OFFSET p_offset;

    -- Result Set 2: Total records count
    SELECT COUNT(*) AS TotalRecords FROM `tmp_vendor_txns`;

    DROP TEMPORARY TABLE IF EXISTS `tmp_vendor_txns`;
END$$
DELIMITER ;

-- ----------------------------------------------------------------------------
-- 3. sp_VendorDashboard_Search
-- ----------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS `sp_VendorDashboard_Search`;
DELIMITER $$
CREATE PROCEDURE `sp_VendorDashboard_Search`(
    IN p_vendor_id BIGINT,
    IN p_search VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_limit INT
)
BEGIN
    DECLARE v_term VARCHAR(102) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    SET v_term = CONCAT('%', TRIM(COALESCE(p_search, '')), '%');

    IF p_limit IS NULL OR p_limit <= 0 THEN
        SET p_limit = 20;
    ELSEIF p_limit > 50 THEN
        SET p_limit = 50;
    END IF;

    DROP TEMPORARY TABLE IF EXISTS `tmp_vendor_search`;
    CREATE TEMPORARY TABLE `tmp_vendor_search` (
        `EntityType` VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
        `EntityId` VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
        `Title` VARCHAR(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
        `Subtitle` VARCHAR(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
        `NavigationPath` VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
        `TypeOrder` INT,
        `RowInType` INT
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

    -- Each entity type: top p_limit matches in the same order as the original service.
    INSERT INTO `tmp_vendor_search`
    SELECT 'Farmer', `FarmerCode`, `FullName`, `MobileNumber`, CONCAT('/vendor/farmers/', `FarmerCode`), 1,
           ROW_NUMBER() OVER (ORDER BY `FarmerCode`)
    FROM `vendor_farmers`
    WHERE `VendorId` = p_vendor_id AND (`FarmerCode` COLLATE utf8mb4_unicode_ci LIKE v_term OR `FullName` COLLATE utf8mb4_unicode_ci LIKE v_term OR `MobileNumber` COLLATE utf8mb4_unicode_ci LIKE v_term)
    ORDER BY `FarmerCode`
    LIMIT p_limit;

    INSERT INTO `tmp_vendor_search`
    SELECT 'Middleman', `MiddlemanCode`, `BusinessName`, `FullName`, CONCAT('/vendor/middlemen/', `MiddlemanCode`), 2,
           ROW_NUMBER() OVER (ORDER BY `MiddlemanCode`)
    FROM `vendor_middlemen`
    WHERE `VendorId` = p_vendor_id AND (`MiddlemanCode` COLLATE utf8mb4_unicode_ci LIKE v_term OR `FullName` COLLATE utf8mb4_unicode_ci LIKE v_term OR `BusinessName` COLLATE utf8mb4_unicode_ci LIKE v_term OR `MobileNumber` COLLATE utf8mb4_unicode_ci LIKE v_term)
    ORDER BY `MiddlemanCode`
    LIMIT p_limit;

    INSERT INTO `tmp_vendor_search`
    SELECT 'Customer', `CustomerCode`, `CustomerName`, `BusinessName`, CONCAT('/vendor/customers/', `CustomerCode`), 3,
           ROW_NUMBER() OVER (ORDER BY `CustomerCode`)
    FROM `vendor_customers`
    WHERE `VendorId` = p_vendor_id AND (`CustomerCode` COLLATE utf8mb4_unicode_ci LIKE v_term OR `CustomerName` COLLATE utf8mb4_unicode_ci LIKE v_term OR `BusinessName` COLLATE utf8mb4_unicode_ci LIKE v_term OR `MobileNumber` COLLATE utf8mb4_unicode_ci LIKE v_term)
    ORDER BY `CustomerCode`
    LIMIT p_limit;

    INSERT INTO `tmp_vendor_search`
    SELECT 'RawMaterial', `StockCode`, `CropName`, `BatchNumber`, CONCAT('/vendor/raw-material-inventory/', `StockCode`), 4,
           ROW_NUMBER() OVER (ORDER BY `StockCode`)
    FROM `vendor_raw_material_stocks`
    WHERE `VendorId` = p_vendor_id AND (`StockCode` COLLATE utf8mb4_unicode_ci LIKE v_term OR `CropName` COLLATE utf8mb4_unicode_ci LIKE v_term OR `BatchNumber` COLLATE utf8mb4_unicode_ci LIKE v_term)
    ORDER BY `StockCode`
    LIMIT p_limit;

    INSERT INTO `tmp_vendor_search`
    SELECT 'ProcessingBatch', `ProcessingCode`, `RawMaterialName`, `BatchNumber`, CONCAT('/vendor/processing/batches/', `ProcessingCode`), 5,
           ROW_NUMBER() OVER (ORDER BY `ProcessingDate`)
    FROM `vendor_processing_batches`
    WHERE `VendorId` = p_vendor_id AND (`ProcessingCode` COLLATE utf8mb4_unicode_ci LIKE v_term OR `BatchNumber` COLLATE utf8mb4_unicode_ci LIKE v_term OR `RawMaterialName` COLLATE utf8mb4_unicode_ci LIKE v_term)
    ORDER BY `ProcessingDate`
    LIMIT p_limit;

    INSERT INTO `tmp_vendor_search`
    SELECT 'FinishedProduct', `ProductCode`, `ProductName`, `BrandName`, CONCAT('/vendor/finished-products/', `ProductCode`), 6,
           ROW_NUMBER() OVER (ORDER BY `ProductName`)
    FROM `vendor_finished_products`
    WHERE `VendorId` = p_vendor_id AND (`ProductCode` COLLATE utf8mb4_unicode_ci LIKE v_term OR `ProductName` COLLATE utf8mb4_unicode_ci LIKE v_term OR `BrandName` COLLATE utf8mb4_unicode_ci LIKE v_term)
    ORDER BY `ProductName`
    LIMIT p_limit;

    -- Round-robin across entity types (1st of each type, then 2nd of each, ...), same as the original service.
    SELECT `EntityType`, `EntityId`, `Title`, `Subtitle`, `NavigationPath`
    FROM `tmp_vendor_search`
    ORDER BY `RowInType`, `TypeOrder`
    LIMIT p_limit;

    DROP TEMPORARY TABLE IF EXISTS `tmp_vendor_search`;
END$$
DELIMITER ;

-- ----------------------------------------------------------------------------
-- 4. sp_VendorDashboard_GetPendingOtpConfirmations
-- ----------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS `sp_VendorDashboard_GetPendingOtpConfirmations`;
DELIMITER $$
CREATE PROCEDURE `sp_VendorDashboard_GetPendingOtpConfirmations`(
    IN p_vendor_id BIGINT,
    IN p_from_date DATETIME(6),
    IN p_to_date DATETIME(6)
)
BEGIN
    SELECT 
        l.`Id`,
        'Farmer' AS PartnerType,
        f.`FullName` AS PartnerName,
        f.`FarmerCode` AS PartnerCode,
        l.`Purpose`,
        l.`ActionDetails`,
        l.`Status`,
        l.`CreatedAt`,
        l.`OtpCode` AS SandboxOtp
    FROM `vendor_farmer_otp_logs` l
    INNER JOIN `vendor_farmers` f ON l.`FarmerId` = f.`Id`
    WHERE f.`VendorId` = p_vendor_id
      AND LOWER(l.`Status`) IN ('pending', 'sent')
      AND (p_from_date IS NULL OR l.`CreatedAt` >= p_from_date)
      AND (p_to_date IS NULL OR l.`CreatedAt` < p_to_date)
    UNION ALL
    SELECT 
        l.`Id`,
        'Middleman' AS PartnerType,
        m.`BusinessName` AS PartnerName,
        m.`MiddlemanCode` AS PartnerCode,
        l.`Purpose`,
        l.`ActionDetails`,
        l.`Status`,
        l.`CreatedAt`,
        l.`OtpCode` AS SandboxOtp
    FROM `vendor_middleman_otp_logs` l
    INNER JOIN `vendor_middlemen` m ON l.`MiddlemanId` = m.`Id`
    WHERE m.`VendorId` = p_vendor_id
      AND LOWER(l.`Status`) IN ('pending', 'sent')
      AND (p_from_date IS NULL OR l.`CreatedAt` >= p_from_date)
      AND (p_to_date IS NULL OR l.`CreatedAt` < p_to_date)
    ORDER BY `CreatedAt` DESC;
END$$
DELIMITER ;

-- ----------------------------------------------------------------------------
-- 5. sp_VendorDashboard_VerifyOtp
-- ----------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS `sp_VendorDashboard_VerifyOtp`;
DELIMITER $$
CREATE PROCEDURE `sp_VendorDashboard_VerifyOtp`(
    IN p_vendor_id BIGINT,
    IN p_partner_type VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_confirmation_id BIGINT,
    IN p_otp VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
)
BEGIN
    DECLARE v_count INT DEFAULT 0;
    DECLARE v_now DATETIME(6);
    SET v_now = UTC_TIMESTAMP(6);

    IF LOWER(TRIM(p_partner_type)) = 'farmer' THEN
        SELECT COUNT(*) INTO v_count
        FROM `vendor_farmer_otp_logs` l
        INNER JOIN `vendor_farmers` f ON l.`FarmerId` = f.`Id`
        WHERE f.`VendorId` = p_vendor_id
          AND l.`Id` = p_confirmation_id
          AND LOWER(l.`Status`) IN ('pending', 'sent')
          AND TRIM(l.`OtpCode`) COLLATE utf8mb4_unicode_ci = TRIM(p_otp) COLLATE utf8mb4_unicode_ci;

        IF v_count > 0 THEN
            UPDATE `vendor_farmer_otp_logs`
            SET `Status` = 'Verified', `VerifiedAt` = v_now
            WHERE `Id` = p_confirmation_id;

            SELECT 1 AS Verified, 'Farmer' AS PartnerType, p_confirmation_id AS ConfirmationId, v_now AS VerifiedAt;
        ELSE
            SELECT 0 AS Verified, 'Farmer' AS PartnerType, p_confirmation_id AS ConfirmationId, CAST(NULL AS DATETIME(6)) AS VerifiedAt;
        END IF;

    ELSEIF LOWER(TRIM(p_partner_type)) = 'middleman' THEN
        SELECT COUNT(*) INTO v_count
        FROM `vendor_middleman_otp_logs` l
        INNER JOIN `vendor_middlemen` m ON l.`MiddlemanId` = m.`Id`
        WHERE m.`VendorId` = p_vendor_id
          AND l.`Id` = p_confirmation_id
          AND LOWER(l.`Status`) IN ('pending', 'sent')
          AND TRIM(l.`OtpCode`) COLLATE utf8mb4_unicode_ci = TRIM(p_otp) COLLATE utf8mb4_unicode_ci;

        IF v_count > 0 THEN
            UPDATE `vendor_middleman_otp_logs`
            SET `Status` = 'Verified', `VerifiedAt` = v_now
            WHERE `Id` = p_confirmation_id;

            SELECT 1 AS Verified, 'Middleman' AS PartnerType, p_confirmation_id AS ConfirmationId, v_now AS VerifiedAt;
        ELSE
            SELECT 0 AS Verified, 'Middleman' AS PartnerType, p_confirmation_id AS ConfirmationId, CAST(NULL AS DATETIME(6)) AS VerifiedAt;
        END IF;

    ELSE
        SELECT 0 AS Verified, '' AS PartnerType, 0 AS ConfirmationId, CAST(NULL AS DATETIME(6)) AS VerifiedAt;
    END IF;
END$$
DELIMITER ;
