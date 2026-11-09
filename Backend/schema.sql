-- =========================================================================
-- DATABASE: arppb_db
-- AGRI RAW PRODUCT PURCHASE & BILLING (ARPPB)
-- CLEAN ARCHITECTURE REGISTRATION SCHEMA
-- =========================================================================

CREATE DATABASE IF NOT EXISTS `arppb_db` 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE `arppb_db`;

-- 1. BASE USERS TABLE (Central Authentication Table)
CREATE TABLE IF NOT EXISTS `Users` (
    `Id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `FullName` VARCHAR(100) NOT NULL,
    `Email` VARCHAR(100) NOT NULL,
    `Mobile` VARCHAR(10) NOT NULL,
    `PasswordHash` VARCHAR(255) NOT NULL,
    `Role` VARCHAR(20) NOT NULL, -- 'Farmer', 'Customer', 'Supplier', 'Vendor'
    `IsActive` TINYINT(1) NOT NULL DEFAULT 1,
    `CreatedAt` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `UpdatedAt` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    
    CONSTRAINT `IX_Users_Email` UNIQUE (`Email`),
    CONSTRAINT `IX_Users_Mobile` UNIQUE (`Mobile`),
    INDEX `IX_Users_Role` (`Role`),
    INDEX `IX_Users_Login` (`Mobile`, `Email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. FARMERS PROFILE TABLE (1-to-1 with Users)
CREATE TABLE IF NOT EXISTS `Farmers` (
    `Id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `UserId` BIGINT NOT NULL,
    `FarmerCode` VARCHAR(30) NOT NULL,
    `CreatedAt` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `UpdatedAt` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    
    CONSTRAINT `IX_Farmers_UserId` UNIQUE (`UserId`),
    CONSTRAINT `IX_Farmers_FarmerCode` UNIQUE (`FarmerCode`),
    CONSTRAINT `FK_Farmers_Users_UserId` FOREIGN KEY (`UserId`) 
        REFERENCES `Users` (`Id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. CUSTOMERS PROFILE TABLE (1-to-1 with Users)
CREATE TABLE IF NOT EXISTS `Customers` (
    `Id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `UserId` BIGINT NOT NULL,
    `CustomerCode` VARCHAR(30) NOT NULL,
    `CreatedAt` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `UpdatedAt` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    
    CONSTRAINT `IX_Customers_UserId` UNIQUE (`UserId`),
    CONSTRAINT `IX_Customers_CustomerCode` UNIQUE (`CustomerCode`),
    CONSTRAINT `FK_Customers_Users_UserId` FOREIGN KEY (`UserId`) 
        REFERENCES `Users` (`Id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. SUPPLIERS PROFILE TABLE (1-to-1 with Users)
CREATE TABLE IF NOT EXISTS `Suppliers` (
    `Id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `UserId` BIGINT NOT NULL,
    `SupplierCode` VARCHAR(30) NOT NULL,
    `CreatedAt` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `UpdatedAt` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    
    CONSTRAINT `IX_Suppliers_UserId` UNIQUE (`UserId`),
    CONSTRAINT `IX_Suppliers_SupplierCode` UNIQUE (`SupplierCode`),
    CONSTRAINT `FK_Suppliers_Users_UserId` FOREIGN KEY (`UserId`) 
        REFERENCES `Users` (`Id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. VENDORS PROFILE TABLE (1-to-1 with Users)
CREATE TABLE IF NOT EXISTS `Vendors` (
    `Id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `UserId` BIGINT NOT NULL,
    `VendorCode` VARCHAR(30) NOT NULL,
    `CreatedAt` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `UpdatedAt` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    
    CONSTRAINT `IX_Vendors_UserId` UNIQUE (`UserId`),
    CONSTRAINT `IX_Vendors_VendorCode` UNIQUE (`VendorCode`),
    CONSTRAINT `FK_Vendors_Users_UserId` FOREIGN KEY (`UserId`) 
        REFERENCES `Users` (`Id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
