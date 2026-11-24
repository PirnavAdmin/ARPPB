-- ========================================================================
-- Vendor Operations Setup: Partners & Directory and Inventory & Processing
-- Safe, additive-only migration script for MySQL 8+
-- NOTE: Does NOT modify any existing tables (Users, Farmers, Vendors, etc.)
-- ========================================================================

-- 1. VENDOR PARTNERS: FARMERS
CREATE TABLE IF NOT EXISTS `vendor_farmers` (
  `Id` BIGINT NOT NULL AUTO_INCREMENT,
  `VendorId` BIGINT NOT NULL DEFAULT 1,
  `FarmerCode` VARCHAR(50) NOT NULL,
  `FullName` VARCHAR(150) NOT NULL,
  `FatherOrSpouseName` VARCHAR(150) NULL,
  `MobileNumber` VARCHAR(20) NOT NULL,
  `Email` VARCHAR(100) NULL,
  `Village` VARCHAR(100) NOT NULL DEFAULT '',
  `District` VARCHAR(100) NOT NULL DEFAULT '',
  `State` VARCHAR(100) NOT NULL DEFAULT '',
  `PinCode` VARCHAR(10) NULL,
  `LandAcres` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `RegisteredCrops` VARCHAR(500) NOT NULL DEFAULT '',
  `BankAccountNumber` VARCHAR(50) NULL,
  `IfscCode` VARCHAR(20) NULL,
  `BankName` VARCHAR(100) NULL,
  `AadhaarNumber` VARCHAR(20) NULL,
  `Status` VARCHAR(20) NOT NULL DEFAULT 'Active',
  `RegisteredAt` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `CreatedAt` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `UpdatedAt` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`Id`),
  UNIQUE KEY `UQ_vendor_farmers_code` (`VendorId`, `FarmerCode`),
  KEY `IX_vendor_farmers_status` (`VendorId`, `Status`),
  KEY `IX_vendor_farmers_mobile` (`MobileNumber`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. VENDOR FARMER PURCHASES (Procurement Transactions)
CREATE TABLE IF NOT EXISTS `vendor_farmer_purchases` (
  `Id` BIGINT NOT NULL AUTO_INCREMENT,
  `FarmerId` BIGINT NOT NULL,
  `PurchaseCode` VARCHAR(50) NOT NULL,
  `BillNumber` VARCHAR(50) NOT NULL,
  `CropName` VARCHAR(100) NOT NULL,
  `CropVariety` VARCHAR(100) NOT NULL,
  `Quantity` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `Unit` VARCHAR(20) NOT NULL DEFAULT 'Quintal',
  `RatePerUnit` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `TotalAmount` DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  `DueAmount` DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  `PaymentStatus` VARCHAR(30) NOT NULL DEFAULT 'Pending',
  `PurchaseDate` DATETIME(6) NOT NULL,
  `CreatedAt` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`Id`),
  KEY `IX_vendor_farmer_purchases_farmer` (`FarmerId`),
  CONSTRAINT `FK_vendor_farmer_purchases_farmer` FOREIGN KEY (`FarmerId`) REFERENCES `vendor_farmers` (`Id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. VENDOR FARMER PAYMENTS (Ledger)
CREATE TABLE IF NOT EXISTS `vendor_farmer_payments` (
  `Id` BIGINT NOT NULL AUTO_INCREMENT,
  `FarmerId` BIGINT NOT NULL,
  `PaymentCode` VARCHAR(50) NOT NULL,
  `VoucherNumber` VARCHAR(50) NOT NULL,
  `Amount` DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  `PaymentMethod` VARCHAR(50) NOT NULL DEFAULT 'Bank Transfer',
  `PaymentDate` DATETIME(6) NOT NULL,
  `ReferenceNumber` VARCHAR(100) NULL,
  `Status` VARCHAR(30) NOT NULL DEFAULT 'Completed',
  `Notes` VARCHAR(255) NULL,
  `CreatedAt` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`Id`),
  KEY `IX_vendor_farmer_payments_farmer` (`FarmerId`),
  CONSTRAINT `FK_vendor_farmer_payments_farmer` FOREIGN KEY (`FarmerId`) REFERENCES `vendor_farmers` (`Id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. VENDOR FARMER OTP LOGS
CREATE TABLE IF NOT EXISTS `vendor_farmer_otp_logs` (
  `Id` BIGINT NOT NULL AUTO_INCREMENT,
  `FarmerId` BIGINT NOT NULL,
  `OtpCode` VARCHAR(10) NOT NULL,
  `Purpose` VARCHAR(50) NOT NULL,
  `ActionDetails` VARCHAR(255) NOT NULL,
  `Status` VARCHAR(30) NOT NULL DEFAULT 'Verified',
  `VerifiedAt` DATETIME(6) NULL,
  `CreatedAt` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`Id`),
  KEY `IX_vendor_farmer_otp_logs_farmer` (`FarmerId`),
  CONSTRAINT `FK_vendor_farmer_otp_logs_farmer` FOREIGN KEY (`FarmerId`) REFERENCES `vendor_farmers` (`Id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. VENDOR PARTNERS: MIDDLEMEN
CREATE TABLE IF NOT EXISTS `vendor_middlemen` (
  `Id` BIGINT NOT NULL AUTO_INCREMENT,
  `VendorId` BIGINT NOT NULL DEFAULT 1,
  `MiddlemanCode` VARCHAR(50) NOT NULL,
  `FullName` VARCHAR(150) NOT NULL,
  `Email` VARCHAR(100) NULL,
  `MobileNumber` VARCHAR(20) NOT NULL,
  `BusinessName` VARCHAR(200) NOT NULL,
  `Gstin` VARCHAR(30) NOT NULL DEFAULT '',
  `Pan` VARCHAR(20) NOT NULL DEFAULT '',
  `MarketYardLocation` VARCHAR(255) NOT NULL DEFAULT '',
  `District` VARCHAR(100) NOT NULL DEFAULT '',
  `State` VARCHAR(100) NOT NULL DEFAULT '',
  `PinCode` VARCHAR(10) NULL,
  `OpeningBalance` DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  `Status` VARCHAR(20) NOT NULL DEFAULT 'Active',
  `RegisteredAt` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `CreatedAt` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `UpdatedAt` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`Id`),
  UNIQUE KEY `UQ_vendor_middlemen_code` (`VendorId`, `MiddlemanCode`),
  KEY `IX_vendor_middlemen_status` (`VendorId`, `Status`),
  KEY `IX_vendor_middlemen_mobile` (`MobileNumber`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. VENDOR MIDDLEMAN PURCHASES (Bulk Lots)
CREATE TABLE IF NOT EXISTS `vendor_middleman_purchases` (
  `Id` BIGINT NOT NULL AUTO_INCREMENT,
  `MiddlemanId` BIGINT NOT NULL,
  `PurchaseCode` VARCHAR(50) NOT NULL,
  `BillNumber` VARCHAR(50) NOT NULL,
  `CropName` VARCHAR(100) NOT NULL,
  `CropVariety` VARCHAR(100) NOT NULL,
  `Quantity` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `Unit` VARCHAR(20) NOT NULL DEFAULT 'Quintal',
  `RatePerUnit` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `TotalAmount` DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  `DueAmount` DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  `PaymentStatus` VARCHAR(30) NOT NULL DEFAULT 'Pending',
  `PurchaseDate` DATETIME(6) NOT NULL,
  `CreatedAt` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`Id`),
  KEY `IX_vendor_middleman_purchases_mid` (`MiddlemanId`),
  CONSTRAINT `FK_vendor_middleman_purchases_mid` FOREIGN KEY (`MiddlemanId`) REFERENCES `vendor_middlemen` (`Id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. VENDOR MIDDLEMAN PAYMENTS (Settlements)
CREATE TABLE IF NOT EXISTS `vendor_middleman_payments` (
  `Id` BIGINT NOT NULL AUTO_INCREMENT,
  `MiddlemanId` BIGINT NOT NULL,
  `PaymentCode` VARCHAR(50) NOT NULL,
  `VoucherNumber` VARCHAR(50) NOT NULL,
  `Amount` DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  `PaymentMethod` VARCHAR(50) NOT NULL DEFAULT 'RTGS/NEFT',
  `PaymentDate` DATETIME(6) NOT NULL,
  `ReferenceNumber` VARCHAR(100) NULL,
  `Status` VARCHAR(30) NOT NULL DEFAULT 'Completed',
  `Notes` VARCHAR(255) NULL,
  `CreatedAt` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`Id`),
  KEY `IX_vendor_middleman_payments_mid` (`MiddlemanId`),
  CONSTRAINT `FK_vendor_middleman_payments_mid` FOREIGN KEY (`MiddlemanId`) REFERENCES `vendor_middlemen` (`Id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. VENDOR MIDDLEMAN OTP LOGS
CREATE TABLE IF NOT EXISTS `vendor_middleman_otp_logs` (
  `Id` BIGINT NOT NULL AUTO_INCREMENT,
  `MiddlemanId` BIGINT NOT NULL,
  `OtpCode` VARCHAR(10) NOT NULL,
  `Purpose` VARCHAR(50) NOT NULL,
  `ActionDetails` VARCHAR(255) NOT NULL,
  `Status` VARCHAR(30) NOT NULL DEFAULT 'Verified',
  `VerifiedAt` DATETIME(6) NULL,
  `CreatedAt` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`Id`),
  KEY `IX_vendor_middleman_otp_logs_mid` (`MiddlemanId`),
  CONSTRAINT `FK_vendor_middleman_otp_logs_mid` FOREIGN KEY (`MiddlemanId`) REFERENCES `vendor_middlemen` (`Id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. VENDOR PARTNERS: CUSTOMERS
CREATE TABLE IF NOT EXISTS `vendor_customers` (
  `Id` BIGINT NOT NULL AUTO_INCREMENT,
  `VendorId` BIGINT NOT NULL DEFAULT 1,
  `CustomerCode` VARCHAR(50) NOT NULL,
  `CustomerName` VARCHAR(150) NOT NULL,
  `BusinessName` VARCHAR(200) NOT NULL,
  `CustomerType` VARCHAR(50) NOT NULL DEFAULT 'Wholesaler',
  `MobileNumber` VARCHAR(20) NOT NULL,
  `Email` VARCHAR(100) NULL,
  `Address` VARCHAR(500) NOT NULL DEFAULT '',
  `District` VARCHAR(100) NOT NULL DEFAULT '',
  `State` VARCHAR(100) NOT NULL DEFAULT '',
  `PinCode` VARCHAR(10) NULL,
  `Gstin` VARCHAR(30) NULL,
  `CreditLimit` DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  `Status` VARCHAR(20) NOT NULL DEFAULT 'Active',
  `CreatedAt` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `UpdatedAt` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`Id`),
  UNIQUE KEY `UQ_vendor_customers_code` (`VendorId`, `CustomerCode`),
  KEY `IX_vendor_customers_status` (`VendorId`, `Status`),
  KEY `IX_vendor_customers_mobile` (`MobileNumber`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. VENDOR CUSTOMER ORDERS
CREATE TABLE IF NOT EXISTS `vendor_customer_orders` (
  `Id` BIGINT NOT NULL AUTO_INCREMENT,
  `CustomerId` BIGINT NOT NULL,
  `OrderCode` VARCHAR(50) NOT NULL,
  `ProductName` VARCHAR(150) NOT NULL,
  `Quantity` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `Unit` VARCHAR(20) NOT NULL DEFAULT 'Quintal',
  `TotalAmount` DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  `DueAmount` DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  `OrderStatus` VARCHAR(30) NOT NULL DEFAULT 'Completed',
  `OrderDate` DATETIME(6) NOT NULL,
  `CreatedAt` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`Id`),
  KEY `IX_vendor_customer_orders_cust` (`CustomerId`),
  CONSTRAINT `FK_vendor_customer_orders_cust` FOREIGN KEY (`CustomerId`) REFERENCES `vendor_customers` (`Id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. VENDOR RAW MATERIAL INVENTORY STOCKS
CREATE TABLE IF NOT EXISTS `vendor_raw_material_stocks` (
  `Id` BIGINT NOT NULL AUTO_INCREMENT,
  `VendorId` BIGINT NOT NULL DEFAULT 1,
  `StockCode` VARCHAR(50) NOT NULL,
  `CropName` VARCHAR(100) NOT NULL,
  `CropVariety` VARCHAR(100) NOT NULL,
  `SupplierName` VARCHAR(150) NOT NULL,
  `SupplierCategory` VARCHAR(30) NOT NULL DEFAULT 'Farmer',
  `PurchaseId` VARCHAR(50) NOT NULL,
  `BatchNumber` VARCHAR(50) NOT NULL,
  `PurchaseDate` DATETIME(6) NOT NULL,
  `PurchasedQuantity` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `ProcessedQuantity` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `AvailableQuantity` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `Unit` VARCHAR(20) NOT NULL DEFAULT 'Quintal',
  `AverageCost` DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  `QualityGrade` VARCHAR(100) NOT NULL DEFAULT 'Grade A (Standard FAQ)',
  `Status` VARCHAR(30) NOT NULL DEFAULT 'In Stock',
  `MinThresholdQuantity` DECIMAL(12,2) NOT NULL DEFAULT 15.00,
  `CreatedAt` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `UpdatedAt` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`Id`),
  UNIQUE KEY `UQ_vendor_raw_material_code` (`VendorId`, `StockCode`),
  KEY `IX_vendor_raw_material_batch` (`BatchNumber`),
  KEY `IX_vendor_raw_material_status` (`VendorId`, `Status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12. VENDOR RAW MATERIAL STOCK MOVEMENTS (Ledger)
CREATE TABLE IF NOT EXISTS `vendor_stock_movements` (
  `Id` BIGINT NOT NULL AUTO_INCREMENT,
  `StockId` BIGINT NOT NULL,
  `MovementCode` VARCHAR(50) NOT NULL,
  `MovementDate` DATETIME(6) NOT NULL,
  `BatchNumber` VARCHAR(50) NOT NULL,
  `CropName` VARCHAR(100) NOT NULL,
  `MovementType` VARCHAR(50) NOT NULL,
  `ReferenceId` VARCHAR(50) NOT NULL,
  `QuantityChange` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `Unit` VARCHAR(20) NOT NULL DEFAULT 'Quintal',
  `BalanceAfter` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `Remarks` VARCHAR(500) NOT NULL DEFAULT '',
  `CreatedAt` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`Id`),
  KEY `IX_vendor_stock_movements_stock` (`StockId`),
  CONSTRAINT `FK_vendor_stock_movements_stock` FOREIGN KEY (`StockId`) REFERENCES `vendor_raw_material_stocks` (`Id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 13. VENDOR PRODUCT PROCESSING BATCHES
CREATE TABLE IF NOT EXISTS `vendor_processing_batches` (
  `Id` BIGINT NOT NULL AUTO_INCREMENT,
  `VendorId` BIGINT NOT NULL DEFAULT 1,
  `ProcessingCode` VARCHAR(50) NOT NULL,
  `BatchNumber` VARCHAR(50) NOT NULL,
  `RawMaterialName` VARCHAR(100) NOT NULL,
  `SourceStockId` VARCHAR(50) NOT NULL,
  `InputQuantity` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `Unit` VARCHAR(20) NOT NULL DEFAULT 'Quintal',
  `WastageQuantity` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `WastagePercentage` DECIMAL(6,2) NOT NULL DEFAULT 0.00,
  `ProcessingExpenses` DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  `TotalBatchCost` DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  `UnitCost` DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  `UnitCostLabel` VARCHAR(50) NOT NULL DEFAULT '₹/Quintal',
  `Status` VARCHAR(30) NOT NULL DEFAULT 'Completed',
  `ProcessingDate` DATETIME(6) NOT NULL,
  `Notes` VARCHAR(500) NULL,
  `CreatedAt` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `UpdatedAt` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`Id`),
  UNIQUE KEY `UQ_vendor_processing_code` (`VendorId`, `ProcessingCode`),
  KEY `IX_vendor_processing_status` (`VendorId`, `Status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 14. VENDOR PRODUCT PROCESSING OUTPUTS (Multiple outputs e.g. Rice + Rice Bran)
CREATE TABLE IF NOT EXISTS `vendor_processing_outputs` (
  `Id` BIGINT NOT NULL AUTO_INCREMENT,
  `ProcessingBatchId` BIGINT NOT NULL,
  `OutputProductName` VARCHAR(150) NOT NULL,
  `OutputQuantity` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `Unit` VARCHAR(20) NOT NULL DEFAULT 'Quintal',
  `OutputType` VARCHAR(30) NOT NULL DEFAULT 'Main Product',
  `CreatedAt` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`Id`),
  KEY `IX_vendor_proc_outputs_batch` (`ProcessingBatchId`),
  CONSTRAINT `FK_vendor_proc_outputs_batch` FOREIGN KEY (`ProcessingBatchId`) REFERENCES `vendor_processing_batches` (`Id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 15. VENDOR FINISHED PRODUCTS INVENTORY
CREATE TABLE IF NOT EXISTS `vendor_finished_products` (
  `Id` BIGINT NOT NULL AUTO_INCREMENT,
  `VendorId` BIGINT NOT NULL DEFAULT 1,
  `ProductCode` VARCHAR(50) NOT NULL,
  `ProductName` VARCHAR(150) NOT NULL,
  `Category` VARCHAR(100) NOT NULL,
  `SourceRawMaterial` VARCHAR(100) NOT NULL,
  `BrandName` VARCHAR(150) NOT NULL,
  `Packaging` VARCHAR(100) NOT NULL,
  `AvailableQuantity` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `SoldQuantity` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `Unit` VARCHAR(20) NOT NULL DEFAULT 'Quintal',
  `MfgDate` DATETIME(6) NOT NULL,
  `ExpiryDate` DATETIME(6) NOT NULL,
  `ProductionCost` DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  `SellingPrice` DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  `ProfitMarginPercentage` DECIMAL(6,2) NOT NULL DEFAULT 0.00,
  `MinThresholdQuantity` DECIMAL(12,2) NOT NULL DEFAULT 10.00,
  `Status` VARCHAR(20) NOT NULL DEFAULT 'Active',
  `ImageUrl` VARCHAR(500) NULL,
  `CreatedAt` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `UpdatedAt` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`Id`),
  UNIQUE KEY `UQ_vendor_finished_product_code` (`VendorId`, `ProductCode`),
  KEY `IX_vendor_finished_product_status` (`VendorId`, `Status`),
  KEY `IX_vendor_finished_product_cat` (`Category`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 16. VENDOR FINISHED PRODUCT MOVEMENTS (Audit History)
CREATE TABLE IF NOT EXISTS `vendor_finished_product_movements` (
  `Id` BIGINT NOT NULL AUTO_INCREMENT,
  `FinishedProductId` BIGINT NOT NULL,
  `MovementCode` VARCHAR(50) NOT NULL,
  `MovementType` VARCHAR(50) NOT NULL,
  `ReferenceId` VARCHAR(50) NOT NULL,
  `QuantityChange` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `Unit` VARCHAR(20) NOT NULL DEFAULT 'Quintal',
  `BalanceAfter` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `MovementDate` DATETIME(6) NOT NULL,
  `Remarks` VARCHAR(500) NOT NULL DEFAULT '',
  `CreatedAt` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`Id`),
  KEY `IX_vendor_fin_prod_movements` (`FinishedProductId`),
  CONSTRAINT `FK_vendor_fin_prod_movements` FOREIGN KEY (`FinishedProductId`) REFERENCES `vendor_finished_products` (`Id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================================================
-- SEED DATA (Exactly matches the 17 Screens UI)
-- ========================================================================

-- Seed Farmers
INSERT INTO `vendor_farmers` 
(`Id`, `VendorId`, `FarmerCode`, `FullName`, `FatherOrSpouseName`, `MobileNumber`, `Village`, `District`, `State`, `RegisteredCrops`, `Status`, `RegisteredAt`)
VALUES
(1, 1, 'FARM-0001', 'Venkateswarlu Reddy', 'S/o Subba Reddy', '+91 9848011223', 'Bethamcherla', 'Nandyal', 'Andhra Pradesh', 'Paddy, Maize', 'Active', '2026-08-10 10:00:00'),
(2, 1, 'FARM-0002', 'Narasimha Rao Kamma', 'S/o Koteswara Rao', '+91 9440122334', 'Duggirala', 'Guntur', 'Andhra Pradesh', 'Turmeric, Chilli', 'Active', '2026-08-12 11:30:00'),
(3, 1, 'FARM-0003', 'Raghavendra Naidu', 'S/o Chennaiah Naidu', '+91 9989233445', 'Kalyandurg', 'Anantapur', 'Andhra Pradesh', 'Groundnut, Cotton', 'Active', '2026-08-15 09:15:00'),
(4, 1, 'FARM-0004', 'Srinivasulu Chowdary', 'S/o Venkatappa', '+91 9866344556', 'Sattenapalle', 'Guntur', 'Andhra Pradesh', 'Chilli, Cotton', 'Active', '2026-08-20 14:00:00'),
(5, 1, 'FARM-0005', 'Bala Subramanyam', 'S/o Ramachandra', '+91 9701455667', 'Allagadda', 'Nandyal', 'Andhra Pradesh', 'Maize, Paddy', 'Active', '2026-08-22 10:00:00'),
(6, 1, 'FARM-0006', 'Obul Reddy Pedda', 'S/o Chinna Reddy', '+91 9490566778', 'Banaganapalle', 'Nandyal', 'Andhra Pradesh', 'Paddy', 'Active', '2026-08-25 12:00:00'),
(7, 1, 'FARM-0007', 'Koteswara Rao', 'S/o Sambasiva Rao', '+91 9177677889', 'Tenali', 'Guntur', 'Andhra Pradesh', 'Turmeric', 'Active', '2026-08-28 15:30:00'),
(8, 1, 'FARM-0008', 'Chandra Sekhar', 'S/o Narayana', '+91 9391788990', 'Dharmavaram', 'Anantapur', 'Andhra Pradesh', 'Groundnut', 'Active', '2026-09-01 09:00:00'),
(9, 1, 'FARM-0009', 'Siva Prasad', 'S/o Ramaiah', '+91 9849899001', 'Mangalagiri', 'Guntur', 'Andhra Pradesh', 'Chilli', 'Active', '2026-09-05 11:00:00'),
(10, 1, 'FARM-0010', 'Ramana Murthy', 'S/o Apparao', '+91 9440900112', 'Pattikonda', 'Kurnool', 'Andhra Pradesh', 'Cotton', 'Active', '2026-09-10 16:00:00'),
(11, 1, 'FARM-0011', 'Anji Babu', 'S/o Veeraiah', '+91 9989011223', 'Yerraguntla', 'YSR Kadapa', 'Andhra Pradesh', 'Groundnut', 'Inactive', '2026-09-15 10:30:00')
ON DUPLICATE KEY UPDATE `FullName` = VALUES(`FullName`);

-- Seed Farmer Purchases
INSERT INTO `vendor_farmer_purchases`
(`Id`, `FarmerId`, `PurchaseCode`, `BillNumber`, `CropName`, `CropVariety`, `Quantity`, `Unit`, `RatePerUnit`, `TotalAmount`, `DueAmount`, `PaymentStatus`, `PurchaseDate`)
VALUES
(1, 1, 'PUR-F-0001', 'BILL-2026-001', 'Paddy', 'BPT 5204 (Sona Masoori)', 120.00, 'Quintal', 2408.33, 289000.00, 111100.00, 'Partially Paid', '2026-10-08 10:00:00'),
(2, 1, 'PUR-F-0009', 'BILL-2026-012', 'Paddy', 'BPT 5204 (Sona Masoori)', 50.00, 'Quintal', 2442.00, 122100.00, 100000.00, 'Pending', '2026-11-05 14:30:00'),
(3, 2, 'PUR-F-0002', 'BILL-2026-003', 'Turmeric', 'Salem Special', 45.00, 'Quintal', 11555.55, 520000.00, 220000.00, 'Partially Paid', '2026-10-12 11:00:00'),
(4, 3, 'PUR-F-0003', 'BILL-2026-004', 'Groundnut', 'K-6 (Kadiri-6)', 80.00, 'Quintal', 6537.50, 523000.00, 200000.00, 'Partially Paid', '2026-10-12 15:00:00'),
(5, 4, 'PUR-F-0004', 'BILL-2026-005', 'Chilli', 'Teja (S17)', 35.00, 'Quintal', 18028.57, 631000.00, 331000.00, 'Partially Paid', '2026-10-16 12:00:00'),
(6, 5, 'PUR-F-0005', 'BILL-2026-006', 'Maize', 'Hybrid Yellow (DHM 117)', 110.00, 'Quintal', 2200.91, 242100.00, 142100.00, 'Partially Paid', '2026-10-20 10:30:00'),
(7, 6, 'PUR-F-0008', 'BILL-2026-011', 'Paddy', 'RNR 15048 (Telangana Sona)', 90.00, 'Quintal', 2480.00, 223200.00, 123200.00, 'Partially Paid', '2026-11-05 09:30:00'),
(8, 7, 'PUR-F-0006', 'BILL-2026-008', 'Turmeric', 'Duggirala Gold', 40.00, 'Quintal', 10500.00, 420000.00, 120000.00, 'Partially Paid', '2026-10-25 16:00:00'),
(9, 8, 'PUR-F-0007', 'BILL-2026-010', 'Groundnut', 'K-6', 40.00, 'Quintal', 5210.00, 208400.00, 166300.00, 'Pending', '2026-10-29 11:30:00')
ON DUPLICATE KEY UPDATE `BillNumber` = VALUES(`BillNumber`);

-- Seed Farmer Payments (Ledger for FARM-0001)
INSERT INTO `vendor_farmer_payments`
(`Id`, `FarmerId`, `PaymentCode`, `VoucherNumber`, `Amount`, `PaymentMethod`, `PaymentDate`, `ReferenceNumber`, `Status`, `Notes`)
VALUES
(1, 1, 'PAY-F-0001', 'VCH-2026-011', 100000.00, 'Bank Transfer (NEFT)', '2026-10-15 11:00:00', 'UTR984801122301', 'Completed', 'Advance settlement for Lot 1'),
(2, 1, 'PAY-F-0002', 'VCH-2026-034', 77900.00, 'Bank Transfer (IMPS)', '2026-10-28 14:15:00', 'UTR984801122302', 'Completed', 'Interim milestone settlement'),
(3, 1, 'PAY-F-0003', 'VCH-2026-056', 22100.00, 'Mandi Voucher / Cash', '2026-11-06 16:45:00', 'VCH-CSH-0089', 'Completed', 'Procurement bonus release')
ON DUPLICATE KEY UPDATE `VoucherNumber` = VALUES(`VoucherNumber`);

-- Seed Farmer OTP Confirmations
INSERT INTO `vendor_farmer_otp_logs`
(`Id`, `FarmerId`, `OtpCode`, `Purpose`, `ActionDetails`, `Status`, `VerifiedAt`, `CreatedAt`)
VALUES
(1, 1, '849201', 'Purchase Confirmation', '120 Quintal Paddy procurement weighment confirmed', 'Verified', '2026-10-08 10:14:22', '2026-10-08 10:10:00'),
(2, 1, '392817', 'Payment Settlement', '₹1,00,000 NEFT transfer voucher acknowledged by farmer', 'Verified', '2026-10-15 11:05:10', '2026-10-15 11:00:00')
ON DUPLICATE KEY UPDATE `OtpCode` = VALUES(`OtpCode`);

-- Seed Middlemen
INSERT INTO `vendor_middlemen`
(`Id`, `VendorId`, `MiddlemanCode`, `FullName`, `Email`, `MobileNumber`, `BusinessName`, `Gstin`, `Pan`, `MarketYardLocation`, `District`, `State`, `OpeningBalance`, `Status`, `RegisteredAt`)
VALUES
(1, 1, 'MID-0001', 'K. Madhusudhan Rao', 'saikrupa.traders@mandicorp.in', '+91 9849100201', 'Sri Sai Krupa Mandi Traders', '37AABCS4812F1Z2', 'AABCS4812F', 'Shop No. 14, Agricultural Market Yard', 'Kurnool', 'Andhra Pradesh', 45000.00, 'Active', '2026-08-05 09:00:00'),
(2, 1, 'MID-0002', 'Ch. Sambasiva Rao', 'sambasiva@gunturmirchiyard.in', '+91 9440811302', 'Guntur Mirchi & Spice Commission Agency', '37AADCG9201M1Z8', 'AADCG9201M', 'Plot 42, Block B, Mirchi Yard', 'Guntur', 'Andhra Pradesh', 0.00, 'Active', '2026-08-07 10:30:00'),
(3, 1, 'MID-0003', 'P. Jaya Prakash Reddy', 'jp.reddy@rayalaseemaagro.in', '+91 9949222403', 'Rayalaseema Groundnut & Oilseeds Trading Co.', '37AAECR1190K1Z4', 'AAECR1190K', 'Gooty Road, Market Yard Gate 2', 'Anantapur', 'Andhra Pradesh', 0.00, 'Active', '2026-08-11 14:00:00'),
(4, 1, 'MID-0004', 'S. Farooq Ahmed', 'farooq@nandyalgrains.in', '+91 9885333504', 'Nandyal Grain & Cereal Brokers LLP', '37AAAFN7731B1Z9', 'AAAFN7731B', 'No. 22/109, Sanjeeva Nagar', 'Nandyal', 'Andhra Pradesh', 0.00, 'Active', '2026-08-14 11:00:00'),
(5, 1, 'MID-0005', 'T. Venkateswara Rao', 'tvrao@krishnatraders.in', '+91 9701444605', 'Krishna Valley Agro Commission Agency', '37AAACK5520P1Z6', 'AAACK5520P', 'Main Road, Mandi Yard', 'Vijayawada', 'Andhra Pradesh', 0.00, 'Active', '2026-08-18 15:00:00'),
(6, 1, 'MID-0006', 'D. Narayana Swamy', 'dnswamy@kadapacotton.in', '+91 9490555706', 'Rayalaseema Cotton & Grain Syndicate', '37AABCR8841L1Z1', 'AABCR8841L', 'Mandi Bazar', 'Kadapa', 'Andhra Pradesh', 0.00, 'Inactive', '2026-08-22 16:30:00')
ON DUPLICATE KEY UPDATE `BusinessName` = VALUES(`BusinessName`);

-- Seed Middleman Purchases
INSERT INTO `vendor_middleman_purchases`
(`Id`, `MiddlemanId`, `PurchaseCode`, `BillNumber`, `CropName`, `CropVariety`, `Quantity`, `Unit`, `RatePerUnit`, `TotalAmount`, `DueAmount`, `PaymentStatus`, `PurchaseDate`)
VALUES
(1, 1, 'PUR-M-0001', 'MANDI-BIL-091', 'Chilli', 'Guntur Sannam (S4)', 140.00, 'Quintal', 2842.86, 398000.00, 193000.00, 'Partially Paid', '2026-10-05 11:30:00'),
(2, 2, 'PUR-M-0004', 'MANDI-BIL-142', 'Chilli', 'Guntur Sannam (S4)', 40.00, 'Quintal', 17300.00, 692000.00, 492000.00, 'Partially Paid', '2026-11-04 15:00:00'),
(3, 3, 'PUR-M-0002', 'MANDI-BIL-105', 'Groundnut', 'K-6 Pods', 70.00, 'Quintal', 6457.14, 452000.00, 312000.00, 'Partially Paid', '2026-10-18 10:00:00'),
(4, 4, 'PUR-M-0003', 'MANDI-BIL-128', 'Maize', 'Yellow Hybrid Grains', 160.00, 'Quintal', 2290.63, 366500.00, 291500.00, 'Partially Paid', '2026-10-24 14:00:00')
ON DUPLICATE KEY UPDATE `BillNumber` = VALUES(`BillNumber`);

-- Seed Middleman Payments (Settlements for MID-0001)
INSERT INTO `vendor_middleman_payments`
(`Id`, `MiddlemanId`, `PaymentCode`, `VoucherNumber`, `Amount`, `PaymentMethod`, `PaymentDate`, `ReferenceNumber`, `Status`, `Notes`)
VALUES
(1, 1, 'PAY-M-0001', 'VCH-MID-0021', 250000.00, 'RTGS / Bank Transfer', '2026-10-20 12:00:00', 'RTGS984910020101', 'Completed', 'Mandi lot initial bulk payment')
ON DUPLICATE KEY UPDATE `VoucherNumber` = VALUES(`VoucherNumber`);

-- Seed Middleman OTP Logs
INSERT INTO `vendor_middleman_otp_logs`
(`Id`, `MiddlemanId`, `OtpCode`, `Purpose`, `ActionDetails`, `Status`, `VerifiedAt`, `CreatedAt`)
VALUES
(1, 1, '519284', 'Bulk Gate Pass Inward', '140 Qtl Mandi Lot gate-inward verification complete', 'Verified', '2026-10-05 11:45:00', '2026-10-05 11:40:00')
ON DUPLICATE KEY UPDATE `OtpCode` = VALUES(`OtpCode`);

-- Seed Customers
INSERT INTO `vendor_customers`
(`Id`, `VendorId`, `CustomerCode`, `CustomerName`, `BusinessName`, `CustomerType`, `MobileNumber`, `Address`, `District`, `State`, `CreditLimit`, `Status`)
VALUES
(1, 1, 'CUST-0001', 'Surya Prakash Somani', 'Annapurna Wholesale Supermart Pvt. Ltd.', 'Wholesaler', '+91 9848500111', 'Plot 104, Industrial Estate, Bellary Road', 'Kurnool', 'Andhra Pradesh', 1000000.00, 'Active'),
(2, 1, 'CUST-0002', 'Venkata Ramana Rao', 'Sri Balaji Provision Stores', 'Retail Store', '+91 9440600222', '14-89, Brodipet 4th Line', 'Guntur', 'Andhra Pradesh', 300000.00, 'Active'),
(3, 1, 'CUST-0003', 'Murali Krishna', 'Rayalaseema Consumer Hub', 'Supermarket', '+91 9989700333', 'B-29, Near Bus Stand', 'Nandyal', 'Andhra Pradesh', 500000.00, 'Active'),
(4, 1, 'CUST-0004', 'Ramesh Chand Jain', 'Mahaveer Trading Corporation', 'Distributor', '+91 9866800444', 'Shop 7, Gandhi Market', 'Anantapur', 'Andhra Pradesh', 800000.00, 'Active'),
(5, 1, 'CUST-0005', 'K. Srinivasa Rao', 'Annadata Foods & Oils', 'Wholesaler', '+91 9701900555', 'D.No 4-12, Main Bazar', 'Tirupati', 'Andhra Pradesh', 600000.00, 'Active'),
(6, 1, 'CUST-0006', 'Syed Abdul Kareem', 'Kareem & Sons Grocery Wholesale', 'Wholesaler', '+91 9490100666', 'RTC Complex Road', 'Kadapa', 'Andhra Pradesh', 400000.00, 'Active'),
(7, 1, 'CUST-0007', 'Naveen Kumar', 'Fresh Mart Organics', 'Retail Store', '+91 9177200777', 'Opp. Municipal Office', 'Ongole', 'Andhra Pradesh', 200000.00, 'Active'),
(8, 1, 'CUST-0008', 'G. Prabhakar', 'Sri Venkateswara Traders', 'Distributor', '+91 9391300888', 'Grain Market Yard Road', 'Nellore', 'Andhra Pradesh', 750000.00, 'Active'),
(9, 1, 'CUST-0009', 'Laxmi Narayana', 'Kaveri Departmental Stores', 'Supermarket', '+91 9849400999', 'High School Road', 'Vijayawada', 'Andhra Pradesh', 500000.00, 'Active'),
(10, 1, 'CUST-0010', 'B. Satyanarayana', 'Coastal Agro Retailers', 'Retail Store', '+91 9440500010', 'Beach Road', 'Machilipatnam', 'Andhra Pradesh', 150000.00, 'Inactive')
ON DUPLICATE KEY UPDATE `BusinessName` = VALUES(`BusinessName`);

-- Seed Customer Orders
INSERT INTO `vendor_customer_orders`
(`Id`, `CustomerId`, `OrderCode`, `ProductName`, `Quantity`, `Unit`, `TotalAmount`, `DueAmount`, `OrderStatus`, `OrderDate`)
VALUES
(1, 1, 'ORD-2026-001', 'Rayalaseema Gold Rice (50 Kg)', 30.00, 'Quintal', 146000.00, 35000.00, 'Completed', '2026-10-25 10:00:00'),
(2, 2, 'ORD-2026-002', 'Guntur Special Chilli Powder', 800.00, 'Kg', 156000.00, 68000.00, 'Completed', '2026-10-28 14:00:00'),
(3, 3, 'ORD-2026-003', 'Nandyal Pure Drop Groundnut Oil', 1000.00, 'Litre', 224500.00, 124500.00, 'Completed', '2026-11-01 11:30:00'),
(4, 4, 'ORD-2026-004', 'Rayalaseema Gold Rice', 40.00, 'Quintal', 195000.00, 85000.00, 'Completed', '2026-11-03 16:00:00'),
(5, 5, 'ORD-2026-005', 'Whole Wheat Atta', 35.00, 'Quintal', 142000.00, 72000.00, 'Completed', '2026-11-06 12:15:00'),
(6, 6, 'ORD-2026-006', 'Pure Groundnut Oil (15L Tin)', 500.00, 'Litre', 115000.00, 65000.00, 'Completed', '2026-11-07 15:30:00'),
(7, 7, 'ORD-2026-007', 'Chilli Powder Pouch (1 Kg)', 600.00, 'Kg', 132000.00, 42000.00, 'Completed', '2026-11-08 10:45:00'),
(8, 8, 'ORD-2026-008', 'Rayalaseema Gold Rice', 25.00, 'Quintal', 112500.00, 99500.00, 'Completed', '2026-11-09 13:00:00')
ON DUPLICATE KEY UPDATE `OrderCode` = VALUES(`OrderCode`);

-- Seed Raw Material Stocks
INSERT INTO `vendor_raw_material_stocks`
(`Id`, `VendorId`, `StockCode`, `CropName`, `CropVariety`, `SupplierName`, `SupplierCategory`, `PurchaseId`, `BatchNumber`, `PurchaseDate`, `PurchasedQuantity`, `ProcessedQuantity`, `AvailableQuantity`, `Unit`, `AverageCost`, `QualityGrade`, `Status`, `MinThresholdQuantity`)
VALUES
(1, 1, 'STK-0013', 'Chilli', 'Guntur Sannam (S4)', 'Guntur Mirchi & Spice Commission Agency', 'Middleman', 'PUR-M-0004', 'BCH-CHI-2026-013', '2026-11-04 15:00:00', 40.00, 0.00, 40.00, 'Quintal', 17300.00, 'Grade A (Export / Premium)', 'In Stock', 10.00),
(2, 1, 'STK-0012', 'Paddy', 'BPT 5204 (Sona Masoori)', 'Venkateswarlu Reddy', 'Farmer', 'PUR-F-0009', 'BCH-PAD-2026-012', '2026-11-05 14:30:00', 50.00, 0.00, 50.00, 'Quintal', 2442.00, 'Grade A (Export / Premium)', 'In Stock', 15.00),
(3, 1, 'STK-0011', 'Paddy', 'RNR 15048 (Telangana Sona)', 'Obul Reddy Pedda', 'Farmer', 'PUR-F-0008', 'BCH-PAD-2026-011', '2026-11-05 09:30:00', 90.00, 0.00, 90.00, 'Quintal', 2480.00, 'Grade A (Export / Premium)', 'In Stock', 15.00),
(4, 1, 'STK-0001', 'Paddy', 'BPT 5204 (Sona Masoori)', 'Venkateswarlu Reddy', 'Farmer', 'PUR-F-0001', 'BCH-PAD-2026-001', '2026-10-08 10:00:00', 120.00, 80.00, 40.00, 'Quintal', 2408.33, 'Grade A (Export / Premium)', 'In Stock', 15.00),
(5, 1, 'STK-0002', 'Groundnut', 'K-6 (Kadiri-6)', 'Raghavendra Naidu', 'Farmer', 'PUR-F-0003', 'BCH-GRO-2026-002', '2026-10-12 15:00:00', 80.00, 68.00, 12.00, 'Quintal', 6537.50, 'Grade A (Export / Premium)', 'Low Stock', 15.00),
(6, 1, 'STK-0003', 'Chilli', 'Teja (S17)', 'Srinivasulu Chowdary', 'Farmer', 'PUR-F-0004', 'BCH-CHI-2026-003', '2026-10-16 12:00:00', 35.00, 27.00, 8.00, 'Quintal', 18028.57, 'Grade A (Export / Premium)', 'Low Stock', 10.00),
(7, 1, 'STK-0004', 'Maize', 'Hybrid Yellow (DHM 117)', 'Bala Subramanyam', 'Farmer', 'PUR-F-0005', 'BCH-MAI-2026-004', '2026-10-20 10:30:00', 110.00, 60.00, 50.00, 'Quintal', 2200.91, 'Grade A (Standard FAQ)', 'In Stock', 20.00),
(8, 1, 'STK-0005', 'Turmeric', 'Salem Special', 'Narasimha Rao Kamma', 'Farmer', 'PUR-F-0002', 'BCH-TUR-2026-005', '2026-10-12 11:00:00', 45.00, 0.00, 45.00, 'Quintal', 11555.55, 'Grade A (Export / Premium)', 'In Stock', 10.00),
(9, 1, 'STK-0006', 'Turmeric', 'Duggirala Gold', 'Koteswara Rao', 'Farmer', 'PUR-F-0006', 'BCH-TUR-2026-006', '2026-10-25 16:00:00', 40.00, 0.00, 40.00, 'Quintal', 10500.00, 'Grade A (Standard FAQ)', 'In Stock', 10.00),
(10, 1, 'STK-0007', 'Groundnut', 'K-6 Pods', 'Chandra Sekhar', 'Farmer', 'PUR-F-0007', 'BCH-GRO-2026-007', '2026-10-29 11:30:00', 40.00, 0.00, 40.00, 'Quintal', 5210.00, 'Grade A (Standard FAQ)', 'In Stock', 15.00),
(11, 1, 'STK-0008', 'Chilli', 'Guntur Sannam (S4)', 'K. Madhusudhan Rao', 'Middleman', 'PUR-M-0001', 'BCH-CHI-2026-008', '2026-10-05 11:30:00', 140.00, 0.00, 140.00, 'Quintal', 2842.86, 'Grade A (Standard FAQ)', 'In Stock', 20.00),
(12, 1, 'STK-0009', 'Paddy', 'Sona Masoori Lot 2', 'Nandyal Grain & Cereal Brokers LLP', 'Middleman', 'PUR-M-0003', 'BCH-PAD-2026-009', '2026-10-24 14:00:00', 160.00, 50.00, 110.00, 'Quintal', 2290.63, 'Grade A (Standard FAQ)', 'In Stock', 25.00),
(13, 1, 'STK-0010', 'Wheat', 'Lokwan Sharbati', 'Direct Agro Depot', 'Middleman', 'PUR-M-0002', 'BCH-WHT-2026-010', '2026-10-28 10:00:00', 110.00, 95.00, 15.00, 'Quintal', 2650.00, 'Grade A (Export / Premium)', 'In Stock', 15.00)
ON DUPLICATE KEY UPDATE `StockCode` = VALUES(`StockCode`);

-- Seed Stock Movement Ledger
INSERT INTO `vendor_stock_movements`
(`Id`, `StockId`, `MovementCode`, `MovementDate`, `BatchNumber`, `CropName`, `MovementType`, `ReferenceId`, `QuantityChange`, `Unit`, `BalanceAfter`, `Remarks`)
VALUES
(1, 12, 'MOV-0020', '2026-11-05 16:00:00', 'BCH-PAD-2026-009 / STK-0009', 'Paddy', 'Processing Issue', 'PROC-0007', -50.00, 'Quintal', 110.00, 'Issued 50 Quintal to Processing Batch PROC-0007 (PRC-RIC-2026-007)'),
(2, 1, 'MOV-0019', '2026-11-05 10:30:00', 'BCH-CHI-2026-013 / STK-0013', 'Chilli', 'Purchase Inward', 'PUR-M-0004', 40.00, 'Quintal', 40.00, 'Confirmed Middleman Purchase from Guntur Mirchi & Spice Commission Agency (OTP Verified)'),
(3, 2, 'MOV-0018', '2026-11-05 09:45:00', 'BCH-PAD-2026-012 / STK-0012', 'Paddy', 'Purchase Inward', 'PUR-F-0009', 50.00, 'Quintal', 50.00, 'Direct Farmer procurement from Venkateswarlu Reddy'),
(4, 6, 'MOV-0017', '2026-10-30 11:00:00', 'BCH-CHI-2026-003 / STK-0003', 'Chilli', 'Processing Issue', 'PROC-0004', -27.00, 'Quintal', 8.00, 'Issued 27 Quintal to Chilli Powder Processing Batch PROC-0004'),
(5, 5, 'MOV-0016', '2026-10-22 14:15:00', 'BCH-GRO-2026-002 / STK-0002', 'Groundnut', 'Processing Issue', 'PROC-0002', -68.00, 'Quintal', 12.00, 'Issued 68 Quintal to Groundnut Oil Extraction Batch PROC-0002'),
(6, 4, 'MOV-0015', '2026-10-10 09:30:00', 'BCH-PAD-2026-001 / STK-0001', 'Paddy', 'Processing Issue', 'PROC-0001', -80.00, 'Quintal', 40.00, 'Issued 80 Quintal to Rice Milling Batch PROC-0001')
ON DUPLICATE KEY UPDATE `MovementCode` = VALUES(`MovementCode`);

-- Seed Product Processing Batches
INSERT INTO `vendor_processing_batches`
(`Id`, `VendorId`, `ProcessingCode`, `BatchNumber`, `RawMaterialName`, `SourceStockId`, `InputQuantity`, `Unit`, `WastageQuantity`, `WastagePercentage`, `ProcessingExpenses`, `TotalBatchCost`, `UnitCost`, `UnitCostLabel`, `Status`, `ProcessingDate`, `Notes`)
VALUES
(1, 1, 'PROC-0001', 'PRC-RIC-2026-001', 'Paddy', 'BCH-PAD-2026-001 (STK-0001)', 80.00, 'Quintal', 18.00, 22.50, 23000.00, 215666.40, 3478.49, '₹3,478.49/Quintal', 'Completed', '2026-10-10 10:00:00', 'Milling of BPT 5204 Sona Masoori Paddy'),
(2, 1, 'PROC-0002', 'PRC-OIL-2026-002', 'Groundnut', 'BCH-GRO-2026-002 (STK-0002)', 68.00, 'Quintal', 9.50, 13.97, 37400.00, 481950.00, 169.11, '₹169.11/Litre', 'Completed', '2026-10-15 11:30:00', 'Expeller cold-press oil extraction from K-6 groundnut'),
(3, 1, 'PROC-0003', 'PRC-WHT-2026-003', 'Wheat', 'BCH-WHT-2026-010 (STK-0010)', 90.00, 'Quintal', 6.00, 6.67, 22000.00, 277857.40, 3307.83, '₹3,307.83/Quintal', 'Completed', '2026-10-18 14:00:00', 'Chakki grinding into high-fiber whole wheat flour'),
(4, 1, 'PROC-0004', 'PRC-CHI-2026-004', 'Chilli', 'BCH-CHI-2026-003 (STK-0003)', 27.00, 'Quintal', 2.70, 10.00, 30000.00, 516771.39, 212.66, '₹212.66/Kg', 'Completed', '2026-10-19 16:00:00', 'Stem cutting, sun drying, and ultra-fine pulverization'),
(5, 1, 'PROC-0005', 'PRC-MAI-2026-005', 'Maize', 'BCH-MAI-2026-004 (STK-0004)', 60.00, 'Quintal', 6.00, 10.00, 15400.00, 147454.60, 2730.64, '₹2,730.64/Quintal', 'Completed', '2026-10-22 09:30:00', 'Flaking and coarse meal processing'),
(6, 1, 'PROC-0006', 'PRC-TUR-2026-006', 'Turmeric', 'BCH-TUR-2026-005 (STK-0005)', 25.00, 'Quintal', 2.50, 10.00, 18500.00, 307388.75, 136.62, '₹136.62/Kg', 'Completed', '2026-10-27 15:00:00', 'Polishing and pure turmeric powder milling'),
(7, 1, 'PROC-0007', 'PRC-RIC-2026-007', 'Paddy', 'BCH-PAD-2026-009 (STK-0009)', 50.00, 'Quintal', 15.50, 31.00, 16600.00, 131131.50, 3800.91, '₹3,800.91/Quintal', 'Completed', '2026-11-05 17:00:00', 'Sona Masoori double-polish processing')
ON DUPLICATE KEY UPDATE `ProcessingCode` = VALUES(`ProcessingCode`);

-- Seed Processing Outputs
INSERT INTO `vendor_processing_outputs`
(`Id`, `ProcessingBatchId`, `OutputProductName`, `OutputQuantity`, `Unit`, `OutputType`)
VALUES
(1, 1, 'Rice', 54.00, 'Quintal', 'Main Product'),
(2, 1, 'Rice Bran (By-product)', 8.00, 'Quintal', 'By-product'),
(3, 2, 'Groundnut Oil', 2850.00, 'Litre', 'Main Product'),
(4, 2, 'Oil Cake (By-product)', 30.00, 'Quintal', 'By-product'),
(5, 3, 'Wheat Flour', 84.00, 'Quintal', 'Main Product'),
(6, 4, 'Chilli Powder', 2430.00, 'Kg', 'Main Product'),
(7, 5, 'Processed Maize Products', 54.00, 'Quintal', 'Main Product')
ON DUPLICATE KEY UPDATE `OutputProductName` = VALUES(`OutputProductName`);

-- Seed Finished Products Inventory
INSERT INTO `vendor_finished_products`
(`Id`, `VendorId`, `ProductCode`, `ProductName`, `Category`, `SourceRawMaterial`, `BrandName`, `Packaging`, `AvailableQuantity`, `SoldQuantity`, `Unit`, `MfgDate`, `ExpiryDate`, `ProductionCost`, `SellingPrice`, `ProfitMarginPercentage`, `MinThresholdQuantity`, `Status`)
VALUES
(1, 1, 'PROD-0001', 'Rice', 'Food Grains & Cereals', 'Paddy', 'Rayalaseema Gold', 'PP Woven Bag 25 Kg / 50 Kg', 57.00, 1200.00, 'Quintal', '2026-11-05 00:00:00', '2027-10-10 00:00:00', 3751.84, 4650.00, 19.32, 15.00, 'Active'),
(2, 1, 'PROD-0002', 'Groundnut Oil', 'Edible Oils', 'Groundnut', 'Nandyal Pure Drop', 'Tin Container 15 Litre Tin', 1650.00, 800.00, 'Litre', '2026-10-15 00:00:00', '2027-07-15 00:00:00', 169.11, 215.00, 21.34, 200.00, 'Active'),
(3, 1, 'PROD-0003', 'Wheat Flour', 'Food Grains & Cereals', 'Wheat', 'Annapurna Shaktibhog', 'PP Woven Bag 50 Kg Bag', 44.00, 450.00, 'Quintal', '2026-10-18 00:00:00', '2027-04-18 00:00:00', 3307.83, 4100.00, 19.32, 10.00, 'Active'),
(4, 1, 'PROD-0004', 'Chilli Powder', 'Spices', 'Chilli', 'Guntur Fire Red', 'Laminated Foil Pack 1 Kg / 5 Kg Pouch', 1230.00, 250.00, 'Kg', '2026-10-19 00:00:00', '2027-10-19 00:00:00', 212.66, 285.00, 25.38, 100.00, 'Active'),
(5, 1, 'PROD-0005', 'Processed Maize Products', 'Food Grains & Cereals', 'Maize', 'Rayalaseema Gold Corn', 'PP Woven Bag 50 Kg Bag', 29.00, 120.00, 'Quintal', '2026-10-22 00:00:00', '2027-06-22 00:00:00', 2730.64, 3400.00, 19.69, 10.00, 'Active'),
(6, 1, 'PROD-0006', 'Pure Turmeric Powder', 'Spices', 'Turmeric', 'Kasturi Gold', 'Aluminium Foil Pouch 500g / 10 Kg', 1500.00, 50.00, 'Kg', '2026-10-27 00:00:00', '2027-10-27 00:00:00', 135.00, 185.00, 27.03, 100.00, 'Active'),
(7, 1, 'PROD-0007', 'Rice Bran FAQ', 'By-products & Animal Feed', 'Paddy', 'Rayalaseema Cattle Feed', 'Gunny Bag 50 Kg Bag', 8.00, 25.00, 'Quintal', '2026-10-10 00:00:00', '2027-02-10 00:00:00', 1450.00, 1950.00, 25.64, 10.00, 'Active')
ON DUPLICATE KEY UPDATE `ProductName` = VALUES(`ProductName`);

-- Seed Finished Product Movements
INSERT INTO `vendor_finished_product_movements`
(`Id`, `FinishedProductId`, `MovementCode`, `MovementType`, `ReferenceId`, `QuantityChange`, `Unit`, `BalanceAfter`, `MovementDate`, `Remarks`)
VALUES
(1, 1, 'FMOV-0001', 'Production Output', 'PROC-0001', 54.00, 'Quintal', 54.00, '2026-10-10 12:00:00', 'Generated from Milling Batch PROC-0001'),
(2, 1, 'FMOV-0002', 'Sales Dispatch', 'ORD-2026-001', -30.00, 'Quintal', 24.00, '2026-10-25 11:00:00', 'Dispatched to Annapurna Wholesale Supermart'),
(3, 1, 'FMOV-0003', 'Production Output', 'PROC-0007', 33.00, 'Quintal', 57.00, '2026-11-05 18:00:00', 'Generated from Second Milling Batch PROC-0007'),
(4, 2, 'FMOV-0004', 'Production Output', 'PROC-0002', 2850.00, 'Litre', 2850.00, '2026-10-15 14:00:00', 'Generated from Cold-press Extraction PROC-0002'),
(5, 2, 'FMOV-0005', 'Sales Dispatch', 'ORD-2026-003', -1000.00, 'Litre', 1850.00, '2026-11-01 12:00:00', 'Dispatched to Rayalaseema Consumer Hub'),
(6, 2, 'FMOV-0006', 'Sales Dispatch', 'ORD-2026-006', -200.00, 'Litre', 1650.00, '2026-11-07 16:00:00', 'Dispatched to Kareem & Sons Grocery Wholesale')
ON DUPLICATE KEY UPDATE `MovementCode` = VALUES(`MovementCode`);

-- Ensure ApmcLicenseNumber column exists on vendor_profiles
ALTER TABLE `vendor_profiles` ADD COLUMN IF NOT EXISTS `ApmcLicenseNumber` VARCHAR(100) NULL AFTER `business_reg_number`;

