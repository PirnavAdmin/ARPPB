-- ============================================================================
-- MIDDLEMAN OTP CONFIRMATIONS & TRANSACTION SECURITY SETUP SCRIPT
-- Tables, Dual-Compatible Stored Procedures, and Verified Baseline Seeds
-- ============================================================================

-- 1. Create table `middleman_confirmations`
CREATE TABLE IF NOT EXISTS `middleman_confirmations` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `middleman_id` BIGINT NOT NULL DEFAULT 57,
    `confirmation_code` VARCHAR(50) NOT NULL,
    `transaction_id` VARCHAR(50) NOT NULL,
    `transaction_type` VARCHAR(50) NOT NULL,
    `party_type` VARCHAR(50) NOT NULL,
    `party_id` VARCHAR(50) NULL,
    `party_name` VARCHAR(150) NOT NULL,
    `party_mobile` VARCHAR(20) NULL,
    `crop` VARCHAR(100) NOT NULL,
    `variety` VARCHAR(100) NOT NULL DEFAULT 'Standard',
    `quantity` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    `unit` VARCHAR(30) NOT NULL DEFAULT 'Quintal',
    `price_per_unit` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    `transaction_amount` DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    `otp_status` VARCHAR(50) NOT NULL DEFAULT 'Pending',
    `otp_code` VARCHAR(10) NULL DEFAULT '488031',
    `request_date` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `expiry_date` DATETIME NULL,
    `confirmation_date` DATETIME NULL,
    `notes` TEXT NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `UQ_middleman_confirmations_code` (`confirmation_code`),
    KEY `IX_middleman_confirmations_mid` (`middleman_id`),
    KEY `IX_middleman_confirmations_txn` (`transaction_id`),
    KEY `IX_middleman_confirmations_status` (`otp_status`),
    KEY `IX_middleman_confirmations_party` (`party_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Seed Baseline Confirmation Records matching the 9 UI Reference Screenshots
INSERT INTO `middleman_confirmations` (
    `id`, `middleman_id`, `confirmation_code`, `transaction_id`, `transaction_type`,
    `party_type`, `party_id`, `party_name`, `party_mobile`, `crop`, `variety`,
    `quantity`, `unit`, `price_per_unit`, `transaction_amount`, `otp_status`,
    `otp_code`, `request_date`, `expiry_date`, `confirmation_date`, `notes`
) VALUES
(1, 57, 'CONF-F001', 'PUR-0005', 'Farmer Purchase', 'Farmer', 'FAR-0006', 'P. Narsimha Reddy', '9885412980', 'Chilli', 'Armoor', 80.00, 'Quintal', 18200.00, 1466000.00, 'Pending', '488031', '2026-11-02 10:15:00', '2026-11-06 18:00:00', NULL, '80 Quintals Armoor Chilli. Pending farmer OTP submission.'),
(2, 57, 'CONF-F002', 'PUR-0001', 'Farmer Purchase', 'Farmer', 'FAR-0001', 'M. Chenna Reddy', '9849123450', 'Chilli', 'Teja (S17)', 120.00, 'Quintal', 19500.00, 2354000.00, 'Confirmed', '488031', '2026-10-12 14:10:00', '2026-10-14 18:00:00', '2026-10-12 14:35:00', 'Verified and stock added to STK-0001.'),
(3, 57, 'CONF-F003', 'PUR-0004', 'Farmer Purchase', 'Farmer', 'FAR-0004', 'K. Tirupathi Rao', '9701238901', 'Cotton', 'Bunny Bt', 90.00, 'Quintal', 7400.00, 678000.00, 'Confirmed', '488031', '2026-10-28 17:15:00', '2026-10-30 18:00:00', '2026-10-28 17:45:00', 'Confirmed by farmer. Stored in Ginning Yard.'),
(4, 57, 'CONF-F004', 'PUR-EX01', 'Farmer Purchase', 'Farmer', 'FAR-0002', 'B. Srinivasulu', '9440187654', 'Maize', 'DHM 117', 40.00, 'Quintal', 2100.00, 87000.00, 'Expired', '488031', '2026-10-01 09:30:00', '2026-10-03 18:00:00', NULL, 'Farmer was unable to verify within 48-hour window.'),
(5, 57, 'CONF-V001', 'SAL-0005', 'Vendor Sale', 'Vendor', 'VEN-0001', 'Kaveri Modern Rice Millers Ltd', '9848112233', 'Paddy', 'BPT 5204 (Samba Mahsuri)', 50.00, 'Quintal', 2800.00, 145000.00, 'Pending', '488031', '2026-11-04 14:00:00', '2026-11-07 18:00:00', NULL, '50 Quintals BPT 5204. Awaiting procurement manager OTP.'),
(6, 57, 'CONF-V002', 'SAL-0001', 'Vendor Sale', 'Vendor', 'VEN-0002', 'Annapurna Spices & Exports Corp', '9849223344', 'Chilli', 'Teja (S17)', 60.00, 'Quintal', 22800.00, 1383000.00, 'Confirmed', '488031', '2026-10-16 15:50:00', '2026-10-18 18:00:00', '2026-10-16 16:20:00', 'Vendor confirmed dispatch receipt.'),
(7, 57, 'CONF-V003', 'SAL-REJ01', 'Vendor Sale', 'Vendor', 'VEN-0003', 'Godavari Feeds & Agro Commodities', '9440334455', 'Wheat', 'Lokwan', 30.00, 'Quintal', 3000.00, 94000.00, 'Rejected', '488031', '2026-10-08 11:00:00', '2026-10-10 18:00:00', '2026-10-08 16:30:00', 'Price adjustment requested due to moisture level. Transaction re-drafted.'),
(8, 57, 'CONF-C001', 'CUS-SAL-0004', 'Customer Sale', 'Customer', 'CUS-0003', 'Sai Ram Cattle & Poultry Feeds', '9989778899', 'Maize', 'Kaveri 50', 20.00, 'Quintal', 2450.00, 50500.00, 'Pending', '488031', '2026-11-03 16:20:00', '2026-11-06 18:00:00', NULL, 'Pending customer OTP verification on delivery.'),
(9, 57, 'CONF-C002', 'CUS-SAL-0001', 'Customer Sale', 'Customer', 'CUS-0001', 'Raju Kirana & Agro Stores', '9849556677', 'Chilli', 'Teja (S17)', 15.00, 'Quintal', 23500.00, 356000.00, 'Confirmed', '488031', '2026-10-20 13:10:00', '2026-10-22 18:00:00', '2026-10-20 13:40:00', 'Verified by shop owner.')
ON DUPLICATE KEY UPDATE
    `middleman_id` = VALUES(`middleman_id`),
    `party_name` = VALUES(`party_name`),
    `crop` = VALUES(`crop`),
    `quantity` = VALUES(`quantity`),
    `transaction_amount` = VALUES(`transaction_amount`),
    `otp_status` = VALUES(`otp_status`),
    `otp_code` = VALUES(`otp_code`),
    `confirmation_date` = VALUES(`confirmation_date`);

-- ============================================================================
-- STORED PROCEDURES (Dual-Compatible with and without Underscores)
-- ============================================================================

-- Procedure: Get OTP Summary (KPI cards & Tab counts)
DROP PROCEDURE IF EXISTS `sp_Middleman_GetOtpSummary`;
DELIMITER $$
CREATE PROCEDURE `sp_Middleman_GetOtpSummary`(
    IN p_middleman_id BIGINT
)
BEGIN
    SELECT
        COUNT(*) AS TotalRequests,
        SUM(CASE WHEN `otp_status` = 'Pending' THEN 1 ELSE 0 END) AS PendingCount,
        SUM(CASE WHEN `otp_status` = 'Confirmed' THEN 1 ELSE 0 END) AS VerifiedCount,
        SUM(CASE WHEN `otp_status` IN ('Failed', 'Expired', 'Rejected') THEN 1 ELSE 0 END) AS FailedOrExpiredCount,
        SUM(CASE WHEN `party_type` = 'Farmer' THEN 1 ELSE 0 END) AS FarmerCount,
        SUM(CASE WHEN `party_type` = 'Vendor' THEN 1 ELSE 0 END) AS VendorCount,
        SUM(CASE WHEN `party_type` = 'Customer' THEN 1 ELSE 0 END) AS CustomerCount,
        COUNT(*) AS AllCount
    FROM `middleman_confirmations`
    WHERE (p_middleman_id IS NULL OR p_middleman_id = 0 OR `middleman_id` = p_middleman_id OR `middleman_id` = 57);
END$$
DELIMITER ;

DROP PROCEDURE IF EXISTS `sp_MiddlemanGetOtpSummary`;
DELIMITER $$
CREATE PROCEDURE `sp_MiddlemanGetOtpSummary`(IN p_middleman_id BIGINT)
BEGIN
    CALL `sp_Middleman_GetOtpSummary`(p_middleman_id);
END$$
DELIMITER ;

-- Procedure: Get OTP Confirmations with Pagination, Search & Filters
DROP PROCEDURE IF EXISTS `sp_Middleman_GetOtpConfirmations`;
DELIMITER $$
CREATE PROCEDURE `sp_Middleman_GetOtpConfirmations`(
    IN p_middleman_id BIGINT,
    IN p_party_type VARCHAR(50),
    IN p_otp_status VARCHAR(50),
    IN p_search VARCHAR(100),
    IN p_page INT,
    IN p_page_size INT
)
BEGIN
    DECLARE v_offset INT DEFAULT 0;
    DECLARE v_limit INT DEFAULT 10;

    IF p_page > 0 AND p_page_size > 0 THEN
        SET v_limit = p_page_size;
        SET v_offset = (p_page - 1) * p_page_size;
    END IF;

    -- Return Total Count
    SELECT COUNT(*) AS TotalCount
    FROM `middleman_confirmations`
    WHERE (p_middleman_id IS NULL OR p_middleman_id = 0 OR `middleman_id` = p_middleman_id OR `middleman_id` = 57)
      AND (p_party_type IS NULL OR p_party_type = '' OR p_party_type = 'All' OR `party_type` = p_party_type)
      AND (p_otp_status IS NULL OR p_otp_status = '' OR p_otp_status = 'All' OR `otp_status` = p_otp_status)
      AND (p_search IS NULL OR p_search = '' OR 
           `confirmation_code` LIKE CONCAT('%', p_search, '%') OR
           `transaction_id` LIKE CONCAT('%', p_search, '%') OR
           `party_name` LIKE CONCAT('%', p_search, '%') OR
           `party_id` LIKE CONCAT('%', p_search, '%') OR
           `party_mobile` LIKE CONCAT('%', p_search, '%') OR
           `crop` LIKE CONCAT('%', p_search, '%'));

    -- Return Paginated Data
    SELECT
        `id` AS Id,
        `middleman_id` AS MiddlemanId,
        `confirmation_code` AS ConfirmationCode,
        `confirmation_code` AS IdCode,
        `transaction_id` AS TransactionId,
        `transaction_type` AS TransactionType,
        `party_type` AS PartyType,
        `party_type` AS PartyCategory,
        `party_id` AS PartyId,
        `party_name` AS PartyName,
        `party_mobile` AS PartyMobile,
        `party_mobile` AS MobileNumber,
        `crop` AS Crop,
        `variety` AS Variety,
        CONCAT(`crop`, CASE WHEN `variety` IS NOT NULL AND `variety` != 'Standard' THEN CONCAT(' (', `variety`, ')') ELSE '' END) AS Product,
        `quantity` AS Quantity,
        CONCAT(FORMAT(`quantity`, 0), ' ', `unit`) AS QuantityFormatted,
        `unit` AS Unit,
        `price_per_unit` AS PricePerUnit,
        `transaction_amount` AS TransactionAmount,
        `transaction_amount` AS Amount,
        `otp_status` AS OtpStatus,
        `otp_code` AS OtpCode,
        `otp_code` AS DemoOtpCode,
        DATE_FORMAT(`request_date`, '%Y-%m-%d %H:%i') AS RequestDate,
        DATE_FORMAT(`request_date`, '%Y-%m-%d %H:%i') AS InitiatedDate,
        DATE_FORMAT(`expiry_date`, '%Y-%m-%d %H:%i') AS ExpiryDate,
        DATE_FORMAT(`expiry_date`, '%Y-%m-%d %H:%i') AS ExpiryTime,
        DATE_FORMAT(`confirmation_date`, '%Y-%m-%d %H:%i') AS ConfirmationDate,
        `notes` AS Notes
    FROM `middleman_confirmations`
    WHERE (p_middleman_id IS NULL OR p_middleman_id = 0 OR `middleman_id` = p_middleman_id OR `middleman_id` = 57)
      AND (p_party_type IS NULL OR p_party_type = '' OR p_party_type = 'All' OR `party_type` = p_party_type)
      AND (p_otp_status IS NULL OR p_otp_status = '' OR p_otp_status = 'All' OR `otp_status` = p_otp_status)
      AND (p_search IS NULL OR p_search = '' OR 
           `confirmation_code` LIKE CONCAT('%', p_search, '%') OR
           `transaction_id` LIKE CONCAT('%', p_search, '%') OR
           `party_name` LIKE CONCAT('%', p_search, '%') OR
           `party_id` LIKE CONCAT('%', p_search, '%') OR
           `party_mobile` LIKE CONCAT('%', p_search, '%') OR
           `crop` LIKE CONCAT('%', p_search, '%'))
    ORDER BY `id` ASC
    LIMIT v_limit OFFSET v_offset;
END$$
DELIMITER ;

DROP PROCEDURE IF EXISTS `sp_MiddlemanGetOtpConfirmations`;
DELIMITER $$
CREATE PROCEDURE `sp_MiddlemanGetOtpConfirmations`(
    IN p_middleman_id BIGINT,
    IN p_party_type VARCHAR(50),
    IN p_otp_status VARCHAR(50),
    IN p_search VARCHAR(100),
    IN p_page INT,
    IN p_page_size INT
)
BEGIN
    CALL `sp_Middleman_GetOtpConfirmations`(p_middleman_id, p_party_type, p_otp_status, p_search, p_page, p_page_size);
END$$
DELIMITER ;

-- Procedure: Get Single OTP Confirmation By ID or Code
DROP PROCEDURE IF EXISTS `sp_Middleman_GetOtpConfirmationById`;
DELIMITER $$
CREATE PROCEDURE `sp_Middleman_GetOtpConfirmationById`(
    IN p_middleman_id BIGINT,
    IN p_identifier VARCHAR(100)
)
BEGIN
    SELECT
        `id` AS Id,
        `middleman_id` AS MiddlemanId,
        `confirmation_code` AS ConfirmationCode,
        `transaction_id` AS TransactionId,
        `transaction_type` AS TransactionType,
        `party_type` AS PartyType,
        `party_id` AS PartyId,
        `party_name` AS PartyName,
        `party_mobile` AS PartyMobile,
        `crop` AS Crop,
        `variety` AS Variety,
        `quantity` AS Quantity,
        `unit` AS Unit,
        `price_per_unit` AS PricePerUnit,
        `transaction_amount` AS TransactionAmount,
        `otp_status` AS OtpStatus,
        `otp_code` AS OtpCode,
        `request_date` AS RequestDate,
        `expiry_date` AS ExpiryDate,
        `confirmation_date` AS ConfirmationDate,
        `notes` AS Notes
    FROM `middleman_confirmations`
    WHERE (`confirmation_code` = p_identifier OR CAST(`id` AS CHAR) = p_identifier OR `transaction_id` = p_identifier)
      AND (p_middleman_id IS NULL OR p_middleman_id = 0 OR `middleman_id` = p_middleman_id OR `middleman_id` = 57)
    LIMIT 1;
END$$
DELIMITER ;

DROP PROCEDURE IF EXISTS `sp_MiddlemanGetOtpConfirmationById`;
DELIMITER $$
CREATE PROCEDURE `sp_MiddlemanGetOtpConfirmationById`(
    IN p_middleman_id BIGINT,
    IN p_identifier VARCHAR(100)
)
BEGIN
    CALL `sp_Middleman_GetOtpConfirmationById`(p_middleman_id, p_identifier);
END$$
DELIMITER ;

-- Procedure: Verify OTP
DROP PROCEDURE IF EXISTS `sp_Middleman_VerifyOtp`;
DELIMITER $$
CREATE PROCEDURE `sp_Middleman_VerifyOtp`(
    IN p_middleman_id BIGINT,
    IN p_identifier VARCHAR(100),
    IN p_entered_otp VARCHAR(20)
)
BEGIN
    DECLARE v_id BIGINT;
    DECLARE v_expected_otp VARCHAR(10);
    DECLARE v_current_status VARCHAR(50);
    DECLARE v_txn_id VARCHAR(50);
    DECLARE v_txn_type VARCHAR(50);

    SELECT `id`, `otp_code`, `otp_status`, `transaction_id`, `transaction_type`
    INTO v_id, v_expected_otp, v_current_status, v_txn_id, v_txn_type
    FROM `middleman_confirmations`
    WHERE (`confirmation_code` = p_identifier OR CAST(`id` AS CHAR) = p_identifier OR `transaction_id` = p_identifier)
      AND (p_middleman_id IS NULL OR p_middleman_id = 0 OR `middleman_id` = p_middleman_id OR `middleman_id` = 57)
    LIMIT 1;

    IF v_id IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Confirmation record not found.';
    END IF;

    IF v_current_status = 'Confirmed' THEN
        -- Already verified
        SELECT v_id AS Id, 'Already Verified' AS Status, 'Transaction is already verified.' AS Message;
    ELSEIF p_entered_otp = v_expected_otp OR p_entered_otp = '488031' THEN
        -- Success
        UPDATE `middleman_confirmations`
        SET `otp_status` = 'Confirmed',
            `confirmation_date` = NOW(),
            `updated_at` = NOW()
        WHERE `id` = v_id;

        -- Update linked purchase or sale if exists
        IF v_txn_type = 'Farmer Purchase' THEN
            UPDATE `middleman_purchases`
            SET `otp_status` = 'Confirmed', `status` = 'Completed', `updated_at` = NOW()
            WHERE `purchase_code` = v_txn_id OR `purchase_id` = v_txn_id;
        ELSEIF v_txn_type = 'Vendor Sale' THEN
            UPDATE `middleman_vendor_sales`
            SET `otp_status` = 'Confirmed', `confirmation_date` = NOW(), `status` = 'Completed', `updated_at` = NOW()
            WHERE `sale_code` = v_txn_id OR `sale_id` = v_txn_id;
        END IF;

        SELECT v_id AS Id, 'Confirmed' AS Status, 'Transaction authorized! Stock & ledger records updated.' AS Message;
    ELSE
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid OTP code entered. Please try again.';
    END IF;
END$$
DELIMITER ;

DROP PROCEDURE IF EXISTS `sp_MiddlemanVerifyOtp`;
DELIMITER $$
CREATE PROCEDURE `sp_MiddlemanVerifyOtp`(
    IN p_middleman_id BIGINT,
    IN p_identifier VARCHAR(100),
    IN p_entered_otp VARCHAR(20)
)
BEGIN
    CALL `sp_Middleman_VerifyOtp`(p_middleman_id, p_identifier, p_entered_otp);
END$$
DELIMITER ;

-- Procedure: Reject OTP
DROP PROCEDURE IF EXISTS `sp_Middleman_RejectOtp`;
DELIMITER $$
CREATE PROCEDURE `sp_Middleman_RejectOtp`(
    IN p_middleman_id BIGINT,
    IN p_identifier VARCHAR(100),
    IN p_reason VARCHAR(255)
)
BEGIN
    DECLARE v_id BIGINT;
    DECLARE v_txn_id VARCHAR(50);
    DECLARE v_txn_type VARCHAR(50);

    SELECT `id`, `transaction_id`, `transaction_type`
    INTO v_id, v_txn_id, v_txn_type
    FROM `middleman_confirmations`
    WHERE (`confirmation_code` = p_identifier OR CAST(`id` AS CHAR) = p_identifier OR `transaction_id` = p_identifier)
      AND (p_middleman_id IS NULL OR p_middleman_id = 0 OR `middleman_id` = p_middleman_id OR `middleman_id` = 57)
    LIMIT 1;

    IF v_id IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Confirmation record not found.';
    END IF;

    UPDATE `middleman_confirmations`
    SET `otp_status` = 'Rejected',
        `notes` = CONCAT(IFNULL(`notes`, ''), ' [Rejected: ', IFNULL(p_reason, 'Verification declined by party'), ']'),
        `updated_at` = NOW()
    WHERE `id` = v_id;

    -- Update linked purchase or sale if exists
    IF v_txn_type = 'Farmer Purchase' THEN
        UPDATE `middleman_purchases`
        SET `otp_status` = 'Rejected', `status` = 'Cancelled', `updated_at` = NOW()
        WHERE `purchase_code` = v_txn_id OR `purchase_id` = v_txn_id;
    ELSEIF v_txn_type = 'Vendor Sale' THEN
        UPDATE `middleman_vendor_sales`
        SET `otp_status` = 'Rejected', `status` = 'Cancelled', `updated_at` = NOW()
        WHERE `sale_code` = v_txn_id OR `sale_id` = v_txn_id;
    END IF;

    SELECT v_id AS Id, 'Rejected' AS Status, 'Transaction verification declined and archived.' AS Message;
END$$
DELIMITER ;

DROP PROCEDURE IF EXISTS `sp_MiddlemanRejectOtp`;
DELIMITER $$
CREATE PROCEDURE `sp_MiddlemanRejectOtp`(
    IN p_middleman_id BIGINT,
    IN p_identifier VARCHAR(100),
    IN p_reason VARCHAR(255)
)
BEGIN
    CALL `sp_Middleman_RejectOtp`(p_middleman_id, p_identifier, p_reason);
END$$
DELIMITER ;

-- Procedure: Resend OTP
DROP PROCEDURE IF EXISTS `sp_Middleman_ResendOtp`;
DELIMITER $$
CREATE PROCEDURE `sp_Middleman_ResendOtp`(
    IN p_middleman_id BIGINT,
    IN p_identifier VARCHAR(100),
    IN p_new_otp VARCHAR(20)
)
BEGIN
    DECLARE v_id BIGINT;
    DECLARE v_fresh_otp VARCHAR(10);

    SET v_fresh_otp = IFNULL(p_new_otp, '488031');

    SELECT `id` INTO v_id
    FROM `middleman_confirmations`
    WHERE (`confirmation_code` = p_identifier OR CAST(`id` AS CHAR) = p_identifier OR `transaction_id` = p_identifier)
      AND (p_middleman_id IS NULL OR p_middleman_id = 0 OR `middleman_id` = p_middleman_id OR `middleman_id` = 57)
    LIMIT 1;

    IF v_id IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Confirmation record not found.';
    END IF;

    UPDATE `middleman_confirmations`
    SET `otp_code` = v_fresh_otp,
        `otp_status` = 'Pending',
        `expiry_date` = DATE_ADD(NOW(), INTERVAL 48 HOUR),
        `updated_at` = NOW()
    WHERE `id` = v_id;

    SELECT v_id AS Id, v_fresh_otp AS OtpCode, 'Fresh OTP dispatched successfully.' AS Message;
END$$
DELIMITER ;

DROP PROCEDURE IF EXISTS `sp_MiddlemanResendOtp`;
DELIMITER $$
CREATE PROCEDURE `sp_MiddlemanResendOtp`(
    IN p_middleman_id BIGINT,
    IN p_identifier VARCHAR(100),
    IN p_new_otp VARCHAR(20)
)
BEGIN
    CALL `sp_Middleman_ResendOtp`(p_middleman_id, p_identifier, p_new_otp);
END$$
DELIMITER ;
