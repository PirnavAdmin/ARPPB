using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using AgriPurchaseBilling.Application.DTOs;
using AgriPurchaseBilling.Application.Interfaces;
using AgriPurchaseBilling.Domain.Entities;
using AgriPurchaseBilling.Domain.Enums;
using AgriPurchaseBilling.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace AgriPurchaseBilling.Infrastructure.Services
{
    public class MiddlemanCentralIntegrationService : IMiddlemanCentralIntegrationService
    {
        private readonly AppDbContext _context;

        public MiddlemanCentralIntegrationService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<UnifiedPortalSummaryDto> GetPortalSummaryAsync(long middlemanId, CancellationToken ct = default)
        {
            var farmerUserCount = await _context.Users.CountAsync(u => u.Role == UserRole.Farmer, ct);
            var vendorUserCount = await _context.Users.CountAsync(u => u.Role == UserRole.Vendor, ct);
            var customerUserCount = await _context.Users.CountAsync(u => u.Role == UserRole.Customer, ct);
            var middlemanUserCount = await _context.Users.CountAsync(u => u.Role == UserRole.Middleman, ct);

            var offlineFarmers = await _context.MiddlemanFarmers.CountAsync(ct);
            var offlineVendors = await _context.MiddlemanVendors.CountAsync(ct);
            var offlineCustomers = await _context.MiddlemanCustomers.CountAsync(ct);

            return new UnifiedPortalSummaryDto
            {
                TotalFarmers = farmerUserCount + offlineFarmers,
                TotalVendors = vendorUserCount + offlineVendors,
                TotalCustomers = customerUserCount + offlineCustomers,
                TotalMiddlemen = middlemanUserCount,
                TotalUsers = farmerUserCount + vendorUserCount + customerUserCount + middlemanUserCount
            };
        }

        public async Task<UnifiedPagedResultDto<UnifiedFarmerItemDto>> GetFarmersAsync(
            long middlemanId,
            UnifiedPortalQueryDto query,
            CancellationToken ct = default)
        {
            // 1. Fetch portal registered farmers
            var portalFarmers = await _context.Users
                .AsNoTracking()
                .Include(u => u.Farmer)
                .Where(u => u.Role == UserRole.Farmer)
                .ToListAsync(ct);

            // 2. Fetch offline Middleman farmers
            var offlineFarmers = await _context.MiddlemanFarmers
                .AsNoTracking()
                .ToListAsync(ct);

            // 3. Trade metrics from middleman_purchases
            var purchaseStats = await _context.MiddlemanPurchases
                .AsNoTracking()
                .Where(p => p.FarmerMobile != null && p.FarmerMobile != "")
                .GroupBy(p => p.FarmerMobile!)
                .Select(g => new
                {
                    Mobile = g.Key,
                    Count = g.Count(),
                    TotalQty = g.Sum(x => x.Quantity),
                    TotalVal = g.Sum(x => x.TotalAmount)
                })
                .ToDictionaryAsync(x => x.Mobile, ct);

            var list = new List<UnifiedFarmerItemDto>();
            var seenMobiles = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

            foreach (var u in portalFarmers)
            {
                var mob = u.Mobile ?? string.Empty;
                seenMobiles.Add(mob);

                purchaseStats.TryGetValue(mob, out var stats);

                var cropsList = !string.IsNullOrWhiteSpace(u.Farmer?.PrimaryCrops)
                    ? u.Farmer.PrimaryCrops.Split(',', StringSplitOptions.RemoveEmptyEntries).Select(c => c.Trim()).ToList()
                    : new List<string> { "Paddy", "Chilli" };

                list.Add(new UnifiedFarmerItemDto
                {
                    Id = u.Id,
                    UserId = u.Id,
                    FarmerCode = u.Farmer?.FarmerCode ?? $"FAR-{u.Id:D4}",
                    Name = u.FullName,
                    Mobile = mob,
                    Email = u.Email,
                    Role = "Farmer",
                    UserType = "Farmer",
                    RegistrationDate = u.CreatedAt,
                    Status = u.IsActive ? "Active" : "Inactive",
                    Village = u.Farmer?.Village ?? string.Empty,
                    Mandal = u.Farmer?.Mandal,
                    District = u.Farmer?.District ?? string.Empty,
                    State = u.Farmer?.State ?? "Andhra Pradesh",
                    PinCode = u.Farmer?.PinCode,
                    Address = u.Farmer?.Address ?? $"{u.Farmer?.Village}, {u.Farmer?.Mandal}, {u.Farmer?.District}",
                    TotalLandArea = u.Farmer?.TotalLandArea,
                    SoilType = u.Farmer?.SoilType,
                    Crops = cropsList,
                    TotalPurchases = stats?.Count ?? 0,
                    TotalQuantityPurchased = stats?.TotalQty ?? 0m,
                    TotalPurchaseValue = stats?.TotalVal ?? 0m,
                    OutstandingPayables = 0m,
                    PendingConfirmations = 0,
                    SourcePortal = "Farmer Portal",
                    CreatedAt = u.CreatedAt,
                    UpdatedAt = u.UpdatedAt
                });
            }

            foreach (var mf in offlineFarmers)
            {
                var mob = mf.Mobile ?? string.Empty;
                if (!string.IsNullOrWhiteSpace(mob) && seenMobiles.Contains(mob))
                {
                    continue; // Skip duplicates, prefer portal registered
                }

                seenMobiles.Add(mob);
                purchaseStats.TryGetValue(mob, out var stats);

                var cropsList = !string.IsNullOrWhiteSpace(mf.Crops)
                    ? mf.Crops.Split(',', StringSplitOptions.RemoveEmptyEntries).Select(c => c.Trim()).ToList()
                    : new List<string>();

                list.Add(new UnifiedFarmerItemDto
                {
                    Id = mf.Id,
                    UserId = 0,
                    FarmerCode = mf.FarmerCode,
                    Name = mf.Name,
                    Mobile = mob,
                    Email = mf.Email,
                    Role = "Farmer",
                    UserType = "Farmer",
                    RegistrationDate = mf.CreatedAt,
                    Status = mf.Status,
                    Village = mf.Village,
                    Mandal = mf.Mandal,
                    District = mf.District,
                    State = mf.State,
                    PinCode = mf.PinCode,
                    Address = mf.CompleteAddress,
                    Crops = cropsList,
                    TotalPurchases = stats != null ? stats.Count : mf.TotalPurchases,
                    TotalQuantityPurchased = stats != null ? stats.TotalQty : mf.TotalQuantityPurchased,
                    TotalPurchaseValue = stats != null ? stats.TotalVal : mf.TotalPurchaseValue,
                    OutstandingPayables = mf.OutstandingPayables,
                    PendingConfirmations = mf.PendingConfirmations,
                    SourcePortal = "Middleman Offline",
                    CreatedAt = mf.CreatedAt,
                    UpdatedAt = mf.UpdatedAt
                });
            }

            // Apply Filters
            var filtered = list.AsEnumerable();

            if (!string.IsNullOrWhiteSpace(query.District) && !query.District.Equals("ALL", StringComparison.OrdinalIgnoreCase))
            {
                filtered = filtered.Where(x => string.Equals(x.District, query.District, StringComparison.OrdinalIgnoreCase));
            }

            if (!string.IsNullOrWhiteSpace(query.Status) && !query.Status.Equals("ALL", StringComparison.OrdinalIgnoreCase))
            {
                filtered = filtered.Where(x => string.Equals(x.Status, query.Status, StringComparison.OrdinalIgnoreCase));
            }

            if (!string.IsNullOrWhiteSpace(query.Source) && !query.Source.Equals("ALL", StringComparison.OrdinalIgnoreCase))
            {
                filtered = filtered.Where(x => x.SourcePortal.Contains(query.Source, StringComparison.OrdinalIgnoreCase));
            }

            if (!string.IsNullOrWhiteSpace(query.Search))
            {
                var s = query.Search.Trim().ToLowerInvariant();
                filtered = filtered.Where(x =>
                    x.Name.ToLowerInvariant().Contains(s) ||
                    x.FarmerCode.ToLowerInvariant().Contains(s) ||
                    x.Mobile.Contains(s) ||
                    (x.Email != null && x.Email.ToLowerInvariant().Contains(s)) ||
                    x.Village.ToLowerInvariant().Contains(s) ||
                    x.District.ToLowerInvariant().Contains(s));
            }

            var totalItems = filtered.Count();
            var page = query.Page > 0 ? query.Page : 1;
            var pageSize = query.PageSize > 0 ? query.PageSize : 10;

            var items = filtered
                .OrderByDescending(x => x.RegistrationDate)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToList();

            return new UnifiedPagedResultDto<UnifiedFarmerItemDto>
            {
                Items = items,
                TotalItems = totalItems,
                Page = page,
                PageSize = pageSize
            };
        }

        public async Task<UnifiedPagedResultDto<UnifiedVendorItemDto>> GetVendorsAsync(
            long middlemanId,
            UnifiedPortalQueryDto query,
            CancellationToken ct = default)
        {
            // 1. Fetch portal registered vendors
            var portalVendors = await _context.Users
                .AsNoTracking()
                .Include(u => u.Vendor)
                .Where(u => u.Role == UserRole.Vendor)
                .ToListAsync(ct);

            var vendorProfiles = await _context.VendorProfiles
                .AsNoTracking()
                .ToListAsync(ct);

            var profilesByUserId = vendorProfiles.ToDictionary(p => p.Mobile, StringComparer.OrdinalIgnoreCase);

            // 2. Fetch offline Middleman vendors
            var offlineVendors = await _context.MiddlemanVendors
                .AsNoTracking()
                .ToListAsync(ct);

            // 3. Trade metrics from middleman_vendor_sales
            var salesStats = await _context.MiddlemanVendorSales
                .AsNoTracking()
                .Where(s => s.Mobile != null && s.Mobile != "")
                .GroupBy(s => s.Mobile!)
                .Select(g => new
                {
                    Mobile = g.Key,
                    Count = g.Count(),
                    TotalVal = g.Sum(x => x.TotalAmount)
                })
                .ToDictionaryAsync(x => x.Mobile, ct);

            var list = new List<UnifiedVendorItemDto>();
            var seenMobiles = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

            foreach (var u in portalVendors)
            {
                var mob = u.Mobile ?? string.Empty;
                seenMobiles.Add(mob);

                profilesByUserId.TryGetValue(mob, out var profile);
                salesStats.TryGetValue(mob, out var stats);

                list.Add(new UnifiedVendorItemDto
                {
                    Id = u.Id,
                    UserId = u.Id,
                    VendorCode = u.Vendor?.VendorCode ?? profile?.VendorCode ?? $"VEN-{u.Id:D4}",
                    BusinessName = profile?.BusinessName ?? u.FullName,
                    OwnerName = profile?.OwnerName ?? u.FullName,
                    Mobile = mob,
                    Email = u.Email,
                    Role = "Vendor",
                    UserType = "Vendor",
                    RegistrationDate = u.CreatedAt,
                    Status = u.IsActive ? "Active" : "Inactive",
                    BusinessType = profile?.BusinessType ?? "Wholesaler",
                    GstNumber = profile?.Gstin,
                    BusinessRegNumber = profile?.BusinessRegNumber,
                    Address = profile?.BusinessAddress,
                    District = profile?.District ?? string.Empty,
                    State = profile?.State ?? "Andhra Pradesh",
                    PinCode = profile?.PinCode,
                    TotalPurchases = stats?.Count ?? 0,
                    TotalPurchaseValue = stats?.TotalVal ?? 0m,
                    OutstandingReceivables = 0m,
                    SourcePortal = "Vendor Portal",
                    CreatedAt = u.CreatedAt,
                    UpdatedAt = u.UpdatedAt
                });
            }

            foreach (var mv in offlineVendors)
            {
                var mob = mv.Mobile ?? string.Empty;
                if (!string.IsNullOrWhiteSpace(mob) && seenMobiles.Contains(mob))
                {
                    continue; // Skip duplicate, prefer portal registered
                }

                seenMobiles.Add(mob);
                salesStats.TryGetValue(mob, out var stats);

                list.Add(new UnifiedVendorItemDto
                {
                    Id = mv.Id,
                    UserId = 0,
                    VendorCode = mv.VendorId,
                    BusinessName = mv.BusinessName,
                    OwnerName = mv.OwnerName,
                    Mobile = mob,
                    Email = mv.Email,
                    Role = "Vendor",
                    UserType = "Vendor",
                    RegistrationDate = mv.CreatedAt,
                    Status = mv.Status,
                    BusinessType = mv.BusinessType,
                    GstNumber = mv.GstNumber,
                    Address = mv.Address,
                    District = mv.District,
                    State = mv.State,
                    PinCode = mv.PinCode,
                    TotalPurchases = stats != null ? stats.Count : mv.TotalPurchases,
                    TotalPurchaseValue = stats != null ? stats.TotalVal : mv.TotalPurchaseValue,
                    OutstandingReceivables = mv.OutstandingReceivables,
                    SourcePortal = "Middleman Offline",
                    CreatedAt = mv.CreatedAt,
                    UpdatedAt = mv.UpdatedAt
                });
            }

            // Filter
            var filtered = list.AsEnumerable();

            if (!string.IsNullOrWhiteSpace(query.District) && !query.District.Equals("ALL", StringComparison.OrdinalIgnoreCase))
            {
                filtered = filtered.Where(x => string.Equals(x.District, query.District, StringComparison.OrdinalIgnoreCase));
            }

            if (!string.IsNullOrWhiteSpace(query.Status) && !query.Status.Equals("ALL", StringComparison.OrdinalIgnoreCase))
            {
                filtered = filtered.Where(x => string.Equals(x.Status, query.Status, StringComparison.OrdinalIgnoreCase));
            }

            if (!string.IsNullOrWhiteSpace(query.Source) && !query.Source.Equals("ALL", StringComparison.OrdinalIgnoreCase))
            {
                filtered = filtered.Where(x => x.SourcePortal.Contains(query.Source, StringComparison.OrdinalIgnoreCase));
            }

            if (!string.IsNullOrWhiteSpace(query.Search))
            {
                var s = query.Search.Trim().ToLowerInvariant();
                filtered = filtered.Where(x =>
                    x.BusinessName.ToLowerInvariant().Contains(s) ||
                    x.OwnerName.ToLowerInvariant().Contains(s) ||
                    x.VendorCode.ToLowerInvariant().Contains(s) ||
                    x.Mobile.Contains(s) ||
                    (x.Email != null && x.Email.ToLowerInvariant().Contains(s)) ||
                    x.District.ToLowerInvariant().Contains(s));
            }

            var totalItems = filtered.Count();
            var page = query.Page > 0 ? query.Page : 1;
            var pageSize = query.PageSize > 0 ? query.PageSize : 10;

            var items = filtered
                .OrderByDescending(x => x.RegistrationDate)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToList();

            return new UnifiedPagedResultDto<UnifiedVendorItemDto>
            {
                Items = items,
                TotalItems = totalItems,
                Page = page,
                PageSize = pageSize
            };
        }

        public async Task<UnifiedPagedResultDto<UnifiedCustomerItemDto>> GetCustomersAsync(
            long middlemanId,
            UnifiedPortalQueryDto query,
            CancellationToken ct = default)
        {
            // 1. Fetch portal registered customers
            var portalCustomers = await _context.Users
                .AsNoTracking()
                .Include(u => u.Customer)
                .Where(u => u.Role == UserRole.Customer)
                .ToListAsync(ct);

            var customerProfiles = await _context.CustomerProfiles
                .AsNoTracking()
                .ToDictionaryAsync(p => p.UserId, ct);

            // 2. Fetch offline Middleman customers
            var offlineCustomers = await _context.MiddlemanCustomers
                .AsNoTracking()
                .ToListAsync(ct);

            // 3. Trade metrics from middleman_sales
            var salesStats = await _context.MiddlemanSales
                .AsNoTracking()
                .Where(s => s.BuyerMobile != null && s.BuyerMobile != "")
                .GroupBy(s => s.BuyerMobile!)
                .Select(g => new
                {
                    Mobile = g.Key,
                    Count = g.Count(),
                    TotalVal = g.Sum(x => x.TotalAmount)
                })
                .ToDictionaryAsync(x => x.Mobile, ct);

            var list = new List<UnifiedCustomerItemDto>();
            var seenMobiles = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

            foreach (var u in portalCustomers)
            {
                var mob = u.Mobile ?? string.Empty;
                seenMobiles.Add(mob);

                customerProfiles.TryGetValue(u.Id, out var profile);
                salesStats.TryGetValue(mob, out var stats);

                list.Add(new UnifiedCustomerItemDto
                {
                    Id = u.Id,
                    UserId = u.Id,
                    CustomerCode = u.Customer?.CustomerCode ?? $"CUST-{u.Id:D4}",
                    Name = u.FullName,
                    Mobile = mob,
                    Email = u.Email,
                    Role = "Customer",
                    UserType = "Customer",
                    RegistrationDate = u.CreatedAt,
                    Status = u.IsActive ? "Active" : "Inactive",
                    Address = profile?.Address,
                    District = profile?.District ?? string.Empty,
                    State = profile?.State ?? "Andhra Pradesh",
                    PinCode = profile?.PinCode,
                    AlternateMobile = profile?.AlternateMobile,
                    TotalPurchases = stats?.Count ?? 0,
                    TotalPurchaseValue = stats?.TotalVal ?? 0m,
                    OutstandingReceivables = 0m,
                    SourcePortal = "Customer Portal",
                    CreatedAt = u.CreatedAt,
                    UpdatedAt = u.UpdatedAt
                });
            }

            foreach (var mc in offlineCustomers)
            {
                var mob = mc.Mobile ?? string.Empty;
                if (!string.IsNullOrWhiteSpace(mob) && seenMobiles.Contains(mob))
                {
                    continue; // Skip duplicate, prefer portal registered
                }

                seenMobiles.Add(mob);
                salesStats.TryGetValue(mob, out var stats);

                list.Add(new UnifiedCustomerItemDto
                {
                    Id = mc.Id,
                    UserId = 0,
                    CustomerCode = mc.CustomerId,
                    Name = mc.Name,
                    Mobile = mob,
                    Email = mc.Email,
                    Role = "Customer",
                    UserType = "Customer",
                    RegistrationDate = mc.CreatedAt,
                    Status = mc.Status,
                    Address = mc.Address,
                    District = mc.District,
                    State = mc.State,
                    PinCode = mc.PinCode,
                    TotalPurchases = stats != null ? stats.Count : mc.TotalPurchases,
                    TotalPurchaseValue = stats != null ? stats.TotalVal : mc.TotalPurchaseValue,
                    OutstandingReceivables = mc.OutstandingReceivables,
                    SourcePortal = "Middleman Offline",
                    CreatedAt = mc.CreatedAt,
                    UpdatedAt = mc.UpdatedAt
                });
            }

            // Filter
            var filtered = list.AsEnumerable();

            if (!string.IsNullOrWhiteSpace(query.District) && !query.District.Equals("ALL", StringComparison.OrdinalIgnoreCase))
            {
                filtered = filtered.Where(x => string.Equals(x.District, query.District, StringComparison.OrdinalIgnoreCase));
            }

            if (!string.IsNullOrWhiteSpace(query.Status) && !query.Status.Equals("ALL", StringComparison.OrdinalIgnoreCase))
            {
                filtered = filtered.Where(x => string.Equals(x.Status, query.Status, StringComparison.OrdinalIgnoreCase));
            }

            if (!string.IsNullOrWhiteSpace(query.Source) && !query.Source.Equals("ALL", StringComparison.OrdinalIgnoreCase))
            {
                filtered = filtered.Where(x => x.SourcePortal.Contains(query.Source, StringComparison.OrdinalIgnoreCase));
            }

            if (!string.IsNullOrWhiteSpace(query.Search))
            {
                var s = query.Search.Trim().ToLowerInvariant();
                filtered = filtered.Where(x =>
                    x.Name.ToLowerInvariant().Contains(s) ||
                    x.CustomerCode.ToLowerInvariant().Contains(s) ||
                    x.Mobile.Contains(s) ||
                    (x.Email != null && x.Email.ToLowerInvariant().Contains(s)) ||
                    x.District.ToLowerInvariant().Contains(s));
            }

            var totalItems = filtered.Count();
            var page = query.Page > 0 ? query.Page : 1;
            var pageSize = query.PageSize > 0 ? query.PageSize : 10;

            var items = filtered
                .OrderByDescending(x => x.RegistrationDate)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToList();

            return new UnifiedPagedResultDto<UnifiedCustomerItemDto>
            {
                Items = items,
                TotalItems = totalItems,
                Page = page,
                PageSize = pageSize
            };
        }

        public async Task<UnifiedPagedResultDto<UnifiedMiddlemanItemDto>> GetMiddlemenAsync(
            long middlemanId,
            UnifiedPortalQueryDto query,
            CancellationToken ct = default)
        {
            var middlemanUsers = await _context.Users
                .AsNoTracking()
                .Include(u => u.Middleman)
                .Include(u => u.MiddlemanProfile)
                .Where(u => u.Role == UserRole.Middleman)
                .ToListAsync(ct);

            var list = middlemanUsers.Select(u => new UnifiedMiddlemanItemDto
            {
                Id = u.Id,
                UserId = u.Id,
                MiddlemanCode = u.Middleman?.MiddlemanPortalId ?? u.MiddlemanProfile?.MiddlemanPortalId ?? $"MID-{u.Id:D4}",
                BusinessName = !string.IsNullOrWhiteSpace(u.MiddlemanProfile?.RegisteredBusinessName)
                    ? u.MiddlemanProfile.RegisteredBusinessName
                    : u.FullName,
                OwnerName = u.MiddlemanProfile?.OwnerName ?? u.FullName,
                Mobile = u.Mobile,
                Email = u.Email,
                Role = "Middleman",
                UserType = "Middleman",
                RegistrationDate = u.CreatedAt,
                Status = u.IsActive ? "Active" : "Inactive",
                LicenseNumber = u.MiddlemanProfile?.RegistrationLicenseNo,
                GstNumber = u.MiddlemanProfile?.Gstin,
                Address = u.MiddlemanProfile?.PremisesAddress,
                VillageArea = u.MiddlemanProfile?.VillageArea,
                District = u.MiddlemanProfile?.District ?? string.Empty,
                State = u.MiddlemanProfile?.State ?? "Andhra Pradesh",
                PinCode = u.MiddlemanProfile?.PinCode,
                BankName = u.MiddlemanProfile?.BankName,
                AccountNumber = u.MiddlemanProfile?.AccountNumber,
                IfscCode = u.MiddlemanProfile?.IfscCode,
                SourcePortal = "Middleman Portal",
                CreatedAt = u.CreatedAt,
                UpdatedAt = u.UpdatedAt
            });

            var filtered = list.AsEnumerable();

            if (!string.IsNullOrWhiteSpace(query.District) && !query.District.Equals("ALL", StringComparison.OrdinalIgnoreCase))
            {
                filtered = filtered.Where(x => string.Equals(x.District, query.District, StringComparison.OrdinalIgnoreCase));
            }

            if (!string.IsNullOrWhiteSpace(query.Status) && !query.Status.Equals("ALL", StringComparison.OrdinalIgnoreCase))
            {
                filtered = filtered.Where(x => string.Equals(x.Status, query.Status, StringComparison.OrdinalIgnoreCase));
            }

            if (!string.IsNullOrWhiteSpace(query.Search))
            {
                var s = query.Search.Trim().ToLowerInvariant();
                filtered = filtered.Where(x =>
                    x.BusinessName.ToLowerInvariant().Contains(s) ||
                    x.OwnerName.ToLowerInvariant().Contains(s) ||
                    x.MiddlemanCode.ToLowerInvariant().Contains(s) ||
                    x.Mobile.Contains(s) ||
                    (x.Email != null && x.Email.ToLowerInvariant().Contains(s)) ||
                    x.District.ToLowerInvariant().Contains(s));
            }

            var totalItems = filtered.Count();
            var page = query.Page > 0 ? query.Page : 1;
            var pageSize = query.PageSize > 0 ? query.PageSize : 10;

            var items = filtered
                .OrderByDescending(x => x.RegistrationDate)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToList();

            return new UnifiedPagedResultDto<UnifiedMiddlemanItemDto>
            {
                Items = items,
                TotalItems = totalItems,
                Page = page,
                PageSize = pageSize
            };
        }

        public async Task<UnifiedPagedResultDto<SellOrderResponseDto>> GetFarmerSellProductsAsync(
            long middlemanId,
            UnifiedPortalQueryDto query,
            CancellationToken ct = default)
        {
            var baseQuery = _context.FarmerSellProducts
                .AsNoTracking();

            if (!string.IsNullOrWhiteSpace(query.Search))
            {
                var s = query.Search.Trim().ToLower();
                baseQuery = baseQuery.Where(x =>
                    x.CropName.ToLower().Contains(s) ||
                    x.SaleCode.ToLower().Contains(s) ||
                    x.BuyerName.ToLower().Contains(s) ||
                    x.BuyerMobile.Contains(s) ||
                    x.PickupLocation.ToLower().Contains(s));
            }

            if (!string.IsNullOrWhiteSpace(query.Status) && !query.Status.Equals("ALL", StringComparison.OrdinalIgnoreCase))
            {
                baseQuery = baseQuery.Where(x => x.Status == query.Status);
            }

            var totalItems = await baseQuery.CountAsync(ct);
            var page = query.Page > 0 ? query.Page : 1;
            var pageSize = query.PageSize > 0 ? query.PageSize : 10;

            var items = await baseQuery
                .OrderByDescending(x => x.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(x => new SellOrderResponseDto
                {
                    Id = x.Id,
                    SaleCode = x.SaleCode,
                    FarmerId = x.FarmerId,
                    CropId = x.CropId,
                    BuyerCategory = x.BuyerCategory,
                    BuyerName = x.BuyerName,
                    BuyerMobile = x.BuyerMobile,
                    CropName = x.CropName,
                    CropVariety = x.CropVariety,
                    QualityGrade = x.QualityGrade,
                    SellingQuantity = x.SellingQuantity,
                    Unit = x.Unit,
                    PricePerUnit = x.PricePerUnit,
                    TotalAmount = x.TotalAmount,
                    PickupLocation = x.PickupLocation,
                    ExpectedPickupDate = x.ExpectedPickupDate,
                    Notes = x.Notes,
                    Status = x.Status,
                    OtpStatus = x.OtpStatus,
                    ConfirmedAt = x.ConfirmedAt,
                    CreatedAt = x.CreatedAt
                })
                .ToListAsync(ct);

            return new UnifiedPagedResultDto<SellOrderResponseDto>
            {
                Items = items,
                TotalItems = totalItems,
                Page = page,
                PageSize = pageSize
            };
        }

        public async Task<UnifiedPagedResultDto<CustomerOrderListDto>> GetCustomerOrdersAsync(
            long middlemanId,
            UnifiedPortalQueryDto query,
            CancellationToken ct = default)
        {
            var baseQuery = _context.VpSales
                .AsNoTracking()
                .Where(x => x.OrderStatus.ToLower() != "draft");

            if (!string.IsNullOrWhiteSpace(query.Search))
            {
                var s = query.Search.Trim().ToLower();
                baseQuery = baseQuery.Where(x =>
                    x.SaleCode.ToLower().Contains(s) ||
                    x.CustomerName.ToLower().Contains(s) ||
                    (x.CustomerMobile != null && x.CustomerMobile.Contains(s)));
            }

            if (!string.IsNullOrWhiteSpace(query.Status) && !query.Status.Equals("ALL", StringComparison.OrdinalIgnoreCase))
            {
                baseQuery = baseQuery.Where(x => x.OrderStatus == query.Status);
            }

            var totalItems = await baseQuery.CountAsync(ct);
            var page = query.Page > 0 ? query.Page : 1;
            var pageSize = query.PageSize > 0 ? query.PageSize : 10;

            var items = await baseQuery
                .OrderByDescending(x => x.SaleDate)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(x => new CustomerOrderListDto
                {
                    Id = x.Id,
                    OrderId = x.OrderCode != "" ? x.OrderCode : x.SaleCode,
                    TransactionId = x.SaleCode,
                    OrderDate = x.SaleDate,
                    Product = x.CustomerName,
                    Quantity = 1,
                    Unit = "Batch",
                    TotalAmount = x.TotalAmount,
                    OrderStatus = x.OrderStatus,
                    ExpectedDeliveryDate = x.ExpectedDeliveryDate,
                    ExpectedPaymentDate = x.ExpectedPaymentDate
                })
                .ToListAsync(ct);

            return new UnifiedPagedResultDto<CustomerOrderListDto>
            {
                Items = items,
                TotalItems = totalItems,
                Page = page,
                PageSize = pageSize
            };
        }
    }
}
