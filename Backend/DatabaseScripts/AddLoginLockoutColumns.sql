-- ARPPB login lockout update
-- Run this only after confirming the existing table is named `Users`.
USE u819242402_arppb;

SHOW TABLES LIKE 'Users';

SET @db_name = DATABASE();

SET @column_exists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = @db_name
      AND TABLE_NAME = 'Users'
      AND COLUMN_NAME = 'failed_login_attempts'
);
SET @sql = IF(
    @column_exists = 0,
    'ALTER TABLE `Users` ADD COLUMN `failed_login_attempts` INT NOT NULL DEFAULT 0',
    'SELECT ''failed_login_attempts already exists'' AS status'
);
PREPARE arppb_stmt FROM @sql;
EXECUTE arppb_stmt;
DEALLOCATE PREPARE arppb_stmt;

SET @column_exists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = @db_name
      AND TABLE_NAME = 'Users'
      AND COLUMN_NAME = 'lockout_end'
);
SET @sql = IF(
    @column_exists = 0,
    'ALTER TABLE `Users` ADD COLUMN `lockout_end` DATETIME NULL',
    'SELECT ''lockout_end already exists'' AS status'
);
PREPARE arppb_stmt FROM @sql;
EXECUTE arppb_stmt;
DEALLOCATE PREPARE arppb_stmt;

SHOW COLUMNS FROM `Users` LIKE 'failed_login_attempts';
SHOW COLUMNS FROM `Users` LIKE 'lockout_end';
