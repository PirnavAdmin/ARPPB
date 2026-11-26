using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using AgriPurchaseBilling.Application.DTOs;
using AgriPurchaseBilling.Application.Interfaces;
using AgriPurchaseBilling.Domain.Entities;
using AgriPurchaseBilling.Domain.Enums;
using AgriPurchaseBilling.Infrastructure.Data;

namespace AgriPurchaseBilling.Infrastructure.Repositories
{
    public class ContactRepository : IContactRepository
    {
        private readonly AppDbContext _context;

        public ContactRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<List<FarmerContactSummaryDto>> SearchContactsAsync(
            string category,
            string? prefix,
            int limit,
            CancellationToken ct = default)
        {
            category = category?.Trim() ?? string.Empty;
            prefix = prefix?.Trim();
            bool hasPrefix = !string.IsNullOrWhiteSpace(prefix);
            int takeCount = limit <= 0 ? 10 : Math.Min(limit, 10);

            if (category.Equals("Middleman", StringComparison.OrdinalIgnoreCase))
            {
                var query = _context.Users
                    .AsNoTracking()
                    .Include(u => u.MiddlemanProfile)
                    .Where(u => u.Role == UserRole.Middleman && u.IsActive);

                if (hasPrefix)
                {
                    query = query.Where(u =>
                        EF.Functions.Like(u.FullName, $"{prefix}%") ||
                        (u.MiddlemanProfile != null && (
                            EF.Functions.Like(u.MiddlemanProfile.OwnerName, $"{prefix}%") ||
                            EF.Functions.Like(u.MiddlemanProfile.RegisteredBusinessName, $"{prefix}%")
                        ))
                    );
                }

                return await query
                    .OrderBy(u => u.FullName)
                    .Take(takeCount)
                    .Select(u => new FarmerContactSummaryDto
                    {
                        Id = u.Id,
                        Name = (u.MiddlemanProfile != null && !string.IsNullOrEmpty(u.MiddlemanProfile.OwnerName))
                            ? u.MiddlemanProfile.OwnerName
                            : u.FullName,
                        MobileNumber = (u.MiddlemanProfile != null && !string.IsNullOrEmpty(u.MiddlemanProfile.Mobile))
                            ? u.MiddlemanProfile.Mobile
                            : u.Mobile,
                        BusinessName = u.MiddlemanProfile != null
                            ? u.MiddlemanProfile.RegisteredBusinessName
                            : string.Empty
                    })
                    .ToListAsync(ct);
            }

            if (category.Equals("Vendor", StringComparison.OrdinalIgnoreCase))
            {
                var query = _context.Users
                    .AsNoTracking()
                    .Include(u => u.Vendor)
                        .ThenInclude(v => v!.Profile)
                    .Where(u => u.Role == UserRole.Vendor && u.IsActive);

                if (hasPrefix)
                {
                    query = query.Where(u =>
                        EF.Functions.Like(u.FullName, $"{prefix}%") ||
                        (u.Vendor != null && u.Vendor.Profile != null && (
                            EF.Functions.Like(u.Vendor.Profile.OwnerName, $"{prefix}%") ||
                            EF.Functions.Like(u.Vendor.Profile.BusinessName, $"{prefix}%")
                        ))
                    );
                }

                return await query
                    .OrderBy(u => u.FullName)
                    .Take(takeCount)
                    .Select(u => new FarmerContactSummaryDto
                    {
                        Id = u.Id,
                        Name = (u.Vendor != null && u.Vendor.Profile != null && !string.IsNullOrEmpty(u.Vendor.Profile.OwnerName))
                            ? u.Vendor.Profile.OwnerName
                            : u.FullName,
                        MobileNumber = (u.Vendor != null && u.Vendor.Profile != null && !string.IsNullOrEmpty(u.Vendor.Profile.Mobile))
                            ? u.Vendor.Profile.Mobile
                            : u.Mobile,
                        BusinessName = (u.Vendor != null && u.Vendor.Profile != null)
                            ? u.Vendor.Profile.BusinessName
                            : string.Empty
                    })
                    .ToListAsync(ct);
            }

            if (category.Equals("Customer", StringComparison.OrdinalIgnoreCase))
            {
                var query = _context.Users
                    .AsNoTracking()
                    .Where(u => u.Role == UserRole.Customer && u.IsActive);

                if (hasPrefix)
                {
                    query = query.Where(u => EF.Functions.Like(u.FullName, $"{prefix}%"));
                }

                return await query
                    .OrderBy(u => u.FullName)
                    .Take(takeCount)
                    .Select(u => new FarmerContactSummaryDto
                    {
                        Id = u.Id,
                        Name = u.FullName,
                        MobileNumber = u.Mobile,
                        BusinessName = string.Empty
                    })
                    .ToListAsync(ct);
            }

            return new List<FarmerContactSummaryDto>();
        }

        public async Task<FarmerContactDetailsDto?> GetContactDetailsAsync(
            long id,
            string category,
            CancellationToken ct = default)
        {
            category = category?.Trim() ?? string.Empty;

            if (category.Equals("Middleman", StringComparison.OrdinalIgnoreCase))
            {
                var user = await _context.Users
                    .AsNoTracking()
                    .Include(u => u.MiddlemanProfile)
                    .FirstOrDefaultAsync(u =>
                        (u.Id == id || (u.MiddlemanProfile != null && u.MiddlemanProfile.Id == id)) &&
                        u.Role == UserRole.Middleman,
                        ct);

                if (user == null) return null;

                var profile = user.MiddlemanProfile;
                return new FarmerContactDetailsDto
                {
                    Id = user.Id,
                    Name = (profile != null && !string.IsNullOrEmpty(profile.OwnerName)) ? profile.OwnerName : user.FullName,
                    Category = "Middleman",
                    MobileNumber = (profile != null && !string.IsNullOrEmpty(profile.Mobile)) ? profile.Mobile : user.Mobile,
                    Email = profile?.Email ?? user.Email,
                    BusinessName = profile?.RegisteredBusinessName,
                    Village = profile?.VillageArea ?? profile?.District,
                    Address = profile?.PremisesAddress
                };
            }

            if (category.Equals("Vendor", StringComparison.OrdinalIgnoreCase))
            {
                var user = await _context.Users
                    .AsNoTracking()
                    .Include(u => u.Vendor)
                        .ThenInclude(v => v!.Profile)
                    .FirstOrDefaultAsync(u =>
                        (u.Id == id ||
                         (u.Vendor != null && (u.Vendor.Id == id || (u.Vendor.Profile != null && u.Vendor.Profile.Id == id)))) &&
                        u.Role == UserRole.Vendor,
                        ct);

                if (user == null) return null;

                var vp = user.Vendor?.Profile;
                return new FarmerContactDetailsDto
                {
                    Id = user.Id,
                    Name = (vp != null && !string.IsNullOrEmpty(vp.OwnerName)) ? vp.OwnerName : user.FullName,
                    Category = "Vendor",
                    MobileNumber = (vp != null && !string.IsNullOrEmpty(vp.Mobile)) ? vp.Mobile : user.Mobile,
                    Email = (vp != null && !string.IsNullOrEmpty(vp.Email)) ? vp.Email : user.Email,
                    BusinessName = vp?.BusinessName,
                    Village = vp?.District,
                    Address = vp?.BusinessAddress
                };
            }

            if (category.Equals("Customer", StringComparison.OrdinalIgnoreCase))
            {
                var user = await _context.Users
                    .AsNoTracking()
                    .FirstOrDefaultAsync(u => u.Id == id && u.Role == UserRole.Customer, ct);

                if (user == null)
                {
                    var cpUser = await _context.CustomerProfiles
                        .AsNoTracking()
                        .Where(cp => cp.Id == id)
                        .Select(cp => cp.UserId)
                        .FirstOrDefaultAsync(ct);

                    if (cpUser > 0)
                    {
                        user = await _context.Users
                            .AsNoTracking()
                            .FirstOrDefaultAsync(u => u.Id == cpUser && u.Role == UserRole.Customer, ct);
                    }
                }

                if (user == null) return null;

                var profile = await _context.CustomerProfiles
                    .AsNoTracking()
                    .FirstOrDefaultAsync(cp => cp.UserId == user.Id, ct);

                return new FarmerContactDetailsDto
                {
                    Id = user.Id,
                    Name = user.FullName,
                    Category = "Customer",
                    MobileNumber = user.Mobile,
                    Email = user.Email,
                    BusinessName = null,
                    Village = profile?.District,
                    Address = profile?.Address
                };
            }

            return null;
        }
    }
}
