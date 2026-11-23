using Microsoft.EntityFrameworkCore;
using AgriPurchaseBilling.Application.Interfaces;
using AgriPurchaseBilling.Domain.Entities;
using AgriPurchaseBilling.Domain.Enums;
using AgriPurchaseBilling.Infrastructure.Data;

namespace AgriPurchaseBilling.Infrastructure.Repositories
{

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
                u => u.Email != null && u.Email.ToLower() == email.ToLower(),
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
                u => u.Email != null && u.Email.ToLower() == email.ToLower(),
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

        // Creates the central User record and role-specific identity records in one transaction.
        public async Task<(User User, string EntityCode)> CreateUserWithProfileAsync(
            User user,
            UserRole role,
            CancellationToken cancellationToken = default)
        {
            user.Role = role;

            await using var transaction = await _context.Database
                .BeginTransactionAsync(cancellationToken);

            try
            {
                _context.Users.Add(user);
                await _context.SaveChangesAsync(cancellationToken);

                string entityCode = role switch
                {
                    UserRole.Farmer => $"FAR-{DateTime.UtcNow.Year}-{user.Id:D4}",
                    UserRole.Customer => $"CUST-{DateTime.UtcNow.Year}-{user.Id:D4}",
                    UserRole.Middleman => $"MID-{DateTime.UtcNow.Year}-{user.Id:D4}",
                    UserRole.Vendor => $"VEN-{DateTime.UtcNow.Year}-{user.Id:D4}",
                    _ => throw new InvalidOperationException(
                        $"Unsupported role: {role}")
                };

                var now = DateTime.UtcNow;
                switch (role)
                {
                    case UserRole.Farmer:
                        _context.Farmers.Add(new Farmer
                        {
                            UserId = user.Id,
                            FarmerCode = entityCode,
                            CreatedAt = now,
                            UpdatedAt = now
                        });
                        break;
                    case UserRole.Customer:
                        _context.Customers.Add(new Customer
                        {
                            UserId = user.Id,
                            CustomerCode = entityCode,
                            CreatedAt = now,
                            UpdatedAt = now
                        });
                        _context.CustomerProfiles.Add(new CustomerProfileEntity
                        {
                            UserId = user.Id,
                            Address = string.Empty,
                            District = string.Empty,
                            State = string.Empty,
                            PinCode = string.Empty,
                            CreatedAt = now,
                            UpdatedAt = now
                        });
                        break;
                    case UserRole.Vendor:
                        _context.Vendors.Add(new Vendor
                        {
                            UserId = user.Id,
                            VendorCode = entityCode,
                            CreatedAt = now,
                            UpdatedAt = now
                        });
                        break;
                }

                if (role != UserRole.Middleman)
                {
                    await _context.SaveChangesAsync(cancellationToken);
                }

                if (role == UserRole.Middleman)
                {

                    var middleman = new Middleman
                    {
                        UserId = user.Id,
                        MiddlemanPortalId = entityCode,
                        CreatedAt = now,
                        UpdatedAt = now
                    };

                    var profile = new MiddlemanProfile
                    {
                        UserId = user.Id,
                        MiddlemanPortalId = $"MMP-{DateTime.UtcNow.Year}-{user.Id:D6}",
                        // Contact details are mirrored to the profile table.
                        OwnerName = user.FullName,
                        Mobile = user.Mobile,
                        Email = user.Email,
                        // Business information is completed later through the profile PUT API.
                        RegisteredBusinessName = string.Empty,
                        CreatedAt = now,
                        UpdatedAt = now
                    };

                    _context.Middleman.Add(middleman);
                    _context.MiddlemanProfiles.Add(profile);
                    await _context.SaveChangesAsync(cancellationToken);
                }

                await transaction.CommitAsync(cancellationToken);
                return (user, entityCode);
            }
            catch
            {
                await transaction.RollbackAsync(cancellationToken);
                throw;
            }
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
}