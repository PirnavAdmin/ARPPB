-- ==================================================================================
-- AgriConnect (ARPPB) - Middleman Module Stored Procedures Compatibility & Fixes
-- Target DB: MariaDB (u819242402_arppb) on srv1061.hstgr.io:3306
--
-- PURPOSE:
-- 1. Provides 100% bidirectional compatibility for all Middleman stored procedures:
--    Supports BOTH naming conventions seamlessly:
--    - With underscore:    sp_Middleman_...
--    - Without underscore: sp_Middleman...
--    Prevents MariaDB ERROR 1305 (PROCEDURE does not exist) when called from
--    phpMyAdmin, MySQL Workbench, Swagger, or backend services.
-- 2. Implements missing stored procedures:
--    - sp_MiddlemanUpdateFarmer / sp_Middleman_UpdateFarmer
--    - sp_MiddlemanGetPurchaseById / sp_Middleman_GetPurchaseById
-- 3. Ensures strict UTF-8 Unicode collation (utf8mb4_unicode_ci) to eliminate
--    MariaDB 11.4 utf8mb4_uca1400_ai_ci collation mismatch errors.
-- ==================================================================================

USE `u819242402_arppb`;

DELIMITER $$

-- ==================================================================================
-- SECTION 1: MISSING PROCEDURES (Farmer Update & Purchase By ID)
-- ==================================================================================

DROP PROCEDURE IF EXISTS `sp_MiddlemanUpdateFarmer`$$
CREATE PROCEDURE `sp_MiddlemanUpdateFarmer`(
    IN p_middleman_id BIGINT,
    IN p_farmer_id VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_name VARCHAR(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_mobile VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_email VARCHAR(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_village VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_mandal VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_district VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_state VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_pincode VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_address VARCHAR(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_crops TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_status VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_notes TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
)
BEGIN
    UPDATE `middleman_farmers`
    SET
        `name` = IFNULL(p_name, `name`),
        `mobile` = IFNULL(p_mobile, `mobile`),
        `email` = IFNULL(p_email, `email`),
        `village` = IFNULL(p_village, `village`),
        `mandal` = IFNULL(p_mandal, `mandal`),
        `district` = IFNULL(p_district, `district`),
        `state` = IFNULL(p_state, `state`),
        `pincode` = IFNULL(p_pincode, `pincode`),
        `complete_address` = IFNULL(p_address, `complete_address`),
        `crops` = IFNULL(p_crops, `crops`),
        `status` = IFNULL(p_status, `status`),
        `notes` = IFNULL(p_notes, `notes`),
        `updated_at` = NOW(6)
    WHERE `middleman_id` = p_middleman_id
      AND (`farmer_code` = p_farmer_id OR CAST(`id` AS CHAR) = p_farmer_id);

    CALL sp_MiddlemanGetFarmerById(p_middleman_id, p_farmer_id);
END$$

DROP PROCEDURE IF EXISTS `sp_Middleman_UpdateFarmer`$$
CREATE PROCEDURE `sp_Middleman_UpdateFarmer`(
    IN p_middleman_id BIGINT,
    IN p_farmer_id VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_name VARCHAR(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_mobile VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_email VARCHAR(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_village VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_mandal VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_district VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_state VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_pincode VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_address VARCHAR(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_crops TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_status VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_notes TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
)
BEGIN
    CALL sp_MiddlemanUpdateFarmer(
        p_middleman_id, p_farmer_id, p_name, p_mobile, p_email,
        p_village, p_mandal, p_district, p_state, p_pincode,
        p_address, p_crops, p_status, p_notes
    );
END$$

DROP PROCEDURE IF EXISTS `sp_MiddlemanGetPurchaseById`$$
CREATE PROCEDURE `sp_MiddlemanGetPurchaseById`(
    IN p_middleman_id BIGINT,
    IN p_purchase_id VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
)
BEGIN
    SELECT 
        `id` AS Id,
        `middleman_id` AS MiddlemanId,
        `purchase_code` AS PurchaseId,
        `farmer_id` AS FarmerId,
        `farmer_name` AS FarmerName,
        `farmer_mobile` AS FarmerMobile,
        `crop_name` AS CropName,
        `variety` AS Variety,
        `quality_grade` AS QualityGrade,
        `quantity` AS Quantity,
        `unit` AS Unit,
        `rate` AS Rate,
        `subtotal` AS Subtotal,
        `transportation_charges` AS TransportationCharges,
        `loading_charges` AS LoadingCharges,
        `other_charges` AS OtherCharges,
        `additional_charges` AS AdditionalCharges,
        `total_amount` AS TotalAmount,
        `purchase_date` AS PurchaseDate,
        `expected_payment_date` AS ExpectedPaymentDate,
        `pickup_location` AS PickupLocation,
        `delivery_date` AS DeliveryDate,
        `status` AS Status,
        `otp_status` AS OtpStatus,
        `notes` AS Notes,
        `created_at` AS CreatedAt,
        `updated_at` AS UpdatedAt
    FROM `middleman_purchases`
    WHERE `middleman_id` = p_middleman_id
      AND (`purchase_code` = p_purchase_id OR CAST(`id` AS CHAR) = p_purchase_id)
    LIMIT 1;
END$$

DROP PROCEDURE IF EXISTS `sp_Middleman_GetPurchaseById`$$
CREATE PROCEDURE `sp_Middleman_GetPurchaseById`(
    IN p_middleman_id BIGINT,
    IN p_purchase_id VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
)
BEGIN
    CALL sp_MiddlemanGetPurchaseById(p_middleman_id, p_purchase_id);
END$$


-- ==================================================================================
-- SECTION 2: UNDERSCORE ALIASES FOR FARMER & PURCHASE MODULES
-- ==================================================================================

DROP PROCEDURE IF EXISTS `sp_Middleman_GetFarmers`$$
CREATE PROCEDURE `sp_Middleman_GetFarmers`(
    IN p_middleman_id BIGINT,
    IN p_search VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_crop VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_district VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_status VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_offset INT,
    IN p_limit INT
)
BEGIN
    CALL sp_MiddlemanGetFarmers(p_middleman_id, p_search, p_crop, p_district, p_status, p_offset, p_limit);
END$$

DROP PROCEDURE IF EXISTS `sp_Middleman_GetFarmerById`$$
CREATE PROCEDURE `sp_Middleman_GetFarmerById`(
    IN p_middleman_id BIGINT,
    IN p_farmer_code VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
)
BEGIN
    CALL sp_MiddlemanGetFarmerById(p_middleman_id, p_farmer_code);
END$$

DROP PROCEDURE IF EXISTS `sp_Middleman_RegisterFarmer`$$
CREATE PROCEDURE `sp_Middleman_RegisterFarmer`(
    IN p_middleman_id BIGINT,
    IN p_name VARCHAR(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_mobile VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_email VARCHAR(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_village VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_mandal VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_district VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_state VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_pincode VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_address VARCHAR(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_crops TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_notes TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
)
BEGIN
    CALL sp_MiddlemanRegisterFarmer(
        p_middleman_id, p_name, p_mobile, p_email, p_village,
        p_mandal, p_district, p_state, p_pincode, p_address, p_crops, p_notes
    );
END$$

DROP PROCEDURE IF EXISTS `sp_Middleman_GetFarmerHistory`$$
CREATE PROCEDURE `sp_Middleman_GetFarmerHistory`(
    IN p_middleman_id BIGINT,
    IN p_farmer_code VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
)
BEGIN
    CALL sp_MiddlemanGetFarmerHistory(p_middleman_id, p_farmer_code);
END$$

DROP PROCEDURE IF EXISTS `sp_Middleman_CreatePurchase`$$
CREATE PROCEDURE `sp_Middleman_CreatePurchase`(
    IN p_middleman_id BIGINT,
    IN p_farmer_id VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_farmer_name VARCHAR(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_farmer_mobile VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_crop_name VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_variety VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_quality_grade VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_quantity DECIMAL(12,2),
    IN p_unit VARCHAR(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_rate DECIMAL(12,2),
    IN p_transport_charges DECIMAL(12,2),
    IN p_loading_charges DECIMAL(12,2),
    IN p_other_charges DECIMAL(12,2),
    IN p_purchase_date DATE,
    IN p_expected_payment_date DATE,
    IN p_pickup_location VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_delivery_date DATE,
    IN p_notes TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_is_draft BOOLEAN
)
BEGIN
    CALL sp_MiddlemanCreatePurchase(
        p_middleman_id, p_farmer_id, p_farmer_name, p_farmer_mobile,
        p_crop_name, p_variety, p_quality_grade, p_quantity, p_unit,
        p_rate, p_transport_charges, p_loading_charges, p_other_charges,
        p_purchase_date, p_expected_payment_date, p_pickup_location,
        p_delivery_date, p_notes, p_is_draft
    );
END$$

DROP PROCEDURE IF EXISTS `sp_Middleman_GetPurchases`$$
CREATE PROCEDURE `sp_Middleman_GetPurchases`(
    IN p_middleman_id BIGINT,
    IN p_status VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_search VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_offset INT,
    IN p_limit INT
)
BEGIN
    CALL sp_MiddlemanGetPurchases(p_middleman_id, p_status, p_search, p_offset, p_limit);
END$$


-- ==================================================================================
-- SECTION 3: UNDERSCORE ALIASES FOR INVENTORY MODULE
-- ==================================================================================

DROP PROCEDURE IF EXISTS `sp_Middleman_GetInventoryBatches`$$
CREATE PROCEDURE `sp_Middleman_GetInventoryBatches`(
    IN p_middleman_id BIGINT,
    IN p_search VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_crop VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_quality VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_status VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_offset INT,
    IN p_limit INT
)
BEGIN
    CALL sp_MiddlemanGetInventoryBatches(p_middleman_id, p_search, p_crop, p_quality, p_status, p_offset, p_limit);
END$$

DROP PROCEDURE IF EXISTS `sp_Middleman_GetInventoryBatchById`$$
CREATE PROCEDURE `sp_Middleman_GetInventoryBatchById`(
    IN p_middleman_id BIGINT,
    IN p_batch_id VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
)
BEGIN
    CALL sp_MiddlemanGetInventoryBatchById(p_middleman_id, p_batch_id);
END$$

DROP PROCEDURE IF EXISTS `sp_Middleman_GetInventorySummary`$$
CREATE PROCEDURE `sp_Middleman_GetInventorySummary`(
    IN p_middleman_id BIGINT
)
BEGIN
    CALL sp_MiddlemanGetInventorySummary(p_middleman_id);
END$$

DROP PROCEDURE IF EXISTS `sp_Middleman_UpdateInventoryBatch`$$
CREATE PROCEDURE `sp_Middleman_UpdateInventoryBatch`(
    IN p_middleman_id BIGINT,
    IN p_id BIGINT,
    IN p_available_quantity DECIMAL(12,2),
    IN p_sold_quantity DECIMAL(12,2),
    IN p_storage_location VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_minimum_threshold DECIMAL(12,2),
    IN p_status VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
)
BEGIN
    CALL sp_MiddlemanUpdateInventoryBatch(p_middleman_id, p_id, p_available_quantity, p_sold_quantity, p_storage_location, p_minimum_threshold, p_status);
END$$


-- ==================================================================================
-- SECTION 4: UNDERSCORE ALIASES FOR LEDGER & DASHBOARD MODULES
-- ==================================================================================

DROP PROCEDURE IF EXISTS `sp_Middleman_GetLedgerEntries`$$
CREATE PROCEDURE `sp_Middleman_GetLedgerEntries`(
    IN p_middleman_id BIGINT,
    IN p_party_type VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_status VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_search VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_offset INT,
    IN p_limit INT
)
BEGIN
    CALL sp_MiddlemanGetLedgerEntries(p_middleman_id, p_party_type, p_status, p_search, p_offset, p_limit);
END$$

DROP PROCEDURE IF EXISTS `sp_Middleman_GetLedgerSummary`$$
CREATE PROCEDURE `sp_Middleman_GetLedgerSummary`(
    IN p_middleman_id BIGINT
)
BEGIN
    CALL sp_MiddlemanGetLedgerSummary(p_middleman_id);
END$$

DROP PROCEDURE IF EXISTS `sp_Middleman_SettleLedgerEntry`$$
CREATE PROCEDURE `sp_Middleman_SettleLedgerEntry`(
    IN p_entry_id BIGINT,
    IN p_middleman_id BIGINT,
    IN p_settle_amount DECIMAL(18,2),
    IN p_payment_mode VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_notes VARCHAR(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
)
BEGIN
    CALL sp_MiddlemanSettleLedgerEntry(p_entry_id, p_middleman_id, p_settle_amount, p_payment_mode, p_notes);
END$$

DROP PROCEDURE IF EXISTS `sp_Middleman_GetDashboardMetrics`$$
CREATE PROCEDURE `sp_Middleman_GetDashboardMetrics`(
    IN p_middleman_id BIGINT
)
BEGIN
    CALL sp_MiddlemanGetDashboardMetrics(p_middleman_id);
END$$

DROP PROCEDURE IF EXISTS `sp_Middleman_GetRecentTransactions`$$
CREATE PROCEDURE `sp_Middleman_GetRecentTransactions`(
    IN p_middleman_id BIGINT,
    IN p_limit INT
)
BEGIN
    CALL sp_MiddlemanGetRecentTransactions(p_middleman_id, p_limit);
END$$

DROP PROCEDURE IF EXISTS `sp_Middleman_GetCropwiseInventory`$$
CREATE PROCEDURE `sp_Middleman_GetCropwiseInventory`(
    IN p_middleman_id BIGINT
)
BEGIN
    CALL sp_MiddlemanGetCropwiseInventory(p_middleman_id);
END$$

DROP PROCEDURE IF EXISTS `sp_Middleman_GetPendingConfirmations`$$
CREATE PROCEDURE `sp_Middleman_GetPendingConfirmations`(
    IN p_middleman_id BIGINT
)
BEGIN
    CALL sp_MiddlemanGetPendingConfirmations(p_middleman_id);
END$$


-- ==================================================================================
-- SECTION 5: UNDERSCORE ALIASES FOR NOTIFICATION MODULE
-- ==================================================================================

DROP PROCEDURE IF EXISTS `sp_Middleman_GetNotifications`$$
CREATE PROCEDURE `sp_Middleman_GetNotifications`(
    IN p_user_id BIGINT,
    IN p_search VARCHAR(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_category VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_priority VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_status VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_time_range VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_offset INT,
    IN p_page_size INT
)
BEGIN
    CALL sp_MiddlemanGetNotifications(p_user_id, p_search, p_category, p_priority, p_status, p_time_range, p_offset, p_page_size);
END$$

DROP PROCEDURE IF EXISTS `sp_Middleman_GetNotificationStatus`$$
CREATE PROCEDURE `sp_Middleman_GetNotificationStatus`(
    IN p_user_id BIGINT
)
BEGIN
    CALL sp_MiddlemanGetNotificationStatus(p_user_id);
END$$

DROP PROCEDURE IF EXISTS `sp_Middleman_GetLatestNotifications`$$
CREATE PROCEDURE `sp_Middleman_GetLatestNotifications`(
    IN p_user_id BIGINT,
    IN p_take INT
)
BEGIN
    CALL sp_MiddlemanGetLatestNotifications(p_user_id, p_take);
END$$

DROP PROCEDURE IF EXISTS `sp_Middleman_CountNotifications`$$
CREATE PROCEDURE `sp_Middleman_CountNotifications`(
    IN p_user_id BIGINT,
    IN p_search VARCHAR(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_category VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_priority VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_status VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_time_range VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
)
BEGIN
    CALL sp_MiddlemanCountNotifications(p_user_id, p_search, p_category, p_priority, p_status, p_time_range);
END$$

DROP PROCEDURE IF EXISTS `sp_Middleman_CreateNotification`$$
CREATE PROCEDURE `sp_Middleman_CreateNotification`(
    IN p_user_id BIGINT,
    IN p_title VARCHAR(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_description VARCHAR(1000) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_category VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_priority VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_actor_name VARCHAR(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_reference_number VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_module_url VARCHAR(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
)
BEGIN
    CALL sp_MiddlemanCreateNotification(p_user_id, p_title, p_description, p_category, p_priority, p_actor_name, p_reference_number, p_module_url);
END$$

DROP PROCEDURE IF EXISTS `sp_Middleman_MarkNotificationRead`$$
CREATE PROCEDURE `sp_Middleman_MarkNotificationRead`(
    IN p_user_id BIGINT,
    IN p_notification_id BIGINT
)
BEGIN
    CALL sp_MiddlemanMarkNotificationRead(p_user_id, p_notification_id);
END$$

DROP PROCEDURE IF EXISTS `sp_Middleman_MarkAllNotificationsRead`$$
CREATE PROCEDURE `sp_Middleman_MarkAllNotificationsRead`(
    IN p_user_id BIGINT
)
BEGIN
    CALL sp_MiddlemanMarkAllNotificationsRead(p_user_id);
END$$

DROP PROCEDURE IF EXISTS `sp_Middleman_DeleteNotification`$$
CREATE PROCEDURE `sp_Middleman_DeleteNotification`(
    IN p_user_id BIGINT,
    IN p_notification_id BIGINT
)
BEGIN
    CALL sp_MiddlemanDeleteNotification(p_user_id, p_notification_id);
END$$


-- ==================================================================================
-- SECTION 6: NON-UNDERSCORE ALIASES FOR VENDOR & VENDOR SALES MODULES
-- ==================================================================================

DROP PROCEDURE IF EXISTS `sp_MiddlemanGetVendors`$$
CREATE PROCEDURE `sp_MiddlemanGetVendors`(
    IN p_middleman_id BIGINT,
    IN p_search VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_type VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_district VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_offset INT,
    IN p_limit INT
)
BEGIN
    CALL sp_Middleman_GetVendors(p_middleman_id, p_search, p_type, p_district, p_offset, p_limit);
END$$

DROP PROCEDURE IF EXISTS `sp_MiddlemanGetVendorById`$$
CREATE PROCEDURE `sp_MiddlemanGetVendorById`(
    IN p_middleman_id BIGINT,
    IN p_vendor_id VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
)
BEGIN
    CALL sp_Middleman_GetVendorById(p_middleman_id, p_vendor_id);
END$$

DROP PROCEDURE IF EXISTS `sp_MiddlemanRegisterVendor`$$
CREATE PROCEDURE `sp_MiddlemanRegisterVendor`(
    IN p_middleman_id BIGINT,
    IN p_business_name VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_owner_name VARCHAR(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_mobile VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_business_type VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_gst_number VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_email VARCHAR(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_address VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_district VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_state VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_pin_code VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_notes TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
)
BEGIN
    CALL sp_Middleman_RegisterVendor(
        p_middleman_id, p_business_name, p_owner_name, p_mobile,
        p_business_type, p_gst_number, p_email, p_address,
        p_district, p_state, p_pin_code, p_notes
    );
END$$

DROP PROCEDURE IF EXISTS `sp_MiddlemanUpdateVendor`$$
CREATE PROCEDURE `sp_MiddlemanUpdateVendor`(
    IN p_middleman_id BIGINT,
    IN p_vendor_id VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_business_name VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_owner_name VARCHAR(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_mobile VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_business_type VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_gst_number VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_email VARCHAR(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_address VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_district VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_state VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_pin_code VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_status VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_notes TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
)
BEGIN
    CALL sp_Middleman_UpdateVendor(
        p_middleman_id, p_vendor_id, p_business_name, p_owner_name,
        p_mobile, p_business_type, p_gst_number, p_email,
        p_address, p_district, p_state, p_pin_code, p_status, p_notes
    );
END$$

DROP PROCEDURE IF EXISTS `sp_MiddlemanGetVendorSales`$$
CREATE PROCEDURE `sp_MiddlemanGetVendorSales`(
    IN p_middleman_id BIGINT,
    IN p_search VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_status VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_offset INT,
    IN p_limit INT
)
BEGIN
    CALL sp_Middleman_GetVendorSales(p_middleman_id, p_search, p_status, p_offset, p_limit);
END$$

DROP PROCEDURE IF EXISTS `sp_MiddlemanGetVendorSaleById`$$
CREATE PROCEDURE `sp_MiddlemanGetVendorSaleById`(
    IN p_middleman_id BIGINT,
    IN p_sale_id VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
)
BEGIN
    CALL sp_Middleman_GetVendorSaleById(p_middleman_id, p_sale_id);
END$$

DROP PROCEDURE IF EXISTS `sp_MiddlemanCreateVendorSale`$$
CREATE PROCEDURE `sp_MiddlemanCreateVendorSale`(
    IN p_middleman_id BIGINT,
    IN p_vendor_id VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_crop_name VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_variety VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_quality_grade VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_quantity DECIMAL(18,2),
    IN p_unit VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_rate DECIMAL(18,2),
    IN p_transportation_charges DECIMAL(18,2),
    IN p_other_charges DECIMAL(18,2),
    IN p_sales_date DATETIME,
    IN p_expected_delivery_date DATETIME,
    IN p_expected_payment_date DATETIME,
    IN p_delivery_location VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_notes TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_is_draft BOOLEAN
)
BEGIN
    CALL sp_Middleman_CreateVendorSale(
        p_middleman_id, p_vendor_id, p_crop_name, p_variety,
        p_quality_grade, p_quantity, p_unit, p_rate,
        p_transportation_charges, p_other_charges, p_sales_date,
        p_expected_delivery_date, p_expected_payment_date,
        p_delivery_location, p_notes, p_is_draft
    );
END$$

DELIMITER ;
