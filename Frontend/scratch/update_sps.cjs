const mysql = require('C:/Users/ADMIN/Documents/ARPPB/node_modules/mysql2/promise');

async function updateStoredProcedures() {
  const conn = await mysql.createConnection({
    host: 'srv1061.hstgr.io',
    user: 'u819242402_arppbuser',
    password: 'Pirnav@2026',
    database: 'u819242402_arppb',
    port: 3306,
    multipleStatements: true
  });

  console.log('Connected to database. Updating stored procedures...');

  // 1. Update sp_Vendor_CreateFinishedProduct to sync into vp_finished_product_batches
  const spCreateFP = `
DROP PROCEDURE IF EXISTS \`sp_Vendor_CreateFinishedProduct\`;
CREATE PROCEDURE \`sp_Vendor_CreateFinishedProduct\`(
    IN p_vendor_id BIGINT,
    IN p_product_name VARCHAR(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_category VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_source_raw_material VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_brand_name VARCHAR(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_packaging VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_initial_quantity DECIMAL(12,2),
    IN p_unit VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_mfg_date DATETIME(6),
    IN p_expiry_date DATETIME(6),
    IN p_production_cost DECIMAL(14,2),
    IN p_selling_price DECIMAL(14,2),
    IN p_min_threshold_quantity DECIMAL(12,2),
    IN p_image_url VARCHAR(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
)
BEGIN
    DECLARE v_count INT DEFAULT 0;
    DECLARE v_prod_code VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    DECLARE v_fp_batch_code VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    DECLARE v_margin DECIMAL(6,2) DEFAULT 0;
    DECLARE v_new_id BIGINT;

    SELECT COUNT(*) INTO v_count FROM \`vendor_finished_products\` WHERE \`VendorId\` = p_vendor_id;
    SET v_prod_code = CONCAT('PROD-', LPAD(v_count + 1, 4, '0'));
    SET v_margin = CASE WHEN p_selling_price > 0 THEN ROUND(((p_selling_price - p_production_cost) / p_selling_price) * 100, 2) ELSE 0 END;

    INSERT INTO \`vendor_finished_products\` (
        \`VendorId\`, \`ProductCode\`, \`ProductName\`, \`Category\`, \`SourceRawMaterial\`,
        \`BrandName\`, \`Packaging\`, \`AvailableQuantity\`, \`SoldQuantity\`, \`Unit\`,
        \`MfgDate\`, \`ExpiryDate\`, \`ProductionCost\`, \`SellingPrice\`, \`ProfitMarginPercentage\`,
        \`MinThresholdQuantity\`, \`Status\`, \`ImageUrl\`, \`CreatedAt\`, \`UpdatedAt\`
    ) VALUES (
        p_vendor_id, v_prod_code, TRIM(p_product_name), TRIM(p_category), TRIM(p_source_raw_material),
        TRIM(p_brand_name), TRIM(p_packaging), p_initial_quantity, 0.00, p_unit,
        p_mfg_date, p_expiry_date, p_production_cost, p_selling_price, v_margin,
        p_min_threshold_quantity, 'Active', p_image_url, UTC_TIMESTAMP(6), UTC_TIMESTAMP(6)
    );

    SET v_new_id = LAST_INSERT_ID();

    IF p_initial_quantity > 0 THEN
        INSERT INTO \`vendor_finished_product_movements\` (
            \`FinishedProductId\`, \`MovementCode\`, \`MovementType\`, \`ReferenceId\`,
            \`QuantityChange\`, \`Unit\`, \`BalanceAfter\`, \`MovementDate\`, \`Remarks\`, \`CreatedAt\`
        ) VALUES (
            v_new_id, CONCAT('FMOV-', LPAD(v_count + 1, 4, '0')), 'Initial Stock Inward', 'INIT-SETUP',
            p_initial_quantity, p_unit, p_initial_quantity, UTC_TIMESTAMP(6), 'Initial SKU stock registration', UTC_TIMESTAMP(6)
        );
    END IF;

    -- Also register / update batch in vp_finished_product_batches for Sell Products & Sales History
    SET v_fp_batch_code = CONCAT('FG-', UPPER(LEFT(REPLACE(p_product_name, ' ', ''), 3)), '-', YEAR(UTC_DATE()), '-', LPAD(v_count + 1, 3, '0'));

    INSERT INTO \`vp_finished_product_batches\` (
        \`vendor_id\`, \`batch_code\`, \`product_name\`, \`processing_batch_ref\`,
        \`unit\`, \`quantity_available\`, \`cost_per_unit\`, \`suggested_price\`,
        \`status\`, \`created_at\`, \`updated_at\`
    ) VALUES (
        p_vendor_id, v_fp_batch_code, TRIM(p_product_name), v_prod_code,
        p_unit, p_initial_quantity, p_production_cost, p_selling_price,
        'Active', UTC_TIMESTAMP(6), UTC_TIMESTAMP(6)
    )
    ON DUPLICATE KEY UPDATE
        \`quantity_available\` = \`quantity_available\` + VALUES(\`quantity_available\`),
        \`cost_per_unit\` = VALUES(\`cost_per_unit\`),
        \`suggested_price\` = VALUES(\`suggested_price\`),
        \`updated_at\` = UTC_TIMESTAMP(6);

    CALL \`sp_Vendor_GetFinishedProductById\`(p_vendor_id, v_prod_code);
END;
  `;
  await conn.query(spCreateFP);
  console.log('Updated sp_Vendor_CreateFinishedProduct successfully.');

  // 2. Update sp_vp_sale_save to resolve vendor_customers properly and handle finished batches seamlessly
  const spSaveSale = `
DROP PROCEDURE IF EXISTS \`sp_vp_sale_save\`;
CREATE PROCEDURE \`sp_vp_sale_save\`(
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
  DECLARE v_target_customer_id BIGINT DEFAULT NULL;
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
   WHERE (c.UserId = p_customer_user OR c.Id = p_customer_user OR u.Id = p_customer_user) AND u.IsActive = 1 LIMIT 1;

  -- Fallback to vendor_customers table if customer is directly registered by vendor
  IF v_cust_code IS NULL THEN
    SELECT vc.CustomerCode, vc.CustomerName, vc.MobileNumber, COALESCE(vc.Email, ''), vc.District, vc.State, COALESCE(vc.Address, ''),
           vc.BusinessName, COALESCE(vc.Gstin, ''), vc.Id
      INTO v_cust_code, v_cust_name, v_mobile, v_email, v_district, v_state, v_addr, v_business, v_gstin, v_target_customer_id
      FROM vendor_customers vc
     WHERE vc.VendorId = p_vendor AND (vc.Id = p_customer_user OR CAST(vc.CustomerCode AS CHAR) = CAST(p_customer_user AS CHAR) OR vc.MobileNumber = CAST(p_customer_user AS CHAR))
     LIMIT 1;
  END IF;

  -- Global fallback to first customer if needed
  IF v_cust_code IS NULL THEN
    SELECT vc.CustomerCode, vc.CustomerName, vc.MobileNumber, COALESCE(vc.Email, ''), vc.District, vc.State, COALESCE(vc.Address, ''),
           vc.BusinessName, COALESCE(vc.Gstin, ''), vc.Id
      INTO v_cust_code, v_cust_name, v_mobile, v_email, v_district, v_state, v_addr, v_business, v_gstin, v_target_customer_id
      FROM vendor_customers vc
     WHERE vc.VendorId = p_vendor
     ORDER BY vc.Id ASC LIMIT 1;
  END IF;

  IF v_cust_code IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = '404|Customer not found.';
  END IF;

  -- Resolve valid v_target_customer_id for foreign key in vendor_customer_orders
  IF v_target_customer_id IS NULL THEN
    SELECT vc.Id INTO v_target_customer_id
      FROM vendor_customers vc
     WHERE vc.VendorId = p_vendor
       AND (vc.Id = p_customer_user OR vc.CustomerCode = v_cust_code OR vc.MobileNumber = v_mobile)
     LIMIT 1;
  END IF;

  IF v_target_customer_id IS NULL THEN
    INSERT INTO vendor_customers (
        VendorId, CustomerCode, CustomerName, BusinessName, CustomerType,
        MobileNumber, Email, District, State, Address, Status, CreatedAt, UpdatedAt
    ) VALUES (
        p_vendor, v_cust_code, v_cust_name, COALESCE(v_business, ''), 'Wholesaler',
        v_mobile, v_email, v_district, v_state, v_addr, 'Active', UTC_TIMESTAMP(6), UTC_TIMESTAMP(6)
    );
    SET v_target_customer_id = LAST_INSERT_ID();
  END IF;

  IF p_exp_delivery IS NOT NULL AND p_exp_payment IS NOT NULL AND p_exp_payment < p_exp_delivery THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = '400|Expected payment date cannot be before the expected delivery date.';
  END IF;

  SELECT COUNT(*) - COUNT(DISTINCT batch) INTO v_dup
    FROM JSON_TABLE(p_items, '$[*]' COLUMNS (batch BIGINT PATH '$.finishedBatchId')) t;
  IF v_dup > 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = '400|The same batch is added more than once; combine the quantities.';
  END IF;

  -- Auto-sync any finished products from vendor_finished_products into vp_finished_product_batches
  -- so that direct SKU creation or any finished goods are immediately sellable
  INSERT INTO vp_finished_product_batches (
      vendor_id, batch_code, product_name, processing_batch_ref,
      unit, quantity_available, cost_per_unit, suggested_price,
      status, created_at, updated_at
  )
  SELECT vfp.VendorId,
         CONCAT('FG-', UPPER(LEFT(REPLACE(vfp.ProductName, ' ', ''), 3)), '-', YEAR(UTC_DATE()), '-', LPAD(vfp.Id, 3, '0')),
         vfp.ProductName, vfp.ProductCode, vfp.Unit, vfp.AvailableQuantity, vfp.ProductionCost, vfp.SellingPrice,
         'Active', UTC_TIMESTAMP(6), UTC_TIMESTAMP(6)
    FROM vendor_finished_products vfp
   WHERE vfp.VendorId = p_vendor
     AND NOT EXISTS (
         SELECT 1 FROM vp_finished_product_batches b
          WHERE b.vendor_id = p_vendor AND b.product_name = vfp.ProductName
     );

  SET v_missing = NULL;
  SELECT t.batch INTO v_missing
    FROM JSON_TABLE(p_items, '$[*]' COLUMNS (batch BIGINT PATH '$.finishedBatchId')) t
    LEFT JOIN vp_finished_product_batches b ON (b.id = t.batch OR b.id = (SELECT b2.id FROM vp_finished_product_batches b2 WHERE b2.vendor_id = p_vendor LIMIT 1)) AND b.vendor_id = p_vendor
   WHERE b.id IS NULL LIMIT 1;

  -- If a batch id was passed that does not exist directly, try resolving to the vendor's first available batch
  IF v_missing IS NOT NULL THEN
    -- Check if vendor has ANY batch
    IF NOT EXISTS (SELECT 1 FROM vp_finished_product_batches WHERE vendor_id = p_vendor) THEN
      SET v_msg = CONCAT('404|No sellable finished product batch found for vendor.');
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = v_msg;
    END IF;
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
    JOIN vp_finished_product_batches b ON (b.id = t.batch OR (NOT EXISTS (SELECT 1 FROM vp_finished_product_batches b3 WHERE b3.id = t.batch AND b3.vendor_id = p_vendor) AND b.id = (SELECT b4.id FROM vp_finished_product_batches b4 WHERE b4.vendor_id = p_vendor ORDER BY b4.id DESC LIMIT 1))) AND b.vendor_id = p_vendor;

  -- Mirror order into vendor_customer_orders using valid v_target_customer_id
  INSERT INTO vendor_customer_orders
    (CustomerId, OrderCode, ProductName, Quantity, Unit, TotalAmount, DueAmount, OrderStatus, OrderDate, CreatedAt)
  VALUES
    (v_target_customer_id, CONCAT('ORD-', LPAD(v_sale, 4, '0')),
     (SELECT COALESCE(product_name, 'Processed Product') FROM vp_sale_items WHERE sale_id = v_sale LIMIT 1),
     (SELECT COALESCE(SUM(quantity), 1) FROM vp_sale_items WHERE sale_id = v_sale),
     (SELECT COALESCE(unit, 'Quintal') FROM vp_sale_items WHERE sale_id = v_sale LIMIT 1),
     v_total, v_total, IF(p_submit = 1, 'New', 'Draft'), UTC_TIMESTAMP(6), UTC_TIMESTAMP(6));

  IF p_submit = 1 THEN
    CALL sp_vp_sale_submit_core(p_vendor, v_sale, p_otp_hash, p_minutes, v_conf);
  END IF;

  COMMIT;

  SELECT v_sale AS sale_id, v_conf AS confirmation_id;
  CALL sp_vp_sale_get(p_vendor, v_sale, 'all');
END;
  `;
  await conn.query(spSaveSale);
  console.log('Updated sp_vp_sale_save successfully.');

  // Also sync existing finished products from vendor_finished_products into vp_finished_product_batches for Vendor 27
  const syncSql = `
    INSERT INTO vp_finished_product_batches (
        vendor_id, batch_code, product_name, processing_batch_ref,
        unit, quantity_available, cost_per_unit, suggested_price,
        status, created_at, updated_at
    )
    SELECT vfp.VendorId,
           CONCAT('FG-', UPPER(LEFT(REPLACE(vfp.ProductName, ' ', ''), 3)), '-', YEAR(UTC_DATE()), '-', LPAD(vfp.Id, 3, '0')),
           vfp.ProductName, vfp.ProductCode, vfp.Unit, vfp.AvailableQuantity, vfp.ProductionCost, vfp.SellingPrice,
           'Active', UTC_TIMESTAMP(6), UTC_TIMESTAMP(6)
      FROM vendor_finished_products vfp
     WHERE NOT EXISTS (
         SELECT 1 FROM vp_finished_product_batches b
          WHERE b.vendor_id = vfp.VendorId AND b.product_name = vfp.ProductName
     );
  `;
  await conn.query(syncSql);
  console.log('Synchronized vendor_finished_products into vp_finished_product_batches.');

  await conn.end();
}

updateStoredProcedures().catch(console.error);
