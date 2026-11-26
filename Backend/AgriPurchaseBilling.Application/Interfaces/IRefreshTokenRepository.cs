using AgriPurchaseBilling.Application.DTOs;

namespace AgriPurchaseBilling.Application.Interfaces
{
    public interface IRefreshTokenRepository
    {
        Task CreateAsync(
            long userId,
            string tokenHash,
            DateTime expiresAt,
            CancellationToken cancellationToken = default);

        Task<RefreshTokenUserIdentity?> RotateAsync(
            string currentTokenHash,
            string replacementTokenHash,
            DateTime replacementExpiresAt,
            CancellationToken cancellationToken = default);

        Task RevokeAsync(
            string tokenHash,
            CancellationToken cancellationToken = default);
    }
}
