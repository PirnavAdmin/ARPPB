-- ============================================================================
-- ARPPB: Vendor Portal - Sales & Orders stored procedures (MySQL 8+ / MariaDB 11+)
-- Script: VendorSalesOrdersStoredProcedures.sql
-- Screens: Sell Products, Customer Orders, Sales History (+ the OTP popup shown
--          after "Submit Sales Order & Send OTP").
--
-- Scope  : touches ONLY the vendor-portal sales/orders routines (sp_vp_*).
--          No table is altered; the existing vp_sales, vp_sale_items,
--          vp_finished_product_batches, vp_otp_confirmations and
--          vp_ledger_entries tables are used as they are.
-- Safe   : every routine is DROP ... IF EXISTS + CREATE, so the script can be
--          re-run at any time.
--
-- Changes in this script
--   1. sp_vp_catalog_summary : + total_orders, total_sales, open_orders,
--                              pending_otp_orders  (header "Customer Orders (n)" button).
--   2. sp_vp_sales_summary   : NEW - Sales History KPI cards (was inline SQL in the API).
--   3. sp_vp_sales_list      : each sale now also carries its latest customer OTP
--                              confirmation (otp_confirmation_id / _code / otp_expires_at /
--                              otp_attempts) so Customer Orders and the OTP popup can
--                              verify / resend the OTP for a sale.
--   4. sp_vp_sale_get        : same OTP columns for a single sale / order.
--   5. sp_vp_sales_export    : NEW - every sale matching the Sales History filters (no paging) for
--                              "Export / Print Sales" (Vendor_Sales_History_Register.csv).
--   6. sp_vp_sales_filter_options : NEW - customers, products and status counts for the Sales History dropdowns.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. sp_vp_catalog_summary  (Sell Products header + "Customer Orders (n)")
-- ----------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS `sp_vp_catalog_summary`;
DELIMITER $$
CREATE PROCEDURE `sp_vp_catalog_summary`(IN p_vendor BIGINT)
BEGIN
  SELECT
    (SELECT COUNT(*) FROM vp_finished_product_batches
       WHERE vendor_id = p_vendor AND status = 'Active' AND quantity_available > 0) AS sellable_sku_lines,
    (SELECT COUNT(DISTINCT product_name) FROM vp_finished_product_batches
       WHERE vendor_id = p_vendor AND status = 'Active' AND quantity_available > 0) AS active_products_ready,
    (SELECT COALESCE(SUM(quantity_available * suggested_price), 0) FROM vp_finished_product_batches
       WHERE vendor_id = p_vendor AND status = 'Active' AND quantity_available > 0) AS available_stock_market_value,
    (SELECT COUNT(*) FROM Customers c JOIN Users u ON u.Id = c.UserId WHERE u.IsActive = 1) AS verified_customers,
    (SELECT COUNT(*) FROM vp_sales
       WHERE vendor_id = p_vendor AND order_status <> 'Draft') AS total_orders,
    (SELECT COUNT(*) FROM vp_sales
       WHERE vendor_id = p_vendor AND order_status <> 'Draft') AS total_sales,
    (SELECT COUNT(*) FROM vp_sales
       WHERE vendor_id = p_vendor AND order_status NOT IN ('Draft', 'Completed', 'Cancelled')) AS open_orders,
    (SELECT COUNT(*) FROM vp_sales
       WHERE vendor_id = p_vendor AND order_status = 'New' AND otp_status IN ('Sent', 'Expired', 'Failed')) AS pending_otp_orders;
END$$
DELIMITER ;

-- ----------------------------------------------------------------------------
-- 2. sp_vp_sales_summary  (Sales History KPI cards)
-- ----------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS `sp_vp_sales_summary`;
DELIMITER $$
CREATE PROCEDURE `sp_vp_sales_summary`(IN p_vendor BIGINT)
BEGIN
  SELECT COUNT(*) AS total_sales,
         COUNT(*) AS total_orders,
         COALESCE(SUM(order_status = 'Completed'), 0) AS completed_sales,
         COALESCE(SUM(order_status NOT IN ('Completed', 'Cancelled')), 0) AS pending_orders,
         COALESCE(SUM(CASE WHEN otp_status = 'Verified' AND order_status <> 'Cancelled'
                           THEN total_amount END), 0) AS total_revenue,
         COALESCE(SUM(CASE WHEN otp_status = 'Verified' AND order_status <> 'Cancelled'
                           THEN total_amount - amount_received END), 0) AS outstanding_receivables
    FROM vp_sales
   WHERE vendor_id = p_vendor AND order_status <> 'Draft';
END$$
DELIMITER ;

-- ----------------------------------------------------------------------------
-- 3. sp_vp_sales_list  (Sales History / Customer Orders / Drafts)
--    p_scope: 'draft' => drafts only, anything else => submitted sales / orders.
--    Result sets: (1) total, (2) sales page + OTP confirmation, (3) their items.
-- ----------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS `sp_vp_sales_list`;
DELIMITER $$
CREATE PROCEDURE `sp_vp_sales_list`(
  IN p_vendor BIGINT,
  IN p_scope VARCHAR(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  IN p_search VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  IN p_status VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  IN p_otp VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  IN p_payment VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  IN p_customer BIGINT,
  IN p_product VARCHAR(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  IN p_from DATE, IN p_to DATE, IN p_page INT, IN p_size INT)
BEGIN
  DECLARE v_off INT;
  SET v_off = (GREATEST(p_page, 1) - 1) * p_size;

  DROP TEMPORARY TABLE IF EXISTS tmp_sale_match;
  CREATE TEMPORARY TABLE tmp_sale_match (id BIGINT NOT NULL PRIMARY KEY);

  INSERT INTO tmp_sale_match
  SELECT s.id FROM vp_sales s
   WHERE s.vendor_id = p_vendor
     AND ((p_scope = 'draft' AND s.order_status = 'Draft') OR (p_scope <> 'draft' AND s.order_status <> 'Draft'))
     AND (p_status IS NULL OR s.order_status = p_status)
     -- OTP filter accepts DB values (Sent, Verified, Failed, Expired, NotSent) and the screen's
     -- wording: 'Pending' = Sent / NotSent on a live order, 'Cancelled' = cancelled order.
     AND (p_otp IS NULL
          OR (p_otp = 'Pending' AND s.otp_status IN ('Sent', 'NotSent') AND s.order_status <> 'Cancelled')
          OR (p_otp = 'Cancelled' AND s.order_status = 'Cancelled')
          OR (p_otp NOT IN ('Pending', 'Cancelled') AND s.otp_status = REPLACE(p_otp, ' ', '')
              AND (p_scope <> 'orders' OR s.order_status <> 'Cancelled')))
     -- Payment filter: the screen's 'Pending' means Unpaid.
     AND (p_payment IS NULL
          OR s.payment_status = IF(p_payment = 'Pending', 'Unpaid', p_payment))
     AND (p_customer IS NULL OR s.customer_user_id = p_customer)
     AND (p_product IS NULL OR EXISTS (SELECT 1 FROM vp_sale_items i WHERE i.sale_id = s.id AND i.product_name = p_product))
     AND (p_search IS NULL
          OR s.sale_code LIKE CONCAT('%', p_search, '%') OR s.order_code LIKE CONCAT('%', p_search, '%')
          OR s.customer_name LIKE CONCAT('%', p_search, '%') OR s.business_name LIKE CONCAT('%', p_search, '%')
          OR EXISTS (SELECT 1 FROM vp_sale_items i WHERE i.sale_id = s.id
                       AND (i.product_name LIKE CONCAT('%', p_search, '%') OR i.batch_code LIKE CONCAT('%', p_search, '%'))))
     AND (p_from IS NULL OR s.sale_date >= p_from)
     AND (p_to IS NULL OR s.sale_date <= p_to);

  SELECT COUNT(*) AS total FROM tmp_sale_match;

  SELECT s.*,
         c.id AS otp_confirmation_id,
         c.confirmation_code AS otp_confirmation_code,
         c.expires_at AS otp_expires_at,
         c.attempts AS otp_attempts
    FROM vp_sales s
    JOIN tmp_sale_match m ON m.id = s.id
    LEFT JOIN vp_otp_confirmations c
           ON c.id = (SELECT MAX(x.id) FROM vp_otp_confirmations x WHERE x.sale_id = s.id)
   ORDER BY s.id DESC
   LIMIT p_size OFFSET v_off;

  SELECT i.* FROM vp_sale_items i
   WHERE i.sale_id IN (SELECT id FROM (SELECT m.id FROM tmp_sale_match m ORDER BY m.id DESC LIMIT p_size OFFSET v_off) x)
   ORDER BY i.id;

  DROP TEMPORARY TABLE IF EXISTS tmp_sale_match;
END$$
DELIMITER ;

-- ----------------------------------------------------------------------------
-- 4. sp_vp_sale_get  (single sale / order with its items)
--    p_scope = 'orders' hides drafts (Customer Orders screen).
--    Also called by sp_vp_order_update_status and sp_vp_order_cancel.
-- ----------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS `sp_vp_sale_get`;
DELIMITER $$
CREATE PROCEDURE `sp_vp_sale_get`(
  IN p_vendor BIGINT, IN p_id BIGINT,
  IN p_scope VARCHAR(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci)
BEGIN
  SELECT s.*,
         c.id AS otp_confirmation_id,
         c.confirmation_code AS otp_confirmation_code,
         c.expires_at AS otp_expires_at,
         c.attempts AS otp_attempts
    FROM vp_sales s
    LEFT JOIN vp_otp_confirmations c
           ON c.id = (SELECT MAX(x.id) FROM vp_otp_confirmations x WHERE x.sale_id = s.id)
   WHERE s.id = p_id AND s.vendor_id = p_vendor AND (p_scope <> 'orders' OR s.order_status <> 'Draft');

  SELECT i.* FROM vp_sale_items i JOIN vp_sales s ON s.id = i.sale_id
   WHERE s.id = p_id AND s.vendor_id = p_vendor AND (p_scope <> 'orders' OR s.order_status <> 'Draft')
   ORDER BY i.id;
END$$
DELIMITER ;

-- ----------------------------------------------------------------------------
-- 5. sp_vp_sales_export  (Sales History: Export / Print Sales)
--    Same filters as sp_vp_sales_list (scope 'history'); date range is on sale_date.
--    Confirmation wording: Sent -> 'Pending', NotSent -> 'Not Sent', otherwise the DB value.
--    Payment status and sales (order) status are returned as stored.
-- ----------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS `sp_vp_sales_export`;
DELIMITER $$
CREATE PROCEDURE `sp_vp_sales_export`(
  IN p_vendor BIGINT,
  IN p_search VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  IN p_status VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  IN p_otp VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  IN p_payment VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  IN p_customer BIGINT,
  IN p_product VARCHAR(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  IN p_from DATE, IN p_to DATE)
BEGIN
  SELECT s.sale_code,
         s.order_code,
         s.customer_name,
         CONCAT(COALESCE(it.first_product, ''),
                IF(COALESCE(it.line_count, 0) > 1, CONCAT(' +', it.line_count - 1, ' more'), '')) AS product,
         COALESCE(it.total_qty, 0) AS quantity,
         CASE WHEN COALESCE(it.unit_count, 0) > 1 THEN 'Mixed' ELSE COALESCE(it.unit, '') END AS unit,
         CASE WHEN COALESCE(it.total_qty, 0) > 0 THEN ROUND(it.total_value / it.total_qty, 2) ELSE 0 END AS unit_price,
         s.total_amount,
         s.sale_date,
         CASE s.otp_status WHEN 'Sent' THEN 'Pending' WHEN 'NotSent' THEN 'Not Sent' ELSE s.otp_status END AS confirmation_status,
         s.expected_payment_date,
         s.payment_status,
         s.order_status AS sales_status
    FROM vp_sales s
    LEFT JOIN (
      SELECT i.sale_id,
             COUNT(*) AS line_count,
             SUM(i.quantity) AS total_qty,
             SUM(i.line_total) AS total_value,
             COUNT(DISTINCT i.unit) AS unit_count,
             MIN(i.unit) AS unit,
             SUBSTRING_INDEX(GROUP_CONCAT(i.product_name ORDER BY i.id SEPARATOR '||'), '||', 1) AS first_product
        FROM vp_sale_items i
       GROUP BY i.sale_id
    ) it ON it.sale_id = s.id
   WHERE s.vendor_id = p_vendor
     AND s.order_status <> 'Draft'
     AND (p_status IS NULL OR s.order_status = p_status)
     AND (p_otp IS NULL
          OR (p_otp = 'Pending' AND s.otp_status IN ('Sent', 'NotSent') AND s.order_status <> 'Cancelled')
          OR (p_otp = 'Cancelled' AND s.order_status = 'Cancelled')
          OR (p_otp NOT IN ('Pending', 'Cancelled') AND s.otp_status = REPLACE(p_otp, ' ', '')))
     AND (p_payment IS NULL
          OR s.payment_status = IF(p_payment = 'Pending', 'Unpaid', p_payment))
     AND (p_customer IS NULL OR s.customer_user_id = p_customer)
     AND (p_product IS NULL OR EXISTS (SELECT 1 FROM vp_sale_items i WHERE i.sale_id = s.id AND i.product_name = p_product))
     AND (p_search IS NULL
          OR s.sale_code LIKE CONCAT('%', p_search, '%') OR s.order_code LIKE CONCAT('%', p_search, '%')
          OR s.customer_name LIKE CONCAT('%', p_search, '%') OR s.business_name LIKE CONCAT('%', p_search, '%')
          OR EXISTS (SELECT 1 FROM vp_sale_items i WHERE i.sale_id = s.id
                       AND (i.product_name LIKE CONCAT('%', p_search, '%') OR i.batch_code LIKE CONCAT('%', p_search, '%'))))
     AND (p_from IS NULL OR s.sale_date >= p_from)
     AND (p_to IS NULL OR s.sale_date <= p_to)
   ORDER BY s.id DESC;
END$$
DELIMITER ;

-- ----------------------------------------------------------------------------
-- 6. sp_vp_sales_filter_options  (Sales History dropdowns)
--    Result sets: (1) customers that have submitted sales, (2) finished products sold,
--                 (3) number of submitted sales per sales (order) status.
-- ----------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS `sp_vp_sales_filter_options`;
DELIMITER $$
CREATE PROCEDURE `sp_vp_sales_filter_options`(IN p_vendor BIGINT)
BEGIN
  SELECT s.customer_user_id,
         MIN(s.customer_code) AS customer_code,
         MIN(s.customer_name) AS customer_name,
         MIN(s.business_name) AS business_name,
         COUNT(*) AS orders
    FROM vp_sales s
   WHERE s.vendor_id = p_vendor AND s.order_status <> 'Draft'
   GROUP BY s.customer_user_id
   ORDER BY MIN(s.customer_name);

  SELECT i.product_name, COUNT(DISTINCT i.sale_id) AS sales
    FROM vp_sale_items i
    JOIN vp_sales s ON s.id = i.sale_id
   WHERE s.vendor_id = p_vendor AND s.order_status <> 'Draft'
   GROUP BY i.product_name
   ORDER BY i.product_name;

  SELECT s.order_status AS status, COUNT(*) AS cnt
    FROM vp_sales s
   WHERE s.vendor_id = p_vendor AND s.order_status <> 'Draft'
   GROUP BY s.order_status;
END$$
DELIMITER ;
