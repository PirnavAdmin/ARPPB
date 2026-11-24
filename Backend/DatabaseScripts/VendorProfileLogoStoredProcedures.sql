-- ============================================================================
-- ARPPB: Vendor Portal - My Profile stored procedures (MySQL 8+ / MariaDB 11+)
-- Script: VendorProfileStoredProcedures.sql
-- Screen: My Vendor Profile & Treasury Settings (business logo upload / remove, bank detail
--         change notification).
--
-- Scope  : uses the EXISTING vendor_profiles columns logo_data / logo_content_type /
--          logo_file_name and the existing vp_notifications table; no table is altered.
-- Safe   : DROP ... IF EXISTS + CREATE, so it can be re-run at any time.
--
--   1. sp_vp_profile_logo_get    : the logo of the vendor that belongs to a user.
--   2. sp_vp_profile_logo_save   : stores / replaces the logo.
--   3. sp_vp_profile_logo_delete : removes the logo.
--   4. sp_vp_profile_notify      : raises a vendor notification (e.g. bank details updated).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. sp_vp_profile_logo_get   (p_user = Users.Id; no row when there is no logo)
-- ----------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS `sp_vp_profile_logo_get`;
DELIMITER $$
CREATE PROCEDURE `sp_vp_profile_logo_get`(IN p_user BIGINT)
BEGIN
  SELECT vp.logo_content_type, vp.logo_file_name, vp.logo_data
    FROM vendor_profiles vp
    JOIN Vendors v ON v.Id = vp.vendor_id
   WHERE v.UserId = p_user AND vp.logo_data IS NOT NULL
   LIMIT 1;
END$$
DELIMITER ;

-- ----------------------------------------------------------------------------
-- 2. sp_vp_profile_logo_save   (returns updated = 1 when the vendor profile exists)
-- ----------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS `sp_vp_profile_logo_save`;
DELIMITER $$
CREATE PROCEDURE `sp_vp_profile_logo_save`(
  IN p_user BIGINT,
  IN p_type VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  IN p_name VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  IN p_data MEDIUMBLOB)
BEGIN
  DECLARE v_profile BIGINT DEFAULT NULL;

  SELECT vp.id INTO v_profile
    FROM vendor_profiles vp JOIN Vendors v ON v.Id = vp.vendor_id
   WHERE v.UserId = p_user
   LIMIT 1;

  IF v_profile IS NOT NULL THEN
    UPDATE vendor_profiles
       SET logo_data = p_data, logo_content_type = p_type, logo_file_name = p_name, updated_at = UTC_TIMESTAMP(6)
     WHERE id = v_profile;
    SELECT 1 AS updated;
  ELSE
    SELECT 0 AS updated;
  END IF;
END$$
DELIMITER ;

-- ----------------------------------------------------------------------------
-- 3. sp_vp_profile_logo_delete   (returns deleted = 1 when a logo was removed)
-- ----------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS `sp_vp_profile_logo_delete`;
DELIMITER $$
CREATE PROCEDURE `sp_vp_profile_logo_delete`(IN p_user BIGINT)
BEGIN
  DECLARE v_deleted INT DEFAULT 0;
  UPDATE vendor_profiles vp
    JOIN Vendors v ON v.Id = vp.vendor_id
     SET vp.logo_data = NULL, vp.logo_content_type = NULL, vp.logo_file_name = NULL, vp.updated_at = UTC_TIMESTAMP(6)
   WHERE v.UserId = p_user AND vp.logo_data IS NOT NULL;
  SET v_deleted = ROW_COUNT();
  SELECT v_deleted AS deleted;
END$$
DELIMITER ;

-- ----------------------------------------------------------------------------
-- 4. sp_vp_profile_notify   (shown on the Notifications screen; opens My Profile)
-- ----------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS `sp_vp_profile_notify`;
DELIMITER $$
CREATE PROCEDURE `sp_vp_profile_notify`(
  IN p_vendor BIGINT,
  IN p_title VARCHAR(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  IN p_desc VARCHAR(1000) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  IN p_priority VARCHAR(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  IN p_ref VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci)
BEGIN
  INSERT INTO vp_notifications (vendor_id, title, description, category, priority, reference_code, module_link)
  VALUES (p_vendor, p_title, p_desc, 'Profile Update', COALESCE(NULLIF(p_priority, ''), 'Medium'), p_ref, '/vendor/profile');
END$$
DELIMITER ;
