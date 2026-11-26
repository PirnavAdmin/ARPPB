USE `u819242402_arppb`;

-- ----------------------------------------------------------------------------
-- 1. sp_FarmerOtpConfirmationsGetSummary
-- Calculates the 4 KPI cards for the OTP Confirmations page:
-- 1. Pending Authorizations (Awaiting 6-digit OTP)
-- 2. Confirmed Transactions (Verified & stock released)
-- 3. Rejected / Expired (Declined or timed out)
-- 4. Total Protected Value (Total ₹ secured by OTP handshake)
-- ----------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS `sp_FarmerOtpConfirmationsGetSummary`;
DELIMITER $$
CREATE PROCEDURE `sp_FarmerOtpConfirmationsGetSummary`(
    IN p_farmer_id BIGINT
)
BEGIN
    DECLARE v_pending INT DEFAULT 0;
    DECLARE v_confirmed INT DEFAULT 0;
    DECLARE v_rejected_expired INT DEFAULT 0;
    DECLARE v_total_protected DECIMAL(14, 2) DEFAULT 0.00;

    -- Pending authorizations from farmer_sell_products
    SELECT COUNT(*) INTO v_pending
    FROM farmer_sell_products
    WHERE farmer_id = p_farmer_id 
      AND otp_status = 'Pending'
      AND (otp_expires_at IS NULL OR otp_expires_at >= UTC_TIMESTAMP())
      AND is_active = 1;

    -- Confirmed from farmer_my_sales
    SELECT COUNT(*) INTO v_confirmed
    FROM farmer_my_sales
    WHERE farmer_id = p_farmer_id AND is_active = 1;

    -- Rejected or Expired
    SELECT COUNT(*) INTO v_rejected_expired
    FROM farmer_sell_products
    WHERE farmer_id = p_farmer_id 
      AND (otp_status IN ('Rejected', 'Expired') OR (otp_status = 'Pending' AND otp_expires_at < UTC_TIMESTAMP()))
      AND is_active = 1;

    -- Total Protected Value: Sum of confirmed + active pending + rejected/expired
    SELECT 
        COALESCE((SELECT SUM(total_revenue) FROM farmer_my_sales WHERE farmer_id = p_farmer_id AND is_active = 1), 0.00) +
        COALESCE((SELECT SUM(total_amount) FROM farmer_sell_products WHERE farmer_id = p_farmer_id AND is_active = 1 AND id NOT IN (SELECT COALESCE(sell_product_id, 0) FROM farmer_my_sales WHERE farmer_id = p_farmer_id)), 0.00)
    INTO v_total_protected;

    SELECT 
        v_pending AS PendingAuthorizations,
        v_confirmed AS ConfirmedTransactions,
        v_rejected_expired AS RejectedOrExpired,
        v_total_protected AS TotalProtectedValue;
END$$
DELIMITER ;

-- ----------------------------------------------------------------------------
-- 2. sp_FarmerOtpConfirmationsGetList
-- Returns filterable list of OTP authorizations with tab filtering:
-- 'Pending', 'Confirmed', 'Rejected', 'Expired', 'All'
-- ----------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS `sp_FarmerOtpConfirmationsGetList`;
DELIMITER $$
CREATE PROCEDURE `sp_FarmerOtpConfirmationsGetList`(
    IN p_farmer_id BIGINT,
    IN p_tab VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_buyer_category VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_search VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
)
BEGIN
    SELECT * FROM (
        -- Confirmed transactions from farmer_my_sales
        SELECT 
            fms.id AS Id,
            CONCAT('OTP-2026-', LPAD(fms.id + 300, 3, '0')) AS OtpId,
            fms.sale_code AS TransactionId,
            fms.buyer_name AS BuyerName,
            fms.buyer_mobile AS BuyerMobile,
            fms.buyer_category AS BuyerCategory,
            fms.crop_name AS Crop,
            fms.quantity_dispatched AS Quantity,
            fms.unit AS Unit,
            fms.selling_rate AS Rate,
            fms.total_revenue AS TotalAmount,
            fms.confirmed_at AS RequestDate,
            'Confirmed' AS OtpStatus,
            NULL AS OtpCode,
            0 AS ExpiresInMinutes,
            0 AS AttemptsLeft,
            'received_request' AS Direction
        FROM farmer_my_sales fms
        WHERE fms.farmer_id = p_farmer_id AND fms.is_active = 1

        UNION ALL

        -- Pending, Rejected, or Expired orders from farmer_sell_products
        SELECT 
            fsp.id AS Id,
            CONCAT('OTP-2026-', LPAD(fsp.id + 300, 3, '0')) AS OtpId,
            fsp.sale_code AS TransactionId,
            fsp.buyer_name AS BuyerName,
            fsp.buyer_mobile AS BuyerMobile,
            fsp.buyer_category AS BuyerCategory,
            fsp.crop_name AS Crop,
            fsp.selling_quantity AS Quantity,
            fsp.unit AS Unit,
            fsp.price_per_unit AS Rate,
            fsp.total_amount AS TotalAmount,
            fsp.created_at AS RequestDate,
            CASE 
                WHEN fsp.otp_status = 'Pending' AND fsp.otp_expires_at < UTC_TIMESTAMP() THEN 'Expired'
                WHEN fsp.status = 'Confirmed' THEN 'Confirmed'
                ELSE fsp.otp_status 
            END AS OtpStatus,
            fsp.otp_code AS OtpCode,
            CASE 
                WHEN fsp.otp_expires_at > UTC_TIMESTAMP() THEN GREATEST(1, TIMESTAMPDIFF(MINUTE, UTC_TIMESTAMP(), fsp.otp_expires_at))
                ELSE 0 
            END AS ExpiresInMinutes,
            3 AS AttemptsLeft,
            'received_request' AS Direction
        FROM farmer_sell_products fsp
        WHERE fsp.farmer_id = p_farmer_id 
          AND fsp.is_active = 1
          AND fsp.id NOT IN (SELECT COALESCE(sell_product_id, 0) FROM farmer_my_sales WHERE farmer_id = p_farmer_id)
    ) AS all_otps
    WHERE 
        (p_tab IS NULL OR p_tab = '' OR p_tab = 'All' OR all_otps.OtpStatus = p_tab)
        AND (p_buyer_category IS NULL OR p_buyer_category = '' OR p_buyer_category = 'All' OR all_otps.BuyerCategory = p_buyer_category)
        AND (p_search IS NULL OR p_search = '' OR 
             LOWER(all_otps.OtpId) LIKE CONCAT('%', LOWER(p_search), '%') OR
             LOWER(all_otps.TransactionId) LIKE CONCAT('%', LOWER(p_search), '%') OR
             LOWER(all_otps.BuyerName) LIKE CONCAT('%', LOWER(p_search), '%') OR
             LOWER(all_otps.Crop) LIKE CONCAT('%', LOWER(p_search), '%')
            )
    ORDER BY all_otps.RequestDate DESC;
END$$
DELIMITER ;

-- ----------------------------------------------------------------------------
-- 3. sp_FarmerOtpReject
-- Rejects a pending OTP authorization request
-- ----------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS `sp_FarmerOtpReject`;
DELIMITER $$
CREATE PROCEDURE `sp_FarmerOtpReject`(
    IN p_sale_id BIGINT,
    IN p_farmer_id BIGINT,
    IN p_reason VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
)
BEGIN
    UPDATE farmer_sell_products
    SET status = 'Rejected',
        otp_status = 'Rejected',
        notes = CONCAT(COALESCE(notes, ''), ' | Rejected: ', COALESCE(p_reason, 'Rejected by farmer')),
        updated_at = UTC_TIMESTAMP()
    WHERE id = p_sale_id AND farmer_id = p_farmer_id;

    SELECT 
        id AS Id,
        sale_code AS SaleCode,
        farmer_id AS FarmerId,
        status AS Status,
        otp_status AS OtpStatus
    FROM farmer_sell_products
    WHERE id = p_sale_id AND farmer_id = p_farmer_id;
END$$
DELIMITER ;
