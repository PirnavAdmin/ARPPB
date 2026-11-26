using AgriPurchaseBilling.Domain.Entities;

namespace AgriPurchaseBilling.Application.Interfaces
{
    public interface IJwtTokenGenerator
    {
        (string Token, DateTime ExpiresAt) GenerateToken(User user);

        (string Token, DateTime ExpiresAt) GenerateToken(
            long userId,
            string fullName,
            string mobile,
            string? email,
            string role);
    }
}
