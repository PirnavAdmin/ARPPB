using AgriPurchaseBilling.Application.DTOs;
using AgriPurchaseBilling.Application.Interfaces;
using AgriPurchaseBilling.Domain.Enums;
using AgriPurchaseBilling.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace AgriPurchaseBilling.Infrastructure.Repositories
{
    public class CustomerMarketplaceRepository : ICustomerMarketplaceRepository
    {
        private readonly AppDbContext _context;

        public CustomerMarketplaceRepository(AppDbContext context)
        {
            _context = context;
        }

        private const decimal LowStockThreshold = 20m;

        private static readonly TimeZoneInfo BusinessTimeZone = ResolveBusinessTimeZone();

        public async Task<List<CustomerMarketplaceCategoryDto>> GetCategoriesAsync(
            CancellationToken cancellationToken = default)
        {
            var categories = await BuildEligibleBaseQuery(inStockOnly: true)
                .Where(x => x.Category.Trim().Length > 0)
                .GroupBy(x => x.Category)
                .Select(g => new CustomerMarketplaceCategoryDto
                {
                    Category = g.Key,
                    ProductCount = g.Count()
                })
                .OrderBy(c => c.Category)
                .ToListAsync(cancellationToken);

            return categories;
        }

        public async Task<CustomerMarketplacePagedProductsDto> GetProductsAsync(
            CustomerMarketplaceProductQueryDto query,
            CancellationToken cancellationToken = default)
        {
            var filtered = BuildEligibleBaseQuery(inStockOnly: false);

            // Apply stockStatus filter when provided; otherwise preserve existing inStockOnly behavior
            if (!string.IsNullOrWhiteSpace(query.StockStatus))
            {
                switch (query.StockStatus.ToLowerInvariant())
                {
                    case "in_stock":
                        filtered = filtered.Where(x => x.AvailableQuantity > LowStockThreshold);
                        break;
                    case "low_stock":
                        filtered = filtered.Where(x => x.AvailableQuantity > 0m && x.AvailableQuantity <= LowStockThreshold);
                        break;
                    case "out_of_stock":
                        filtered = filtered.Where(x => x.AvailableQuantity <= 0m);
                        break;
                    case "all":
                        break;
                }
            }
            else if (query.InStockOnly)
            {
                filtered = filtered.Where(x => x.AvailableQuantity > 0m);
            }

            if (!string.IsNullOrWhiteSpace(query.Category))
            {
                string cat = query.Category.Trim().ToLower();
                filtered = filtered.Where(x => x.Category.ToLower() == cat);
            }

            if (!string.IsNullOrWhiteSpace(query.Search))
            {
                string term = query.Search.Trim().ToLower();
                filtered = filtered.Where(x =>
                    x.ProductName.ToLower().Contains(term) ||
                    x.BrandName.ToLower().Contains(term) ||
                    x.ProductCode.ToLower().Contains(term) ||
                    x.Category.ToLower().Contains(term) ||
                    (x.District != null && x.District.ToLower().Contains(term)) ||
                    (x.State != null && x.State.ToLower().Contains(term)));
            }

            if (!string.IsNullOrWhiteSpace(query.Location))
            {
                string loc = query.Location.Trim().ToLower();
                filtered = filtered.Where(x =>
                    (x.District != null && x.District.ToLower().Contains(loc)) ||
                    (x.State != null && x.State.ToLower().Contains(loc)));
            }

            if (!string.IsNullOrWhiteSpace(query.District))
            {
                string dist = query.District.Trim().ToLower();
                filtered = filtered.Where(x => x.District != null && x.District.ToLower() == dist);
            }

            if (!string.IsNullOrWhiteSpace(query.State))
            {
                string st = query.State.Trim().ToLower();
                filtered = filtered.Where(x => x.State != null && x.State.ToLower() == st);
            }

            if (query.VendorId.HasValue)
            {
                long vid = query.VendorId.Value;
                filtered = filtered.Where(x => x.VendorId == vid);
            }

            if (query.MinPrice.HasValue)
            {
                decimal minPrice = query.MinPrice.Value;
                filtered = filtered.Where(x => x.SellingPrice >= minPrice);
            }

            if (query.MaxPrice.HasValue)
            {
                decimal maxPrice = query.MaxPrice.Value;
                filtered = filtered.Where(x => x.SellingPrice <= maxPrice);
            }

            int totalCount = await filtered.CountAsync(cancellationToken);
            int totalPages = totalCount == 0
                ? 0
                : (int)Math.Ceiling(totalCount / (double)query.PageSize);

            if (totalCount == 0 || (query.Page - 1) * query.PageSize >= totalCount)
            {
                return new CustomerMarketplacePagedProductsDto
                {
                    Items = new List<CustomerMarketplaceProductDto>(),
                    Page = query.Page,
                    PageSize = query.PageSize,
                    TotalCount = totalCount,
                    TotalPages = totalPages,
                    HasNextPage = false,
                    HasPreviousPage = query.Page > 1 && totalCount > 0
                };
            }

            IQueryable<MarketplaceProductProjection> ordered = query.SortBy switch
            {
                "popular" => filtered
                    .OrderByDescending(x => x.SoldQuantity)
                    .ThenByDescending(x => x.AvailableQuantity)
                    .ThenByDescending(x => x.CreatedAt)
                    .ThenByDescending(x => x.ProductId),
                "price_asc" => filtered.OrderBy(x => x.SellingPrice).ThenByDescending(x => x.ProductId),
                "price_desc" => filtered.OrderByDescending(x => x.SellingPrice).ThenByDescending(x => x.ProductId),
                _ => filtered.OrderByDescending(x => x.CreatedAt).ThenByDescending(x => x.ProductId)
            };

            var rows = await ordered
                .Skip((query.Page - 1) * query.PageSize)
                .Take(query.PageSize)
                .ToListAsync(cancellationToken);

            var items = rows.Select(MapToProductDto).ToList();

            return new CustomerMarketplacePagedProductsDto
            {
                Items = items,
                Page = query.Page,
                PageSize = query.PageSize,
                TotalCount = totalCount,
                TotalPages = totalPages,
                HasNextPage = query.Page < totalPages,
                HasPreviousPage = query.Page > 1
            };
        }

        public async Task<CustomerMarketplaceProductDetailDto?> GetProductByIdAsync(
            long productId,
            CancellationToken cancellationToken = default)
        {
            var row = await BuildEligibleBaseQuery(inStockOnly: false)
                .FirstOrDefaultAsync(x => x.ProductId == productId, cancellationToken);

            if (row == null)
            {
                return null;
            }

            return new CustomerMarketplaceProductDetailDto
            {
                ProductId = row.ProductId,
                ProductCode = row.ProductCode,
                ProductName = row.ProductName,
                Category = row.Category,
                AvailableQuantity = row.AvailableQuantity,
                Unit = row.Unit,
                SellingPrice = row.SellingPrice,
                StockStatus = ComputeStockStatus(row.AvailableQuantity),
                Status = row.Status,
                ImageUrl = string.IsNullOrWhiteSpace(row.ImageUrl) ? null : row.ImageUrl,
                VendorId = row.VendorId,
                VendorBusinessName = ResolveVendorBusinessName(row.ProfileBusinessName, row.UserFullName),
                District = string.IsNullOrWhiteSpace(row.District) ? null : row.District,
                State = string.IsNullOrWhiteSpace(row.State) ? null : row.State,
                CreatedAt = row.CreatedAt,
                UpdatedAt = row.UpdatedAt
            };
        }

        /// <summary>
        /// Builds a strictly read-only base query of customer-eligible vendor products.
        /// Excludes orphan vendor records (must join to an active Vendor user + Vendors row),
        /// inactive vendor profiles (if profile exists), inactive products, expired products,
        /// and optionally zero-stock products. Never selects ProductionCost, ProfitMarginPercentage,
        /// or private user credentials.
        /// </summary>
        private IQueryable<MarketplaceProductProjection> BuildEligibleBaseQuery(bool inStockOnly)
        {
            DateTime todayBusinessDate = GetBusinessTodayDate(DateTime.UtcNow);

            return from p in _context.VendorFinishedProducts.AsNoTracking()
                   join u in _context.Users.AsNoTracking() on p.VendorId equals u.Id
                   join v in _context.Vendors.AsNoTracking() on u.Id equals v.UserId
                   join vp in _context.VendorProfiles.AsNoTracking() on v.Id equals vp.VendorId into vpGroup
                   from vp in vpGroup.DefaultIfEmpty()
                   where u.Role == UserRole.Vendor
                      && u.IsActive
                      && (vp == null || vp.IsActive)
                      && p.Status != null && p.Status.ToLower() == "active"
                      && p.ExpiryDate >= todayBusinessDate
                      && (!inStockOnly || p.AvailableQuantity > 0m)
                   select new MarketplaceProductProjection
                   {
                       ProductId = p.Id,
                       ProductCode = p.ProductCode,
                       ProductName = p.ProductName,
                       Category = p.Category,
                       SourceRawMaterial = p.SourceRawMaterial,
                       BrandName = p.BrandName,
                       Packaging = p.Packaging,
                       AvailableQuantity = p.AvailableQuantity,
                       SoldQuantity = p.SoldQuantity,
                       Unit = p.Unit,
                       SellingPrice = p.SellingPrice,
                       Status = p.Status,
                       MfgDate = p.MfgDate,
                       ExpiryDate = p.ExpiryDate,
                       ImageUrl = p.ImageUrl,
                       CreatedAt = p.CreatedAt,
                       UpdatedAt = p.UpdatedAt,
                       VendorId = v.Id,
                       VendorUserId = u.Id,
                       VendorCode = v.VendorCode,
                       UserFullName = u.FullName,
                       ProfileBusinessName = vp != null ? vp.BusinessName : null,
                       VendorIsVerified = vp != null && vp.IsVerified,
                       District = vp != null ? vp.District : null,
                       State = vp != null ? vp.State : null
                   };
        }

        private static CustomerMarketplaceProductDto MapToProductDto(MarketplaceProductProjection row)
        {
            return new CustomerMarketplaceProductDto
            {
                ProductId = row.ProductId,
                ProductCode = row.ProductCode,
                ProductName = row.ProductName,
                Category = row.Category,
                AvailableQuantity = row.AvailableQuantity,
                Unit = row.Unit,
                SellingPrice = row.SellingPrice,
                StockStatus = ComputeStockStatus(row.AvailableQuantity),
                ImageUrl = string.IsNullOrWhiteSpace(row.ImageUrl) ? null : row.ImageUrl,
                VendorId = row.VendorId,
                VendorBusinessName = ResolveVendorBusinessName(row.ProfileBusinessName, row.UserFullName),
                District = string.IsNullOrWhiteSpace(row.District) ? null : row.District,
                State = string.IsNullOrWhiteSpace(row.State) ? null : row.State,
                CreatedAt = row.CreatedAt
            };
        }

        public static string ComputeStockStatus(decimal availableQty)
        {
            if (availableQty <= 0m) return "Out of Stock";
            if (availableQty <= LowStockThreshold) return "Low Stock";
            return "In Stock";
        }

        public static DateTime GetBusinessTodayDate(DateTime utcNow)
        {
            DateTime normalizedUtc = utcNow.Kind == DateTimeKind.Utc
                ? utcNow
                : DateTime.SpecifyKind(utcNow, DateTimeKind.Utc);
            return TimeZoneInfo.ConvertTimeFromUtc(normalizedUtc, BusinessTimeZone).Date;
        }

        private static TimeZoneInfo ResolveBusinessTimeZone()
        {
            foreach (string tzId in new[] { "Asia/Kolkata", "India Standard Time" })
            {
                try
                {
                    return TimeZoneInfo.FindSystemTimeZoneById(tzId);
                }
                catch (TimeZoneNotFoundException)
                {
                }
                catch (InvalidTimeZoneException)
                {
                }
            }

            return TimeZoneInfo.CreateCustomTimeZone(
                "Asia/Kolkata",
                TimeSpan.FromHours(5.5),
                "India Standard Time",
                "India Standard Time");
        }

        private static string ResolveVendorBusinessName(string? profileBusinessName, string userFullName)
        {
            return !string.IsNullOrWhiteSpace(profileBusinessName)
                ? profileBusinessName.Trim()
                : userFullName.Trim();
        }

        private sealed class MarketplaceProductProjection
        {
            public long ProductId { get; set; }
            public string ProductCode { get; set; } = string.Empty;
            public string ProductName { get; set; } = string.Empty;
            public string Category { get; set; } = string.Empty;
            public string SourceRawMaterial { get; set; } = string.Empty;
            public string BrandName { get; set; } = string.Empty;
            public string Packaging { get; set; } = string.Empty;
            public decimal AvailableQuantity { get; set; }
            public decimal SoldQuantity { get; set; }
            public string Unit { get; set; } = string.Empty;
            public decimal SellingPrice { get; set; }
            public string Status { get; set; } = string.Empty;
            public DateTime MfgDate { get; set; }
            public DateTime ExpiryDate { get; set; }
            public string? ImageUrl { get; set; }
            public DateTime CreatedAt { get; set; }
            public DateTime UpdatedAt { get; set; }
            public long VendorId { get; set; }
            public long VendorUserId { get; set; }
            public string VendorCode { get; set; } = string.Empty;
            public string UserFullName { get; set; } = string.Empty;
            public string? ProfileBusinessName { get; set; }
            public bool VendorIsVerified { get; set; }
            public string? District { get; set; }
            public string? State { get; set; }
        }
    }
}

