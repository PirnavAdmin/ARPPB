using AgriPurchaseBilling.Application.DTOs;
using AgriPurchaseBilling.Application.Interfaces;
using AgriPurchaseBilling.Domain.Entities;
using AgriPurchaseBilling.Domain.Enums;
using AgriPurchaseBilling.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace AgriPurchaseBilling.Infrastructure.Repositories
{
    public sealed class VendorProfileRepository : IVendorProfileRepository
    {
        private readonly AppDbContext _context;

        public VendorProfileRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<VendorProfile?> GetOrCreateProfileByUserIdAsync(
            long userId,
            CancellationToken cancellationToken = default)
        {
            await using var transaction = await _context.Database
                .BeginTransactionAsync(cancellationToken);

            var user = await _context.Users.FirstOrDefaultAsync(
                x => x.Id == userId && x.Role == UserRole.Vendor,
                cancellationToken);
            if (user == null)
            {
                await transaction.RollbackAsync(cancellationToken);
                return null;
            }

            var vendor = await _context.Vendors.FirstOrDefaultAsync(
                x => x.UserId == userId,
                cancellationToken);

            if (vendor == null)
            {
                vendor = new Vendor
                {
                    UserId = user.Id,
                    VendorCode = $"VEN-{user.CreatedAt.Year}-{user.Id:D4}",
                    CreatedAt = user.CreatedAt,
                    UpdatedAt = DateTime.UtcNow
                };
                _context.Vendors.Add(vendor);
                await _context.SaveChangesAsync(cancellationToken);
            }

            var profile = await _context.VendorProfiles.FirstOrDefaultAsync(
                x => x.VendorId == vendor.Id || x.VendorCode == vendor.VendorCode,
                cancellationToken);

            if (profile == null)
            {
                profile = new VendorProfile
                {
                    VendorId = vendor.Id,
                    VendorCode = vendor.VendorCode,
                    BusinessName = user.FullName,
                    OwnerName = user.FullName,
                    Mobile = user.Mobile,
                    Email = user.Email ?? string.Empty,
                    Gstin = null,
                    BusinessRegNumber = string.Empty,
                    BusinessType = string.Empty,
                    BusinessAddress = string.Empty,
                    District = string.Empty,
                    State = string.Empty,
                    PinCode = string.Empty,
                    IsActive = user.IsActive,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };
                _context.VendorProfiles.Add(profile);
            }
            else
            {
                bool profileChanged = false;
                if (profile.VendorId == null)
                {
                    profile.VendorId = vendor.Id;
                    profileChanged = true;
                }
                if (profile.Mobile != user.Mobile)
                {
                    profile.Mobile = user.Mobile;
                    profileChanged = true;
                }
                if (profile.OwnerName != user.FullName)
                {
                    profile.OwnerName = user.FullName;
                    profileChanged = true;
                }
                if (profile.Email != (user.Email ?? string.Empty))
                {
                    profile.Email = user.Email ?? string.Empty;
                    profileChanged = true;
                }
                if (profileChanged)
                {
                    profile.UpdatedAt = DateTime.UtcNow;
                }
            }

            await _context.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);
            return profile;
        }

        public async Task<VendorProfile?> UpdateProfileAsync(
            long userId,
            UpdateVendorProfileRequest request,
            CancellationToken cancellationToken = default)
        {
            var profile = await GetOrCreateProfileByUserIdAsync(userId, cancellationToken);
            if (profile == null)
            {
                return null;
            }

            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);

            string? normalizedGstin = string.IsNullOrWhiteSpace(request.Gstin)
                ? null
                : request.Gstin.Trim().ToUpperInvariant();

            profile.BusinessName = request.BusinessName.Trim();
            profile.BusinessAddress = request.BusinessAddress.Trim();
            profile.District = request.District.Trim();
            profile.State = request.State.Trim();
            profile.PinCode = request.PinCode.Trim();

            if (!string.IsNullOrWhiteSpace(request.BusinessRegistrationNumber))
            {
                profile.BusinessRegNumber = request.BusinessRegistrationNumber.Trim();
            }

            profile.BusinessType = (request.BusinessType ?? string.Empty).Trim();

            // Handle Email update if provided
            if (!string.IsNullOrWhiteSpace(request.Email))
            {
                string cleanEmail = request.Email.Trim().ToLowerInvariant();
                if (user != null)
                {
                    bool emailTaken = await _context.Users.AnyAsync(
                        u => u.Email == cleanEmail && u.Id != userId, cancellationToken);
                    if (emailTaken)
                    {
                        throw new InvalidOperationException($"Email address '{cleanEmail}' is already registered.");
                    }
                    user.Email = cleanEmail;
                    user.UpdatedAt = DateTime.UtcNow;
                }
                profile.Email = cleanEmail;
            }

            if (profile.Gstin != normalizedGstin)
            {
                profile.Gstin = normalizedGstin;
                profile.GstBillingEnabled = normalizedGstin != null;
                profile.ComplianceUpdatedAt = DateTime.UtcNow;
            }

            profile.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync(cancellationToken);
            return profile;
        }

        public Task<VendorBankAccount?> GetPrimaryBankAsync(
            long vendorProfileId,
            CancellationToken cancellationToken = default) =>
            _context.VendorBankAccounts.AsNoTracking()
                .Where(x => x.VendorProfileId == vendorProfileId && x.IsPrimary)
                .OrderBy(x => x.Id)
                .FirstOrDefaultAsync(cancellationToken);

        public async Task<bool> UpsertBankAsync(
            long vendorProfileId,
            UpdateVendorBankDetailsRequest request,
            CancellationToken cancellationToken = default)
        {
            var account = await _context.VendorBankAccounts.FirstOrDefaultAsync(
                x => x.VendorProfileId == vendorProfileId && x.IsPrimary,
                cancellationToken);

            if (account == null)
            {
                account = new VendorBankAccount
                {
                    VendorProfileId = vendorProfileId,
                    AccountHolderName = request.AccountHolderName.Trim(),
                    BankName = request.BankName.Trim(),
                    BranchName = request.BranchName.Trim(),
                    AccountNumber = request.AccountNumber.Trim(),
                    IfscCode = request.IfscCode.Trim().ToUpperInvariant(),
                    IsPrimary = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };
                _context.VendorBankAccounts.Add(account);
            }
            else
            {
                account.AccountHolderName = request.AccountHolderName.Trim();
                account.BankName = request.BankName.Trim();
                account.BranchName = request.BranchName.Trim();
                account.AccountNumber = request.AccountNumber.Trim();
                account.IfscCode = request.IfscCode.Trim().ToUpperInvariant();
                account.UpdatedAt = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync(cancellationToken);
            return true;
        }

        public async Task<bool> IsMobileInUseAsync(
            long userId,
            string mobile,
            CancellationToken cancellationToken = default)
        {
            long vendorId = await _context.Vendors
                .Where(x => x.UserId == userId)
                .Select(x => x.Id)
                .FirstOrDefaultAsync(cancellationToken);

            return await _context.Users.AnyAsync(
                       x => x.Mobile == mobile && x.Id != userId,
                       cancellationToken)
                   || await _context.VendorProfiles.AnyAsync(
                       x => x.Mobile == mobile && x.VendorId != vendorId,
                       cancellationToken);
        }

        public Task<bool> HasRecentMobileChangeOtpAsync(
            long userId,
            DateTime sinceUtc,
            CancellationToken cancellationToken = default)
        {
            string purpose = $"VendorMobileChange:{userId}";
            return _context.UserOtps.AnyAsync(
                x => x.Purpose == purpose && x.CreatedAt >= sinceUtc,
                cancellationToken);
        }

        public async Task<bool> UpdateMobileWithHistoryAsync(
            long userId,
            string mobile,
            CancellationToken cancellationToken = default)
        {
            var user = await _context.Users.FirstOrDefaultAsync(
                x => x.Id == userId && x.Role == UserRole.Vendor,
                cancellationToken);
            var vendor = await _context.Vendors.FirstOrDefaultAsync(
                x => x.UserId == userId,
                cancellationToken);
            if (user == null || vendor == null)
            {
                return false;
            }

            var profile = await _context.VendorProfiles.FirstOrDefaultAsync(
                x => x.VendorId == vendor.Id,
                cancellationToken);
            if (profile == null || user.Mobile == mobile)
            {
                return false;
            }

            var now = DateTime.UtcNow;
            _context.UserMobileHistories.Add(new UserMobileHistory
            {
                UserId = userId,
                OldMobile = user.Mobile,
                NewMobile = mobile,
                OldMobileStatus = "Inactive",
                NewMobileStatus = "Active",
                ChangedAt = now
            });

            user.Mobile = mobile;
            user.UpdatedAt = now;
            profile.Mobile = mobile;
            profile.UpdatedAt = now;

            await _context.SaveChangesAsync(cancellationToken);
            return true;
        }
    }
}
