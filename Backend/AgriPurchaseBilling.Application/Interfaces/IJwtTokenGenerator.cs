using AgriPurchaseBilling.Domain.Entities;

namespace AgriPurchaseBilling.Application.Interfaces
{
    public interface IJwtTokenGenerator
    {
        (string Token, DateTime ExpiresAt) GenerateToken(User user);
    }
}
