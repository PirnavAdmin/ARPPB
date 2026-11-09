
using Microsoft.EntityFrameworkCore;
using AgriPurchaseBilling.Application.Interfaces;
using AgriPurchaseBilling.Domain.Entities;
using AgriPurchaseBilling.Domain.Enums;
using AgriPurchaseBilling.Infrastructure.Data;

namespace AgriPurchaseBilling.Infrastructure.Repositories;

public class UserRepository : IUserRepository
{
    private readonly AppDbContext _context;

    public UserRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<bool> ExistsByEmailAsync(
        string email,
        CancellationToken cancellationToken = default)
    {
        return await _context.Users.AnyAsync(
            u => u.Email.ToLower() == email.ToLower(),
            cancellationToken);
    }

    public async Task<bool> ExistsByMobileAsync(
        string mobile,
        CancellationToken cancellationToken = default)
    {
        return await _context.Users.AnyAsync(
            u => u.Mobile == mobile,
            cancellationToken);
    }

    public async Task<User?> GetByEmailAsync(
        string email,
        CancellationToken cancellationToken = default)
    {
        return await _context.Users.FirstOrDefaultAsync(
            u => u.Email.ToLower() == email.ToLower(),
            cancellationToken);
    }

    public async Task<User?> GetByMobileAsync(
        string mobile,
        CancellationToken cancellationToken = default)
    {
        return await _context.Users.FirstOrDefaultAsync(
            u => u.Mobile == mobile,
            cancellationToken);
    }

    public async Task<bool> UpdatePasswordAsync(
        long userId,
        string passwordHash,
        CancellationToken cancellationToken = default)
    {
        var user = await _context.Users.FirstOrDefaultAsync(
            u => u.Id == userId,
            cancellationToken);

        if (user == null)
            return false;

        user.PasswordHash = passwordHash;
        user.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        return true;
    }

    // Save user in the existing Users table only.
    // Role-specific profile tables are not currently available.
    public async Task<(User User, string EntityCode)> CreateUserWithProfileAsync(
        User user,
        UserRole role,
        CancellationToken cancellationToken = default)
    {
        user.Role = role;

        await _context.Users.AddAsync(user, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);

        string entityCode = role switch
        {
            UserRole.Farmer => $"FAR-{DateTime.UtcNow.Year}-{user.Id:D4}",
            UserRole.Customer => $"CUST-{DateTime.UtcNow.Year}-{user.Id:D4}",
            UserRole.Supplier => $"SUP-{DateTime.UtcNow.Year}-{user.Id:D4}",
            UserRole.Vendor => $"VEN-{DateTime.UtcNow.Year}-{user.Id:D4}",
            _ => throw new InvalidOperationException(
                $"Unsupported role: {role}")
        };

        return (user, entityCode);
    }

    public async Task UpdateLoginSecurityAsync(
        long userId,
        int failedLoginAttempts,
        DateTime? lockoutEnd,
        CancellationToken cancellationToken = default)
    {
        var user = await _context.Users.FirstOrDefaultAsync(
            u => u.Id == userId,
            cancellationToken);

        if (user == null)
            return;

        user.FailedLoginAttempts = failedLoginAttempts;
        user.LockoutEnd = lockoutEnd;
        user.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);
    }

}
