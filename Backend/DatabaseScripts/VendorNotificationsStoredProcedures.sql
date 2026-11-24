-- ============================================================================
-- ARPPB: Vendor Portal - Notifications stored procedures (MySQL 8+ / MariaDB 11+)
-- Script: VendorNotificationsStoredProcedures.sql
-- Screen: System Notifications & Operational Alerts (KPI cards, filters, Mark Read,
--         Mark All as Read, delete) and the header badges (bell + "OTP Queue").
--
-- Scope  : vendor notification routines only; no table is altered (vp_notifications is used as is).
-- Safe   : DROP ... IF EXISTS + CREATE, so it can be re-run at any time.
--
-- These replace the inline SQL the API used for notifications (AGENTS.md: use stored procedures).
--   1. sp_vp_notifications_summary        : the four KPI cards.
--   2. sp_vp_notifications_list           : alert list; understands the screen's filter words
--                                           (category names, High / Medium / Low [Priority]).
--   3. sp_vp_notification_mark_read       : "Mark Read" on one notification.
--   4. sp_vp_notifications_mark_all_read  : "Mark All as Read".
--   5. sp_vp_notification_delete          : trash icon.
--   6. sp_vp_notification_filter_options  : categories present in the vendor's notifications.
--   7. sp_vp_header_counts                : unread alerts + pending customer OTPs for the header.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. sp_vp_notifications_summary
-- ----------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS `sp_vp_notifications_summary`;
DELIMITER $$
CREATE PROCEDURE `sp_vp_notifications_summary`(IN p_vendor BIGINT)
BEGIN
  SELECT COUNT(*) AS total,
         COALESCE(SUM(is_read = 0), 0) AS unread,
         COALESCE(SUM(is_read = 0 AND priority = 'High'), 0) AS high_priority_unread,
         COALESCE(SUM(is_read = 1), 0) AS read_count,
         COUNT(DISTINCT category) AS category_count
    FROM vp_notifications
   WHERE vendor_id = p_vendor;
END$$
DELIMITER ;

-- ----------------------------------------------------------------------------
-- 2. sp_vp_notifications_list
--    Result sets: (1) total, (2) the page (newest first).
--    p_category : screen category or stored category ('Customer Order Confirmed' = 'Sale Confirmed',
--                 'OTP Verification' = 'OTP Confirmation')
--    p_priority : High | Medium | Low (a trailing " Priority" is ignored)
--    p_read     : 1 = read only, 0 = unread only, NULL = all
-- ----------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS `sp_vp_notifications_list`;
DELIMITER $$
CREATE PROCEDURE `sp_vp_notifications_list`(
  IN p_vendor BIGINT,
  IN p_search VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  IN p_category VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  IN p_priority VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  IN p_read TINYINT,
  IN p_from DATETIME, IN p_to_excl DATETIME, IN p_page INT, IN p_size INT)
BEGIN
  DECLARE v_off INT;
  DECLARE v_priority VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  DECLARE v_category VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  SET v_off = (GREATEST(p_page, 1) - 1) * p_size;
  SET v_priority = NULLIF(TRIM(REPLACE(COALESCE(p_priority, ''), ' Priority', '')), '');
  SET v_category = CASE p_category
                     WHEN 'Customer Order Confirmed' THEN 'Sale Confirmed'
                     WHEN 'OTP Verification' THEN 'OTP Confirmation'
                     ELSE p_category END;

  SELECT COUNT(*) AS total
    FROM vp_notifications n
   WHERE n.vendor_id = p_vendor
     AND (p_category IS NULL OR n.category = p_category OR n.category = v_category)
     AND (v_priority IS NULL OR n.priority = v_priority)
     AND (p_read IS NULL OR n.is_read = p_read)
     AND (p_from IS NULL OR n.created_at >= p_from)
     AND (p_to_excl IS NULL OR n.created_at < p_to_excl)
     AND (p_search IS NULL OR n.title LIKE CONCAT('%', p_search, '%')
          OR n.description LIKE CONCAT('%', p_search, '%')
          OR n.reference_code LIKE CONCAT('%', p_search, '%')
          OR n.category LIKE CONCAT('%', p_search, '%'));

  SELECT n.id, n.title, n.description, n.category, n.priority, n.reference_code, n.module_link,
         n.is_read, n.read_at, n.created_at
    FROM vp_notifications n
   WHERE n.vendor_id = p_vendor
     AND (p_category IS NULL OR n.category = p_category OR n.category = v_category)
     AND (v_priority IS NULL OR n.priority = v_priority)
     AND (p_read IS NULL OR n.is_read = p_read)
     AND (p_from IS NULL OR n.created_at >= p_from)
     AND (p_to_excl IS NULL OR n.created_at < p_to_excl)
     AND (p_search IS NULL OR n.title LIKE CONCAT('%', p_search, '%')
          OR n.description LIKE CONCAT('%', p_search, '%')
          OR n.reference_code LIKE CONCAT('%', p_search, '%')
          OR n.category LIKE CONCAT('%', p_search, '%'))
   ORDER BY n.created_at DESC, n.id DESC
   LIMIT p_size OFFSET v_off;
END$$
DELIMITER ;

-- ----------------------------------------------------------------------------
-- 3. sp_vp_notification_mark_read   (returns the notification, or no row when it is not the vendor's)
-- ----------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS `sp_vp_notification_mark_read`;
DELIMITER $$
CREATE PROCEDURE `sp_vp_notification_mark_read`(IN p_vendor BIGINT, IN p_id BIGINT)
BEGIN
  UPDATE vp_notifications
     SET is_read = 1, read_at = UTC_TIMESTAMP(6)
   WHERE id = p_id AND vendor_id = p_vendor AND is_read = 0;

  SELECT id, title, description, category, priority, reference_code, module_link, is_read, read_at, created_at
    FROM vp_notifications
   WHERE id = p_id AND vendor_id = p_vendor;
END$$
DELIMITER ;

-- ----------------------------------------------------------------------------
-- 4. sp_vp_notifications_mark_all_read   (returns how many were unread)
-- ----------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS `sp_vp_notifications_mark_all_read`;
DELIMITER $$
CREATE PROCEDURE `sp_vp_notifications_mark_all_read`(IN p_vendor BIGINT)
BEGIN
  DECLARE v_updated INT DEFAULT 0;
  UPDATE vp_notifications
     SET is_read = 1, read_at = UTC_TIMESTAMP(6)
   WHERE vendor_id = p_vendor AND is_read = 0;
  SET v_updated = ROW_COUNT();
  SELECT v_updated AS updated;
END$$
DELIMITER ;

-- ----------------------------------------------------------------------------
-- 5. sp_vp_notification_delete   (returns how many rows were removed: 0 or 1)
-- ----------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS `sp_vp_notification_delete`;
DELIMITER $$
CREATE PROCEDURE `sp_vp_notification_delete`(IN p_vendor BIGINT, IN p_id BIGINT)
BEGIN
  DECLARE v_deleted INT DEFAULT 0;
  DELETE FROM vp_notifications WHERE id = p_id AND vendor_id = p_vendor;
  SET v_deleted = ROW_COUNT();
  SELECT v_deleted AS deleted;
END$$
DELIMITER ;

-- ----------------------------------------------------------------------------
-- 6. sp_vp_notification_filter_options   (category dropdown: stored categories with counts)
-- ----------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS `sp_vp_notification_filter_options`;
DELIMITER $$
CREATE PROCEDURE `sp_vp_notification_filter_options`(IN p_vendor BIGINT)
BEGIN
  SELECT category, COUNT(*) AS cnt
    FROM vp_notifications
   WHERE vendor_id = p_vendor
   GROUP BY category
   ORDER BY category;
END$$
DELIMITER ;

-- ----------------------------------------------------------------------------
-- 7. sp_vp_header_counts   (bell badge + "OTP Queue" badge, shown on every vendor page)
--    pending_otps = customer / farmer / middleman OTPs still waiting for entry:
--                   status Sent, not expired, and not on a cancelled order.
-- ----------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS `sp_vp_header_counts`;
DELIMITER $$
CREATE PROCEDURE `sp_vp_header_counts`(IN p_vendor BIGINT)
BEGIN
  SELECT
    (SELECT COUNT(*) FROM vp_notifications WHERE vendor_id = p_vendor AND is_read = 0) AS unread_notifications,
    (SELECT COUNT(*) FROM vp_notifications WHERE vendor_id = p_vendor AND is_read = 0 AND priority = 'High') AS high_priority_unread,
    (SELECT COUNT(*)
       FROM vp_otp_confirmations c
       LEFT JOIN vp_sales s ON s.id = c.sale_id
      WHERE c.vendor_id = p_vendor AND c.otp_status = 'Sent' AND c.expires_at > UTC_TIMESTAMP(6)
        AND COALESCE(s.order_status, '') <> 'Cancelled') AS pending_otps;
END$$
DELIMITER ;
