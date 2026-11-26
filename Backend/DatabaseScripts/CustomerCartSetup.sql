-- ==============================================================================
-- PROPOSED CUSTOMER PORTAL – MY CART MODULE SETUP SCRIPT
-- Database: MariaDB 11.8+ / MySQL 8.0+
-- Dedicated table: customer_cart_items
-- Scope: Customer Portal only. Strictly isolated from Vendor, Farmer, Middleman.
-- DO NOT EXECUTE ON SHARED MARIADB WITHOUT EXPLICIT USER APPROVAL.
-- ==============================================================================

-- 1. Create dedicated customer_cart_items table
CREATE TABLE IF NOT EXISTS `customer_cart_items` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `customer_user_id` BIGINT NOT NULL COMMENT 'References Users.Id for authenticated Customer',
  `product_id` BIGINT NOT NULL COMMENT 'References vendor_finished_products.Id',
  `quantity` DECIMAL(12, 2) NOT NULL DEFAULT 1.00 COMMENT 'Requested purchase quantity in product units',
  `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `UQ_customer_cart_user_product` (`customer_user_id`, `product_id`),
  KEY `IX_customer_cart_customer_user_id` (`customer_user_id`),
  KEY `IX_customer_cart_product_id` (`product_id`),
  CONSTRAINT `FK_customer_cart_user`
    FOREIGN KEY (`customer_user_id`) REFERENCES `Users` (`Id`) ON DELETE CASCADE,
  CONSTRAINT `FK_customer_cart_product`
    FOREIGN KEY (`product_id`) REFERENCES `vendor_finished_products` (`Id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==============================================================================
-- POST-CREATION READ-ONLY VERIFICATION QUERIES
-- ==============================================================================
-- SELECT TABLE_NAME, ENGINE, TABLE_ROWS, CREATE_TIME 
-- FROM information_schema.tables 
-- WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'customer_cart_items';
--
-- DESCRIBE customer_cart_items;
--
-- SHOW CREATE TABLE customer_cart_items;

-- ==============================================================================
-- SAFE ROLLBACK SCRIPT (IF NEEDED)
-- ==============================================================================
-- DROP TABLE IF EXISTS `customer_cart_items`;

