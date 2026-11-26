-- Proposed Customer Notifications Center table setup (MariaDB 11.8+ / MySQL 8+).
-- DO NOT run automatically without DBA / project approval.
-- Dedicated table isolated from vp_notifications, farmer_notifications, and middleman_notifications.

CREATE TABLE IF NOT EXISTS `customer_notifications` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `customer_user_id` BIGINT NOT NULL,
  `title` VARCHAR(200) NOT NULL,
  `message` VARCHAR(1000) NOT NULL,
  `type` VARCHAR(80) NOT NULL,
  `priority` VARCHAR(20) NOT NULL DEFAULT 'Medium',
  `order_code` VARCHAR(50) NULL,
  `transaction_code` VARCHAR(50) NULL,
  `is_read` TINYINT(1) NOT NULL DEFAULT 0,
  `read_at` DATETIME(6) NULL,
  `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  KEY `IX_customer_notifications_user_id` (`customer_user_id`),
  KEY `IX_customer_notifications_user_read` (`customer_user_id`, `is_read`),
  KEY `IX_customer_notifications_user_created` (`customer_user_id`, `created_at`),
  KEY `IX_customer_notifications_user_priority_read` (`customer_user_id`, `priority`, `is_read`),
  KEY `IX_customer_notifications_user_type` (`customer_user_id`, `type`),
  CONSTRAINT `FK_customer_notifications_users`
    FOREIGN KEY (`customer_user_id`) REFERENCES `Users` (`Id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

