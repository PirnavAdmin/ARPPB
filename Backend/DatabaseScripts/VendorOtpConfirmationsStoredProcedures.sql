-- ============================================================================
-- ARPPB: Vendor Portal - OTP Confirmations stored procedures (MySQL 8+ / MariaDB 11+)
-- Script: VendorOtpConfirmationsStoredProcedures.sql
-- Screen: OTP Confirmations & Transaction Security (Farmer / Middleman / Customer / All tabs,
--         "Export OTP Audit Log", verify / resend).
--
-- Scope  : vendor OTP confirmation routines only; no table is altered.
-- Safe   : DROP ... IF EXISTS + CREATE, so it can be re-run at any time.
--
--   1. sp_vp_otp_list   : each row now also carries the order status / code of its sale, so a
--                         cancelled order's OTP is reported as 'Cancelled'; the status filter
--                         understands the screen's words (Sent / Pending / Verified / Failed /
--                         Expired / Cancelled). p_size is no longer clamped by the procedure.
--   2. sp_vp_otp_verify : the "related order is cancelled" check now runs BEFORE the
--                         "too many failed attempts" check (cancelling an order marks its pending
--                         OTP as Failed, which used to hide the real reason).
--   3. sp_vp_otp_summary: cancelled-order OTPs are counted in cancelled_confirmations instead of
--                         failed_expired_rejected, matching the list.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. sp_vp_otp_list
--    "Cancelled" = the OTP belongs to a cancelled order and was never verified.
-- ----------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS `sp_vp_otp_list`;
DELIMITER $$
CREATE PROCEDURE `sp_vp_otp_list`(
  IN p_vendor BIGINT, IN p_id BIGINT,
  IN p_category VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  IN p_status VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  IN p_search VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  IN p_from DATETIME, IN p_to_excl DATETIME, IN p_page INT, IN p_size INT, IN p_asc TINYINT)
BEGIN
  DECLARE v_off INT;
  SET v_off = (GREATEST(p_page, 1) - 1) * p_size;

  SELECT COUNT(*) AS total
    FROM vp_otp_confirmations c
    LEFT JOIN vp_sales s ON s.id = c.sale_id
   WHERE c.vendor_id = p_vendor AND (p_id IS NULL OR c.id = p_id)
     AND (p_category IS NULL OR c.party_category = p_category)
     AND (p_status IS NULL
          OR (p_status IN ('Sent', 'Pending')
              AND c.otp_status = 'Sent' AND c.expires_at > UTC_TIMESTAMP(6)
              AND NOT COALESCE(s.order_status = 'Cancelled' AND c.otp_status <> 'Verified', 0))
          OR (p_status = 'Expired'
              AND (c.otp_status = 'Expired' OR (c.otp_status = 'Sent' AND c.expires_at <= UTC_TIMESTAMP(6)))
              AND NOT COALESCE(s.order_status = 'Cancelled' AND c.otp_status <> 'Verified', 0))
          OR (p_status = 'Cancelled'
              AND COALESCE(s.order_status = 'Cancelled' AND c.otp_status <> 'Verified', 0))
          OR (p_status NOT IN ('Sent', 'Pending', 'Expired', 'Cancelled')
              AND c.otp_status = p_status
              AND NOT COALESCE(s.order_status = 'Cancelled' AND c.otp_status <> 'Verified', 0)))
     AND (p_search IS NULL OR c.transaction_code LIKE CONCAT('%', p_search, '%') OR c.party_name LIKE CONCAT('%', p_search, '%')
          OR c.mobile LIKE CONCAT('%', p_search, '%') OR c.product LIKE CONCAT('%', p_search, '%')
          OR c.confirmation_code LIKE CONCAT('%', p_search, '%'))
     AND (p_from IS NULL OR c.sent_at >= p_from) AND (p_to_excl IS NULL OR c.sent_at < p_to_excl);

  SELECT c.*,
         s.order_status AS sale_order_status,
         s.order_code AS sale_order_code
    FROM vp_otp_confirmations c
    LEFT JOIN vp_sales s ON s.id = c.sale_id
   WHERE c.vendor_id = p_vendor AND (p_id IS NULL OR c.id = p_id)
     AND (p_category IS NULL OR c.party_category = p_category)
     AND (p_status IS NULL
          OR (p_status IN ('Sent', 'Pending')
              AND c.otp_status = 'Sent' AND c.expires_at > UTC_TIMESTAMP(6)
              AND NOT COALESCE(s.order_status = 'Cancelled' AND c.otp_status <> 'Verified', 0))
          OR (p_status = 'Expired'
              AND (c.otp_status = 'Expired' OR (c.otp_status = 'Sent' AND c.expires_at <= UTC_TIMESTAMP(6)))
              AND NOT COALESCE(s.order_status = 'Cancelled' AND c.otp_status <> 'Verified', 0))
          OR (p_status = 'Cancelled'
              AND COALESCE(s.order_status = 'Cancelled' AND c.otp_status <> 'Verified', 0))
          OR (p_status NOT IN ('Sent', 'Pending', 'Expired', 'Cancelled')
              AND c.otp_status = p_status
              AND NOT COALESCE(s.order_status = 'Cancelled' AND c.otp_status <> 'Verified', 0)))
     AND (p_search IS NULL OR c.transaction_code LIKE CONCAT('%', p_search, '%') OR c.party_name LIKE CONCAT('%', p_search, '%')
          OR c.mobile LIKE CONCAT('%', p_search, '%') OR c.product LIKE CONCAT('%', p_search, '%')
          OR c.confirmation_code LIKE CONCAT('%', p_search, '%'))
     AND (p_from IS NULL OR c.sent_at >= p_from) AND (p_to_excl IS NULL OR c.sent_at < p_to_excl)
   ORDER BY IF(p_asc = 1, c.sent_at, NULL) ASC, c.sent_at DESC, c.id DESC
   LIMIT p_size OFFSET v_off;
END$$
DELIMITER ;

-- ----------------------------------------------------------------------------
-- 2. sp_vp_otp_verify
--    Business errors are signalled as SQLSTATE 45000 "httpStatus|message".
-- ----------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS `sp_vp_otp_verify`;
DELIMITER $$
CREATE PROCEDURE `sp_vp_otp_verify`(
  IN p_vendor BIGINT, IN p_id BIGINT,
  IN p_otp VARCHAR(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci)
BEGIN
  DECLARE v_status VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL;
  DECLARE v_hash VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  DECLARE v_attempts INT;
  DECLARE v_expires DATETIME(6);
  DECLARE v_sale BIGINT;
  DECLARE v_txn VARCHAR(40) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  DECLARE v_party VARCHAR(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  DECLARE v_type VARCHAR(40) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  DECLARE v_sale_status VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  DECLARE v_left INT;
  DECLARE v_ok TINYINT DEFAULT 0;
  DECLARE v_msg VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  DECLARE v_voucher_id BIGINT;
  DECLARE v_total DECIMAL(18,2);
  DECLARE v_exp_pay DATE;
  DECLARE v_cust VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  DECLARE v_cust_code VARCHAR(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  DECLARE v_order_code VARCHAR(40) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  DECLARE v_desc VARCHAR(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  DECLARE v_qty DECIMAL(18,3);
  DECLARE v_unit VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  DECLARE v_product VARCHAR(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

  SELECT otp_status, otp_hash, attempts, expires_at, sale_id, transaction_code, party_name, transaction_type
    INTO v_status, v_hash, v_attempts, v_expires, v_sale, v_txn, v_party, v_type
    FROM vp_otp_confirmations WHERE id = p_id AND vendor_id = p_vendor;
  IF v_status IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = '404|OTP confirmation not found.';
  END IF;
  IF v_status = 'Verified' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = '409|This transaction is already verified.';
  END IF;

  -- Checked before 'Failed': cancelling an order marks its pending OTP as Failed.
  IF v_sale IS NOT NULL THEN
    SET v_sale_status = NULL;
    SELECT order_status INTO v_sale_status FROM vp_sales WHERE id = v_sale AND vendor_id = p_vendor;
    IF v_sale_status = 'Cancelled' THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = '409|The related order is cancelled.';
    END IF;
  END IF;

  IF v_status = 'Failed' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = '409|Too many failed attempts. Resend a new OTP.';
  END IF;

  IF v_expires <= UTC_TIMESTAMP(6) THEN
    UPDATE vp_otp_confirmations SET otp_status = 'Expired', updated_at = UTC_TIMESTAMP(6) WHERE id = p_id;
    IF v_sale IS NOT NULL THEN
      UPDATE vp_sales SET otp_status = 'Expired', updated_at = UTC_TIMESTAMP(6) WHERE id = v_sale AND vendor_id = p_vendor;
    END IF;
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = '400|OTP has expired. Resend a new OTP.';
  END IF;
  IF v_hash IS NOT NULL AND LOCATE(':', v_hash) > 0
     AND LOWER(SUBSTRING_INDEX(v_hash, ':', -1)) = CONVERT(SHA2(CONCAT(SUBSTRING_INDEX(v_hash, ':', 1), p_otp), 256) USING utf8mb4) COLLATE utf8mb4_unicode_ci THEN
    SET v_ok = 1;
  END IF;

  IF v_ok = 0 THEN
    SET v_attempts = v_attempts + 1;
    SET v_left = 5 - v_attempts;
    UPDATE vp_otp_confirmations
       SET attempts = v_attempts, otp_status = IF(v_left <= 0, 'Failed', otp_status), updated_at = UTC_TIMESTAMP(6)
     WHERE id = p_id;
    IF v_left <= 0 AND v_sale IS NOT NULL THEN
      UPDATE vp_sales SET otp_status = 'Failed', updated_at = UTC_TIMESTAMP(6) WHERE id = v_sale AND vendor_id = p_vendor;
    END IF;
    IF v_left <= 0 THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = '400|Too many failed attempts. Resend a new OTP.';
    END IF;
    SET v_msg = CONCAT('400|Invalid OTP. ', v_left, ' attempt(s) remaining.');
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = v_msg;
  END IF;

  BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION BEGIN ROLLBACK; RESIGNAL; END;
    START TRANSACTION;
    UPDATE vp_otp_confirmations SET otp_status = 'Verified', confirmed_at = UTC_TIMESTAMP(6), updated_at = UTC_TIMESTAMP(6)
     WHERE id = p_id;

    IF v_sale IS NOT NULL THEN
      SELECT total_amount, expected_payment_date, customer_name, customer_code, order_code
        INTO v_total, v_exp_pay, v_cust, v_cust_code, v_order_code
        FROM vp_sales WHERE id = v_sale AND vendor_id = p_vendor FOR UPDATE;
      UPDATE vp_sales
         SET otp_status = 'Verified', order_status = IF(order_status = 'New', 'Confirmed', order_status),
             updated_at = UTC_TIMESTAMP(6)
       WHERE id = v_sale;
      SELECT COALESCE(SUM(quantity), 0), MIN(unit), MIN(product_name) INTO v_qty, v_unit, v_product
        FROM vp_sale_items WHERE sale_id = v_sale;
      SET v_desc = CONCAT('Confirmed sale of ', fn_vp_num(v_qty), ' ', COALESCE(v_unit, ''), ' ', COALESCE(v_product, ''), ' to ', v_cust);
      INSERT INTO vp_ledger_entries
        (vendor_id, transaction_code, entry_date, description, party_name, party_code, party_category, ledger_category,
         debit, credit, expected_payment_date, status, sale_id)
      VALUES (p_vendor, v_txn, UTC_TIMESTAMP(6), v_desc, v_cust, v_cust_code, 'Customer', 'Sale',
              v_total, 0, v_exp_pay, 'Unpaid', v_sale);
      SET v_voucher_id = LAST_INSERT_ID();
      UPDATE vp_ledger_entries SET voucher_code = CONCAT('VCH-', LPAD(v_voucher_id, 4, '0')) WHERE id = v_voucher_id;
      INSERT INTO vp_notifications (vendor_id, title, description, category, priority, reference_code, module_link)
      VALUES (p_vendor, CONCAT('Order Confirmed - ', v_order_code),
              CONCAT(v_cust, ' verified OTP for ', v_order_code, ' (', fn_vp_money(v_total), ').'),
              'Sale Confirmed', 'High', v_order_code, '/vendor/orders');
    ELSE
      INSERT INTO vp_notifications (vendor_id, title, description, category, priority, reference_code, module_link)
      VALUES (p_vendor, CONCAT('OTP Verified - ', v_txn), CONCAT(v_party, ' verified ', v_type, '.'),
              'OTP Confirmation', 'Medium', v_txn, '/vendor/confirmations');
    END IF;
    COMMIT;
  END;

  SELECT * FROM vp_otp_confirmations WHERE id = p_id;
END$$
DELIMITER ;

-- ----------------------------------------------------------------------------
-- 3. sp_vp_otp_summary
--    KPI cards / tab counts. An unverified OTP of a cancelled order is counted under
--    cancelled_confirmations (shown as 'Cancelled' in the list), not as failed / expired.
-- ----------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS `sp_vp_otp_summary`;
DELIMITER $$
CREATE PROCEDURE `sp_vp_otp_summary`(IN p_vendor BIGINT)
BEGIN
  SELECT
    COUNT(*) AS total_otp_requests,
    COALESCE(SUM(NOT cx AND c.otp_status = 'Sent' AND c.expires_at > UTC_TIMESTAMP(6)), 0) AS pending_or_sent,
    COALESCE(SUM(c.otp_status = 'Verified'), 0) AS verified_transactions,
    COALESCE(SUM(NOT cx AND (c.otp_status IN ('Failed', 'Expired')
                             OR (c.otp_status = 'Sent' AND c.expires_at <= UTC_TIMESTAMP(6)))), 0) AS failed_expired_rejected,
    COALESCE(SUM(cx), 0) AS cancelled_confirmations,
    COALESCE(SUM(c.party_category = 'Farmer'), 0) AS farmer_confirmations,
    COALESCE(SUM(c.party_category = 'Middleman'), 0) AS middleman_confirmations,
    COALESCE(SUM(c.party_category = 'Customer'), 0) AS customer_confirmations
  FROM (
    SELECT o.party_category, o.otp_status, o.expires_at,
           COALESCE(s.order_status = 'Cancelled' AND o.otp_status <> 'Verified', 0) AS cx
      FROM vp_otp_confirmations o
      LEFT JOIN vp_sales s ON s.id = o.sale_id
     WHERE o.vendor_id = p_vendor
  ) c;
END$$
DELIMITER ;

-- ----------------------------------------------------------------------------
-- 4. sp_vp_otp_filter_options
--    One row with the counts behind the tabs and the Category / OTP Status dropdowns of the
--    OTP Confirmations screen (same status rules as sp_vp_otp_list).
-- ----------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS `sp_vp_otp_filter_options`;
DELIMITER $$
CREATE PROCEDURE `sp_vp_otp_filter_options`(IN p_vendor BIGINT)
BEGIN
  SELECT
    COUNT(*) AS total,
    COALESCE(SUM(c.party_category = 'Farmer'), 0) AS farmer,
    COALESCE(SUM(c.party_category = 'Middleman'), 0) AS middleman,
    COALESCE(SUM(c.party_category = 'Customer'), 0) AS customer,
    COALESCE(SUM(NOT cx AND c.otp_status = 'Sent' AND c.expires_at > UTC_TIMESTAMP(6)), 0) AS pending,
    COALESCE(SUM(c.otp_status = 'Verified'), 0) AS verified,
    COALESCE(SUM(NOT cx AND (c.otp_status = 'Expired' OR (c.otp_status = 'Sent' AND c.expires_at <= UTC_TIMESTAMP(6)))), 0) AS expired,
    COALESCE(SUM(NOT cx AND c.otp_status = 'Failed'), 0) AS failed,
    COALESCE(SUM(cx), 0) AS cancelled
  FROM (
    SELECT o.party_category, o.otp_status, o.expires_at,
           COALESCE(s.order_status = 'Cancelled' AND o.otp_status <> 'Verified', 0) AS cx
      FROM vp_otp_confirmations o
      LEFT JOIN vp_sales s ON s.id = o.sale_id
     WHERE o.vendor_id = p_vendor
  ) c;
END$$
DELIMITER ;
