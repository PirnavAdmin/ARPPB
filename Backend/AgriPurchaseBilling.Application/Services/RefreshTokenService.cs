using System.Security.Cryptography;
using System.Text;
using AgriPurchaseBilling.Application.DTOs;
using AgriPurchaseBilling.Application.Interfaces;
using Microsoft.Extensions.Configuration;

namespace AgriPurchaseBilling.Application.Services
{
    public sealed class RefreshTokenService : IRefreshTokenService
    {
        private readonly IRefreshTokenRepository _repository;
        private readonly IJwtTokenGenerator _jwtTokenGenerator;
        private readonly int _expiryDays;

        public RefreshTokenService(
            IRefreshTokenRepository repository,
            IJwtTokenGenerator jwtTokenGenerator,
            IConfiguration configuration)
        {
            _repository = repository;
            _jwtTokenGenerator = jwtTokenGenerator;

            var configuredExpiry = configuration["JwtSettings:RefreshTokenExpiryDays"];
            _expiryDays = int.TryParse(configuredExpiry, out var expiryDays)
                ? expiryDays
                : 30;

            if (_expiryDays is < 1 or > 365)
            {
                throw new InvalidOperationException(
                    "JwtSettings:RefreshTokenExpiryDays must be between 1 and 365.");
            }
        }

        public async Task<(string Token, DateTime ExpiresAt)> CreateAsync(
            long userId,
            CancellationToken cancellationToken = default)
        {
            var token = GenerateToken();
            var expiresAt = DateTime.UtcNow.AddDays(_expiryDays);

            await _repository.CreateAsync(
                userId,
                HashToken(token),
                expiresAt,
                cancellationToken);

            return (token, expiresAt);
        }

        public async Task<RefreshTokenResponseDto?> RotateAsync(
            string token,
            CancellationToken cancellationToken = default)
        {
            if (string.IsNullOrWhiteSpace(token))
            {
                return null;
            }

            var replacementToken = GenerateToken();
            var replacementExpiresAt = DateTime.UtcNow.AddDays(_expiryDays);
            var user = await _repository.RotateAsync(
                HashToken(token),
                HashToken(replacementToken),
                replacementExpiresAt,
                cancellationToken);

            if (user is null)
            {
                return null;
            }

            var (accessToken, accessTokenExpiresAt) =
                _jwtTokenGenerator.GenerateToken(
                    user.UserId,
                    user.FullName,
                    user.Mobile,
                    user.Email,
                    user.Role);

            return new RefreshTokenResponseDto(
                user.UserId,
                user.FullName,
                user.Email,
                user.Mobile,
                user.Role,
                accessToken,
                "Bearer",
                accessTokenExpiresAt,
                replacementToken,
                replacementExpiresAt);
        }

        public async Task RevokeAsync(
            string token,
            CancellationToken cancellationToken = default)
        {
            if (string.IsNullOrWhiteSpace(token))
            {
                return;
            }

            await _repository.RevokeAsync(
                HashToken(token),
                cancellationToken);
        }

        private static string GenerateToken()
        {
            var bytes = RandomNumberGenerator.GetBytes(64);
            return Convert.ToBase64String(bytes)
                .TrimEnd('=')
                .Replace('+', '-')
                .Replace('/', '_');
        }

        private static string HashToken(string token) =>
            Convert.ToHexString(
                SHA256.HashData(Encoding.UTF8.GetBytes(token)));
    }
}
