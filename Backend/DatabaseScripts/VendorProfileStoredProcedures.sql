-- ============================================================================
-- Vendor Profile & Bank Account Stored Procedures
-- Author: Backend Team
-- ============================================================================

DROP PROCEDURE IF EXISTS `sp_VendorProfile_GetOrCreateByUserId`;
DROP PROCEDURE IF EXISTS `sp_VendorProfile_GetAll`;
DROP PROCEDURE IF EXISTS `sp_VendorProfile_GetById`;
DROP PROCEDURE IF EXISTS `sp_VendorProfile_Update`;
DROP PROCEDURE IF EXISTS `sp_VendorProfile_GetAllPrimaryBanks`;
DROP PROCEDURE IF EXISTS `sp_VendorProfile_GetPrimaryBank`;
DROP PROCEDURE IF EXISTS `sp_VendorProfile_UpsertBank`;
DROP PROCEDURE IF EXISTS `sp_VendorProfile_IsMobileInUse`;
DROP PROCEDURE IF EXISTS `sp_VendorProfile_HasRecentMobileOtp`;
DROP PROCEDURE IF EXISTS `sp_VendorProfile_UpdateMobileWithHistory`;

DELIMITER $$

-- 1. sp_VendorProfile_GetOrCreateByUserId
CREATE PROCEDURE `sp_VendorProfile_GetOrCreateByUserId`(
    IN p_user_id BIGINT
)
BEGIN
    DECLARE v_user_id BIGINT DEFAULT NULL;
    DECLARE v_full_name VARCHAR(100);
    DECLARE v_mobile VARCHAR(20);
    DECLARE v_email VARCHAR(150);
    DECLARE v_is_active TINYINT(1);
    DECLARE v_created_at DATETIME(6);
    DECLARE v_vendor_id BIGINT DEFAULT NULL;
    DECLARE v_vendor_code VARCHAR(30);
    DECLARE v_profile_id BIGINT DEFAULT NULL;

    SELECT `Id`, `FullName`, `Mobile`, COALESCE(`Email`, ''), `IsActive`, `CreatedAt`
    INTO v_user_id, v_full_name, v_mobile, v_email, v_is_active, v_created_at
    FROM `Users`
    WHERE `Id` = p_user_id AND LOWER(`Role`) = 'vendor'
    LIMIT 1;

    IF v_user_id IS NOT NULL THEN
        SELECT `Id`, `VendorCode`
        INTO v_vendor_id, v_vendor_code
        FROM `Vendors`
        WHERE `UserId` = p_user_id
        LIMIT 1;

        IF v_vendor_id IS NULL THEN
            SET v_vendor_code = CONCAT('VEN-', YEAR(v_created_at), '-', LPAD(v_user_id, 4, '0'));
            INSERT INTO `Vendors` (`UserId`, `VendorCode`, `CreatedAt`, `UpdatedAt`)
            VALUES (v_user_id, v_vendor_code, v_created_at, UTC_TIMESTAMP(6));
            SET v_vendor_id = LAST_INSERT_ID();
        END IF;

        SELECT `id`
        INTO v_profile_id
        FROM `vendor_profiles`
        WHERE `vendor_id` = v_vendor_id OR `vendor_code` = v_vendor_code
        LIMIT 1;

        IF v_profile_id IS NULL THEN
            INSERT INTO `vendor_profiles` (
                `vendor_id`, `vendor_code`, `business_name`, `owner_name`, `mobile`, `email`,
                `gstin`, `business_reg_number`, `ApmcLicenseNumber`, `business_type`, `business_address`,
                `district`, `state`, `pin_code`, `is_active`, `is_verified`,
                `otp_security_enabled`, `gst_billing_enabled`, `created_at`, `updated_at`
            ) VALUES (
                v_vendor_id, v_vendor_code, v_full_name, v_full_name, v_mobile, v_email,
                '', '', NULL, '', '',
                '', '', '', v_is_active, 0,
                1, 1, UTC_TIMESTAMP(6), UTC_TIMESTAMP(6)
            );
            SET v_profile_id = LAST_INSERT_ID();
        ELSE
            UPDATE `vendor_profiles`
            SET `vendor_id` = COALESCE(`vendor_id`, v_vendor_id),
                `mobile` = v_mobile,
                `owner_name` = v_full_name,
                `email` = v_email,
                `updated_at` = UTC_TIMESTAMP(6)
            WHERE `id` = v_profile_id
              AND (`vendor_id` IS NULL OR `mobile` <> v_mobile OR `owner_name` <> v_full_name OR `email` <> v_email);
        END IF;

        SELECT
            vp.`id` AS Id,
            vp.`vendor_id` AS VendorId,
            vp.`vendor_code` AS VendorCode,
            vp.`business_name` AS BusinessName,
            vp.`owner_name` AS OwnerName,
            vp.`mobile` AS Mobile,
            vp.`email` AS Email,
            vp.`gstin` AS Gstin,
            vp.`business_reg_number` AS BusinessRegNumber,
            vp.`ApmcLicenseNumber` AS ApmcLicenseNumber,
            vp.`business_type` AS BusinessType,
            vp.`business_address` AS BusinessAddress,
            vp.`district` AS District,
            vp.`state` AS State,
            vp.`pin_code` AS PinCode,
            vp.`is_active` AS IsActive,
            vp.`is_verified` AS IsVerified,
            vp.`otp_security_enabled` AS OtpSecurityEnabled,
            vp.`gst_billing_enabled` AS GstBillingEnabled,
            vp.`compliance_updated_at` AS ComplianceUpdatedAt,
            vp.`created_at` AS CreatedAt,
            vp.`updated_at` AS UpdatedAt,
            v.`UserId` AS VendorUserId
        FROM `vendor_profiles` vp
        LEFT JOIN `Vendors` v ON v.`Id` = vp.`vendor_id`
        WHERE vp.`id` = v_profile_id
        LIMIT 1;
    END IF;
END$$

-- 2. sp_VendorProfile_GetAll
CREATE PROCEDURE `sp_VendorProfile_GetAll`()
BEGIN
    SELECT
        vp.`id` AS Id,
        vp.`vendor_id` AS VendorId,
        vp.`vendor_code` AS VendorCode,
        vp.`business_name` AS BusinessName,
        vp.`owner_name` AS OwnerName,
        vp.`mobile` AS Mobile,
        vp.`email` AS Email,
        vp.`gstin` AS Gstin,
        vp.`business_reg_number` AS BusinessRegNumber,
        vp.`ApmcLicenseNumber` AS ApmcLicenseNumber,
        vp.`business_type` AS BusinessType,
        vp.`business_address` AS BusinessAddress,
        vp.`district` AS District,
        vp.`state` AS State,
        vp.`pin_code` AS PinCode,
        vp.`is_active` AS IsActive,
        vp.`is_verified` AS IsVerified,
        vp.`otp_security_enabled` AS OtpSecurityEnabled,
        vp.`gst_billing_enabled` AS GstBillingEnabled,
        vp.`compliance_updated_at` AS ComplianceUpdatedAt,
        vp.`created_at` AS CreatedAt,
        vp.`updated_at` AS UpdatedAt,
        v.`UserId` AS VendorUserId
    FROM `vendor_profiles` vp
    LEFT JOIN `Vendors` v ON v.`Id` = vp.`vendor_id`
    ORDER BY vp.`id`;
END$$

-- 3. sp_VendorProfile_GetById
CREATE PROCEDURE `sp_VendorProfile_GetById`(
    IN p_id BIGINT
)
BEGIN
    SELECT
        vp.`id` AS Id,
        vp.`vendor_id` AS VendorId,
        vp.`vendor_code` AS VendorCode,
        vp.`business_name` AS BusinessName,
        vp.`owner_name` AS OwnerName,
        vp.`mobile` AS Mobile,
        vp.`email` AS Email,
        vp.`gstin` AS Gstin,
        vp.`business_reg_number` AS BusinessRegNumber,
        vp.`ApmcLicenseNumber` AS ApmcLicenseNumber,
        vp.`business_type` AS BusinessType,
        vp.`business_address` AS BusinessAddress,
        vp.`district` AS District,
        vp.`state` AS State,
        vp.`pin_code` AS PinCode,
        vp.`is_active` AS IsActive,
        vp.`is_verified` AS IsVerified,
        vp.`otp_security_enabled` AS OtpSecurityEnabled,
        vp.`gst_billing_enabled` AS GstBillingEnabled,
        vp.`compliance_updated_at` AS ComplianceUpdatedAt,
        vp.`created_at` AS CreatedAt,
        vp.`updated_at` AS UpdatedAt,
        v.`UserId` AS VendorUserId
    FROM `vendor_profiles` vp
    LEFT JOIN `Vendors` v ON v.`Id` = vp.`vendor_id`
    WHERE vp.`id` = p_id
    LIMIT 1;
END$$

-- 4. sp_VendorProfile_Update
CREATE PROCEDURE `sp_VendorProfile_Update`(
    IN p_id BIGINT,
    IN p_business_name VARCHAR(200),
    IN p_gstin VARCHAR(15),
    IN p_business_reg_number VARCHAR(50),
    IN p_apmc_license_number VARCHAR(100),
    IN p_business_type VARCHAR(100),
    IN p_business_address VARCHAR(500),
    IN p_district VARCHAR(100),
    IN p_state VARCHAR(100),
    IN p_pin_code VARCHAR(10)
)
BEGIN
    UPDATE `vendor_profiles`
    SET `business_name` = p_business_name,
        `gstin` = p_gstin,
        `business_reg_number` = p_business_reg_number,
        `ApmcLicenseNumber` = p_apmc_license_number,
        `business_type` = p_business_type,
        `business_address` = p_business_address,
        `district` = p_district,
        `state` = p_state,
        `pin_code` = p_pin_code,
        `gst_billing_enabled` = CASE WHEN p_gstin IS NOT NULL AND p_gstin <> '' THEN 1 ELSE `gst_billing_enabled` END,
        `compliance_updated_at` = UTC_TIMESTAMP(6),
        `updated_at` = UTC_TIMESTAMP(6)
    WHERE `id` = p_id;

    CALL `sp_VendorProfile_GetById`(p_id);
END$$

-- 5. sp_VendorProfile_GetAllPrimaryBanks
CREATE PROCEDURE `sp_VendorProfile_GetAllPrimaryBanks`()
BEGIN
    SELECT
        `id` AS Id,
        `vendor_profile_id` AS VendorProfileId,
        `account_holder_name` AS AccountHolderName,
        `bank_name` AS BankName,
        `branch_name` AS BranchName,
        `account_number` AS AccountNumber,
        `ifsc_code` AS IfscCode,
        `is_primary` AS IsPrimary,
        `created_at` AS CreatedAt,
        `updated_at` AS UpdatedAt
    FROM `vendor_bank_accounts`
    WHERE `is_primary` = 1
    ORDER BY `id`;
END$$

-- 6. sp_VendorProfile_GetPrimaryBank
CREATE PROCEDURE `sp_VendorProfile_GetPrimaryBank`(
    IN p_vendor_profile_id BIGINT
)
BEGIN
    SELECT
        `id` AS Id,
        `vendor_profile_id` AS VendorProfileId,
        `account_holder_name` AS AccountHolderName,
        `bank_name` AS BankName,
        `branch_name` AS BranchName,
        `account_number` AS AccountNumber,
        `ifsc_code` AS IfscCode,
        `is_primary` AS IsPrimary,
        `created_at` AS CreatedAt,
        `updated_at` AS UpdatedAt
    FROM `vendor_bank_accounts`
    WHERE `vendor_profile_id` = p_vendor_profile_id AND `is_primary` = 1
    ORDER BY `id`
    LIMIT 1;
END$$

-- 7. sp_VendorProfile_UpsertBank
CREATE PROCEDURE `sp_VendorProfile_UpsertBank`(
    IN p_vendor_profile_id BIGINT,
    IN p_account_holder_name VARCHAR(200),
    IN p_bank_name VARCHAR(150),
    IN p_branch_name VARCHAR(150),
    IN p_account_number VARCHAR(20),
    IN p_ifsc_code VARCHAR(11)
)
BEGIN
    DECLARE v_bank_id BIGINT DEFAULT NULL;

    SELECT `id` INTO v_bank_id
    FROM `vendor_bank_accounts`
    WHERE `vendor_profile_id` = p_vendor_profile_id AND `is_primary` = 1
    ORDER BY `id`
    LIMIT 1;

    IF v_bank_id IS NULL THEN
        INSERT INTO `vendor_bank_accounts` (
            `vendor_profile_id`, `account_holder_name`, `bank_name`, `branch_name`,
            `account_number`, `ifsc_code`, `is_primary`, `created_at`, `updated_at`
        ) VALUES (
            p_vendor_profile_id, p_account_holder_name, p_bank_name, p_branch_name,
            p_account_number, p_ifsc_code, 1, UTC_TIMESTAMP(6), UTC_TIMESTAMP(6)
        );
    ELSE
        UPDATE `vendor_bank_accounts`
        SET `account_holder_name` = p_account_holder_name,
            `bank_name` = p_bank_name,
            `branch_name` = p_branch_name,
            `account_number` = p_account_number,
            `ifsc_code` = p_ifsc_code,
            `updated_at` = UTC_TIMESTAMP(6)
        WHERE `id` = v_bank_id;
    END IF;

    SELECT 1 AS Success;
END$$

-- 8. sp_VendorProfile_IsMobileInUse
CREATE PROCEDURE `sp_VendorProfile_IsMobileInUse`(
    IN p_user_id BIGINT,
    IN p_mobile VARCHAR(20)
)
BEGIN
    DECLARE v_vendor_id BIGINT DEFAULT 0;

    SELECT COALESCE(`Id`, 0) INTO v_vendor_id
    FROM `Vendors`
    WHERE `UserId` = p_user_id
    LIMIT 1;

    SELECT CASE
        WHEN EXISTS (SELECT 1 FROM `Users` WHERE `Mobile` = p_mobile AND `Id` <> p_user_id)
          OR EXISTS (SELECT 1 FROM `vendor_profiles` WHERE `mobile` = p_mobile AND COALESCE(`vendor_id`, 0) <> v_vendor_id)
        THEN 1
        ELSE 0
    END AS IsInUse;
END$$

-- 9. sp_VendorProfile_HasRecentMobileOtp
CREATE PROCEDURE `sp_VendorProfile_HasRecentMobileOtp`(
    IN p_purpose VARCHAR(50),
    IN p_since_utc DATETIME(6)
)
BEGIN
    SELECT CASE
        WHEN EXISTS (SELECT 1 FROM `otp_verifications` WHERE `purpose` = p_purpose AND `created_at` >= p_since_utc)
        THEN 1
        ELSE 0
    END AS HasRecent;
END$$

-- 10. sp_VendorProfile_UpdateMobileWithHistory
CREATE PROCEDURE `sp_VendorProfile_UpdateMobileWithHistory`(
    IN p_user_id BIGINT,
    IN p_new_mobile VARCHAR(20)
)
BEGIN
    DECLARE v_old_mobile VARCHAR(20) DEFAULT NULL;
    DECLARE v_vendor_id BIGINT DEFAULT NULL;
    DECLARE v_profile_id BIGINT DEFAULT NULL;

    SELECT `Mobile` INTO v_old_mobile
    FROM `Users`
    WHERE `Id` = p_user_id AND LOWER(`Role`) = 'vendor'
    LIMIT 1;

    SELECT `Id` INTO v_vendor_id
    FROM `Vendors`
    WHERE `UserId` = p_user_id
    LIMIT 1;

    IF v_vendor_id IS NOT NULL THEN
        SELECT `id` INTO v_profile_id
        FROM `vendor_profiles`
        WHERE `vendor_id` = v_vendor_id
        LIMIT 1;
    END IF;

    IF v_old_mobile IS NULL OR v_vendor_id IS NULL OR v_profile_id IS NULL OR v_old_mobile = p_new_mobile THEN
        SELECT 0 AS Updated;
    ELSE
        INSERT INTO `UserMobileHistories` (`UserId`, `OldMobile`, `NewMobile`, `OldMobileStatus`, `NewMobileStatus`, `ChangedAt`)
        VALUES (p_user_id, v_old_mobile, p_new_mobile, 'Inactive', 'Active', UTC_TIMESTAMP(6));

        UPDATE `Users`
        SET `Mobile` = p_new_mobile, `UpdatedAt` = UTC_TIMESTAMP(6)
        WHERE `Id` = p_user_id;

        UPDATE `vendor_profiles`
        SET `mobile` = p_new_mobile, `updated_at` = UTC_TIMESTAMP(6)
        WHERE `id` = v_profile_id;

        SELECT 1 AS Updated;
    END IF;
END$$

DELIMITER ;
