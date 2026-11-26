using AgriPurchaseBilling.Application.DTOs;

namespace AgriPurchaseBilling.Application.Interfaces
{
    public interface IRefreshTokenService
    {
        Task<(string Token, DateTime ExpiresAt)> CreateAsync(
            long userId,
            CancellationToken cancellationToken = default);

        Task<RefreshTokenResponseDto?> RotateAsync(
            string token,
            CancellationToken cancellationToken = default);

        Task RevokeAsync(
            string token,
            CancellationToken cancellationToken = default);
    }
}
