-- ARPPB authentication updates (MySQL 8+)
-- Select your existing ARPPB database before running this script.
USE `u819242402_arppb`;

-- Add login lockout fields only if missing.
SET @db = DATABASE();
SET @sql = (SELECT IF(COUNT(*) = 0,
  'ALTER TABLE `Users` ADD COLUMN `failed_login_attempts` INT NOT NULL DEFAULT 0',
  'SELECT "failed_login_attempts already exists"')
  FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=@db AND TABLE_NAME='Users' AND COLUMN_NAME='failed_login_attempts');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(COUNT(*) = 0,
  'ALTER TABLE `Users` ADD COLUMN `lockout_end` DATETIME(6) NULL',
  'SELECT "lockout_end already exists"')
  FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=@db AND TABLE_NAME='Users' AND COLUMN_NAME='lockout_end');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- OTP records support both registration and password-reset purposes.
CREATE TABLE IF NOT EXISTS `otp_verifications` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `email` VARCHAR(150) NULL,
  `mobile` VARCHAR(15) NULL,
  `otp_hash` VARCHAR(255) NOT NULL,
  `purpose` VARCHAR(50) NOT NULL,
  `expires_at` DATETIME(6) NOT NULL,
  `attempts` INT NOT NULL DEFAULT 0,
  `verified_at` DATETIME(6) NULL,
  `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  INDEX `IX_otp_email_purpose` (`email`, `purpose`),
  INDEX `IX_otp_mobile_purpose` (`mobile`, `purpose`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Email must be nullable because registration supports mobile-only accounts.
SET @sql = (SELECT IF(IS_NULLABLE = 'NO',
  'ALTER TABLE `Users` MODIFY COLUMN `Email` VARCHAR(100) NULL',
  'SELECT "Users.Email is already nullable"')
  FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=@db AND TABLE_NAME='Users' AND COLUMN_NAME='Email' LIMIT 1);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
