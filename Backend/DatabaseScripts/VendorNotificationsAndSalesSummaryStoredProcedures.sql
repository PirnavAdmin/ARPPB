-- ============================================================================
-- Vendor Portal Notifications & Sales History Summary Stored Procedures
-- Author: Backend Team
-- ============================================================================

DROP PROCEDURE IF EXISTS `sp_vp_sales_history_summary`;
DROP PROCEDURE IF EXISTS `sp_vp_notifications_summary`;
DROP PROCEDURE IF EXISTS `sp_vp_notifications_list`;
DROP PROCEDURE IF EXISTS `sp_vp_notification_mark_read`;
DROP PROCEDURE IF EXISTS `sp_vp_notifications_mark_all_read`;
DROP PROCEDURE IF EXISTS `sp_vp_notification_delete`;

DELIMITER $$

-- 1. sp_vp_sales_history_summary
CREATE PROCEDURE `sp_vp_sales_history_summary`(
    IN p_vendor BIGINT
)
BEGIN
    SELECT
        COUNT(*) AS total_sales,
        COUNT(*) AS total_orders,
        COALESCE(SUM(order_status = 'Completed'), 0) AS completed_sales,
        COALESCE(SUM(order_status NOT IN ('Completed', 'Cancelled')), 0) AS pending_orders,
        COALESCE(SUM(CASE WHEN otp_status = 'Verified' AND order_status <> 'Cancelled'
                          THEN total_amount END), 0) AS total_revenue,
        COALESCE(SUM(CASE WHEN otp_status = 'Verified' AND order_status <> 'Cancelled'
                          THEN total_amount - amount_received END), 0) AS outstanding_receivables
    FROM `vp_sales`
    WHERE `vendor_id` = p_vendor AND `order_status` <> 'Draft';
END$$

-- 2. sp_vp_notifications_summary
CREATE PROCEDURE `sp_vp_notifications_summary`(
    IN p_vendor BIGINT
)
BEGIN
    SELECT
        COUNT(*) AS total,
        COALESCE(SUM(is_read = 0), 0) AS unread,
        COALESCE(SUM(is_read = 0 AND priority = 'High'), 0) AS high_priority_unread,
        COALESCE(SUM(is_read = 1), 0) AS read_count,
        COUNT(DISTINCT category) AS category_count
    FROM `vp_notifications`
    WHERE `vendor_id` = p_vendor;
END$$

-- 3. sp_vp_notifications_list
CREATE PROCEDURE `sp_vp_notifications_list`(
    IN p_vendor BIGINT,
    IN p_search VARCHAR(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_category VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_priority VARCHAR(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_read TINYINT,
    IN p_from DATETIME(6),
    IN p_to_excl DATETIME(6),
    IN p_page INT,
    IN p_size INT
)
BEGIN
    DECLARE v_offset INT DEFAULT 0;
    SET v_offset = GREATEST(0, (p_page - 1) * p_size);

    -- Result Set 1: Total count
    SELECT COUNT(*)
    FROM `vp_notifications`
    WHERE `vendor_id` = p_vendor
      AND (p_category IS NULL OR `category` = p_category)
      AND (p_priority IS NULL OR `priority` = p_priority)
      AND (p_read IS NULL OR `is_read` = p_read)
      AND (p_from IS NULL OR `created_at` >= p_from)
      AND (p_to_excl IS NULL OR `created_at` < p_to_excl)
      AND (p_search IS NULL OR `title` LIKE CONCAT('%', p_search, '%')
           OR `description` LIKE CONCAT('%', p_search, '%')
           OR `reference_code` LIKE CONCAT('%', p_search, '%')
           OR `category` LIKE CONCAT('%', p_search, '%'));

    -- Result Set 2: Paginated items
    SELECT
        `id`,
        `title`,
        `description`,
        `category`,
        `priority`,
        `reference_code`,
        `module_link`,
        `is_read`,
        `read_at`,
        `created_at`
    FROM `vp_notifications`
    WHERE `vendor_id` = p_vendor
      AND (p_category IS NULL OR `category` = p_category)
      AND (p_priority IS NULL OR `priority` = p_priority)
      AND (p_read IS NULL OR `is_read` = p_read)
      AND (p_from IS NULL OR `created_at` >= p_from)
      AND (p_to_excl IS NULL OR `created_at` < p_to_excl)
      AND (p_search IS NULL OR `title` LIKE CONCAT('%', p_search, '%')
           OR `description` LIKE CONCAT('%', p_search, '%')
           OR `reference_code` LIKE CONCAT('%', p_search, '%')
           OR `category` LIKE CONCAT('%', p_search, '%'))
    ORDER BY `created_at` DESC, `id` DESC
    LIMIT p_size OFFSET v_offset;
END$$

-- 4. sp_vp_notification_mark_read
CREATE PROCEDURE `sp_vp_notification_mark_read`(
    IN p_vendor BIGINT,
    IN p_id BIGINT
)
BEGIN
    UPDATE `vp_notifications`
    SET `is_read` = 1, `read_at` = UTC_TIMESTAMP(6)
    WHERE `id` = p_id AND `vendor_id` = p_vendor AND `is_read` = 0;

    SELECT
        `id`,
        `title`,
        `description`,
        `category`,
        `priority`,
        `reference_code`,
        `module_link`,
        `is_read`,
        `read_at`,
        `created_at`
    FROM `vp_notifications`
    WHERE `id` = p_id AND `vendor_id` = p_vendor;
END$$

-- 5. sp_vp_notifications_mark_all_read
CREATE PROCEDURE `sp_vp_notifications_mark_all_read`(
    IN p_vendor BIGINT
)
BEGIN
    UPDATE `vp_notifications`
    SET `is_read` = 1, `read_at` = UTC_TIMESTAMP(6)
    WHERE `vendor_id` = p_vendor AND `is_read` = 0;

    SELECT ROW_COUNT() AS updated_count;
END$$

-- 6. sp_vp_notification_delete
CREATE PROCEDURE `sp_vp_notification_delete`(
    IN p_vendor BIGINT,
    IN p_id BIGINT
)
BEGIN
    DELETE FROM `vp_notifications`
    WHERE `id` = p_id AND `vendor_id` = p_vendor;

    SELECT ROW_COUNT() AS deleted_count;
END$$

DELIMITER ;
