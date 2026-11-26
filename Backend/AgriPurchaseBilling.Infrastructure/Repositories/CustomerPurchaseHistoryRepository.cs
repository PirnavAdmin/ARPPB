using AgriPurchaseBilling.Application.DTOs;
using AgriPurchaseBilling.Application.Interfaces;
using AgriPurchaseBilling.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace AgriPurchaseBilling.Infrastructure.Repositories
{
    public class CustomerPurchaseHistoryRepository : ICustomerPurchaseHistoryRepository
    {
        private static readonly string[] EligibleOrderStatuses =
        {
            "confirmed",
            "processing",
            "packed",
            "dispatched",
            "shipped",
            "in transit",
            "out for delivery",
            "delivered",
            "completed"
        };

        private static readonly string[] ConfirmedAndFulfilmentOrderStatuses =
        {
            "confirmed",
            "processing",
            "packed",
            "dispatched",
            "shipped",
            "in transit",
            "out for delivery"
        };

        private static readonly string[] InFulfilmentOnlyOrderStatuses =
        {
            "processing",
            "packed",
            "dispatched",
            "shipped",
            "in transit",
            "out for delivery"
        };

        private static readonly string[] CompletedOrderStatuses =
        {
            "delivered",
            "completed"
        };

        private readonly AppDbContext _context;

        public CustomerPurchaseHistoryRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<CustomerPurchaseHistoryPagedDto> GetPurchaseHistoryAsync(
            long customerUserId,
            CustomerPurchaseHistoryQueryDto query,
            DateTime? effectiveFromDate,
            DateTime? effectiveToDate,
            CancellationToken cancellationToken = default)
        {
            var filtered = BuildEligibleBaseQuery(customerUserId);

            if (!string.IsNullOrWhiteSpace(query.Status))
            {
                switch (query.Status.ToLowerInvariant())
                {
                    case "confirmed":
                        filtered = filtered.Where(x => ConfirmedAndFulfilmentOrderStatuses.Contains(x.DbOrderStatus.ToLower()));
                        break;
                    case "in_fulfilment":
                        filtered = filtered.Where(x => InFulfilmentOnlyOrderStatuses.Contains(x.DbOrderStatus.ToLower()));
                        break;
                    case "completed":
                        filtered = filtered.Where(x => CompletedOrderStatuses.Contains(x.DbOrderStatus.ToLower()));
                        break;
                }
            }

            if (effectiveFromDate.HasValue)
            {
                DateTime from = effectiveFromDate.Value.Date;
                filtered = filtered.Where(x => x.SaleDate >= from);
            }

            if (effectiveToDate.HasValue)
            {
                DateTime to = effectiveToDate.Value.Date;
                filtered = filtered.Where(x => x.SaleDate <= to);
            }

            if (!string.IsNullOrWhiteSpace(query.Search))
            {
                string term = query.Search.Trim().ToLower();
                filtered = filtered.Where(x =>
                    x.SaleCode.ToLower().Contains(term) ||
                    x.OrderCode.ToLower().Contains(term) ||
                    x.ProductName.ToLower().Contains(term) ||
                    (x.VendorDistrict != null && x.VendorDistrict.ToLower().Contains(term)) ||
                    (x.VendorState != null && x.VendorState.ToLower().Contains(term)));
            }

            int totalCount = await filtered.CountAsync(cancellationToken);
            int totalPages = totalCount == 0
                ? 0
                : (int)Math.Ceiling(totalCount / (double)query.PageSize);

            if (totalCount == 0 || (query.Page - 1) * query.PageSize >= totalCount)
            {
                return new CustomerPurchaseHistoryPagedDto
                {
                    Items = new List<CustomerPurchaseHistoryItemDto>(),
                    Page = query.Page,
                    PageSize = query.PageSize,
                    TotalCount = totalCount,
                    TotalPages = totalPages,
                    HasNextPage = false,
                    HasPreviousPage = query.Page > 1 && totalCount > 0
                };
            }

            bool isAsc = string.Equals(query.SortOrder, "asc", StringComparison.OrdinalIgnoreCase);

            IQueryable<PurchaseLineProjection> ordered = (query.SortBy, isAsc) switch
            {
                ("transactionId", true) => filtered.OrderBy(x => x.SaleCode).ThenByDescending(x => x.Id),
                ("transactionId", false) => filtered.OrderByDescending(x => x.SaleCode).ThenByDescending(x => x.Id),
                ("productName", true) => filtered.OrderBy(x => x.ProductName).ThenByDescending(x => x.Id),
                ("productName", false) => filtered.OrderByDescending(x => x.ProductName).ThenByDescending(x => x.Id),
                ("quantity", true) => filtered.OrderBy(x => x.Quantity).ThenByDescending(x => x.Id),
                ("quantity", false) => filtered.OrderByDescending(x => x.Quantity).ThenByDescending(x => x.Id),
                ("unitPrice", true) => filtered.OrderBy(x => x.PricePerUnit).ThenByDescending(x => x.Id),
                ("unitPrice", false) => filtered.OrderByDescending(x => x.PricePerUnit).ThenByDescending(x => x.Id),
                ("totalAmount", true) => filtered.OrderBy(x => x.LineTotal).ThenByDescending(x => x.Id),
                ("totalAmount", false) => filtered.OrderByDescending(x => x.LineTotal).ThenByDescending(x => x.Id),
                ("purchaseDate", true) => filtered.OrderBy(x => x.SaleDate).ThenBy(x => x.CreatedAt).ThenByDescending(x => x.Id),
                _ => filtered.OrderByDescending(x => x.SaleDate).ThenByDescending(x => x.CreatedAt).ThenByDescending(x => x.Id)
            };

            var rows = await ordered
                .Skip((query.Page - 1) * query.PageSize)
                .Take(query.PageSize)
                .ToListAsync(cancellationToken);

            var items = rows.Select(MapToItemDto).ToList();

            return new CustomerPurchaseHistoryPagedDto
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

        public async Task<CustomerPurchaseSummaryDto> GetPurchaseSummaryAsync(
            long customerUserId,
            CancellationToken cancellationToken = default)
        {
            var summary = await _context.VpSales.AsNoTracking()
                .Where(s => s.CustomerUserId == customerUserId &&
                            EligibleOrderStatuses.Contains(s.OrderStatus.ToLower()))
                .GroupBy(_ => 1)
                .Select(g => new CustomerPurchaseSummaryDto
                {
                    ConfirmedPurchases = g.Count(),
                    CompletedOrders = g.Count(s => CompletedOrderStatuses.Contains(s.OrderStatus.ToLower())),
                    InFulfilment = g.Count(s => ConfirmedAndFulfilmentOrderStatuses.Contains(s.OrderStatus.ToLower())),
                    TotalPurchaseSpend = g.Sum(s => s.TotalAmount)
                })
                .FirstOrDefaultAsync(cancellationToken);

            return summary ?? new CustomerPurchaseSummaryDto();
        }

        public async Task<CustomerPurchaseDetailDto?> GetPurchaseByIdAsync(
            long customerUserId,
            long purchaseItemId,
            CancellationToken cancellationToken = default)
        {
            var row = await BuildEligibleBaseQuery(customerUserId)
                .FirstOrDefaultAsync(x => x.Id == purchaseItemId, cancellationToken);

            if (row == null)
            {
                return null;
            }

            return new CustomerPurchaseDetailDto
            {
                Id = row.Id,
                TransactionId = row.SaleCode,
                OrderId = row.OrderCode,
                LotId = ResolveLotId(row.BatchCode, row.ProcessingBatchRef),
                Status = MapOrderStatusToUi(row.DbOrderStatus),
                PurchaseDate = row.SaleDate,
                ExpectedPaymentDate = row.ExpectedPaymentDate,
                ProductName = row.ProductName,
                Category = null,
                SourceRegion = FormatSourceRegion(row.VendorDistrict, row.VendorState),
                Quantity = row.Quantity,
                Unit = row.Unit,
                UnitPrice = row.PricePerUnit,
                TotalAmount = row.LineTotal
            };
        }

        /// <summary>
        /// Strictly read-only base query at `vp_sale_items` line-item granularity joined to `vp_sales`,
        /// scoped to the authenticated customer's `Users.Id` and excluding Draft / Cancelled sales.
        /// Never selects `cost_per_unit`, internal vendor financials, or unrelated customer PII.
        /// </summary>
        private IQueryable<PurchaseLineProjection> BuildEligibleBaseQuery(long customerUserId)
        {
            return from si in _context.VpSaleItems.AsNoTracking()
                   join s in _context.VpSales.AsNoTracking() on si.SaleId equals s.Id
                   join v in _context.Vendors.AsNoTracking() on s.VendorId equals v.Id into vGroup
                   from v in vGroup.DefaultIfEmpty()
                   join vp in _context.VendorProfiles.AsNoTracking() on v.Id equals vp.VendorId into vpGroup
                   from vp in vpGroup.DefaultIfEmpty()
                   where s.CustomerUserId == customerUserId
                      && EligibleOrderStatuses.Contains(s.OrderStatus.ToLower())
                   select new PurchaseLineProjection
                   {
                       Id = si.Id,
                       SaleId = s.Id,
                       SaleCode = s.SaleCode,
                       OrderCode = s.OrderCode,
                       BatchCode = si.BatchCode,
                       ProcessingBatchRef = si.ProcessingBatchRef,
                       DbOrderStatus = s.OrderStatus,
                       SaleDate = s.SaleDate,
                       ExpectedPaymentDate = s.ExpectedPaymentDate,
                       CreatedAt = s.CreatedAt,
                       ProductName = si.ProductName,
                       VendorDistrict = vp != null ? vp.District : null,
                       VendorState = vp != null ? vp.State : null,
                       Quantity = si.Quantity,
                       Unit = si.Unit,
                       PricePerUnit = si.PricePerUnit,
                       LineTotal = si.LineTotal
                   };
        }

        private static CustomerPurchaseHistoryItemDto MapToItemDto(PurchaseLineProjection row)
        {
            return new CustomerPurchaseHistoryItemDto
            {
                Id = row.Id,
                SaleId = row.SaleId,
                TransactionId = row.SaleCode,
                OrderId = row.OrderCode,
                LotId = ResolveLotId(row.BatchCode, row.ProcessingBatchRef),
                Status = MapOrderStatusToUi(row.DbOrderStatus),
                PurchaseDate = row.SaleDate,
                ExpectedPaymentDate = row.ExpectedPaymentDate,
                ProductName = row.ProductName,
                Category = null,
                SourceRegion = FormatSourceRegion(row.VendorDistrict, row.VendorState),
                Quantity = row.Quantity,
                Unit = row.Unit,
                UnitPrice = row.PricePerUnit,
                TotalAmount = row.LineTotal
            };
        }

        public static string MapOrderStatusToUi(string? dbOrderStatus)
        {
            if (string.IsNullOrWhiteSpace(dbOrderStatus))
            {
                return "Confirmed";
            }

            string normalized = dbOrderStatus.Trim().ToLowerInvariant();
            if (CompletedOrderStatuses.Contains(normalized))
            {
                return "Completed";
            }

            if (InFulfilmentOnlyOrderStatuses.Contains(normalized))
            {
                return "In Fulfilment";
            }

            return "Confirmed";
        }

        public static string? FormatSourceRegion(string? district, string? state)
        {
            string? d = string.IsNullOrWhiteSpace(district) ? null : district.Trim();
            string? s = string.IsNullOrWhiteSpace(state) ? null : state.Trim();

            if (d != null && s != null) return $"{d}, {s}";
            return d ?? s;
        }

        public static string? ResolveLotId(string? batchCode, string? processingBatchRef)
        {
            if (!string.IsNullOrWhiteSpace(batchCode)) return batchCode.Trim();
            if (!string.IsNullOrWhiteSpace(processingBatchRef)) return processingBatchRef.Trim();
            return null;
        }

        private sealed class PurchaseLineProjection
        {
            public long Id { get; set; }
            public long SaleId { get; set; }
            public string SaleCode { get; set; } = string.Empty;
            public string OrderCode { get; set; } = string.Empty;
            public string BatchCode { get; set; } = string.Empty;
            public string? ProcessingBatchRef { get; set; }
            public string DbOrderStatus { get; set; } = string.Empty;
            public DateTime SaleDate { get; set; }
            public DateTime? ExpectedPaymentDate { get; set; }
            public DateTime CreatedAt { get; set; }
            public string ProductName { get; set; } = string.Empty;
            public string? VendorDistrict { get; set; }
            public string? VendorState { get; set; }
            public decimal Quantity { get; set; }
            public string Unit { get; set; } = string.Empty;
            public decimal PricePerUnit { get; set; }
            public decimal LineTotal { get; set; }
        }
    }
}

