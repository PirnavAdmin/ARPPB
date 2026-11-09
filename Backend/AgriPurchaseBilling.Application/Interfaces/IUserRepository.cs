
using AgriPurchaseBilling.Domain.Entities;
using AgriPurchaseBilling.Domain.Enums;

namespace AgriPurchaseBilling.Application.Interfaces;

public interface IUserRepository
{
    // Check duplicate email (only when email is provided)
    Task<bool> ExistsByEmailAsync(
        string email,
        CancellationToken cancellationToken = default);

    // Check duplicate mobile number
    Task<bool> ExistsByMobileAsync(
        string mobile,
        CancellationToken cancellationToken = default);

    // Create user and profile
    Task<(User User, string EntityCode)> CreateUserWithProfileAsync(
        User user,
        UserRole role,
        CancellationToken cancellationToken = default);

    // Login using email
    Task<User?> GetByEmailAsync(
        string email,
        CancellationToken cancellationToken = default);

    // Login using mobile number
    Task<User?> GetByMobileAsync(
        string mobile,
        CancellationToken cancellationToken = default);


    // Persist failed login attempts and account lockout expiry.
    Task UpdateLoginSecurityAsync(
        long userId,
        int failedLoginAttempts,
        DateTime? lockoutEnd,
        CancellationToken cancellationToken = default);

    // Update existing password (Forgot Password)
    Task<bool> UpdatePasswordAsync(
        long userId,
        string passwordHash,
        CancellationToken cancellationToken = default);
}
