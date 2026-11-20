USE `u819242402_arppb`;

DROP TABLE IF EXISTS `farmer_crop_yield_logs`;
DROP TABLE IF EXISTS `farmer_crops`;

CREATE TABLE `farmer_crops` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `crop_code` VARCHAR(50) NOT NULL,
    `farmer_id` BIGINT NOT NULL,
    `crop_name` VARCHAR(100) NOT NULL,
    `crop_category` VARCHAR(60) NOT NULL,
    `crop_variety` VARCHAR(150) NOT NULL,
    `season` VARCHAR(50) NOT NULL,
    `cultivation_area_acres` DECIMAL(8, 2) NOT NULL DEFAULT 0.00,
    `harvest_date` DATE NOT NULL,
    `harvested_quantity` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    `available_quantity` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    `sold_quantity` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    `unit` VARCHAR(30) NOT NULL,
    `expected_selling_price` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    `quality_grade` VARCHAR(100) NULL,
    `storage_location` VARCHAR(255) NOT NULL,
    `crop_description` TEXT NULL,
    `status` VARCHAR(50) NOT NULL,
    `is_active` TINYINT(1) NOT NULL DEFAULT 1,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY `uk_crop_code` (`crop_code`),
    INDEX `idx_farmer_id` (`farmer_id`),
    INDEX `idx_category_season` (`crop_category`, `season`),
    INDEX `idx_status` (`status`),

    CONSTRAINT `fk_farmer_crops_farmer`
        FOREIGN KEY (`farmer_id`)
        REFERENCES `Farmers` (`Id`)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `farmer_crop_yield_logs` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `farmer_crop_id` BIGINT NOT NULL,
    `additional_quantity` DECIMAL(12, 2) NOT NULL,
    `previous_available_quantity` DECIMAL(12, 2) NOT NULL,
    `new_available_quantity` DECIMAL(12, 2) NOT NULL,
    `notes` VARCHAR(255) NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    INDEX `idx_yield_crop_id` (`farmer_crop_id`),

    CONSTRAINT `fk_yield_farmer_crop`
        FOREIGN KEY (`farmer_crop_id`)
        REFERENCES `farmer_crops` (`id`)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;