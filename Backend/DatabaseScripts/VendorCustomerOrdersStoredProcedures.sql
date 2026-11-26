-- ============================================================================
-- ARPPB: Vendor Portal - Customer Orders page stored procedures (MySQL 8+ / MariaDB 11+)
-- Script: VendorCustomerOrdersStoredProcedures.sql
-- Screen: Customer Orders & Fulfilment Pipeline
--         (orders table, "Export Orders" CSV, "Print" register, order status history).
--
-- Scope  : vendor-portal Customer Orders routines only; no table is altered.
--          Run VendorSalesOrdersStoredProcedures.sql first (it owns sp_vp_sales_list).
-- Safe   : DROP ... IF EXISTS + CREATE, so it can be re-run at any time.
--
--   1. sp_vp_orders_export   : every order matching the screen filters (no paging) with the
--                              13 export columns, in the wording the screen uses.
--   2. sp_vp_order_timeline  : chronological status history of orders, built from the
--                              order notifications written by the order procedures.
--   3. sp_vp_orders_filter_options : customers that have orders (Customer dropdown).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. sp_vp_orders_export  (Export Orders CSV + Print register rows)
--    Filters mirror sp_vp_sales_list (scope 'orders'); date range is on sale_date.
--    OTP wording : Sent / NotSent -> 'Pending', cancelled order -> 'Cancelled'.
--    Payment wording : Unpaid -> 'Pending'.
-- ----------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS `sp_vp_orders_export`;
DELIMITER $$
CREATE PROCEDURE `sp_vp_orders_export`(
  IN p_vendor BIGINT,
  IN p_search VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  IN p_status VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  IN p_otp VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  IN p_payment VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  IN p_customer BIGINT,
  IN p_product VARCHAR(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  IN p_from DATE, IN p_to DATE)
BEGIN
  SELECT s.order_code,
         s.sale_code,
         s.customer_name,
         s.business_name,
         CONCAT(COALESCE(it.first_product, ''),
                IF(COALESCE(it.line_count, 0) > 1, CONCAT(' +', it.line_count - 1, ' more'), '')) AS product,
         COALESCE(it.total_qty, 0) AS quantity,
         CASE WHEN COALESCE(it.unit_count, 0) > 1 THEN 'Mixed' ELSE COALESCE(it.unit, '') END AS unit,
         CASE WHEN COALESCE(it.total_qty, 0) > 0 THEN ROUND(it.total_value / it.total_qty, 2) ELSE 0 END AS price,
         s.total_amount,
         s.sale_date AS order_date,
         s.expected_delivery_date,
         CASE WHEN s.order_status = 'Cancelled' THEN 'Cancelled'
              WHEN s.otp_status IN ('Sent', 'NotSent') THEN 'Pending'
              ELSE s.otp_status END AS otp_status,
         IF(s.payment_status = 'Unpaid', 'Pending', s.payment_status) AS payment_status,
         s.order_status
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
          OR (p_otp NOT IN ('Pending', 'Cancelled') AND s.otp_status = REPLACE(p_otp, ' ', '') AND s.order_status <> 'Cancelled'))
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
-- 2. sp_vp_order_timeline  (Order Fulfilment Pipeline / "Chronological Status History")
--    p_ids : comma separated vp_sales ids (e.g. '1,4,7') of the vendor's orders.
--    Source: vp_notifications rows written when an order is created, confirmed,
--            moved to a new stage or cancelled.
-- ----------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS `sp_vp_order_timeline`;
DELIMITER $$
CREATE PROCEDURE `sp_vp_order_timeline`(
  IN p_vendor BIGINT,
  IN p_ids VARCHAR(4000) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci)
BEGIN
  SELECT s.id AS order_id,
         CASE n.category
           WHEN 'Customer Order Received' THEN 'New'
           WHEN 'Sale Confirmed' THEN 'Confirmed'
           ELSE SUBSTRING_INDEX(SUBSTRING_INDEX(n.title, ' - ', 1), ' ', -1)
         END AS status,
         COALESCE(n.description, n.title) AS note,
         n.created_at AS event_at
    FROM vp_sales s
    JOIN vp_notifications n
      ON n.vendor_id = s.vendor_id
     AND n.reference_code = s.order_code
     AND n.category IN ('Customer Order Received', 'Sale Confirmed', 'Order Update')
   WHERE s.vendor_id = p_vendor
     AND FIND_IN_SET(s.id, p_ids) > 0
   ORDER BY s.id, n.created_at, n.id;
END$$
DELIMITER ;

-- ----------------------------------------------------------------------------
-- 3. sp_vp_orders_filter_options  (Customer dropdown of the Customer Orders screen)
--    The customers that actually have submitted orders with this vendor, with their order counts.
-- ----------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS `sp_vp_orders_filter_options`;
DELIMITER $$
CREATE PROCEDURE `sp_vp_orders_filter_options`(IN p_vendor BIGINT)
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
END$$
DELIMITER ;
