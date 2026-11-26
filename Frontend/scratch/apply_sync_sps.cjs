const mysql = require('C:/Users/ADMIN/Documents/ARPPB/node_modules/mysql2/promise');

async function applySps() {
  const conn = await mysql.createConnection({
    host: 'srv1061.hstgr.io',
    user: 'u819242402_arppbuser',
    password: 'Pirnav@2026',
    database: 'u819242402_arppb',
    multipleStatements: true
  });

  console.log('Connected to MariaDB.');

  // 1. One-time sync of vendor_customer_orders from vp_sales
  console.log('Syncing existing vendor_customer_orders with vp_sales...');
  await conn.query(`
    UPDATE vendor_customer_orders o
      JOIN vp_sales s ON (s.order_code = o.OrderCode OR s.sale_code = o.OrderCode)
       SET o.DueAmount = GREATEST(0, s.total_amount - s.amount_received),
           o.OrderStatus = IF(s.amount_received >= s.total_amount AND o.OrderStatus = 'New', 'Confirmed', o.OrderStatus);
  `);
  console.log('vendor_customer_orders synced.');

  // 2. Drop and recreate sp_vp_ledger_pay_core
  console.log('Recreating sp_vp_ledger_pay_core...');
  await conn.query('DROP PROCEDURE IF EXISTS `sp_vp_ledger_pay_core`');
  await conn.query(`
    CREATE PROCEDURE \`sp_vp_ledger_pay_core\`(
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
      DECLARE v_p_code VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
      DECLARE v_p_party_cat VARCHAR(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

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

          -- Synchronize supplier purchases and payments
          SET v_p_code = NULL;
          SET v_p_party_cat = NULL;
          SELECT transaction_code, party_category INTO v_p_code, v_p_party_cat FROM vp_ledger_entries WHERE id = v_id LIMIT 1;

          IF v_p_code IS NOT NULL THEN
            UPDATE vendor_farmer_purchases
               SET DueAmount = GREATEST(0, DueAmount - v_piece),
                   PaymentStatus = IF(DueAmount - v_piece <= 0, 'Paid', IF(DueAmount - v_piece < TotalAmount, 'Partial', 'Pending'))
             WHERE PurchaseCode = v_p_code;

            UPDATE vendor_middleman_purchases
               SET DueAmount = GREATEST(0, DueAmount - v_piece),
                   PaymentStatus = IF(DueAmount - v_piece <= 0, 'Paid', IF(DueAmount - v_piece < TotalAmount, 'Partial', 'Pending'))
             WHERE PurchaseCode = v_p_code;

            IF v_p_party_cat = 'Farmer' OR v_p_code LIKE 'PUR-FAR-%' OR v_p_code LIKE 'PUR-F-%' THEN
              INSERT INTO vendor_farmer_payments
                (FarmerId, PaymentCode, VoucherNumber, Amount, PaymentMethod, PaymentDate, ReferenceNumber, Status, Notes, CreatedAt)
              SELECT f.Id, CONCAT('PAY-F-', LPAD(v_new, 4, '0')), CONCAT('VCH-', LPAD(v_new, 4, '0')), v_piece,
                     COALESCE(NULLIF(TRIM(p_mode), ''), 'Bank Transfer'), UTC_TIMESTAMP(6), NULLIF(TRIM(p_ref), ''), 'Completed',
                     CONCAT('Settlement against ', v_p_code), UTC_TIMESTAMP(6)
                FROM vendor_farmers f
               WHERE f.VendorId = p_vendor
                 AND (f.FarmerCode = (SELECT party_code FROM vp_ledger_entries WHERE id = v_id LIMIT 1)
                      OR f.FullName = (SELECT party_name FROM vp_ledger_entries WHERE id = v_id LIMIT 1))
               LIMIT 1;
            ELSEIF v_p_party_cat = 'Middleman' OR v_p_code LIKE 'PUR-MID-%' OR v_p_code LIKE 'PUR-M-%' THEN
              INSERT INTO vendor_middleman_payments
                (MiddlemanId, PaymentCode, VoucherNumber, Amount, PaymentMethod, PaymentDate, ReferenceNumber, Status, Notes, CreatedAt)
              SELECT m.Id, CONCAT('PAY-M-', LPAD(v_new, 4, '0')), CONCAT('VCH-', LPAD(v_new, 4, '0')), v_piece,
                     COALESCE(NULLIF(TRIM(p_mode), ''), 'Bank Transfer'), UTC_TIMESTAMP(6), NULLIF(TRIM(p_ref), ''), 'Completed',
                     CONCAT('Settlement against ', v_p_code), UTC_TIMESTAMP(6)
                FROM vendor_middlemen m
               WHERE m.VendorId = p_vendor
                 AND (m.MiddlemanCode = (SELECT party_code FROM vp_ledger_entries WHERE id = v_id LIMIT 1)
                      OR m.FullName = (SELECT party_name FROM vp_ledger_entries WHERE id = v_id LIMIT 1)
                      OR m.BusinessName = (SELECT party_name FROM vp_ledger_entries WHERE id = v_id LIMIT 1))
               LIMIT 1;
            END IF;
          END IF;

          SET v_left = v_left - v_piece;
        END LOOP;
        CLOSE cur;
      END;

      SET p_applied = p_amount - v_left;
      INSERT INTO vp_notifications (vendor_id, title, description, category, priority, reference_code, module_link)
      VALUES (p_vendor, 'Supplier Payment Recorded', CONCAT(fn_vp_money(p_applied), ' paid to ', v_party_name, '.'),
              'Payment', 'Medium', v_txn, '/vendor/ledger');
    END;
  `);
  console.log('sp_vp_ledger_pay_core recreated.');

  // 3. Drop and recreate sp_vp_ledger_receipt_core
  console.log('Recreating sp_vp_ledger_receipt_core...');
  await conn.query('DROP PROCEDURE IF EXISTS `sp_vp_ledger_receipt_core`');
  await conn.query(`
    CREATE PROCEDURE \`sp_vp_ledger_receipt_core\`(
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
        SELECT otp_status, order_status, customer_user_id, customer_name INTO v_sale_otp, v_sale_status, v_cust, v_name
          FROM vp_sales WHERE id = p_sale AND vendor_id = p_vendor;
        IF v_sale_otp IS NULL THEN
          SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = '404|Sale not found.';
        END IF;
        IF v_sale_status = 'Cancelled' THEN
          SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = '409|Receipts cannot be recorded against cancelled sales.';
        END IF;
      ELSEIF v_cust IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = '400|Provide SaleId or CustomerUserId.';
      END IF;

      SELECT COALESCE(SUM(total_amount - amount_received), 0), MIN(sale_code) INTO v_sales_due, v_first_code
        FROM vp_sales
       WHERE vendor_id = p_vendor
         AND (customer_user_id = v_cust OR p_sale IS NOT NULL)
         AND order_status <> 'Cancelled'
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

      IF v_name IS NULL THEN
        SELECT FullName INTO v_name FROM Users WHERE Id = v_cust;
        IF v_name IS NULL THEN
          SELECT CustomerName INTO v_name FROM vendor_customers WHERE Id = v_cust LIMIT 1;
        END IF;
        IF v_name IS NULL THEN
          SET v_name = 'Customer';
        END IF;
      END IF;

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
           WHERE vendor_id = p_vendor
             AND (customer_user_id = v_cust OR p_sale IS NOT NULL)
             AND order_status <> 'Cancelled'
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
                 otp_status = IF(otp_status = 'Sent', 'Verified', otp_status),
                 order_status = IF(order_status = 'New', 'Confirmed', order_status),
                 updated_at = UTC_TIMESTAMP(6)
           WHERE id = v_sid;

          -- Synchronize vendor_customer_orders
          UPDATE vendor_customer_orders
             SET DueAmount = GREATEST(0, DueAmount - v_piece),
                 OrderStatus = IF(DueAmount - v_piece <= 0 AND OrderStatus = 'New', 'Confirmed', OrderStatus)
           WHERE OrderCode = (SELECT order_code FROM vp_sales WHERE id = v_sid LIMIT 1)
              OR OrderCode = (SELECT sale_code FROM vp_sales WHERE id = v_sid LIMIT 1);

          -- Check or auto-create parent sale ledger entry
          SET v_sale_entry = NULL;
          SELECT id INTO v_sale_entry FROM vp_ledger_entries
           WHERE sale_id = v_sid AND ledger_category = 'Sale' AND status <> 'Cancelled' ORDER BY id LIMIT 1;

          IF v_sale_entry IS NULL THEN
            INSERT INTO vp_ledger_entries
              (vendor_id, transaction_code, entry_date, description, party_name, party_code, party_category, ledger_category,
               debit, credit, expected_payment_date, status, settled_amount, sale_id)
            SELECT p_vendor, sale_code, UTC_TIMESTAMP(6), CONCAT('Sale order ', sale_code, ' to ', customer_name),
                   customer_name, customer_code, 'Customer', 'Sale',
                   total_amount, 0, expected_payment_date, 'Unpaid', 0, id
              FROM vp_sales WHERE id = v_sid;
            SET v_sale_entry = LAST_INSERT_ID();
            UPDATE vp_ledger_entries SET voucher_code = CONCAT('VCH-', LPAD(v_sale_entry, 4, '0')) WHERE id = v_sale_entry;
          END IF;

          -- Update parent entry's settled amount and status
          UPDATE vp_ledger_entries
             SET settled_amount = v_recv + v_piece,
                 status = IF(v_recv + v_piece >= debit, 'Paid', 'Partial'),
                 updated_at = UTC_TIMESTAMP(6)
           WHERE id = v_sale_entry;

          -- Insert receipt voucher
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
    END;
  `);
  console.log('sp_vp_ledger_receipt_core recreated.');

  // 4. Update sp_Vendor_UpdatePurchaseStatus to also synchronize vp_ledger_entries
  console.log('Recreating sp_Vendor_UpdatePurchaseStatus...');
  await conn.query('DROP PROCEDURE IF EXISTS `sp_Vendor_UpdatePurchaseStatus`');
  await conn.query(`
    CREATE PROCEDURE \`sp_Vendor_UpdatePurchaseStatus\`(
        IN p_vendor_id BIGINT,
        IN p_purchase_id VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
        IN p_supplier_category VARCHAR(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
        IN p_payment_status VARCHAR(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
        IN p_due_amount DECIMAL(14,2)
    )
    BEGIN
        IF LOWER(p_supplier_category) = 'middleman' THEN
            UPDATE \`vendor_middleman_purchases\` p
            INNER JOIN \`vendor_middlemen\` m ON p.\`MiddlemanId\` = m.\`Id\`
            SET
                p.\`PaymentStatus\` = COALESCE(p_payment_status, p.\`PaymentStatus\`),
                p.\`DueAmount\` = COALESCE(p_due_amount, p.\`DueAmount\`)
            WHERE m.\`VendorId\` = p_vendor_id
              AND (p.\`PurchaseCode\` = p_purchase_id OR CAST(p.\`Id\` AS CHAR) = p_purchase_id);
        ELSE
            UPDATE \`vendor_farmer_purchases\` p
            INNER JOIN \`vendor_farmers\` f ON p.\`FarmerId\` = f.\`Id\`
            SET
                p.\`PaymentStatus\` = COALESCE(p_payment_status, p.\`PaymentStatus\`),
                p.\`DueAmount\` = COALESCE(p_due_amount, p.\`DueAmount\`)
            WHERE f.\`VendorId\` = p_vendor_id
              AND (p.\`PurchaseCode\` = p_purchase_id OR CAST(p.\`Id\` AS CHAR) = p_purchase_id);
        END IF;

        -- Synchronize vp_ledger_entries
        UPDATE \`vp_ledger_entries\`
           SET settled_amount = IF(p_due_amount IS NOT NULL, credit - p_due_amount, settled_amount),
               status = IF(p_due_amount = 0, 'Paid', IF(p_due_amount > 0 AND p_due_amount < credit, 'Partial', status)),
               updated_at = UTC_TIMESTAMP(6)
         WHERE vendor_id = p_vendor_id AND (transaction_code = p_purchase_id OR CAST(id AS CHAR) = p_purchase_id);

        -- Return updated purchase
        CALL \`sp_Vendor_GetPurchaseById\`(p_vendor_id, p_purchase_id, p_supplier_category);
    END;
  `);
  console.log('sp_Vendor_UpdatePurchaseStatus recreated.');

  await conn.end();
  console.log('ALL SPS UPDATED SUCCESSFULLY!');
}

applySps().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
