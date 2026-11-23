-- ==================================================================================
-- AgriConnect (ARPPB) - Middleman Module Notifications Stored Procedures & Triggers
-- Target DB: MariaDB (u819242402_arppb) on srv1061.hstgr.io:3306
--
-- PURPOSE:
-- 1. Full persistence for Middleman Notifications in MySQL table `MiddlemanNotifications`.
-- 2. Bidirectional support for both naming conventions:
--    - sp_Middleman...
--    - sp_Middleman_...
-- 3. Automatic notification persistence via DB triggers on middleman business tables:
--    - middleman_farmers (Registration)
--    - middleman_vendors (Registration)
--    - middleman_customers (Registration)
--    - middleman_purchases (Procurement orders)
--    - middleman_vendor_sales (Vendor sales)
--    - middleman_sales (Customer sales)
--    - middleman_confirmations (OTP verification/rejection)
--    - middleman_ledger (Ledger entries)
-- 4. Case-insensitive filtering for status ('All', 'Read', 'Unread') and time range
--    ('All', 'Today', 'Last7Days', 'Last30Days').
-- 5. Strict UTF-8 Unicode collation (utf8mb4_unicode_ci).
-- ==================================================================================

USE `u819242402_arppb`;

-- ----------------------------------------------------------------------------------
-- TABLE DEFINITION
-- ----------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `MiddlemanNotifications` (
  `Id` BIGINT(20) NOT NULL AUTO_INCREMENT,
  `UserId` BIGINT(20) NOT NULL,
  `Title` VARCHAR(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `Description` VARCHAR(1000) COLLATE utf8mb4_unicode_ci NOT NULL,
  `Category` VARCHAR(100) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'General',
  `Priority` ENUM('High','Medium','Low') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Medium',
  `ActorName` VARCHAR(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ReferenceNumber` VARCHAR(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ModuleUrl` VARCHAR(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `IsRead` TINYINT(1) NOT NULL DEFAULT 0,
  `CreatedAt` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`Id`),
  KEY `IX_MiddlemanNotifications_UserId` (`UserId`),
  KEY `IX_MiddlemanNotifications_CreatedAt` (`CreatedAt`),
  KEY `IX_MiddlemanNotifications_IsRead` (`IsRead`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DELIMITER $$

-- ----------------------------------------------------------------------------------
-- 1. CREATE NOTIFICATION
-- ----------------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS `sp_MiddlemanCreateNotification`$$
CREATE PROCEDURE `sp_MiddlemanCreateNotification`(
    IN p_user_id BIGINT,
    IN p_title VARCHAR(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_description VARCHAR(1000) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_category VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_priority VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_actor_name VARCHAR(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_reference_number VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_module_url VARCHAR(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
)
BEGIN
    DECLARE v_target_user_id BIGINT DEFAULT p_user_id;
 
    -- If passed p_user_id is a MiddlemanProfile.Id instead of UserId, resolve it
    IF EXISTS (SELECT 1 FROM `MiddlemanProfiles` WHERE `Id` = p_user_id) THEN
        SELECT `UserId` INTO v_target_user_id FROM `MiddlemanProfiles` WHERE `Id` = p_user_id LIMIT 1;
    END IF;

    INSERT INTO `MiddlemanNotifications` (
        `UserId`, `Title`, `Description`, `Category`, `Priority`,
        `ActorName`, `ReferenceNumber`, `ModuleUrl`, `IsRead`, `CreatedAt`
    ) VALUES (
        v_target_user_id,
        p_title,
        p_description,
        COALESCE(p_category, 'General'),
        COALESCE(p_priority, 'Medium'),
        p_actor_name,
        p_reference_number,
        p_module_url,
        0,
        NOW(6)
    );
 
    SELECT LAST_INSERT_ID() AS id;
END$$

DROP PROCEDURE IF EXISTS `sp_Middleman_CreateNotification`$$
CREATE PROCEDURE `sp_Middleman_CreateNotification`(
    IN p_user_id BIGINT,
    IN p_title VARCHAR(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_description VARCHAR(1000) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_category VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_priority VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_actor_name VARCHAR(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_reference_number VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_module_url VARCHAR(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
)
BEGIN
    CALL sp_MiddlemanCreateNotification(
        p_user_id, p_title, p_description, p_category, p_priority,
        p_actor_name, p_reference_number, p_module_url
    );
END$$

-- ----------------------------------------------------------------------------------
-- 2. GET NOTIFICATIONS (PAGINATED WITH FILTERS)
-- ----------------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS `sp_MiddlemanGetNotifications`$$
CREATE PROCEDURE `sp_MiddlemanGetNotifications`(
    IN p_user_id BIGINT,
    IN p_search VARCHAR(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_category VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_priority VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_status VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_time_range VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_offset INT,
    IN p_page_size INT
)
BEGIN
    SELECT 
        Id AS id,
        Title AS title,
        Description AS description,
        Category AS category,
        Priority AS priority,
        ActorName AS actor_name,
        ReferenceNumber AS reference_number,
        ModuleUrl AS module_url,
        IsRead AS is_read,
        CreatedAt AS created_at
    FROM `MiddlemanNotifications`
    WHERE (UserId = p_user_id OR UserId IN (SELECT `UserId` FROM `MiddlemanProfiles` WHERE `Id` = p_user_id))
      AND (p_search IS NULL OR p_search = '' 
           OR Title LIKE CONCAT('%', p_search, '%')
           OR Description LIKE CONCAT('%', p_search, '%')
           OR ReferenceNumber LIKE CONCAT('%', p_search, '%'))
      AND (p_category IS NULL OR LOWER(p_category) = 'all' OR Category = p_category)
      AND (p_priority IS NULL OR LOWER(p_priority) = 'all' OR Priority = p_priority)
      AND (p_status IS NULL OR LOWER(p_status) = 'all' 
           OR (LOWER(p_status) = 'read' AND IsRead = 1) 
           OR (LOWER(p_status) = 'unread' AND IsRead = 0))
      AND (p_time_range IS NULL OR LOWER(p_time_range) = 'all'
           OR (LOWER(p_time_range) = 'today' AND CreatedAt >= CURDATE())
           OR (LOWER(p_time_range) = 'last7days' AND CreatedAt >= NOW() - INTERVAL 7 DAY)
           OR (LOWER(p_time_range) = 'last30days' AND CreatedAt >= NOW() - INTERVAL 30 DAY))
    ORDER BY CreatedAt DESC, Id DESC
    LIMIT p_offset, p_page_size;
END$$

DROP PROCEDURE IF EXISTS `sp_Middleman_GetNotifications`$$
CREATE PROCEDURE `sp_Middleman_GetNotifications`(
    IN p_user_id BIGINT,
    IN p_search VARCHAR(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_category VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_priority VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_status VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_time_range VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_offset INT,
    IN p_page_size INT
)
BEGIN
    CALL sp_MiddlemanGetNotifications(
        p_user_id, p_search, p_category, p_priority, p_status, p_time_range, p_offset, p_page_size
    );
END$$

-- ----------------------------------------------------------------------------------
-- 3. COUNT NOTIFICATIONS (WITH FILTERS)
-- ----------------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS `sp_MiddlemanCountNotifications`$$
CREATE PROCEDURE `sp_MiddlemanCountNotifications`(
    IN p_user_id BIGINT,
    IN p_search VARCHAR(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_category VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_priority VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_status VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_time_range VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
)
BEGIN
    SELECT COUNT(*) AS total
    FROM `MiddlemanNotifications`
    WHERE (UserId = p_user_id OR UserId IN (SELECT `UserId` FROM `MiddlemanProfiles` WHERE `Id` = p_user_id))
      AND (p_search IS NULL OR p_search = '' 
           OR Title LIKE CONCAT('%', p_search, '%')
           OR Description LIKE CONCAT('%', p_search, '%')
           OR ReferenceNumber LIKE CONCAT('%', p_search, '%'))
      AND (p_category IS NULL OR LOWER(p_category) = 'all' OR Category = p_category)
      AND (p_priority IS NULL OR LOWER(p_priority) = 'all' OR Priority = p_priority)
      AND (p_status IS NULL OR LOWER(p_status) = 'all' 
           OR (LOWER(p_status) = 'read' AND IsRead = 1) 
           OR (LOWER(p_status) = 'unread' AND IsRead = 0))
      AND (p_time_range IS NULL OR LOWER(p_time_range) = 'all'
           OR (LOWER(p_time_range) = 'today' AND CreatedAt >= CURDATE())
           OR (LOWER(p_time_range) = 'last7days' AND CreatedAt >= NOW() - INTERVAL 7 DAY)
           OR (LOWER(p_time_range) = 'last30days' AND CreatedAt >= NOW() - INTERVAL 30 DAY));
END$$

DROP PROCEDURE IF EXISTS `sp_Middleman_CountNotifications`$$
CREATE PROCEDURE `sp_Middleman_CountNotifications`(
    IN p_user_id BIGINT,
    IN p_search VARCHAR(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_category VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_priority VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_status VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_time_range VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
)
BEGIN
    CALL sp_MiddlemanCountNotifications(
        p_user_id, p_search, p_category, p_priority, p_status, p_time_range
    );
END$$

-- ----------------------------------------------------------------------------------
-- 4. GET NOTIFICATION STATUS / COUNTERS
-- ----------------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS `sp_MiddlemanGetNotificationStatus`$$
CREATE PROCEDURE `sp_MiddlemanGetNotificationStatus`(
    IN p_user_id BIGINT
)
BEGIN
    SELECT 
        COUNT(*) AS total,
        COALESCE(SUM(IsRead = 0), 0) AS unread,
        COALESCE(SUM(IsRead = 0 AND Priority = 'High'), 0) AS high_priority_unread,
        COALESCE(SUM(IsRead = 1), 0) AS read_count
    FROM `MiddlemanNotifications`
    WHERE (UserId = p_user_id OR UserId IN (SELECT `UserId` FROM `MiddlemanProfiles` WHERE `Id` = p_user_id));
END$$

DROP PROCEDURE IF EXISTS `sp_Middleman_GetNotificationStatus`$$
CREATE PROCEDURE `sp_Middleman_GetNotificationStatus`(
    IN p_user_id BIGINT
)
BEGIN
    CALL sp_MiddlemanGetNotificationStatus(p_user_id);
END$$

-- ----------------------------------------------------------------------------------
-- 5. GET LATEST NOTIFICATIONS (FOR BELL / DROPDOWN)
-- ----------------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS `sp_MiddlemanGetLatestNotifications`$$
CREATE PROCEDURE `sp_MiddlemanGetLatestNotifications`(
    IN p_user_id BIGINT,
    IN p_take INT
)
BEGIN
    SELECT 
        Id AS id,
        Title AS title,
        Description AS description,
        Category AS category,
        Priority AS priority,
        ActorName AS actor_name,
        ReferenceNumber AS reference_number,
        ModuleUrl AS module_url,
        IsRead AS is_read,
        CreatedAt AS created_at
    FROM `MiddlemanNotifications`
    WHERE (UserId = p_user_id OR UserId IN (SELECT `UserId` FROM `MiddlemanProfiles` WHERE `Id` = p_user_id))
    ORDER BY CreatedAt DESC, Id DESC
    LIMIT p_take;
END$$

DROP PROCEDURE IF EXISTS `sp_Middleman_GetLatestNotifications`$$
CREATE PROCEDURE `sp_Middleman_GetLatestNotifications`(
    IN p_user_id BIGINT,
    IN p_take INT
)
BEGIN
    CALL sp_MiddlemanGetLatestNotifications(p_user_id, p_take);
END$$

-- ----------------------------------------------------------------------------------
-- 6. MARK NOTIFICATION AS READ
-- ----------------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS `sp_MiddlemanMarkNotificationRead`$$
CREATE PROCEDURE `sp_MiddlemanMarkNotificationRead`(
    IN p_user_id BIGINT,
    IN p_notification_id BIGINT
)
BEGIN
    UPDATE `MiddlemanNotifications`
    SET `IsRead` = 1
    WHERE `Id` = p_notification_id
      AND (UserId = p_user_id OR UserId IN (SELECT `UserId` FROM `MiddlemanProfiles` WHERE `Id` = p_user_id))
      AND `IsRead` = 0;

    SELECT ROW_COUNT() AS affected;
END$$

DROP PROCEDURE IF EXISTS `sp_Middleman_MarkNotificationRead`$$
CREATE PROCEDURE `sp_Middleman_MarkNotificationRead`(
    IN p_user_id BIGINT,
    IN p_notification_id BIGINT
)
BEGIN
    CALL sp_MiddlemanMarkNotificationRead(p_user_id, p_notification_id);
END$$

-- ----------------------------------------------------------------------------------
-- 7. MARK ALL NOTIFICATIONS AS READ
-- ----------------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS `sp_MiddlemanMarkAllNotificationsRead`$$
CREATE PROCEDURE `sp_MiddlemanMarkAllNotificationsRead`(
    IN p_user_id BIGINT
)
BEGIN
    UPDATE `MiddlemanNotifications`
    SET `IsRead` = 1
    WHERE (UserId = p_user_id OR UserId IN (SELECT `UserId` FROM `MiddlemanProfiles` WHERE `Id` = p_user_id))
      AND `IsRead` = 0;

    SELECT ROW_COUNT() AS affected;
END$$

DROP PROCEDURE IF EXISTS `sp_Middleman_MarkAllNotificationsRead`$$
CREATE PROCEDURE `sp_Middleman_MarkAllNotificationsRead`(
    IN p_user_id BIGINT
)
BEGIN
    CALL sp_MiddlemanMarkAllNotificationsRead(p_user_id);
END$$

-- ----------------------------------------------------------------------------------
-- 8. DELETE NOTIFICATION
-- ----------------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS `sp_MiddlemanDeleteNotification`$$
CREATE PROCEDURE `sp_MiddlemanDeleteNotification`(
    IN p_user_id BIGINT,
    IN p_notification_id BIGINT
)
BEGIN
    DELETE FROM `MiddlemanNotifications`
    WHERE `Id` = p_notification_id
      AND (UserId = p_user_id OR UserId IN (SELECT `UserId` FROM `MiddlemanProfiles` WHERE `Id` = p_user_id));

    SELECT ROW_COUNT() AS affected;
END$$

DROP PROCEDURE IF EXISTS `sp_Middleman_DeleteNotification`$$
CREATE PROCEDURE `sp_Middleman_DeleteNotification`(
    IN p_user_id BIGINT,
    IN p_notification_id BIGINT
)
BEGIN
    CALL sp_MiddlemanDeleteNotification(p_user_id, p_notification_id);
END$$

DELIMITER ;

-- ==================================================================================
-- 9. TRIGGERS FOR AUTOMATIC NOTIFICATION LOGGING ON ACTION TABLES
-- ==================================================================================

-- A. Farmer Registered Trigger
DROP TRIGGER IF EXISTS `trg_middleman_farmers_ai`;
DELIMITER $$
CREATE TRIGGER `trg_middleman_farmers_ai` AFTER INSERT ON `middleman_farmers`
FOR EACH ROW
BEGIN
    DECLARE v_target_user_id BIGINT;
    SET v_target_user_id = NEW.middleman_id;
    IF EXISTS (SELECT 1 FROM `MiddlemanProfiles` WHERE `Id` = NEW.middleman_id) THEN
        SELECT `UserId` INTO v_target_user_id FROM `MiddlemanProfiles` WHERE `Id` = NEW.middleman_id LIMIT 1;
    END IF;

    INSERT INTO `MiddlemanNotifications` (
        `UserId`, `Title`, `Description`, `Category`, `Priority`,
        `ActorName`, `ReferenceNumber`, `ModuleUrl`, `IsRead`, `CreatedAt`
    ) VALUES (
        COALESCE(v_target_user_id, 103),
        'Farmer Registered',
        CONCAT('Farmer ', NEW.name, IF(NEW.village IS NOT NULL AND NEW.village != '', CONCAT(' from ', NEW.village), ''), ' was registered successfully.'),
        'Farmers',
        'Medium',
        NEW.name,
        COALESCE(NEW.farmer_code, CONCAT('FAR-', NEW.id)),
        '/middleman/farmers',
        0,
        NOW(6)
    );
END$$
DELIMITER ;

-- B. Vendor Registered Trigger
DROP TRIGGER IF EXISTS `trg_middleman_vendors_ai`;
DELIMITER $$
CREATE TRIGGER `trg_middleman_vendors_ai` AFTER INSERT ON `middleman_vendors`
FOR EACH ROW
BEGIN
    DECLARE v_target_user_id BIGINT;
    SET v_target_user_id = NEW.middleman_id;
    IF EXISTS (SELECT 1 FROM `MiddlemanProfiles` WHERE `Id` = NEW.middleman_id) THEN
        SELECT `UserId` INTO v_target_user_id FROM `MiddlemanProfiles` WHERE `Id` = NEW.middleman_id LIMIT 1;
    END IF;

    INSERT INTO `MiddlemanNotifications` (
        `UserId`, `Title`, `Description`, `Category`, `Priority`,
        `ActorName`, `ReferenceNumber`, `ModuleUrl`, `IsRead`, `CreatedAt`
    ) VALUES (
        COALESCE(v_target_user_id, 103),
        'Vendor Registered',
        CONCAT('Vendor ', NEW.business_name, ' was registered successfully.'),
        'Vendors',
        'Medium',
        NEW.business_name,
        COALESCE(NEW.vendor_id, CONCAT('VEN-', NEW.id)),
        '/middleman/vendors',
        0,
        NOW(6)
    );
END$$
DELIMITER ;

-- C. Customer Registered Trigger
DROP TRIGGER IF EXISTS `trg_middleman_customers_ai`;
DELIMITER $$
CREATE TRIGGER `trg_middleman_customers_ai` AFTER INSERT ON `middleman_customers`
FOR EACH ROW
BEGIN
    DECLARE v_target_user_id BIGINT;
    SET v_target_user_id = NEW.middleman_id;
    IF EXISTS (SELECT 1 FROM `MiddlemanProfiles` WHERE `Id` = NEW.middleman_id) THEN
        SELECT `UserId` INTO v_target_user_id FROM `MiddlemanProfiles` WHERE `Id` = NEW.middleman_id LIMIT 1;
    END IF;

    INSERT INTO `MiddlemanNotifications` (
        `UserId`, `Title`, `Description`, `Category`, `Priority`,
        `ActorName`, `ReferenceNumber`, `ModuleUrl`, `IsRead`, `CreatedAt`
    ) VALUES (
        COALESCE(v_target_user_id, 103),
        'Customer Registered',
        CONCAT('Customer ', NEW.name, ' was registered successfully.'),
        'Customers',
        'Medium',
        NEW.name,
        COALESCE(NEW.customer_id, CONCAT('CUS-', NEW.id)),
        '/middleman/customers',
        0,
        NOW(6)
    );
END$$
DELIMITER ;

-- D. Farmer Purchase Created Trigger
DROP TRIGGER IF EXISTS `trg_middleman_purchases_ai`;
DELIMITER $$
CREATE TRIGGER `trg_middleman_purchases_ai` AFTER INSERT ON `middleman_purchases`
FOR EACH ROW
BEGIN
    DECLARE v_target_user_id BIGINT;
    SET v_target_user_id = NEW.middleman_id;
    IF EXISTS (SELECT 1 FROM `MiddlemanProfiles` WHERE `Id` = NEW.middleman_id) THEN
        SELECT `UserId` INTO v_target_user_id FROM `MiddlemanProfiles` WHERE `Id` = NEW.middleman_id LIMIT 1;
    END IF;

    IF NEW.status != 'Draft' THEN
        INSERT INTO `MiddlemanNotifications` (
            `UserId`, `Title`, `Description`, `Category`, `Priority`,
            `ActorName`, `ReferenceNumber`, `ModuleUrl`, `IsRead`, `CreatedAt`
        ) VALUES (
            COALESCE(v_target_user_id, 103),
            'Farmer Purchase Created',
            CONCAT('Purchase ', COALESCE(NEW.purchase_code, CAST(NEW.id AS CHAR)), ' for ', NEW.quantity, ' ', COALESCE(NEW.unit, 'Qtl'), ' of ', NEW.crop_name, ' from ', NEW.farmer_name),
            'Purchases',
            'High',
            NEW.farmer_name,
            COALESCE(NEW.purchase_code, CAST(NEW.id AS CHAR)),
            '/middleman/purchases',
            0,
            NOW(6)
        );
    END IF;
END$$
DELIMITER ;

-- E. Vendor Sale Created Trigger
DROP TRIGGER IF EXISTS `trg_middleman_vendor_sales_ai`;
DELIMITER $$
CREATE TRIGGER `trg_middleman_vendor_sales_ai` AFTER INSERT ON `middleman_vendor_sales`
FOR EACH ROW
BEGIN
    DECLARE v_target_user_id BIGINT;
    SET v_target_user_id = NEW.middleman_id;
    IF EXISTS (SELECT 1 FROM `MiddlemanProfiles` WHERE `Id` = NEW.middleman_id) THEN
        SELECT `UserId` INTO v_target_user_id FROM `MiddlemanProfiles` WHERE `Id` = NEW.middleman_id LIMIT 1;
    END IF;

    IF NEW.status != 'Draft' THEN
        INSERT INTO `MiddlemanNotifications` (
            `UserId`, `Title`, `Description`, `Category`, `Priority`,
            `ActorName`, `ReferenceNumber`, `ModuleUrl`, `IsRead`, `CreatedAt`
        ) VALUES (
            COALESCE(v_target_user_id, 103),
            'Vendor Sale Created',
            CONCAT('Sale for ', NEW.quantity, ' ', COALESCE(NEW.unit, 'Qtl'), ' of ', NEW.crop_name, ' to ', COALESCE(NEW.business_name, NEW.vendor_name, 'Vendor')),
            'Sales',
            'High',
            COALESCE(NEW.business_name, NEW.vendor_name),
            COALESCE(NEW.sale_id, CAST(NEW.id AS CHAR)),
            '/middleman/vendor-sales',
            0,
            NOW(6)
        );
    END IF;
END$$
DELIMITER ;

-- F. Customer Sale Created Trigger
DROP TRIGGER IF EXISTS `trg_middleman_sales_ai`;
DELIMITER $$
CREATE TRIGGER `trg_middleman_sales_ai` AFTER INSERT ON `middleman_sales`
FOR EACH ROW
BEGIN
    DECLARE v_target_user_id BIGINT;
    SET v_target_user_id = NEW.middleman_id;
    IF EXISTS (SELECT 1 FROM `MiddlemanProfiles` WHERE `Id` = NEW.middleman_id) THEN
        SELECT `UserId` INTO v_target_user_id FROM `MiddlemanProfiles` WHERE `Id` = NEW.middleman_id LIMIT 1;
    END IF;

    IF NEW.status != 'Draft' THEN
        INSERT INTO `MiddlemanNotifications` (
            `UserId`, `Title`, `Description`, `Category`, `Priority`,
            `ActorName`, `ReferenceNumber`, `ModuleUrl`, `IsRead`, `CreatedAt`
        ) VALUES (
            COALESCE(v_target_user_id, 103),
            'Customer Sale Created',
            CONCAT('Customer sale for ', NEW.quantity, ' ', COALESCE(NEW.unit, 'Qtl'), ' of ', NEW.crop_name, ' to ', COALESCE(NEW.buyer_name, 'Customer')),
            'Sales',
            'High',
            NEW.buyer_name,
            COALESCE(NEW.sale_code, CAST(NEW.id AS CHAR)),
            '/middleman/customer-sales',
            0,
            NOW(6)
        );
    END IF;
END$$
DELIMITER ;

-- G. Confirmation Verified/Rejected Trigger
DROP TRIGGER IF EXISTS `trg_middleman_confirmations_au`;
DELIMITER $$
CREATE TRIGGER `trg_middleman_confirmations_au` AFTER UPDATE ON `middleman_confirmations`
FOR EACH ROW
BEGIN
    DECLARE v_target_user_id BIGINT;
    SET v_target_user_id = NEW.middleman_id;
    IF EXISTS (SELECT 1 FROM `MiddlemanProfiles` WHERE `Id` = NEW.middleman_id) THEN
        SELECT `UserId` INTO v_target_user_id FROM `MiddlemanProfiles` WHERE `Id` = NEW.middleman_id LIMIT 1;
    END IF;

    IF (OLD.otp_status != NEW.otp_status) AND (NEW.otp_status IN ('Confirmed', 'Rejected')) THEN
        INSERT INTO `MiddlemanNotifications` (
            `UserId`, `Title`, `Description`, `Category`, `Priority`,
            `ActorName`, `ReferenceNumber`, `ModuleUrl`, `IsRead`, `CreatedAt`
        ) VALUES (
            COALESCE(v_target_user_id, 103),
            IF(NEW.otp_status = 'Confirmed', 'Transaction Verified & Confirmed', 'Transaction Verification Rejected'),
            CONCAT(NEW.transaction_type, ' (', NEW.transaction_id, ') verification was ', LOWER(NEW.otp_status), '.'),
            'Transactions',
            'High',
            NEW.party_name,
            NEW.transaction_id,
            '/middleman/confirmations',
            0,
            NOW(6)
        );
    END IF;
END$$
DELIMITER ;

-- H. Ledger Entry Trigger
DROP TRIGGER IF EXISTS `trg_middleman_ledger_ai`;
DELIMITER $$
CREATE TRIGGER `trg_middleman_ledger_ai` AFTER INSERT ON `middleman_ledger`
FOR EACH ROW
BEGIN
    DECLARE v_target_user_id BIGINT;
    SET v_target_user_id = NEW.middleman_id;
    IF EXISTS (SELECT 1 FROM `MiddlemanProfiles` WHERE `Id` = NEW.middleman_id) THEN
        SELECT `UserId` INTO v_target_user_id FROM `MiddlemanProfiles` WHERE `Id` = NEW.middleman_id LIMIT 1;
    END IF;

    IF NEW.category != 'System' THEN
        INSERT INTO `MiddlemanNotifications` (
            `UserId`, `Title`, `Description`, `Category`, `Priority`,
            `ActorName`, `ReferenceNumber`, `ModuleUrl`, `IsRead`, `CreatedAt`
        ) VALUES (
            COALESCE(v_target_user_id, 103),
            CONCAT('Ledger Entry: ', NEW.category),
            CONCAT(NEW.description, ' (Amount: Rs. ', COALESCE(NEW.debit, NEW.credit, 0), ')'),
            'Ledger',
            'Medium',
            NEW.party_name,
            COALESCE(NEW.ledger_code, NEW.transaction_id, CAST(NEW.id AS CHAR)),
            '/middleman/ledger',
            0,
            NOW(6)
        );
    END IF;
END$$
DELIMITER ;
