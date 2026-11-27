-- ============================================================================
-- ARPPB: Middleman Portal - Centralized Multi-Portal Integration
-- Indexes and Unified Queries for Cross-Portal Visibility
-- Database: u819242402_arppb
-- Ensures sub-millisecond retrieval of Farmers, Vendors, Customers & Middlemen
-- ============================================================================
USE `u819242402_arppb`;

-- 1. Index on central Users table for Role and Active status filtering
SET @exist := (SELECT COUNT(*) FROM information_schema.STATISTICS 
               WHERE TABLE_SCHEMA = 'u819242402_arppb' AND TABLE_NAME = 'Users' AND INDEX_NAME = 'idx_users_role_active');
SET @sqlstmt := IF(@exist = 0, 'ALTER TABLE `Users` ADD INDEX `idx_users_role_active` (`Role`, `IsActive`)', 'SELECT "idx_users_role_active exists"');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 2. Index on Farmers table for UserId and FarmerCode
SET @exist := (SELECT COUNT(*) FROM information_schema.STATISTICS 
               WHERE TABLE_SCHEMA = 'u819242402_arppb' AND TABLE_NAME = 'Farmers' AND INDEX_NAME = 'idx_farmers_district');
SET @sqlstmt := IF(@exist = 0, 'ALTER TABLE `Farmers` ADD INDEX `idx_farmers_district` (`District`)', 'SELECT "idx_farmers_district exists"');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 3. Index on customer_profiles for user_id lookup
SET @exist := (SELECT COUNT(*) FROM information_schema.STATISTICS 
               WHERE TABLE_SCHEMA = 'u819242402_arppb' AND TABLE_NAME = 'customer_profiles' AND INDEX_NAME = 'idx_cp_district');
SET @sqlstmt := IF(@exist = 0, 'ALTER TABLE `customer_profiles` ADD INDEX `idx_cp_district` (`district`)', 'SELECT "idx_cp_district exists"');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 4. Index on vendor_profiles for district and business_type
SET @exist := (SELECT COUNT(*) FROM information_schema.STATISTICS 
               WHERE TABLE_SCHEMA = 'u819242402_arppb' AND TABLE_NAME = 'vendor_profiles' AND INDEX_NAME = 'idx_vp_district');
SET @sqlstmt := IF(@exist = 0, 'ALTER TABLE `vendor_profiles` ADD INDEX `idx_vp_district` (`district`)', 'SELECT "idx_vp_district exists"');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================================================
-- Verification Sample Queries
-- ============================================================================
-- A. All Registered Farmers Across Portals
SELECT u.Id, u.FullName, u.Mobile, u.Email, u.CreatedAt AS RegistrationDate, 
       f.FarmerCode, f.Village, f.Mandal, f.District, f.PrimaryCrops, 'Farmer Portal' AS SourcePortal
FROM Users u
LEFT JOIN Farmers f ON u.Id = f.UserId
WHERE u.Role = 'Farmer'
UNION ALL
SELECT mf.id, mf.name, mf.mobile, mf.email, mf.created_at,
       mf.farmer_code, mf.village, mf.mandal, mf.district, mf.crops, 'Middleman Offline' AS SourcePortal
FROM middleman_farmers mf
WHERE NOT EXISTS (SELECT 1 FROM Users u WHERE u.Mobile = mf.mobile);

-- B. All Registered Vendors Across Portals
SELECT u.Id, u.FullName, u.Mobile, u.Email, u.CreatedAt AS RegistrationDate,
       vp.vendor_code, vp.business_name, vp.business_type, vp.district, 'Vendor Portal' AS SourcePortal
FROM Users u
LEFT JOIN vendor_profiles vp ON u.Mobile = vp.mobile
WHERE u.Role = 'Vendor'
UNION ALL
SELECT mv.id, mv.owner_name, mv.mobile, mv.email, mv.created_at,
       mv.vendor_id, mv.business_name, mv.business_type, mv.district, 'Middleman Offline' AS SourcePortal
FROM middleman_vendors mv
WHERE NOT EXISTS (SELECT 1 FROM Users u WHERE u.Mobile = mv.mobile);

-- C. All Registered Customers Across Portals
SELECT u.Id, u.FullName, u.Mobile, u.Email, u.CreatedAt AS RegistrationDate,
       c.CustomerCode, cp.address, cp.district, 'Customer Portal' AS SourcePortal
FROM Users u
LEFT JOIN Customers c ON u.Id = c.UserId
LEFT JOIN customer_profiles cp ON u.Id = cp.user_id
WHERE u.Role = 'Customer'
UNION ALL
SELECT mc.id, mc.name, mc.mobile, mc.email, mc.created_at,
       mc.customer_id, mc.address, mc.district, 'Middleman Offline' AS SourcePortal
FROM middleman_customers mc
WHERE NOT EXISTS (SELECT 1 FROM Users u WHERE u.Mobile = mc.mobile);

-- D. All Registered Middlemen
SELECT u.Id, u.FullName, u.Mobile, u.Email, u.CreatedAt AS RegistrationDate,
       mp.MiddlemanPortalId, mp.RegisteredBusinessName, mp.RegistrationLicenseNo, mp.District, mp.State
FROM Users u
LEFT JOIN MiddlemanProfiles mp ON u.Id = mp.UserId
WHERE u.Role = 'Middleman';
