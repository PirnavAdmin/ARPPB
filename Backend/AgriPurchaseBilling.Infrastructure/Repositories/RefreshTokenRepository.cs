using System.Data;
using System.Data.Common;
using AgriPurchaseBilling.Application.DTOs;
using AgriPurchaseBilling.Application.Interfaces;
using AgriPurchaseBilling.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace AgriPurchaseBilling.Infrastructure.Repositories
{
    public class RefreshTokenRepository(AppDbContext context)
        : IRefreshTokenRepository
    {
        private async Task<DbConnection> OpenAsync(CancellationToken cancellationToken)
        {
            var connection = context.Database.GetDbConnection();
            if (connection.State != ConnectionState.Open)
            {
                await connection.OpenAsync(cancellationToken);
            }

            return connection;
        }

        private static void AddParameter(
            DbCommand command,
            string name,
            DbType type,
            object value)
        {
            var parameter = command.CreateParameter();
            parameter.ParameterName = name;
            parameter.DbType = type;
            parameter.Value = value;
            command.Parameters.Add(parameter);
        }

        public async Task CreateAsync(
            long userId,
            string tokenHash,
            DateTime expiresAt,
            CancellationToken cancellationToken = default)
        {
            var connection = await OpenAsync(cancellationToken);
            await using var command = connection.CreateCommand();
            command.CommandText =
                "CALL sp_Auth_CreateRefreshToken(@p_user_id,@p_token_hash,@p_expires_at);";
            AddParameter(command, "@p_user_id", DbType.Int64, userId);
            AddParameter(command, "@p_token_hash", DbType.String, tokenHash);
            AddParameter(command, "@p_expires_at", DbType.DateTime, expiresAt);

            var inserted = await command.ExecuteScalarAsync(cancellationToken);
            if (Convert.ToInt32(inserted) != 1)
            {
                throw new InvalidOperationException(
                    "A refresh token could not be issued for the user.");
            }
        }

        public async Task<RefreshTokenUserIdentity?> RotateAsync(
            string currentTokenHash,
            string replacementTokenHash,
            DateTime replacementExpiresAt,
            CancellationToken cancellationToken = default)
        {
            var connection = await OpenAsync(cancellationToken);
            await using var command = connection.CreateCommand();
            command.CommandText =
                "CALL sp_Auth_RotateRefreshToken(@p_current_token_hash,@p_replacement_token_hash,@p_replacement_expires_at);";
            AddParameter(command, "@p_current_token_hash", DbType.String, currentTokenHash);
            AddParameter(command, "@p_replacement_token_hash", DbType.String, replacementTokenHash);
            AddParameter(command, "@p_replacement_expires_at", DbType.DateTime, replacementExpiresAt);

            await using var reader = await command.ExecuteReaderAsync(cancellationToken);
            if (!await reader.ReadAsync(cancellationToken) ||
                Convert.ToInt32(reader["Success"]) != 1)
            {
                return null;
            }

            return new RefreshTokenUserIdentity(
                Convert.ToInt64(reader["UserId"]),
                reader["FullName"].ToString() ?? string.Empty,
                reader["Email"] is DBNull ? null : reader["Email"].ToString(),
                reader["Mobile"].ToString() ?? string.Empty,
                reader["Role"].ToString() ?? string.Empty);
        }

        public async Task RevokeAsync(
            string tokenHash,
            CancellationToken cancellationToken = default)
        {
            var connection = await OpenAsync(cancellationToken);
            await using var command = connection.CreateCommand();
            command.CommandText = "CALL sp_Auth_RevokeRefreshToken(@p_token_hash);";
            AddParameter(command, "@p_token_hash", DbType.String, tokenHash);
            await command.ExecuteScalarAsync(cancellationToken);
        }
    }
}
