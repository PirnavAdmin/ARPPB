-- Vendor portal core stored procedures (Sell Products, Customer Orders, OTP create/resend, My Ledger postings,
-- batches / customers, vendor resolve). Exported from the live arppb database so they live in source control.
-- Safe to re-run: each procedure is dropped and recreated.

-- ----------------------------------------------------------------------------
-- sp_vp_batch_delete
-- ----------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS `sp_vp_batch_delete`;
DELIMITER $$
CREATE PROCEDURE `sp_vp_batch_delete`(IN p_vendor BIGINT, IN p_id BIGINT)
BEGIN
  IF NOT EXISTS (SELECT 1 FROM vp_finished_product_batches WHERE id = p_id AND vendor_id = p_vendor) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = '404|Finished product batch not found.';
  END IF;
  IF EXISTS (SELECT 1 FROM vp_sale_items WHERE finished_batch_id = p_id) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = '409|Batch is used by existing sales; set its status to Inactive instead.';
  END IF;
  DELETE FROM vp_finished_product_batches WHERE id = p_id AND vendor_id = p_vendor;
  SELECT 1 AS deleted;
END$$
DELIMITER ;

-- ----------------------------------------------------------------------------
-- sp_vp_batch_save
-- ----------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS `sp_vp_batch_save`;
DELIMITER $$
CREATE PROCEDURE `sp_vp_batch_save`(
  IN p_vendor BIGINT, IN p_id BIGINT, IN p_code VARCHAR(40) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci, IN p_name VARCHAR(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci, IN p_ref VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  IN p_unit VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci, IN p_qty DECIMAL(18,3), IN p_cost DECIMAL(18,2), IN p_price DECIMAL(18,2), IN p_status VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci)
BEGIN
  DECLARE v_code VARCHAR(40) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  DECLARE v_prefix VARCHAR(3) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  DECLARE v_n INT;
  DECLARE v_id BIGINT;
  DECLARE v_status VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

  SET v_code = NULLIF(TRIM(COALESCE(p_code, '')), '');
  SET v_status = IF(LOWER(TRIM(COALESCE(p_status, ''))) = 'inactive', 'Inactive', 'Active');

  IF p_id IS NULL THEN
    IF v_code IS NULL THEN
      SET v_prefix = RPAD(UPPER(LEFT(REGEXP_REPLACE(p_name, '[^A-Za-z]', ''), 3)), 3, 'X');
      SELECT COUNT(*) + 1 INTO v_n FROM vp_finished_product_batches WHERE vendor_id = p_vendor;
      SET v_code = CONCAT('FG-', v_prefix, '-', YEAR(UTC_DATE()), '-', LPAD(v_n, 3, '0'));
      WHILE EXISTS (SELECT 1 FROM vp_finished_product_batches WHERE vendor_id = p_vendor AND batch_code = v_code) DO
        SET v_n = v_n + 1;
        SET v_code = CONCAT('FG-', v_prefix, '-', YEAR(UTC_DATE()), '-', LPAD(v_n, 3, '0'));
      END WHILE;
    ELSEIF EXISTS (SELECT 1 FROM vp_finished_product_batches WHERE vendor_id = p_vendor AND batch_code = v_code) THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = '409|Batch code already exists.';
    END IF;

    INSERT INTO vp_finished_product_batches
      (vendor_id, batch_code, product_name, processing_batch_ref, unit, quantity_available, cost_per_unit, suggested_price, status)
    VALUES (p_vendor, v_code, TRIM(p_name), NULLIF(TRIM(p_ref), ''), TRIM(p_unit), p_qty, p_cost, p_price, v_status);
    SET v_id = LAST_INSERT_ID();
  ELSE
    IF NOT EXISTS (SELECT 1 FROM vp_finished_product_batches WHERE id = p_id AND vendor_id = p_vendor) THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = '404|Finished product batch not found.';
    END IF;
    IF v_code IS NOT NULL AND EXISTS (SELECT 1 FROM vp_finished_product_batches
                                      WHERE vendor_id = p_vendor AND batch_code = v_code AND id <> p_id) THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = '409|Batch code already exists.';
    END IF;
    UPDATE vp_finished_product_batches
       SET batch_code = COALESCE(v_code, batch_code), product_name = TRIM(p_name),
           processing_batch_ref = NULLIF(TRIM(p_ref), ''), unit = TRIM(p_unit), quantity_available = p_qty,
           cost_per_unit = p_cost, suggested_price = p_price,
           status = IF(NULLIF(TRIM(COALESCE(p_status, '')), '') IS NULL, status, v_status),
           updated_at = UTC_TIMESTAMP(6)
     WHERE id = p_id AND vendor_id = p_vendor;
    SET v_id = p_id;
  END IF;

  CALL sp_vp_batches(p_vendor, v_id, NULL, 1);
END$$
DELIMITER ;

-- ----------------------------------------------------------------------------
-- sp_vp_batches
-- ----------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS `sp_vp_batches`;
DELIMITER $$
CREATE PROCEDURE `sp_vp_batches`(IN p_vendor BIGINT, IN p_id BIGINT, IN p_product VARCHAR(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci, IN p_include_empty TINYINT)
BEGIN
  SELECT * FROM vp_finished_product_batches
  WHERE vendor_id = p_vendor
    AND (p_id IS NULL OR id = p_id)
    AND (p_product IS NULL OR p_product = '' OR product_name = p_product)
    AND (p_include_empty = 1 OR (status = 'Active' AND quantity_available > 0))
  ORDER BY product_name, batch_code;
END$$
DELIMITER ;

-- ----------------------------------------------------------------------------
-- sp_vp_customer_settings_save
-- ----------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS `sp_vp_customer_settings_save`;
DELIMITER $$
CREATE PROCEDURE `sp_vp_customer_settings_save`(
  IN p_vendor BIGINT, IN p_customer_user BIGINT, IN p_business VARCHAR(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci, IN p_gstin VARCHAR(15) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  IN p_type VARCHAR(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci, IN p_credit DECIMAL(18,2), IN p_opening DECIMAL(18,2))
BEGIN
  DECLARE v_gstin VARCHAR(15) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  IF NOT EXISTS (SELECT 1 FROM Customers c JOIN Users u ON u.Id = c.UserId
                 WHERE c.UserId = p_customer_user AND u.IsActive = 1) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = '404|Customer not found.';
  END IF;
  SET v_gstin = NULLIF(UPPER(TRIM(COALESCE(p_gstin, ''))), '');
  IF v_gstin IS NOT NULL AND v_gstin NOT REGEXP '^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = '400|Invalid GSTIN format.';
  END IF;

  INSERT INTO vp_customer_settings (vendor_id, customer_user_id, business_name, gstin, customer_type, credit_limit, opening_due)
  VALUES (p_vendor, p_customer_user, NULLIF(TRIM(p_business), ''), v_gstin,
          COALESCE(NULLIF(TRIM(p_type), ''), 'Wholesaler'), p_credit, p_opening)
  ON DUPLICATE KEY UPDATE business_name = VALUES(business_name), gstin = VALUES(gstin),
                          customer_type = VALUES(customer_type), credit_limit = VALUES(credit_limit),
                          opening_due = VALUES(opening_due), updated_at = UTC_TIMESTAMP(6);

  CALL sp_vp_customers(p_vendor, p_customer_user, NULL);
END$$
DELIMITER ;

-- ----------------------------------------------------------------------------
-- sp_vp_customers
-- ----------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS `sp_vp_customers`;
DELIMITER $$
CREATE PROCEDURE `sp_vp_customers`(IN p_vendor BIGINT, IN p_customer_user BIGINT, IN p_search VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci)
BEGIN
  SELECT c.Id AS customer_id, c.UserId AS customer_user_id, c.CustomerCode AS customer_code,
         u.FullName AS customer_name,
         COALESCE(s.business_name, '') AS business_name,
         COALESCE(s.customer_type, 'Wholesaler') AS customer_type,
         u.Mobile AS mobile, COALESCE(u.Email, '') AS email, COALESCE(s.gstin, '') AS gstin,
         COALESCE(p.district, '') AS district, COALESCE(p.state, '') AS state,
         COALESCE(p.address, '') AS delivery_address,
         COALESCE(s.credit_limit, 0) AS credit_limit,
         COALESCE((SELECT SUM(x.total_amount - x.amount_received) FROM vp_sales x
                    WHERE x.vendor_id = p_vendor AND x.customer_user_id = c.UserId
                      AND x.otp_status = 'Verified' AND x.order_status <> 'Cancelled'), 0)
           + COALESCE(s.opening_due, 0) AS outstanding_receivable
  FROM Customers c
  JOIN Users u ON u.Id = c.UserId
  LEFT JOIN customer_profiles p ON p.user_id = c.UserId
  LEFT JOIN vp_customer_settings s ON s.vendor_id = p_vendor AND s.customer_user_id = c.UserId
  WHERE u.IsActive = 1
    AND (p_customer_user IS NULL OR c.UserId = p_customer_user)
    AND (p_search IS NULL OR p_search = ''
         OR u.FullName COLLATE utf8mb4_unicode_ci LIKE CONCAT('%', p_search, '%')
         OR c.CustomerCode COLLATE utf8mb4_unicode_ci LIKE CONCAT('%', p_search, '%')
         OR u.Mobile COLLATE utf8mb4_unicode_ci LIKE CONCAT('%', p_search, '%')
         OR s.business_name LIKE CONCAT('%', p_search, '%')
         OR p.district LIKE CONCAT('%', p_search, '%'))
  ORDER BY u.FullName;
END$$
DELIMITER ;

-- ----------------------------------------------------------------------------
-- sp_vp_ledger_pay_core
-- ----------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS `sp_vp_ledger_pay_core`;
DELIMITER $$
CREATE PROCEDURE `sp_vp_ledger_pay_core`(
  IN p_vendor BIGINT, IN p_entry BIGINT, IN p_party VARCHAR(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci, IN p_amount DECIMAL(18,2),
  IN p_mode VARCHAR(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci, IN p_ref VARCHAR(80) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci, OUT p_applied DECIMAL(18,2))
BEGIN
  DECLARE v_cat VARCHAR(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  DECLARE v_status VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  DECLARE v_total DECIMAL(18,2);
  DECLARE v_left DECIMAL(18,2);
  DECLARE v_party_name VARCHAR(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  DECLARE v_txn VARCHAR(40) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  DECLARE v_msg VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

  IF p_entry IS NOT NULL THEN
    SET v_cat = NULL;
    SELECT ledger_category, status INTO v_cat, v_status FROM vp_ledger_entries WHERE id = p_entry AND vendor_id = p_vendor;
    IF v_cat IS NULL THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = '404|Payable entry not found.';
    END IF;
    IF v_cat <> 'Purchase' OR v_status = 'Cancelled' THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = '400|The selected entry is not an open payable.';
    END IF;
  ELSEIF NULLIF(TRIM(COALESCE(p_party, '')), '') IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = '400|Provide LedgerEntryId or PartyName.';
  END IF;

  SELECT COALESCE(SUM(credit - settled_amount), 0), MIN(party_name), MIN(transaction_code)
    INTO v_total, v_party_name, v_txn
    FROM vp_ledger_entries
   WHERE vendor_id = p_vendor AND ledger_category = 'Purchase' AND status <> 'Cancelled' AND credit - settled_amount > 0
     AND ((p_entry IS NOT NULL AND id = p_entry) OR (p_entry IS NULL AND party_name = TRIM(p_party)));
  IF v_total <= 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = '409|There are no pending payables to settle.';
  END IF;
  IF p_amount > v_total THEN
    SET v_msg = CONCAT('400|Amount exceeds the pending payable of ', fn_vp_money(v_total), '.');
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = v_msg;
  END IF;

  SET v_left = p_amount;
  BEGIN
    DECLARE v_done INT DEFAULT 0;
    DECLARE v_id BIGINT;
    DECLARE v_credit DECIMAL(18,2);
    DECLARE v_settled DECIMAL(18,2);
    DECLARE v_piece DECIMAL(18,2);
    DECLARE v_new BIGINT;
    DECLARE cur CURSOR FOR
      SELECT id, credit, settled_amount FROM vp_ledger_entries
       WHERE vendor_id = p_vendor AND ledger_category = 'Purchase' AND status <> 'Cancelled' AND credit - settled_amount > 0
         AND ((p_entry IS NOT NULL AND id = p_entry) OR (p_entry IS NULL AND party_name = TRIM(p_party)))
       ORDER BY entry_date, id;
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_done = 1;
    OPEN cur;
    pay_loop: LOOP
      FETCH cur INTO v_id, v_credit, v_settled;
      IF v_done = 1 OR v_left <= 0 THEN LEAVE pay_loop; END IF;
      SET v_piece = LEAST(v_left, v_credit - v_settled);
      UPDATE vp_ledger_entries
         SET settled_amount = settled_amount + v_piece,
             status = IF(settled_amount + v_piece >= credit, 'Paid', 'Partial'), updated_at = UTC_TIMESTAMP(6)
       WHERE id = v_id;
      INSERT INTO vp_ledger_entries
        (vendor_id, transaction_code, entry_date, description, party_name, party_code, party_category, ledger_category,
         debit, credit, status, settled_amount, payment_mode, reference_no, related_entry_id)
      SELECT p_vendor, transaction_code, UTC_TIMESTAMP(6), CONCAT('Payment against ', transaction_code), party_name, party_code,
             party_category, 'Payment', v_piece, 0, 'Paid', v_piece, NULLIF(TRIM(p_mode), ''), NULLIF(TRIM(p_ref), ''), id
        FROM vp_ledger_entries WHERE id = v_id;
      SET v_new = LAST_INSERT_ID();
      UPDATE vp_ledger_entries SET voucher_code = CONCAT('VCH-', LPAD(v_new, 4, '0')) WHERE id = v_new;
      INSERT INTO tmp_posted (id) VALUES (v_new);
      SET v_left = v_left - v_piece;
    END LOOP;
    CLOSE cur;
  END;

  SET p_applied = p_amount - v_left;
  INSERT INTO vp_notifications (vendor_id, title, description, category, priority, reference_code, module_link)
  VALUES (p_vendor, 'Supplier Payment Recorded', CONCAT(fn_vp_money(p_applied), ' paid to ', v_party_name, '.'),
          'Payment', 'Medium', v_txn, '/vendor/ledger');
END$$
DELIMITER ;

-- ----------------------------------------------------------------------------
-- sp_vp_ledger_pay_supplier
-- ----------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS `sp_vp_ledger_pay_supplier`;
DELIMITER $$
CREATE PROCEDURE `sp_vp_ledger_pay_supplier`(
  IN p_vendor BIGINT, IN p_entry BIGINT, IN p_party VARCHAR(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci, IN p_amount DECIMAL(18,2),
  IN p_mode VARCHAR(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci, IN p_ref VARCHAR(80) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci)
BEGIN
  DECLARE v_applied DECIMAL(18,2);
  DECLARE EXIT HANDLER FOR SQLEXCEPTION BEGIN ROLLBACK; DROP TEMPORARY TABLE IF EXISTS tmp_posted; RESIGNAL; END;
  DROP TEMPORARY TABLE IF EXISTS tmp_posted;
  CREATE TEMPORARY TABLE tmp_posted (id BIGINT NOT NULL PRIMARY KEY);
  START TRANSACTION;
  CALL sp_vp_ledger_pay_core(p_vendor, p_entry, p_party, p_amount, p_mode, p_ref, v_applied);
  COMMIT;
  SELECT v_applied AS applied_amount, p_amount - v_applied AS unapplied_amount;
  SELECT e.*, 0 AS running_balance FROM vp_ledger_entries e JOIN tmp_posted t ON t.id = e.id ORDER BY e.id;
  DROP TEMPORARY TABLE IF EXISTS tmp_posted;
END$$
DELIMITER ;

-- ----------------------------------------------------------------------------
-- sp_vp_ledger_post_entry
-- ----------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS `sp_vp_ledger_post_entry`;
DELIMITER $$
CREATE PROCEDURE `sp_vp_ledger_post_entry`(
  IN p_vendor BIGINT, IN p_txn VARCHAR(40) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci, IN p_category VARCHAR(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci, IN p_party VARCHAR(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci, IN p_party_code VARCHAR(40) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  IN p_party_cat VARCHAR(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci, IN p_desc VARCHAR(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci, IN p_amount DECIMAL(18,2), IN p_entry_date DATETIME, IN p_exp_pay DATE)
BEGIN
  DECLARE v_party_cat VARCHAR(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  DECLARE v_id BIGINT;
  SET v_party_cat = CASE LOWER(TRIM(p_party_cat)) WHEN 'farmer' THEN 'Farmer' WHEN 'middleman' THEN 'Middleman'
                         WHEN 'customer' THEN 'Customer' WHEN 'processing plant' THEN 'Processing Plant' ELSE NULL END;
  IF v_party_cat IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = '400|PartyCategory must be Farmer, Middleman, Customer or Processing Plant.';
  END IF;

  IF LOWER(TRIM(p_category)) = 'purchase' THEN
    IF v_party_cat NOT IN ('Farmer', 'Middleman') THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = '400|Purchases must be posted against a Farmer or Middleman.';
    END IF;
    INSERT INTO vp_ledger_entries (vendor_id, transaction_code, entry_date, description, party_name, party_code, party_category,
                                   ledger_category, debit, credit, expected_payment_date, status)
    VALUES (p_vendor, TRIM(p_txn), COALESCE(p_entry_date, UTC_TIMESTAMP(6)), NULLIF(TRIM(p_desc), ''), TRIM(p_party),
            NULLIF(TRIM(p_party_code), ''), v_party_cat, 'Purchase', 0, p_amount, p_exp_pay, 'Unpaid');
  ELSEIF LOWER(TRIM(p_category)) = 'processing expense' THEN
    INSERT INTO vp_ledger_entries (vendor_id, transaction_code, entry_date, description, party_name, party_code, party_category,
                                   ledger_category, debit, credit, expected_payment_date, status, settled_amount)
    VALUES (p_vendor, TRIM(p_txn), COALESCE(p_entry_date, UTC_TIMESTAMP(6)), NULLIF(TRIM(p_desc), ''), TRIM(p_party),
            NULLIF(TRIM(p_party_code), ''), 'Processing Plant', 'Processing Expense', p_amount, 0, p_exp_pay, 'Paid', p_amount);
  ELSE
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = '400|Only ''Purchase'' and ''Processing Expense'' can be posted manually. Sales, payments and receipts are posted automatically.';
  END IF;
  SET v_id = LAST_INSERT_ID();
  UPDATE vp_ledger_entries SET voucher_code = CONCAT('VCH-', LPAD(v_id, 4, '0')) WHERE id = v_id;
  CALL sp_vp_ledger_list(p_vendor, v_id, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, 1, 0);
END$$
DELIMITER ;

-- ----------------------------------------------------------------------------
-- sp_vp_ledger_receipt_core
-- ----------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS `sp_vp_ledger_receipt_core`;
DELIMITER $$
CREATE PROCEDURE `sp_vp_ledger_receipt_core`(
  IN p_vendor BIGINT, IN p_sale BIGINT, IN p_customer BIGINT, IN p_amount DECIMAL(18,2),
  IN p_mode VARCHAR(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci, IN p_ref VARCHAR(80) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci, OUT p_applied DECIMAL(18,2))
BEGIN
  DECLARE v_cust BIGINT;
  DECLARE v_sale_otp VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  DECLARE v_sale_status VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  DECLARE v_sales_due DECIMAL(18,2);
  DECLARE v_opening DECIMAL(18,2) DEFAULT 0;
  DECLARE v_opening_paid DECIMAL(18,2) DEFAULT 0;
  DECLARE v_opening_left DECIMAL(18,2) DEFAULT 0;
  DECLARE v_left DECIMAL(18,2);
  DECLARE v_name VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  DECLARE v_first_code VARCHAR(40) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  DECLARE v_msg VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

  SET v_cust = p_customer;
  IF p_sale IS NOT NULL THEN
    SET v_sale_otp = NULL;
    SELECT otp_status, order_status, customer_user_id INTO v_sale_otp, v_sale_status, v_cust
      FROM vp_sales WHERE id = p_sale AND vendor_id = p_vendor;
    IF v_sale_otp IS NULL THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = '404|Sale not found.';
    END IF;
    IF v_sale_otp <> 'Verified' OR v_sale_status = 'Cancelled' THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = '409|Receipts can only be recorded against OTP-verified, active sales.';
    END IF;
  ELSEIF v_cust IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = '400|Provide SaleId or CustomerUserId.';
  END IF;

  SELECT COALESCE(SUM(total_amount - amount_received), 0), MIN(sale_code) INTO v_sales_due, v_first_code
    FROM vp_sales
   WHERE vendor_id = p_vendor AND customer_user_id = v_cust AND otp_status = 'Verified' AND order_status <> 'Cancelled'
     AND total_amount > amount_received AND (p_sale IS NULL OR id = p_sale);

  IF p_sale IS NULL THEN
    SELECT COALESCE(MAX(opening_due), 0) INTO v_opening FROM vp_customer_settings WHERE vendor_id = p_vendor AND customer_user_id = v_cust;
    SELECT COALESCE(SUM(credit), 0) INTO v_opening_paid FROM vp_ledger_entries
     WHERE vendor_id = p_vendor AND ledger_category = 'Receipt' AND sale_id IS NULL AND party_category = 'Customer'
       AND related_entry_id IS NULL AND party_code = CONCAT('OPENING:', v_cust) AND status <> 'Cancelled';
    SET v_opening_left = GREATEST(0, v_opening - v_opening_paid);
  END IF;

  IF v_sales_due + v_opening_left <= 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = '409|There are no outstanding dues for this customer.';
  END IF;
  IF p_amount > v_sales_due + v_opening_left THEN
    SET v_msg = CONCAT('400|Amount exceeds the outstanding balance of ', fn_vp_money(v_sales_due + v_opening_left), '.');
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = v_msg;
  END IF;

  SELECT FullName INTO v_name FROM Users WHERE Id = v_cust;
  SET v_left = p_amount;

  BEGIN
    DECLARE v_done INT DEFAULT 0;
    DECLARE v_sid BIGINT;
    DECLARE v_total DECIMAL(18,2);
    DECLARE v_recv DECIMAL(18,2);
    DECLARE v_piece DECIMAL(18,2);
    DECLARE v_sale_entry BIGINT;
    DECLARE v_new BIGINT;
    DECLARE cur CURSOR FOR
      SELECT id, total_amount, amount_received FROM vp_sales
       WHERE vendor_id = p_vendor AND customer_user_id = v_cust AND otp_status = 'Verified' AND order_status <> 'Cancelled'
         AND total_amount > amount_received AND (p_sale IS NULL OR id = p_sale)
       ORDER BY sale_date, id;
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_done = 1;
    OPEN cur;
    rec_loop: LOOP
      FETCH cur INTO v_sid, v_total, v_recv;
      IF v_done = 1 OR v_left <= 0 THEN LEAVE rec_loop; END IF;
      SET v_piece = LEAST(v_left, v_total - v_recv);
      UPDATE vp_sales
         SET amount_received = amount_received + v_piece,
             payment_status = IF(amount_received + v_piece >= total_amount, 'Paid', IF(amount_received + v_piece > 0, 'Partial', 'Unpaid')),
             updated_at = UTC_TIMESTAMP(6)
       WHERE id = v_sid;
      SET v_sale_entry = NULL;
      SELECT id INTO v_sale_entry FROM vp_ledger_entries
       WHERE sale_id = v_sid AND ledger_category = 'Sale' AND status <> 'Cancelled' ORDER BY id LIMIT 1;
      IF v_sale_entry IS NOT NULL THEN
        UPDATE vp_ledger_entries
           SET settled_amount = v_recv + v_piece, status = IF(v_recv + v_piece >= debit, 'Paid', 'Partial'), updated_at = UTC_TIMESTAMP(6)
         WHERE id = v_sale_entry;
      END IF;
      INSERT INTO vp_ledger_entries
        (vendor_id, transaction_code, entry_date, description, party_name, party_code, party_category, ledger_category,
         debit, credit, status, settled_amount, payment_mode, reference_no, sale_id, related_entry_id)
      SELECT p_vendor, sale_code, UTC_TIMESTAMP(6), CONCAT('Receipt against ', sale_code), customer_name, customer_code,
             'Customer', 'Receipt', 0, v_piece, 'Paid', v_piece, NULLIF(TRIM(p_mode), ''), NULLIF(TRIM(p_ref), ''), id, v_sale_entry
        FROM vp_sales WHERE id = v_sid;
      SET v_new = LAST_INSERT_ID();
      UPDATE vp_ledger_entries SET voucher_code = CONCAT('VCH-', LPAD(v_new, 4, '0')) WHERE id = v_new;
      INSERT INTO tmp_posted (id) VALUES (v_new);
      SET v_left = v_left - v_piece;
    END LOOP;
    CLOSE cur;
  END;

  IF v_left > 0 AND v_opening_left > 0 THEN
    BEGIN
      DECLARE v_piece2 DECIMAL(18,2);
      DECLARE v_new2 BIGINT;
      SET v_piece2 = LEAST(v_left, v_opening_left);
      INSERT INTO vp_ledger_entries
        (vendor_id, transaction_code, entry_date, description, party_name, party_code, party_category, ledger_category,
         debit, credit, status, settled_amount, payment_mode, reference_no)
      VALUES (p_vendor, 'OPENING', UTC_TIMESTAMP(6), 'Receipt against opening dues', v_name, CONCAT('OPENING:', v_cust),
              'Customer', 'Receipt', 0, v_piece2, 'Paid', v_piece2, NULLIF(TRIM(p_mode), ''), NULLIF(TRIM(p_ref), ''));
      SET v_new2 = LAST_INSERT_ID();
      UPDATE vp_ledger_entries SET voucher_code = CONCAT('VCH-', LPAD(v_new2, 4, '0')) WHERE id = v_new2;
      INSERT INTO tmp_posted (id) VALUES (v_new2);
      SET v_left = v_left - v_piece2;
    END;
  END IF;

  SET p_applied = p_amount - v_left;
  INSERT INTO vp_notifications (vendor_id, title, description, category, priority, reference_code, module_link)
  VALUES (p_vendor, 'Customer Payment Received', CONCAT(fn_vp_money(p_applied), ' received from ', v_name, '.'),
          'Payment', 'Medium', v_first_code, '/vendor/ledger');
END$$
DELIMITER ;

-- ----------------------------------------------------------------------------
-- sp_vp_ledger_record_receipt
-- ----------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS `sp_vp_ledger_record_receipt`;
DELIMITER $$
CREATE PROCEDURE `sp_vp_ledger_record_receipt`(
  IN p_vendor BIGINT, IN p_sale BIGINT, IN p_customer BIGINT, IN p_amount DECIMAL(18,2),
  IN p_mode VARCHAR(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci, IN p_ref VARCHAR(80) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci)
BEGIN
  DECLARE v_applied DECIMAL(18,2);
  DECLARE EXIT HANDLER FOR SQLEXCEPTION BEGIN ROLLBACK; DROP TEMPORARY TABLE IF EXISTS tmp_posted; RESIGNAL; END;
  DROP TEMPORARY TABLE IF EXISTS tmp_posted;
  CREATE TEMPORARY TABLE tmp_posted (id BIGINT NOT NULL PRIMARY KEY);
  START TRANSACTION;
  CALL sp_vp_ledger_receipt_core(p_vendor, p_sale, p_customer, p_amount, p_mode, p_ref, v_applied);
  COMMIT;
  SELECT v_applied AS applied_amount, p_amount - v_applied AS unapplied_amount;
  SELECT e.*, 0 AS running_balance FROM vp_ledger_entries e JOIN tmp_posted t ON t.id = e.id ORDER BY e.id;
  DROP TEMPORARY TABLE IF EXISTS tmp_posted;
END$$
DELIMITER ;

-- ----------------------------------------------------------------------------
-- sp_vp_ledger_settle
-- ----------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS `sp_vp_ledger_settle`;
DELIMITER $$
CREATE PROCEDURE `sp_vp_ledger_settle`(
  IN p_vendor BIGINT, IN p_id BIGINT, IN p_amount DECIMAL(18,2), IN p_mode VARCHAR(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci, IN p_ref VARCHAR(80) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci)
BEGIN
  DECLARE v_cat VARCHAR(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL;
  DECLARE v_status VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  DECLARE v_pending DECIMAL(18,2);
  DECLARE v_sale BIGINT;
  DECLARE v_amount DECIMAL(18,2);
  SELECT ledger_category, status, sale_id,
         CASE ledger_category WHEN 'Purchase' THEN credit - settled_amount WHEN 'Sale' THEN debit - settled_amount ELSE 0 END
    INTO v_cat, v_status, v_sale, v_pending
    FROM vp_ledger_entries WHERE id = p_id AND vendor_id = p_vendor;
  IF v_cat IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = '404|Ledger voucher not found.';
  END IF;
  IF v_status = 'Cancelled' OR v_pending <= 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = '409|This entry has nothing pending to settle.';
  END IF;
  SET v_amount = COALESCE(p_amount, v_pending);
  IF v_cat = 'Purchase' THEN
    CALL sp_vp_ledger_pay_supplier(p_vendor, p_id, NULL, v_amount, p_mode, p_ref);
  ELSEIF v_cat = 'Sale' AND v_sale IS NOT NULL THEN
    CALL sp_vp_ledger_record_receipt(p_vendor, v_sale, NULL, v_amount, p_mode, p_ref);
  ELSE
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = '400|Only purchase payables and sale receivables can be settled.';
  END IF;
END$$
DELIMITER ;

-- ----------------------------------------------------------------------------
-- sp_vp_ledger_summary
-- ----------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS `sp_vp_ledger_summary`;
DELIMITER $$
CREATE PROCEDURE `sp_vp_ledger_summary`(IN p_vendor BIGINT)
BEGIN
  DECLARE v_purchases DECIMAL(18,2);
  DECLARE v_payables DECIMAL(18,2);
  DECLARE v_sales DECIMAL(18,2);
  DECLARE v_expenses DECIMAL(18,2);
  DECLARE v_received DECIMAL(18,2);
  DECLARE v_vouchers INT;
  DECLARE v_opening DECIMAL(18,2);
  DECLARE v_cogs DECIMAL(18,2);

  SELECT COALESCE(SUM(CASE WHEN ledger_category = 'Purchase' THEN credit END), 0),
         COALESCE(SUM(CASE WHEN ledger_category = 'Purchase' THEN credit - settled_amount END), 0),
         COALESCE(SUM(CASE WHEN ledger_category = 'Sale' THEN debit END), 0),
         COALESCE(SUM(CASE WHEN ledger_category = 'Processing Expense' THEN debit END), 0),
         COALESCE(SUM(CASE WHEN ledger_category = 'Receipt' THEN credit END), 0),
         COUNT(*)
    INTO v_purchases, v_payables, v_sales, v_expenses, v_received, v_vouchers
    FROM vp_ledger_entries WHERE vendor_id = p_vendor AND status <> 'Cancelled';

  SELECT COALESCE(SUM(opening_due), 0) INTO v_opening FROM vp_customer_settings WHERE vendor_id = p_vendor AND is_active = 1;

  SELECT COALESCE(SUM(i.quantity * i.cost_per_unit), 0) INTO v_cogs
    FROM vp_sale_items i JOIN vp_sales s ON s.id = i.sale_id
   WHERE s.vendor_id = p_vendor AND s.otp_status = 'Verified' AND s.order_status <> 'Cancelled';

  SELECT v_purchases AS total_purchases, v_sales AS total_sales, v_expenses AS processing_expenses,
         v_payables AS total_payables, v_sales + v_opening AS total_receivables, v_received AS amount_received,
         (v_sales + v_opening) - v_received AS outstanding_amount, v_sales - v_cogs - v_expenses AS estimated_profit,
         v_vouchers AS voucher_count;
END$$
DELIMITER ;

-- ----------------------------------------------------------------------------
-- sp_vp_order_cancel
-- ----------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS `sp_vp_order_cancel`;
DELIMITER $$
CREATE PROCEDURE `sp_vp_order_cancel`(IN p_vendor BIGINT, IN p_id BIGINT, IN p_reason VARCHAR(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci)
BEGIN
  DECLARE v_cur VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL;
  DECLARE v_received DECIMAL(18,2);
  DECLARE v_order_code VARCHAR(40) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  DECLARE v_cust VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  DECLARE v_msg VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  DECLARE EXIT HANDLER FOR SQLEXCEPTION BEGIN ROLLBACK; RESIGNAL; END;

  START TRANSACTION;
  SELECT order_status, amount_received, order_code, customer_name INTO v_cur, v_received, v_order_code, v_cust
    FROM vp_sales WHERE id = p_id AND vendor_id = p_vendor AND order_status <> 'Draft' FOR UPDATE;
  IF v_cur IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = '404|Order not found.';
  END IF;
  IF v_cur NOT IN ('New', 'Confirmed', 'Processing', 'Packed') THEN
    SET v_msg = CONCAT('409|A ', v_cur, ' order cannot be cancelled.');
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = v_msg;
  END IF;
  IF v_received > 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = '409|Payments are already recorded against this order and it cannot be cancelled.';
  END IF;

  UPDATE vp_finished_product_batches b JOIN vp_sale_items i ON i.finished_batch_id = b.id
     SET b.quantity_available = b.quantity_available + i.quantity, b.updated_at = UTC_TIMESTAMP(6)
   WHERE i.sale_id = p_id AND b.vendor_id = p_vendor;
  UPDATE vp_ledger_entries SET status = 'Cancelled', updated_at = UTC_TIMESTAMP(6) WHERE sale_id = p_id;
  UPDATE vp_otp_confirmations SET otp_status = 'Failed', updated_at = UTC_TIMESTAMP(6)
   WHERE sale_id = p_id AND otp_status = 'Sent';
  UPDATE vp_sales SET otp_status = IF(otp_status = 'Sent', 'Failed', otp_status), order_status = 'Cancelled',
         cancel_reason = NULLIF(TRIM(p_reason), ''), updated_at = UTC_TIMESTAMP(6)
   WHERE id = p_id;
  INSERT INTO vp_notifications (vendor_id, title, description, category, priority, reference_code, module_link)
  VALUES (p_vendor, CONCAT('Order Cancelled - ', v_order_code),
          CONCAT('Order ', v_order_code, ' for ', v_cust, ' was cancelled; stock restored.'),
          'Order Update', 'Medium', v_order_code, '/vendor/orders');
  COMMIT;
  CALL sp_vp_sale_get(p_vendor, p_id, 'orders');
END$$
DELIMITER ;

-- ----------------------------------------------------------------------------
-- sp_vp_order_update_status
-- ----------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS `sp_vp_order_update_status`;
DELIMITER $$
CREATE PROCEDURE `sp_vp_order_update_status`(IN p_vendor BIGINT, IN p_id BIGINT, IN p_status VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci)
BEGIN
  DECLARE v_cur VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL;
  DECLARE v_cur_idx INT;
  DECLARE v_target_idx INT;
  DECLARE v_order_code VARCHAR(40) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  DECLARE v_cust VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  DECLARE v_target VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  DECLARE v_msg VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  DECLARE EXIT HANDLER FOR SQLEXCEPTION BEGIN ROLLBACK; RESIGNAL; END;

  START TRANSACTION;
  SELECT order_status, order_code, customer_name INTO v_cur, v_order_code, v_cust
    FROM vp_sales WHERE id = p_id AND vendor_id = p_vendor AND order_status <> 'Draft' FOR UPDATE;
  IF v_cur IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = '404|Order not found.';
  END IF;

  SET v_target_idx = FIELD(LOWER(TRIM(p_status)), 'new', 'confirmed', 'processing', 'packed', 'shipped', 'delivered', 'completed', 'cancelled');
  IF v_target_idx = 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = '400|Unknown order status.';
  END IF;
  IF v_target_idx = 8 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = '400|Use the cancel endpoint to cancel an order.';
  END IF;
  IF v_cur = 'Cancelled' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = '409|Cancelled orders cannot be updated.';
  END IF;
  IF v_cur = 'New' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = '409|Customer OTP confirmation is pending; verify the OTP before progressing the order.';
  END IF;
  SET v_cur_idx = FIELD(v_cur, 'New', 'Confirmed', 'Processing', 'Packed', 'Shipped', 'Delivered', 'Completed');
  IF v_cur_idx >= 7 THEN
    SET v_msg = CONCAT('409|Order is already ', v_cur, '.');
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = v_msg;
  END IF;
  IF v_target_idx <> v_cur_idx + 1 THEN
    SET v_msg = CONCAT('409|Invalid transition. Next allowed status is ',
                       ELT(v_cur_idx + 1, 'New', 'Confirmed', 'Processing', 'Packed', 'Shipped', 'Delivered', 'Completed'), '.');
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = v_msg;
  END IF;

  SET v_target = ELT(v_target_idx, 'New', 'Confirmed', 'Processing', 'Packed', 'Shipped', 'Delivered', 'Completed');
  UPDATE vp_sales SET order_status = v_target, updated_at = UTC_TIMESTAMP(6),
         delivered_at = IF(v_target = 'Delivered', UTC_TIMESTAMP(6), delivered_at)
   WHERE id = p_id;
  INSERT INTO vp_notifications (vendor_id, title, description, category, priority, reference_code, module_link)
  VALUES (p_vendor, CONCAT('Order ', v_target, ' - ', v_order_code),
          CONCAT('Order ', v_order_code, ' for ', v_cust, ' moved to ', v_target, '.'),
          'Order Update', IF(v_target IN ('Delivered', 'Completed'), 'Medium', 'Low'), v_order_code, '/vendor/orders');
  COMMIT;
  CALL sp_vp_sale_get(p_vendor, p_id, 'orders');
END$$
DELIMITER ;

-- ----------------------------------------------------------------------------
-- sp_vp_orders_summary
-- ----------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS `sp_vp_orders_summary`;
DELIMITER $$
CREATE PROCEDURE `sp_vp_orders_summary`(IN p_vendor BIGINT)
BEGIN
  SELECT order_status AS status, COUNT(*) AS cnt FROM vp_sales
   WHERE vendor_id = p_vendor AND order_status <> 'Draft' GROUP BY order_status;
END$$
DELIMITER ;

-- ----------------------------------------------------------------------------
-- sp_vp_otp_create
-- ----------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS `sp_vp_otp_create`;
DELIMITER $$
CREATE PROCEDURE `sp_vp_otp_create`(
  IN p_vendor BIGINT, IN p_txn VARCHAR(40) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci, IN p_category VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci, IN p_party VARCHAR(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci, IN p_party_code VARCHAR(40) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  IN p_mobile VARCHAR(15) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci, IN p_type VARCHAR(40) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci, IN p_product VARCHAR(250) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci, IN p_qty DECIMAL(18,3), IN p_unit VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  IN p_amount DECIMAL(18,2), IN p_hash VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci, IN p_minutes INT)
BEGIN
  DECLARE v_cat VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  DECLARE v_id BIGINT;
  SET v_cat = CASE LOWER(TRIM(p_category)) WHEN 'farmer' THEN 'Farmer' WHEN 'middleman' THEN 'Middleman'
                   WHEN 'customer' THEN 'Customer' ELSE NULL END;
  IF v_cat IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = '400|PartyCategory must be Farmer, Middleman or Customer.';
  END IF;
  INSERT INTO vp_otp_confirmations
    (vendor_id, transaction_code, party_category, party_name, party_code, mobile, transaction_type, product,
     quantity, unit, amount, otp_hash, otp_status, sent_at, expires_at)
  VALUES (p_vendor, TRIM(p_txn), v_cat, TRIM(p_party), NULLIF(TRIM(p_party_code), ''), NULLIF(TRIM(p_mobile), ''),
          TRIM(p_type), NULLIF(TRIM(p_product), ''), p_qty, NULLIF(TRIM(p_unit), ''), p_amount, p_hash, 'Sent',
          UTC_TIMESTAMP(6), DATE_ADD(UTC_TIMESTAMP(6), INTERVAL p_minutes MINUTE));
  SET v_id = LAST_INSERT_ID();
  UPDATE vp_otp_confirmations SET confirmation_code = CONCAT('OTP-', LPAD(v_id, 4, '0')) WHERE id = v_id;
  INSERT INTO vp_notifications (vendor_id, title, description, category, priority, reference_code, module_link)
  VALUES (p_vendor, CONCAT('OTP Sent - ', TRIM(p_txn)), CONCAT('OTP sent to ', TRIM(p_party), ' for ', TRIM(p_type), '.'),
          'OTP Confirmation', 'Medium', TRIM(p_txn), '/vendor/confirmations');
  SELECT * FROM vp_otp_confirmations WHERE id = v_id;
END$$
DELIMITER ;

-- ----------------------------------------------------------------------------
-- sp_vp_otp_resend
-- ----------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS `sp_vp_otp_resend`;
DELIMITER $$
CREATE PROCEDURE `sp_vp_otp_resend`(IN p_vendor BIGINT, IN p_id BIGINT, IN p_hash VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci, IN p_minutes INT)
BEGIN
  DECLARE v_status VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL;
  DECLARE v_sale BIGINT;
  DECLARE v_sale_status VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  SELECT otp_status, sale_id INTO v_status, v_sale FROM vp_otp_confirmations WHERE id = p_id AND vendor_id = p_vendor;
  IF v_status IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = '404|OTP confirmation not found.';
  END IF;
  IF v_status = 'Verified' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = '409|This transaction is already verified.';
  END IF;
  IF v_sale IS NOT NULL THEN
    SET v_sale_status = NULL;
    SELECT order_status INTO v_sale_status FROM vp_sales WHERE id = v_sale AND vendor_id = p_vendor;
    IF v_sale_status = 'Cancelled' THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = '409|The related order is cancelled.';
    END IF;
  END IF;
  UPDATE vp_otp_confirmations
     SET otp_hash = p_hash, attempts = 0, otp_status = 'Sent', sent_at = UTC_TIMESTAMP(6),
         expires_at = DATE_ADD(UTC_TIMESTAMP(6), INTERVAL p_minutes MINUTE), updated_at = UTC_TIMESTAMP(6)
   WHERE id = p_id;
  IF v_sale IS NOT NULL THEN
    UPDATE vp_sales SET otp_status = 'Sent', updated_at = UTC_TIMESTAMP(6) WHERE id = v_sale AND vendor_id = p_vendor;
  END IF;
  SELECT * FROM vp_otp_confirmations WHERE id = p_id;
END$$
DELIMITER ;

-- ----------------------------------------------------------------------------
-- sp_vp_sale_delete_draft
-- ----------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS `sp_vp_sale_delete_draft`;
DELIMITER $$
CREATE PROCEDURE `sp_vp_sale_delete_draft`(IN p_vendor BIGINT, IN p_id BIGINT)
BEGIN
  DECLARE v_status VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL;
  SELECT order_status INTO v_status FROM vp_sales WHERE id = p_id AND vendor_id = p_vendor;
  IF v_status IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = '404|Sale not found.';
  END IF;
  IF v_status <> 'Draft' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = '409|Only draft sales can be deleted.';
  END IF;
  DELETE FROM vp_sales WHERE id = p_id AND vendor_id = p_vendor;
  SELECT 1 AS deleted;
END$$
DELIMITER ;

-- ----------------------------------------------------------------------------
-- sp_vp_sale_save
-- ----------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS `sp_vp_sale_save`;
DELIMITER $$
CREATE PROCEDURE `sp_vp_sale_save`(
  IN p_vendor BIGINT, IN p_sale BIGINT, IN p_customer_user BIGINT, IN p_address VARCHAR(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  IN p_discount DECIMAL(18,2), IN p_tax DECIMAL(18,2), IN p_delivery DECIMAL(18,2), IN p_other DECIMAL(18,2),
  IN p_exp_delivery DATE, IN p_exp_payment DATE, IN p_terms VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci, IN p_notes VARCHAR(1000) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  IN p_items LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci, IN p_submit TINYINT, IN p_otp_hash VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci, IN p_minutes INT)
BEGIN
  DECLARE v_status VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  DECLARE v_cust_code VARCHAR(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  DECLARE v_cust_name VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  DECLARE v_mobile VARCHAR(15) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  DECLARE v_email VARCHAR(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  DECLARE v_district VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  DECLARE v_state VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  DECLARE v_addr VARCHAR(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  DECLARE v_business VARCHAR(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  DECLARE v_gstin VARCHAR(15) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  DECLARE v_dup INT;
  DECLARE v_missing BIGINT;
  DECLARE v_subtotal DECIMAL(18,2);
  DECLARE v_total DECIMAL(18,2);
  DECLARE v_sale BIGINT;
  DECLARE v_conf BIGINT DEFAULT NULL;
  DECLARE v_msg VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  DECLARE EXIT HANDLER FOR SQLEXCEPTION BEGIN ROLLBACK; RESIGNAL; END;

  START TRANSACTION;

  IF p_sale IS NOT NULL THEN
    SET v_status = NULL;
    SELECT order_status INTO v_status FROM vp_sales WHERE id = p_sale AND vendor_id = p_vendor FOR UPDATE;
    IF v_status IS NULL THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = '404|Sale not found.';
    END IF;
    IF v_status <> 'Draft' THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = '409|Only draft sales can be edited.';
    END IF;
  END IF;

  SET v_cust_code = NULL;
  SELECT c.CustomerCode, u.FullName, u.Mobile, u.Email, p.district, p.state, COALESCE(p.address, ''),
         s.business_name, s.gstin
    INTO v_cust_code, v_cust_name, v_mobile, v_email, v_district, v_state, v_addr, v_business, v_gstin
    FROM Customers c
    JOIN Users u ON u.Id = c.UserId
    LEFT JOIN customer_profiles p ON p.user_id = c.UserId
    LEFT JOIN vp_customer_settings s ON s.vendor_id = p_vendor AND s.customer_user_id = c.UserId
   WHERE c.UserId = p_customer_user AND u.IsActive = 1 LIMIT 1;
  IF v_cust_code IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = '404|Customer not found.';
  END IF;

  IF p_exp_delivery IS NOT NULL AND p_exp_payment IS NOT NULL AND p_exp_payment < p_exp_delivery THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = '400|Expected payment date cannot be before the expected delivery date.';
  END IF;

  SELECT COUNT(*) - COUNT(DISTINCT batch) INTO v_dup
    FROM JSON_TABLE(p_items, '$[*]' COLUMNS (batch BIGINT PATH '$.finishedBatchId')) t;
  IF v_dup > 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = '400|The same batch is added more than once; combine the quantities.';
  END IF;

  SET v_missing = NULL;
  SELECT t.batch INTO v_missing
    FROM JSON_TABLE(p_items, '$[*]' COLUMNS (batch BIGINT PATH '$.finishedBatchId')) t
    LEFT JOIN vp_finished_product_batches b ON b.id = t.batch AND b.vendor_id = p_vendor
   WHERE b.id IS NULL LIMIT 1;
  IF v_missing IS NOT NULL THEN
    SET v_msg = CONCAT('404|Finished batch ', v_missing, ' not found.');
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = v_msg;
  END IF;

  IF p_submit = 1 AND JSON_LENGTH(p_items) = 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = '400|Add at least one product line.';
  END IF;

  SELECT COALESCE(SUM(ROUND(t.qty * t.price, 2)), 0) INTO v_subtotal
    FROM JSON_TABLE(p_items, '$[*]' COLUMNS (qty DECIMAL(18,3) PATH '$.quantity', price DECIMAL(18,2) PATH '$.pricePerUnit')) t;
  SET v_total = v_subtotal - p_discount + p_tax + p_delivery + p_other;
  IF v_total < 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = '400|Discount cannot exceed the order value.';
  END IF;

  IF NULLIF(TRIM(COALESCE(p_address, '')), '') IS NOT NULL THEN SET v_addr = TRIM(p_address); END IF;

  IF p_sale IS NULL THEN
    INSERT INTO vp_sales
      (vendor_id, sale_code, order_code, customer_user_id, customer_code, customer_name, business_name, customer_mobile,
       customer_email, customer_gstin, customer_district, customer_state, delivery_address, items_subtotal,
       discount_amount, tax_amount, delivery_charges, other_charges, total_amount, sale_date,
       expected_delivery_date, expected_payment_date, payment_terms, notes, otp_status, payment_status, order_status)
    VALUES
      (p_vendor, CONCAT('TMP-', REPLACE(UUID(), '-', '')), CONCAT('TMP-', REPLACE(UUID(), '-', '')),
       p_customer_user, v_cust_code, v_cust_name, v_business, v_mobile, v_email, v_gstin, v_district, v_state, v_addr,
       v_subtotal, p_discount, p_tax, p_delivery, p_other, v_total, UTC_DATE(), p_exp_delivery, p_exp_payment,
       NULLIF(TRIM(p_terms), ''), NULLIF(TRIM(p_notes), ''), 'NotSent', 'Unpaid', 'Draft');
    SET v_sale = LAST_INSERT_ID();
    UPDATE vp_sales SET sale_code = CONCAT('SALE-', LPAD(v_sale, 4, '0')), order_code = CONCAT('ORD-', LPAD(v_sale, 4, '0'))
     WHERE id = v_sale;
  ELSE
    SET v_sale = p_sale;
    UPDATE vp_sales
       SET customer_user_id = p_customer_user, customer_code = v_cust_code, customer_name = v_cust_name,
           business_name = v_business, customer_mobile = v_mobile, customer_email = v_email, customer_gstin = v_gstin,
           customer_district = v_district, customer_state = v_state, delivery_address = v_addr,
           items_subtotal = v_subtotal, discount_amount = p_discount, tax_amount = p_tax, delivery_charges = p_delivery,
           other_charges = p_other, total_amount = v_total, expected_delivery_date = p_exp_delivery,
           expected_payment_date = p_exp_payment, payment_terms = NULLIF(TRIM(p_terms), ''), notes = NULLIF(TRIM(p_notes), ''),
           updated_at = UTC_TIMESTAMP(6)
     WHERE id = v_sale;
    DELETE FROM vp_sale_items WHERE sale_id = v_sale;
  END IF;

  INSERT INTO vp_sale_items
    (sale_id, finished_batch_id, product_name, batch_code, processing_batch_ref, quantity, unit, price_per_unit, cost_per_unit, line_total)
  SELECT v_sale, b.id, b.product_name, b.batch_code, b.processing_batch_ref, t.qty, b.unit, t.price, b.cost_per_unit, ROUND(t.qty * t.price, 2)
    FROM JSON_TABLE(p_items, '$[*]' COLUMNS (batch BIGINT PATH '$.finishedBatchId',
                                             qty DECIMAL(18,3) PATH '$.quantity',
                                             price DECIMAL(18,2) PATH '$.pricePerUnit')) t
    JOIN vp_finished_product_batches b ON b.id = t.batch AND b.vendor_id = p_vendor;

  IF p_submit = 1 THEN
    CALL sp_vp_sale_submit_core(p_vendor, v_sale, p_otp_hash, p_minutes, v_conf);
  END IF;

  COMMIT;
  SELECT v_sale AS sale_id, v_conf AS confirmation_id;
END$$
DELIMITER ;

-- ----------------------------------------------------------------------------
-- sp_vp_sale_submit
-- ----------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS `sp_vp_sale_submit`;
DELIMITER $$
CREATE PROCEDURE `sp_vp_sale_submit`(IN p_vendor BIGINT, IN p_sale BIGINT, IN p_otp_hash VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci, IN p_minutes INT)
BEGIN
  DECLARE v_conf BIGINT;
  DECLARE EXIT HANDLER FOR SQLEXCEPTION BEGIN ROLLBACK; RESIGNAL; END;
  START TRANSACTION;
  CALL sp_vp_sale_submit_core(p_vendor, p_sale, p_otp_hash, p_minutes, v_conf);
  COMMIT;
  SELECT p_sale AS sale_id, v_conf AS confirmation_id;
END$$
DELIMITER ;

-- ----------------------------------------------------------------------------
-- sp_vp_sale_submit_core
-- ----------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS `sp_vp_sale_submit_core`;
DELIMITER $$
CREATE PROCEDURE `sp_vp_sale_submit_core`(
  IN p_vendor BIGINT, IN p_sale BIGINT, IN p_otp_hash VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci, IN p_minutes INT, OUT p_conf BIGINT)
BEGIN
  DECLARE v_status VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  DECLARE v_cust BIGINT;
  DECLARE v_total DECIMAL(18,2);
  DECLARE v_sale_code VARCHAR(40) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  DECLARE v_order_code VARCHAR(40) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  DECLARE v_cust_name VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  DECLARE v_cust_code VARCHAR(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  DECLARE v_mobile VARCHAR(15) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  DECLARE v_limit DECIMAL(18,2);
  DECLARE v_opening DECIMAL(18,2);
  DECLARE v_open DECIMAL(18,2);
  DECLARE v_items INT;
  DECLARE v_qty DECIMAL(18,3);
  DECLARE v_unit VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  DECLARE v_first VARCHAR(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  DECLARE v_msg VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

  SET v_status = NULL;
  SELECT order_status, customer_user_id, total_amount, sale_code, order_code, customer_name, customer_code, customer_mobile
    INTO v_status, v_cust, v_total, v_sale_code, v_order_code, v_cust_name, v_cust_code, v_mobile
    FROM vp_sales WHERE id = p_sale AND vendor_id = p_vendor FOR UPDATE;
  IF v_status IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = '404|Sale not found.';
  END IF;
  IF v_status <> 'Draft' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = '409|Only draft sales can be submitted.';
  END IF;

  SELECT COUNT(*), COALESCE(SUM(quantity), 0) INTO v_items, v_qty FROM vp_sale_items WHERE sale_id = p_sale;
  IF v_items = 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = '400|Add at least one product line before submitting.';
  END IF;
  SET v_limit = NULL;
  SELECT credit_limit, opening_due INTO v_limit, v_opening
    FROM vp_customer_settings WHERE vendor_id = p_vendor AND customer_user_id = v_cust;
  IF v_limit IS NOT NULL AND v_limit > 0 THEN
    SELECT COALESCE(SUM(total_amount - amount_received), 0) INTO v_open FROM vp_sales
     WHERE vendor_id = p_vendor AND customer_user_id = v_cust AND id <> p_sale
       AND order_status NOT IN ('Draft', 'Cancelled');
    IF v_open + v_opening + v_total > v_limit THEN
      SET v_msg = CONCAT('409|Credit limit of ', fn_vp_money(v_limit), ' would be exceeded for this customer.');
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = v_msg;
    END IF;
  END IF;
  BEGIN
    DECLARE v_done INT DEFAULT 0;
    DECLARE v_batch BIGINT;
    DECLARE v_line_qty DECIMAL(18,3);
    DECLARE v_bcode VARCHAR(40) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    DECLARE v_pname VARCHAR(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    DECLARE cur CURSOR FOR
      SELECT finished_batch_id, quantity, batch_code, product_name FROM vp_sale_items WHERE sale_id = p_sale ORDER BY id;
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_done = 1;
    OPEN cur;
    line_loop: LOOP
      FETCH cur INTO v_batch, v_line_qty, v_bcode, v_pname;
      IF v_done = 1 THEN LEAVE line_loop; END IF;
      UPDATE vp_finished_product_batches
         SET quantity_available = quantity_available - v_line_qty, updated_at = UTC_TIMESTAMP(6)
       WHERE id = v_batch AND vendor_id = p_vendor AND status = 'Active' AND quantity_available >= v_line_qty;
      IF ROW_COUNT() = 0 THEN
        CLOSE cur;
        SET v_msg = CONCAT('409|Insufficient stock in batch ', v_bcode, ' for ', v_pname, '.');
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = v_msg;
      END IF;
    END LOOP;
    CLOSE cur;
  END;

  UPDATE vp_sales SET order_status = 'New', otp_status = 'Sent', sale_date = UTC_DATE(), updated_at = UTC_TIMESTAMP(6)
   WHERE id = p_sale;

  SELECT product_name, unit INTO v_first, v_unit FROM vp_sale_items WHERE sale_id = p_sale ORDER BY id LIMIT 1;
  INSERT INTO vp_otp_confirmations
    (vendor_id, transaction_code, party_category, party_name, party_code, mobile, transaction_type, product,
     quantity, unit, amount, otp_hash, otp_status, sale_id, sent_at, expires_at)
  VALUES (p_vendor, v_sale_code, 'Customer', v_cust_name, v_cust_code, v_mobile, 'Customer Sale',
          CONCAT(v_first, IF(v_items > 1, CONCAT(' +', v_items - 1, ' more'), '')),
          v_qty, v_unit, v_total, p_otp_hash, 'Sent', p_sale, UTC_TIMESTAMP(6),
          DATE_ADD(UTC_TIMESTAMP(6), INTERVAL p_minutes MINUTE));
  SET p_conf = LAST_INSERT_ID();
  UPDATE vp_otp_confirmations SET confirmation_code = CONCAT('OTP-', LPAD(p_conf, 4, '0')) WHERE id = p_conf;

  INSERT INTO vp_notifications (vendor_id, title, description, category, priority, reference_code, module_link)
  VALUES (p_vendor, CONCAT('New Customer Order Received - ', v_order_code),
          CONCAT(v_cust_name, ' order of ', fn_vp_money(v_total), ' created. OTP sent for confirmation.'),
          'Customer Order Received', 'High', v_order_code, '/vendor/orders');
END$$
DELIMITER ;

-- ----------------------------------------------------------------------------
-- sp_vp_vendor_resolve
-- ----------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS `sp_vp_vendor_resolve`;
DELIMITER $$
CREATE PROCEDURE `sp_vp_vendor_resolve`(IN p_user BIGINT)
BEGIN
  SELECT Id AS vendor_id FROM Vendors WHERE UserId = p_user LIMIT 1;
END$$
DELIMITER ;

