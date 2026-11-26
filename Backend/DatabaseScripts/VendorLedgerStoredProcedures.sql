-- ============================================================================
-- ARPPB: Vendor Portal - My Ledger stored procedures (MySQL 8+ / MariaDB 11+)
-- Script: VendorLedgerStoredProcedures.sql
-- Screen: My Financial Ledger & Account Statements (journal tabs, date-wise totals,
--         voucher popup, statement export / print, Pay Supplier, Record Customer Receipt).
--
-- Scope  : vendor ledger routines only; no table is altered.
-- Safe   : DROP ... IF EXISTS + CREATE, so it can be re-run at any time.
--
--   1. sp_vp_ledger_list            : understands the screen's status words (Pending = Unpaid,
--                                     Partially Paid = Partial, Overdue = unpaid / partial and past
--                                     its expected date); cancelled vouchers keep their place and
--                                     show the party balance at that point but never change it.
--   2. sp_vp_ledger_day_totals      : NEW parameter p_tab (suppliers / customers / processing) so
--                                     each tab gets its own date-wise totals.
--   3. sp_vp_ledger_resolve_receipt : turns a customer / sale reference (id or code such as
--                                     CUST-2026-0063, SALE-0001) into the real ids.
--   4. sp_vp_ledger_resolve_payable : turns a voucher / purchase code into an open payable id.
--   5. sp_vp_ledger_filter_options  : parties for the Party Name dropdown + the four tab counts.
--   sp_vp_ledger_list also matches the Party Name filter by name OR party code.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. sp_vp_ledger_list
--    Result sets: (1) total, (2) the page of vouchers with running_balance.
--    p_tab: 'suppliers' | 'customers' | 'processing' (NULL = all journal entries).
-- ----------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS `sp_vp_ledger_list`;
DELIMITER $$
CREATE PROCEDURE `sp_vp_ledger_list`(
  IN p_vendor BIGINT, IN p_id BIGINT,
  IN p_tab VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  IN p_ledger_cat VARCHAR(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  IN p_party_cat VARCHAR(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  IN p_party VARCHAR(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  IN p_status VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  IN p_entry_type VARCHAR(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  IN p_search VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  IN p_from DATETIME, IN p_to_excl DATETIME, IN p_page INT, IN p_size INT, IN p_asc TINYINT)
BEGIN
  DECLARE v_off INT;
  SET v_off = (GREATEST(p_page, 1) - 1) * p_size;

  SELECT COUNT(*) AS total FROM vp_ledger_entries e
   WHERE e.vendor_id = p_vendor AND (p_id IS NULL OR e.id = p_id)
     AND (p_tab IS NULL OR (p_tab = 'suppliers' AND e.party_category IN ('Farmer', 'Middleman'))
          OR (p_tab = 'customers' AND e.party_category = 'Customer')
          OR (p_tab = 'processing' AND e.ledger_category = 'Processing Expense'))
     AND (p_ledger_cat IS NULL OR e.ledger_category = p_ledger_cat)
     AND (p_party_cat IS NULL OR e.party_category = p_party_cat)
     AND (p_party IS NULL OR e.party_name = p_party OR e.party_code = p_party)
     AND (p_status IS NULL
          OR e.status = CASE p_status WHEN 'Pending' THEN 'Unpaid' WHEN 'Partially Paid' THEN 'Partial' ELSE p_status END
          OR (p_status = 'Overdue' AND e.status IN ('Unpaid', 'Partial') AND e.expected_payment_date < UTC_DATE()))
     AND (p_entry_type IS NULL OR (p_entry_type = 'debit' AND e.debit > 0) OR (p_entry_type = 'credit' AND e.credit > 0))
     AND (p_search IS NULL OR e.voucher_code LIKE CONCAT('%', p_search, '%') OR e.transaction_code LIKE CONCAT('%', p_search, '%')
          OR e.party_name LIKE CONCAT('%', p_search, '%') OR e.description LIKE CONCAT('%', p_search, '%'))
     AND (p_from IS NULL OR e.entry_date >= p_from) AND (p_to_excl IS NULL OR e.entry_date < p_to_excl);

  WITH r AS (
    SELECT x.id,
           SUM(CASE WHEN x.status = 'Cancelled' THEN 0
                    WHEN x.party_category IN ('Farmer', 'Middleman') THEN x.credit - x.debit
                    ELSE x.debit - x.credit END)
             OVER (PARTITION BY x.party_category, x.party_name ORDER BY x.entry_date, x.id) AS running_balance
      FROM vp_ledger_entries x WHERE x.vendor_id = p_vendor)
  SELECT e.*, COALESCE(r.running_balance, 0) AS running_balance
    FROM vp_ledger_entries e LEFT JOIN r ON r.id = e.id
   WHERE e.vendor_id = p_vendor AND (p_id IS NULL OR e.id = p_id)
     AND (p_tab IS NULL OR (p_tab = 'suppliers' AND e.party_category IN ('Farmer', 'Middleman'))
          OR (p_tab = 'customers' AND e.party_category = 'Customer')
          OR (p_tab = 'processing' AND e.ledger_category = 'Processing Expense'))
     AND (p_ledger_cat IS NULL OR e.ledger_category = p_ledger_cat)
     AND (p_party_cat IS NULL OR e.party_category = p_party_cat)
     AND (p_party IS NULL OR e.party_name = p_party OR e.party_code = p_party)
     AND (p_status IS NULL
          OR e.status = CASE p_status WHEN 'Pending' THEN 'Unpaid' WHEN 'Partially Paid' THEN 'Partial' ELSE p_status END
          OR (p_status = 'Overdue' AND e.status IN ('Unpaid', 'Partial') AND e.expected_payment_date < UTC_DATE()))
     AND (p_entry_type IS NULL OR (p_entry_type = 'debit' AND e.debit > 0) OR (p_entry_type = 'credit' AND e.credit > 0))
     AND (p_search IS NULL OR e.voucher_code LIKE CONCAT('%', p_search, '%') OR e.transaction_code LIKE CONCAT('%', p_search, '%')
          OR e.party_name LIKE CONCAT('%', p_search, '%') OR e.description LIKE CONCAT('%', p_search, '%'))
     AND (p_from IS NULL OR e.entry_date >= p_from) AND (p_to_excl IS NULL OR e.entry_date < p_to_excl)
   ORDER BY IF(p_asc = 1, e.entry_date, NULL) ASC, IF(p_asc = 1, e.id, NULL) ASC, e.entry_date DESC, e.id DESC
   LIMIT p_size OFFSET v_off;
END$$
DELIMITER ;

-- ----------------------------------------------------------------------------
-- 2. sp_vp_ledger_day_totals  ("Date-wise financial totals (recent posting days)")
--    Cancelled vouchers are excluded. p_tab as in sp_vp_ledger_list.
-- ----------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS `sp_vp_ledger_day_totals`;
DELIMITER $$
CREATE PROCEDURE `sp_vp_ledger_day_totals`(
  IN p_vendor BIGINT, IN p_days INT,
  IN p_tab VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci)
BEGIN
  SELECT DATE(e.entry_date) AS day_date, COUNT(*) AS vouchers,
         COALESCE(SUM(e.debit), 0) AS debit, COALESCE(SUM(e.credit), 0) AS credit
    FROM vp_ledger_entries e
   WHERE e.vendor_id = p_vendor AND e.status <> 'Cancelled'
     AND e.entry_date >= DATE_SUB(UTC_DATE(), INTERVAL (LEAST(GREATEST(p_days, 1), 365) - 1) DAY)
     AND (p_tab IS NULL OR (p_tab = 'suppliers' AND e.party_category IN ('Farmer', 'Middleman'))
          OR (p_tab = 'customers' AND e.party_category = 'Customer')
          OR (p_tab = 'processing' AND e.ledger_category = 'Processing Expense'))
   GROUP BY DATE(e.entry_date) ORDER BY day_date DESC;
END$$
DELIMITER ;

-- ----------------------------------------------------------------------------
-- 3. sp_vp_ledger_resolve_receipt  (Record Customer Receipt)
--    p_sale_ref     : sale id, SALE-xxxx or ORD-xxxx of this vendor
--    p_customer_ref : Customers.UserId, CustomerCode (CUST-2026-0063) or its digits
--    Returns one row: sale_id, customer_user_id (NULL when not found).
-- ----------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS `sp_vp_ledger_resolve_receipt`;
DELIMITER $$
CREATE PROCEDURE `sp_vp_ledger_resolve_receipt`(
  IN p_vendor BIGINT,
  IN p_customer_ref VARCHAR(60) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  IN p_sale_ref VARCHAR(60) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci)
BEGIN
  DECLARE v_sale BIGINT DEFAULT NULL;
  DECLARE v_cust BIGINT DEFAULT NULL;
  DECLARE v_ref VARCHAR(60) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  DECLARE v_digits VARCHAR(60) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

  SET v_ref = NULLIF(TRIM(COALESCE(p_sale_ref, '')), '');
  IF v_ref IS NOT NULL THEN
    SELECT s.id, s.customer_user_id INTO v_sale, v_cust
      FROM vp_sales s
     WHERE s.vendor_id = p_vendor AND s.order_status <> 'Draft'
       AND (s.sale_code = v_ref OR s.order_code = v_ref OR CAST(s.id AS CHAR) COLLATE utf8mb4_unicode_ci = v_ref)
     LIMIT 1;

    -- Also check vp_ledger_entries by voucher code, transaction code, or id
    IF v_sale IS NULL THEN
      SELECT e.sale_id, s.customer_user_id INTO v_sale, v_cust
        FROM vp_ledger_entries e
        LEFT JOIN vp_sales s ON s.id = e.sale_id
       WHERE e.vendor_id = p_vendor
         AND (e.voucher_code = v_ref OR e.transaction_code = v_ref OR CAST(e.id AS CHAR) COLLATE utf8mb4_unicode_ci = v_ref)
       LIMIT 1;
    END IF;
  END IF;

  SET v_ref = NULLIF(TRIM(COALESCE(p_customer_ref, '')), '');
  IF v_cust IS NULL AND v_ref IS NOT NULL THEN
    SET v_digits = REGEXP_REPLACE(v_ref, '[^0-9]', '');

    -- 1. Check vendor_customers table
    SELECT vc.Id INTO v_cust
      FROM vendor_customers vc
     WHERE vc.VendorId = p_vendor
       AND (CAST(vc.Id AS CHAR) COLLATE utf8mb4_unicode_ci = v_ref
            OR vc.CustomerCode COLLATE utf8mb4_unicode_ci = v_ref
            OR vc.CustomerName COLLATE utf8mb4_unicode_ci = v_ref
            OR (v_digits <> '' AND REGEXP_REPLACE(vc.CustomerCode, '[^0-9]', '') COLLATE utf8mb4_unicode_ci = v_digits))
     ORDER BY (CAST(vc.Id AS CHAR) COLLATE utf8mb4_unicode_ci = v_ref) DESC, vc.Id
     LIMIT 1;

    -- 2. Check Customers table
    IF v_cust IS NULL THEN
      SELECT c.UserId INTO v_cust
        FROM Customers c
       WHERE CAST(c.UserId AS CHAR) COLLATE utf8mb4_unicode_ci = v_ref
          OR c.CustomerCode COLLATE utf8mb4_unicode_ci = v_ref
          OR (v_digits <> '' AND REGEXP_REPLACE(c.CustomerCode, '[^0-9]', '') COLLATE utf8mb4_unicode_ci = v_digits)
       ORDER BY (CAST(c.UserId AS CHAR) COLLATE utf8mb4_unicode_ci = v_ref) DESC, c.UserId
       LIMIT 1;
    END IF;

    -- 3. Check Users table
    IF v_cust IS NULL THEN
      SELECT u.Id INTO v_cust
        FROM Users u
       WHERE CAST(u.Id AS CHAR) COLLATE utf8mb4_unicode_ci = v_ref
          OR u.FullName COLLATE utf8mb4_unicode_ci = v_ref
          OR u.Mobile COLLATE utf8mb4_unicode_ci = v_ref
       LIMIT 1;
    END IF;
  END IF;

  SELECT v_sale AS sale_id, v_cust AS customer_user_id;
END$$
DELIMITER ;

-- ----------------------------------------------------------------------------
-- 4. sp_vp_ledger_resolve_payable  (Pay Supplier)
--    p_ref : ledger id, voucher code (VCH-0007) or purchase transaction code (PUR-F-0001)
--    Returns the oldest matching OPEN payable, or no row.
-- ----------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS `sp_vp_ledger_resolve_payable`;
DELIMITER $$
CREATE PROCEDURE `sp_vp_ledger_resolve_payable`(
  IN p_vendor BIGINT,
  IN p_ref VARCHAR(60) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci)
BEGIN
  SELECT e.id AS ledger_entry_id
    FROM vp_ledger_entries e
   WHERE e.vendor_id = p_vendor AND e.ledger_category = 'Purchase' AND e.status <> 'Cancelled'
     AND e.credit - e.settled_amount > 0
     AND (e.voucher_code = TRIM(p_ref) OR e.transaction_code = TRIM(p_ref) OR CAST(e.id AS CHAR) COLLATE utf8mb4_unicode_ci = TRIM(p_ref))
   ORDER BY e.id
   LIMIT 1;
END$$
DELIMITER ;

-- ----------------------------------------------------------------------------
-- 5. sp_vp_ledger_filter_options  (filter dropdowns + tab counts)
--    Result sets: (1) the parties that appear in the vendor's ledger (Party Name dropdown),
--                 (2) one row of counts for the four sub-ledger tabs.
-- ----------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS `sp_vp_ledger_filter_options`;
DELIMITER $$
CREATE PROCEDURE `sp_vp_ledger_filter_options`(IN p_vendor BIGINT)
BEGIN
  SELECT e.party_name, MIN(e.party_code) AS party_code, e.party_category, COUNT(*) AS vouchers
    FROM vp_ledger_entries e
   WHERE e.vendor_id = p_vendor
   GROUP BY e.party_name, e.party_category
   ORDER BY e.party_name;

  SELECT COUNT(*) AS all_entries,
         COALESCE(SUM(e.party_category IN ('Farmer', 'Middleman')), 0) AS payables,
         COALESCE(SUM(e.party_category = 'Customer'), 0) AS receivables,
         COALESCE(SUM(e.ledger_category = 'Processing Expense'), 0) AS expenses
    FROM vp_ledger_entries e
   WHERE e.vendor_id = p_vendor;
END$$
DELIMITER ;
