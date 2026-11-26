CREATE TABLE IF NOT EXISTS `auth_refresh_tokens` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `user_id` BIGINT NOT NULL,
    `token_hash` CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    `expires_at` DATETIME(6) NOT NULL,
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `revoked_at` DATETIME(6) NULL,
    `replaced_by_token_id` BIGINT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_auth_refresh_tokens_token_hash` (`token_hash`),
    KEY `ix_auth_refresh_tokens_user_active` (`user_id`, `revoked_at`, `expires_at`),
    CONSTRAINT `fk_auth_refresh_tokens_user`
        FOREIGN KEY (`user_id`) REFERENCES `Users` (`Id`) ON DELETE CASCADE,
    CONSTRAINT `fk_auth_refresh_tokens_replaced_by`
        FOREIGN KEY (`replaced_by_token_id`) REFERENCES `auth_refresh_tokens` (`id`)
);

DROP PROCEDURE IF EXISTS `sp_Auth_CreateRefreshToken`;
DELIMITER $$
CREATE PROCEDURE `sp_Auth_CreateRefreshToken`(
    IN p_user_id BIGINT,
    IN p_token_hash CHAR(64) CHARACTER SET ascii COLLATE ascii_bin,
    IN p_expires_at DATETIME(6)
)
BEGIN
    INSERT INTO `auth_refresh_tokens` (`user_id`, `token_hash`, `expires_at`)
    SELECT `Id`, p_token_hash, p_expires_at
    FROM `Users`
    WHERE `Id` = p_user_id
      AND `IsActive` = 1;

    SELECT ROW_COUNT() AS `Created`;
END$$
DELIMITER ;

DROP PROCEDURE IF EXISTS `sp_Auth_RotateRefreshToken`;
DELIMITER $$
CREATE PROCEDURE `sp_Auth_RotateRefreshToken`(
    IN p_current_token_hash CHAR(64) CHARACTER SET ascii COLLATE ascii_bin,
    IN p_replacement_token_hash CHAR(64) CHARACTER SET ascii COLLATE ascii_bin,
    IN p_replacement_expires_at DATETIME(6)
)
BEGIN
    DECLARE v_found TINYINT DEFAULT 1;
    DECLARE v_user_id BIGINT DEFAULT NULL;
    DECLARE v_full_name VARCHAR(100) DEFAULT NULL;
    DECLARE v_email VARCHAR(100) DEFAULT NULL;
    DECLARE v_mobile VARCHAR(10) DEFAULT NULL;
    DECLARE v_role VARCHAR(20) DEFAULT NULL;
    DECLARE v_new_token_id BIGINT DEFAULT NULL;

    DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_found = 0;
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;

    SELECT `user_id`
    INTO v_user_id
    FROM `auth_refresh_tokens`
    WHERE `token_hash` = p_current_token_hash
      AND `revoked_at` IS NULL
      AND `expires_at` > UTC_TIMESTAMP(6)
    FOR UPDATE;

    IF v_found = 1 THEN
        SET v_found = 1;
        SELECT `FullName`, `Email`, `Mobile`, `Role`
        INTO v_full_name, v_email, v_mobile, v_role
        FROM `Users`
        WHERE `Id` = v_user_id
          AND `IsActive` = 1
        FOR UPDATE;
    END IF;

    IF v_found = 1 THEN
        INSERT INTO `auth_refresh_tokens` (
            `user_id`,
            `token_hash`,
            `expires_at`
        )
        VALUES (
            v_user_id,
            p_replacement_token_hash,
            p_replacement_expires_at
        );

        SET v_new_token_id = LAST_INSERT_ID();

        UPDATE `auth_refresh_tokens`
        SET `revoked_at` = UTC_TIMESTAMP(6),
            `replaced_by_token_id` = v_new_token_id
        WHERE `token_hash` = p_current_token_hash;

        COMMIT;

        SELECT
            1 AS `Success`,
            v_user_id AS `UserId`,
            v_full_name AS `FullName`,
            v_email AS `Email`,
            v_mobile AS `Mobile`,
            v_role AS `Role`;
    ELSE
        IF v_user_id IS NOT NULL THEN
            UPDATE `auth_refresh_tokens`
            SET `revoked_at` = UTC_TIMESTAMP(6)
            WHERE `token_hash` = p_current_token_hash
              AND `revoked_at` IS NULL;
            COMMIT;
        ELSE
            ROLLBACK;
        END IF;

        SELECT
            0 AS `Success`,
            NULL AS `UserId`,
            NULL AS `FullName`,
            NULL AS `Email`,
            NULL AS `Mobile`,
            NULL AS `Role`;
    END IF;
END$$
DELIMITER ;

DROP PROCEDURE IF EXISTS `sp_Auth_RevokeRefreshToken`;
DELIMITER $$
CREATE PROCEDURE `sp_Auth_RevokeRefreshToken`(
    IN p_token_hash CHAR(64) CHARACTER SET ascii COLLATE ascii_bin
)
BEGIN
    UPDATE `auth_refresh_tokens`
    SET `revoked_at` = UTC_TIMESTAMP(6)
    WHERE `token_hash` = p_token_hash
      AND `revoked_at` IS NULL;

    SELECT ROW_COUNT() AS `Revoked`;
END$$
DELIMITER ;
