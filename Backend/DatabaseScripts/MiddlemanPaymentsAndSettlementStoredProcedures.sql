-- ============================================================================
-- ARPPB: Middleman Payments, Settlements & Cross-Screen Consistency
-- Database: u819242402_arppb (MariaDB 11+)
-- Script: MiddlemanPaymentsAndSettlementStoredProcedures.sql
-- ============================================================================
USE `u819242402_arppb`;

-- ----------------------------------------------------------------------------
-- 1. TABLE: middleman_payments
-- Stores immutable individual payment installments for every settlement
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `middleman_payments` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `middleman_id` BIGINT NOT NULL,
    `payment_code` VARCHAR(50) NOT NULL,
    `ledger_id` BIGINT NULL,
    `transaction_id` VARCHAR(50) NOT NULL,
    `party_category` VARCHAR(50) NOT NULL, -- 'Farmer', 'Vendor', 'Customer'
    `party_id` VARCHAR(50) NULL,
    `party_name` VARCHAR(150) NOT NULL,
    `payment_direction` VARCHAR(20) NOT NULL, -- 'Paid' (to Farmer) or 'Received' (from Vendor/Customer)
    `original_amount` DECIMAL(14,2) NOT NULL,
    `payment_amount` DECIMAL(14,2) NOT NULL,
    `total_paid_after` DECIMAL(14,2) NOT NULL,
    `balance_after` DECIMAL(14,2) NOT NULL,
    `payment_mode` VARCHAR(50) NOT NULL DEFAULT 'NEFT / RTGS',
    `reference_no` VARCHAR(100) NULL,
    `status` VARCHAR(30) NOT NULL DEFAULT 'Successful',
    `notes` VARCHAR(500) NULL,
    `payment_date` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_mm_payments_middleman` (`middleman_id`),
    INDEX `idx_mm_payments_txn` (`middleman_id`, `transaction_id`),
    INDEX `idx_mm_payments_ledger` (`middleman_id`, `ledger_id`),
    INDEX `idx_mm_payments_party` (`middleman_id`, `party_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 2. STORED PROCEDURE: sp_MiddlemanSettleLedgerEntry
-- Performs atomic partial or full settlement, updates ledger balances & status,
-- records individual payment in middleman_payments, and syncs party balances
-- ----------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS `sp_MiddlemanSettleLedgerEntry`;
DELIMITER $$
CREATE PROCEDURE `sp_MiddlemanSettleLedgerEntry`(
    IN p_entry_id BIGINT,
    IN p_middleman_id BIGINT,
    IN p_settle_amount DECIMAL(18,2),
    IN p_payment_mode VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_notes VARCHAR(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_reference_no VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
)
BEGIN
    DECLARE v_current_settled DECIMAL(18,2);
    DECLARE v_total DECIMAL(18,2);
    DECLARE v_new_settled DECIMAL(18,2);
    DECLARE v_new_outstanding DECIMAL(18,2);
    DECLARE v_new_status VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    DECLARE v_effective_payment DECIMAL(18,2);
    DECLARE v_txn_id VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    DECLARE v_party_id VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    DECLARE v_party_name VARCHAR(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    DECLARE v_party_cat VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    DECLARE v_payment_code VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    DECLARE v_payment_dir VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    DECLARE v_effective_mm_id BIGINT;

    -- Fetch current ledger row
    SELECT 
        `middleman_id`, `transaction_id`, `party_id`, `party_name`, `party_category`,
        `settled_amount`, GREATEST(`debit`, `credit`)
    INTO 
        v_effective_mm_id, v_txn_id, v_party_id, v_party_name, v_party_cat,
        v_current_settled, v_total
    FROM `middleman_ledger`
    WHERE `id` = p_entry_id AND (`middleman_id` = p_middleman_id OR p_middleman_id = 0)
    LIMIT 1;

    IF v_total IS NOT NULL THEN
        IF p_middleman_id > 0 THEN
            SET v_effective_mm_id = p_middleman_id;
        END IF;

        IF v_current_settled IS NULL THEN
            SET v_current_settled = 0;
        END IF;

        -- Determine payment amount
        IF p_settle_amount IS NULL OR p_settle_amount <= 0 THEN
            SET v_effective_payment = GREATEST(0, v_total - v_current_settled);
        ELSE
            -- Prevent paying more than outstanding
            SET v_effective_payment = LEAST(p_settle_amount, GREATEST(0, v_total - v_current_settled));
        END IF;

        IF v_effective_payment > 0 THEN
            SET v_new_settled = v_current_settled + v_effective_payment;
            SET v_new_outstanding = GREATEST(0, v_total - v_new_settled);

            IF v_new_outstanding = 0 THEN
                SET v_new_status = 'Paid';
            ELSE
                SET v_new_status = 'Partially Paid';
            END IF;

            -- Update middleman_ledger
            UPDATE `middleman_ledger`
            SET `settled_amount` = v_new_settled,
                `outstanding_amount` = v_new_outstanding,
                `status` = v_new_status,
                `description` = IF(p_notes IS NOT NULL AND p_notes != '', 
                                   CONCAT(COALESCE(`description`,''), ' | ', COALESCE(p_payment_mode, 'Payment'), ': ', p_notes), 
                                   `description`),
                `updated_at` = NOW()
            WHERE `id` = p_entry_id;

            -- Determine direction: Farmer = Paid (outward), Vendor/Customer = Received (inward)
            IF LOWER(v_party_cat) = 'farmer' THEN
                SET v_payment_dir = 'Paid';
            ELSE
                SET v_payment_dir = 'Received';
            END IF;

            -- Generate Payment Code: PAY-YYYYMMDD-XXXX
            SET v_payment_code = CONCAT('PAY-', DATE_FORMAT(NOW(), '%Y%m%d'), '-', LPAD(FLOOR(RAND() * 9000 + 1000), 4, '0'));

            -- Insert payment installment into middleman_payments
            INSERT INTO `middleman_payments` (
                `middleman_id`,
                `payment_code`,
                `ledger_id`,
                `transaction_id`,
                `party_category`,
                `party_id`,
                `party_name`,
                `payment_direction`,
                `original_amount`,
                `payment_amount`,
                `total_paid_after`,
                `balance_after`,
                `payment_mode`,
                `reference_no`,
                `status`,
                `notes`,
                `payment_date`,
                `created_at`,
                `updated_at`
            ) VALUES (
                v_effective_mm_id,
                v_payment_code,
                p_entry_id,
                COALESCE(v_txn_id, CONCAT('TXN-', p_entry_id)),
                COALESCE(v_party_cat, 'Other'),
                v_party_id,
                COALESCE(v_party_name, 'Unknown Party'),
                v_payment_dir,
                v_total,
                v_effective_payment,
                v_new_settled,
                v_new_outstanding,
                COALESCE(p_payment_mode, 'NEFT / RTGS'),
                COALESCE(p_reference_no, CONCAT('REF-', v_payment_code)),
                'Successful',
                COALESCE(p_notes, 'Settlement installment'),
                NOW(),
                NOW(),
                NOW()
            );

            -- Synchronize Party outstanding balance across respective entity table
            IF LOWER(v_party_cat) = 'farmer' AND v_party_id IS NOT NULL AND v_party_id != '' THEN
                UPDATE `middleman_farmers` f
                SET f.`outstanding_payables` = (
                    SELECT COALESCE(SUM(l.`outstanding_amount`), 0)
                    FROM `middleman_ledger` l
                    WHERE (l.`party_id` COLLATE utf8mb4_unicode_ci = v_party_id OR l.`party_name` COLLATE utf8mb4_unicode_ci = v_party_name)
                      AND l.`party_category` COLLATE utf8mb4_unicode_ci = 'Farmer'
                      AND (l.`middleman_id` = v_effective_mm_id OR l.`middleman_id` = 0)
                ),
                f.`updated_at` = NOW()
                WHERE (f.`farmer_code` COLLATE utf8mb4_unicode_ci = v_party_id OR CAST(f.`id` AS CHAR) COLLATE utf8mb4_unicode_ci = v_party_id)
                  AND (f.`middleman_id` = v_effective_mm_id OR f.`middleman_id` = 0);
            ELSEIF LOWER(v_party_cat) = 'vendor' AND v_party_id IS NOT NULL AND v_party_id != '' THEN
                UPDATE `middleman_vendors` v
                SET v.`outstanding_receivables` = (
                    SELECT COALESCE(SUM(l.`outstanding_amount`), 0)
                    FROM `middleman_ledger` l
                    WHERE (l.`party_id` COLLATE utf8mb4_unicode_ci = v_party_id OR l.`party_name` COLLATE utf8mb4_unicode_ci = v_party_name)
                      AND l.`party_category` COLLATE utf8mb4_unicode_ci = 'Vendor'
                      AND (l.`middleman_id` = v_effective_mm_id OR l.`middleman_id` = 0)
                ),
                v.`updated_at` = NOW()
                WHERE (v.`vendor_id` COLLATE utf8mb4_unicode_ci = v_party_id OR CAST(v.`id` AS CHAR) COLLATE utf8mb4_unicode_ci = v_party_id)
                  AND (v.`middleman_id` = v_effective_mm_id OR v.`middleman_id` = 0);
            ELSEIF LOWER(v_party_cat) = 'customer' AND v_party_id IS NOT NULL AND v_party_id != '' THEN
                UPDATE `middleman_customers` c
                SET c.`outstanding_receivables` = (
                    SELECT COALESCE(SUM(l.`outstanding_amount`), 0)
                    FROM `middleman_ledger` l
                    WHERE (l.`party_id` COLLATE utf8mb4_unicode_ci = v_party_id OR l.`party_name` COLLATE utf8mb4_unicode_ci = v_party_name)
                      AND l.`party_category` COLLATE utf8mb4_unicode_ci = 'Customer'
                      AND (l.`middleman_id` = v_effective_mm_id OR l.`middleman_id` = 0)
                ),
                c.`updated_at` = NOW()
                WHERE (c.`customer_id` COLLATE utf8mb4_unicode_ci = v_party_id OR CAST(c.`id` AS CHAR) COLLATE utf8mb4_unicode_ci = v_party_id)
                  AND (c.`middleman_id` = v_effective_mm_id OR c.`middleman_id` = 0);
            END IF;
        END IF;
    END IF;

    -- Return updated ledger entry
    SELECT 
        `id` AS Id,
        `middleman_id` AS MiddlemanId,
        `ledger_code` AS LedgerCode,
        `date` AS Date,
        `transaction_id` AS TransactionId,
        `category` AS Category,
        `description` AS Description,
        `party_id` AS PartyId,
        `party_name` AS PartyName,
        `party_category` AS PartyCategory,
        `debit` AS Debit,
        `credit` AS Credit,
        `settled_amount` AS SettledAmount,
        `outstanding_amount` AS OutstandingAmount,
        `status` AS Status,
        `updated_at` AS UpdatedAt
    FROM `middleman_ledger`
    WHERE `id` = p_entry_id;
END$$
DELIMITER ;

-- ----------------------------------------------------------------------------
-- 3. STORED PROCEDURE: sp_MiddlemanGetPaymentHistory
-- Retrieves complete payment installments for a transaction or ledger entry
-- ----------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS `sp_MiddlemanGetPaymentHistory`;
DELIMITER $$
CREATE PROCEDURE `sp_MiddlemanGetPaymentHistory`(
    IN p_middleman_id BIGINT,
    IN p_transaction_id VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_ledger_id BIGINT
)
BEGIN
    SELECT 
        `id` AS Id,
        `middleman_id` AS MiddlemanId,
        `payment_code` AS PaymentCode,
        `ledger_id` AS LedgerId,
        `transaction_id` AS TransactionId,
        `party_category` AS PartyCategory,
        `party_id` AS PartyId,
        `party_name` AS PartyName,
        `payment_direction` AS PaymentDirection,
        `original_amount` AS OriginalAmount,
        `payment_amount` AS PaymentAmount,
        `total_paid_after` AS TotalPaidAfter,
        `balance_after` AS BalanceAfter,
        `payment_mode` AS PaymentMode,
        `reference_no` AS ReferenceNo,
        `status` AS Status,
        `notes` AS Notes,
        `payment_date` AS PaymentDate,
        `created_at` AS CreatedAt
    FROM `middleman_payments`
    WHERE (`middleman_id` = p_middleman_id OR p_middleman_id = 0)
      AND (
          (p_transaction_id IS NOT NULL AND p_transaction_id != '' AND `transaction_id` = p_transaction_id COLLATE utf8mb4_unicode_ci)
          OR (p_ledger_id IS NOT NULL AND p_ledger_id > 0 AND `ledger_id` = p_ledger_id)
      )
    ORDER BY `payment_date` ASC, `id` ASC;
END$$
DELIMITER ;

-- ----------------------------------------------------------------------------
-- 4. STORED PROCEDURE: sp_MiddlemanRecalculatePersonBalances
-- Recalculates and synchronizes outstanding payables/receivables for all parties
-- ----------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS `sp_MiddlemanRecalculatePersonBalances`;
DELIMITER $$
CREATE PROCEDURE `sp_MiddlemanRecalculatePersonBalances`(
    IN p_middleman_id BIGINT
)
BEGIN
    -- 1. Farmers payables
    UPDATE `middleman_farmers` f
    LEFT JOIN (
        SELECT 
            COALESCE(l.`party_id`, '') AS party_id,
            COALESCE(l.`party_name`, '') AS party_name,
            SUM(l.`outstanding_amount`) AS total_due
        FROM `middleman_ledger` l
        WHERE l.`party_category` COLLATE utf8mb4_unicode_ci = 'Farmer'
          AND (p_middleman_id = 0 OR l.`middleman_id` = p_middleman_id OR l.`middleman_id` = 57)
        GROUP BY l.`party_id`, l.`party_name`
    ) dues ON (f.`farmer_code` COLLATE utf8mb4_unicode_ci = dues.party_id COLLATE utf8mb4_unicode_ci OR f.`name` COLLATE utf8mb4_unicode_ci = dues.party_name COLLATE utf8mb4_unicode_ci)
    SET f.`outstanding_payables` = COALESCE(dues.total_due, 0)
    WHERE p_middleman_id = 0 OR f.`middleman_id` = p_middleman_id OR f.`middleman_id` = 57;

    -- 2. Vendors receivables
    UPDATE `middleman_vendors` v
    LEFT JOIN (
        SELECT 
            COALESCE(l.`party_id`, '') AS party_id,
            COALESCE(l.`party_name`, '') AS party_name,
            SUM(l.`outstanding_amount`) AS total_due
        FROM `middleman_ledger` l
        WHERE l.`party_category` COLLATE utf8mb4_unicode_ci = 'Vendor'
          AND (p_middleman_id = 0 OR l.`middleman_id` = p_middleman_id OR l.`middleman_id` = 57)
        GROUP BY l.`party_id`, l.`party_name`
    ) dues ON (v.`vendor_id` COLLATE utf8mb4_unicode_ci = dues.party_id COLLATE utf8mb4_unicode_ci OR v.`business_name` COLLATE utf8mb4_unicode_ci = dues.party_name COLLATE utf8mb4_unicode_ci)
    SET v.`outstanding_receivables` = COALESCE(dues.total_due, 0)
    WHERE p_middleman_id = 0 OR v.`middleman_id` = p_middleman_id OR v.`middleman_id` = 57;

    -- 3. Customers receivables
    UPDATE `middleman_customers` c
    LEFT JOIN (
        SELECT 
            COALESCE(l.`party_id`, '') AS party_id,
            COALESCE(l.`party_name`, '') AS party_name,
            SUM(l.`outstanding_amount`) AS total_due
        FROM `middleman_ledger` l
        WHERE l.`party_category` COLLATE utf8mb4_unicode_ci = 'Customer'
          AND (p_middleman_id = 0 OR l.`middleman_id` = p_middleman_id OR l.`middleman_id` = 57)
        GROUP BY l.`party_id`, l.`party_name`
    ) dues ON (c.`customer_id` COLLATE utf8mb4_unicode_ci = dues.party_id COLLATE utf8mb4_unicode_ci OR c.`name` COLLATE utf8mb4_unicode_ci = dues.party_name COLLATE utf8mb4_unicode_ci)
    SET c.`outstanding_receivables` = COALESCE(dues.total_due, 0)
    WHERE p_middleman_id = 0 OR c.`middleman_id` = p_middleman_id OR c.`middleman_id` = 57;
END$$
DELIMITER ;

-- ----------------------------------------------------------------------------
-- 5. STORED PROCEDURE: sp_MiddlemanGetLedgerSummary
-- Dynamic aggregation of middleman_ledger metrics
-- ----------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS `sp_MiddlemanGetLedgerSummary`;
DELIMITER $$
CREATE PROCEDURE `sp_MiddlemanGetLedgerSummary`(
    IN p_middleman_id BIGINT
)
BEGIN
    SELECT 
        p_middleman_id AS MiddlemanId,
        COALESCE(SUM(CASE WHEN `party_category` = 'Farmer' THEN `credit` ELSE 0 END), 0) AS TotalPurchases,
        COALESCE(SUM(CASE WHEN `party_category` IN ('Vendor', 'Customer') THEN `debit` ELSE 0 END), 0) AS TotalSales,
        COALESCE(SUM(CASE WHEN `party_category` IN ('Vendor', 'Customer') THEN `outstanding_amount` ELSE 0 END), 0) AS ExpectedReceivables,
        COALESCE(SUM(CASE WHEN `party_category` = 'Farmer' THEN `outstanding_amount` ELSE 0 END), 0) AS ExpectedPayables,
        COALESCE(SUM(CASE WHEN `party_category` IN ('Vendor', 'Customer') THEN `settled_amount` ELSE 0 END), 0) AS AmountReceived,
        COALESCE(SUM(CASE WHEN `party_category` = 'Farmer' THEN `settled_amount` ELSE 0 END), 0) AS AmountPaid,
        (COALESCE(SUM(CASE WHEN `party_category` IN ('Vendor', 'Customer') THEN `debit` ELSE 0 END), 0) -
         COALESCE(SUM(CASE WHEN `party_category` = 'Farmer' THEN `credit` ELSE 0 END), 0)) AS NetBalance,
        COUNT(*) AS TotalTransactionsCount
    FROM `middleman_ledger`
    WHERE (`middleman_id` = p_middleman_id OR p_middleman_id = 0);
END$$
DELIMITER ;
