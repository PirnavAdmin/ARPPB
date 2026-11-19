using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using AgriPurchaseBilling.Application.DTOs.VendorOperations;
using AgriPurchaseBilling.Application.Interfaces;
using AgriPurchaseBilling.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace AgriPurchaseBilling.Infrastructure.Services
{
    public sealed class VendorDashboardService : IVendorDashboardService
    {
        private readonly VendorOperationsDbContext _context;

        private sealed record PurchaseMetric(string Code, string Crop, decimal Quantity, string Unit, decimal TotalAmount, decimal DueAmount, string Status, DateTime PurchaseDate, string PartyName);
        private sealed record OrderMetric(string Code, string ProductName, decimal Quantity, string Unit, decimal TotalAmount, decimal DueAmount, string Status, DateTime OrderDate, string PartyName);

        public VendorDashboardService(VendorOperationsDbContext context) => _context = context;

        public async Task<VendorDashboardDto> GetDashboardAsync(
            long vendorId,
            DateTime? fromDate,
            DateTime? toDate,
            bool includeSandboxOtps,
            CancellationToken cancellationToken = default)
        {
            var (start, endExclusive) = NormalizeRange(fromDate, toDate);

            var farmers = await _context.Farmers.AsNoTracking()
                .Where(x => x.VendorId == vendorId)
                .Select(x => new { x.Status })
                .ToListAsync(cancellationToken);
            var middlemen = await _context.Middlemen.AsNoTracking()
                .Where(x => x.VendorId == vendorId)
                .Select(x => new { x.Status })
                .ToListAsync(cancellationToken);
            var customers = await _context.Customers.AsNoTracking()
                .Where(x => x.VendorId == vendorId)
                .CountAsync(cancellationToken);

            var farmerPurchases = await _context.FarmerPurchases.AsNoTracking()
                .Where(x => x.Farmer != null && x.Farmer.VendorId == vendorId
                    && (!start.HasValue || x.PurchaseDate >= start.Value)
                    && (!endExclusive.HasValue || x.PurchaseDate < endExclusive.Value))
                .Select(x => new PurchaseMetric(x.PurchaseCode, x.CropName, x.Quantity, x.Unit, x.TotalAmount, x.DueAmount, x.PaymentStatus, x.PurchaseDate, x.Farmer!.FullName))
                .ToListAsync(cancellationToken);
            var middlemanPurchases = await _context.MiddlemanPurchases.AsNoTracking()
                .Where(x => x.Middleman != null && x.Middleman.VendorId == vendorId
                    && (!start.HasValue || x.PurchaseDate >= start.Value)
                    && (!endExclusive.HasValue || x.PurchaseDate < endExclusive.Value))
                .Select(x => new PurchaseMetric(x.PurchaseCode, x.CropName, x.Quantity, x.Unit, x.TotalAmount, x.DueAmount, x.PaymentStatus, x.PurchaseDate, x.Middleman!.BusinessName))
                .ToListAsync(cancellationToken);
            var orders = await _context.CustomerOrders.AsNoTracking()
                .Where(x => x.Customer != null && x.Customer.VendorId == vendorId
                    && (!start.HasValue || x.OrderDate >= start.Value)
                    && (!endExclusive.HasValue || x.OrderDate < endExclusive.Value))
                .Select(x => new OrderMetric(x.OrderCode, x.ProductName, x.Quantity, x.Unit, x.TotalAmount, x.DueAmount, x.OrderStatus, x.OrderDate, x.Customer!.CustomerName))
                .ToListAsync(cancellationToken);

            var inRangeFarmerPurchases = farmerPurchases.Where(x => InRange(x.PurchaseDate, start, endExclusive)).ToList();
            var inRangeMiddlemanPurchases = middlemanPurchases.Where(x => InRange(x.PurchaseDate, start, endExclusive)).ToList();
            var inRangeOrders = orders.Where(x => InRange(x.OrderDate, start, endExclusive)).ToList();

            var stocks = await _context.RawMaterialStocks.AsNoTracking()
                .Where(x => x.VendorId == vendorId)
                .Select(x => new { x.CropName, x.AvailableQuantity, x.Unit })
                .ToListAsync(cancellationToken);

            var finishedProducts = await _context.FinishedProducts.AsNoTracking()
                .Where(x => x.VendorId == vendorId)
                .OrderBy(x => x.ProductName)
                .Select(x => new VendorDashboardFinishedProductDto
                {
                    ProductId = x.ProductCode,
                    ProductName = x.ProductName,
                    BrandName = x.BrandName,
                    AvailableQuantity = x.AvailableQuantity,
                    SoldQuantity = x.SoldQuantity,
                    Unit = x.Unit,
                    SellingPrice = x.SellingPrice,
                    MinThresholdQuantity = x.MinThresholdQuantity,
                    IsLowStock = x.AvailableQuantity <= x.MinThresholdQuantity
                })
                .ToListAsync(cancellationToken);

            var processing = await _context.ProcessingBatches.AsNoTracking()
                .Where(x => x.VendorId == vendorId
                    && (!start.HasValue || x.ProcessingDate >= start.Value)
                    && (!endExclusive.HasValue || x.ProcessingDate < endExclusive.Value))
                .Select(x => new { x.ProcessingDate, x.ProcessingExpenses })
                .ToListAsync(cancellationToken);
            var rangedProcessing = processing.Where(x => InRange(x.ProcessingDate, start, endExclusive)).ToList();

            var productCosts = await _context.FinishedProducts.AsNoTracking()
                .Where(x => x.VendorId == vendorId)
                .Select(x => new { x.ProductName, x.ProductionCost })
                .ToListAsync(cancellationToken);
            var costLookup = productCosts
                .GroupBy(x => x.ProductName, StringComparer.OrdinalIgnoreCase)
                .ToDictionary(group => group.Key, group => group.First().ProductionCost, StringComparer.OrdinalIgnoreCase);
            var estimatedCostOfGoods = inRangeOrders.Sum(order =>
                costLookup.TryGetValue(order.ProductName, out var unitCost) ? order.Quantity * unitCost : 0m);

            var pendingOtps = await LoadPendingOtpConfirmationsAsync(vendorId, start, endExclusive, includeSandboxOtps, cancellationToken);
            var purchaseAmountFarmers = inRangeFarmerPurchases.Sum(x => x.TotalAmount);
            var purchaseAmountMiddlemen = inRangeMiddlemanPurchases.Sum(x => x.TotalAmount);
            var revenue = inRangeOrders.Sum(x => x.TotalAmount);
            var processingExpenses = rangedProcessing.Sum(x => x.ProcessingExpenses);

            return new VendorDashboardDto
            {
                GeneratedAtUtc = DateTime.UtcNow,
                FromDate = start,
                ToDate = endExclusive?.AddTicks(-1),
                Kpis = new VendorDashboardKpisDto
                {
                    TotalFarmers = farmers.Count,
                    ActiveFarmers = farmers.Count(x => IsActive(x.Status)),
                    TotalMiddlemen = middlemen.Count,
                    ActiveMiddlemen = middlemen.Count(x => IsActive(x.Status)),
                    TotalPurchases = inRangeFarmerPurchases.Count + inRangeMiddlemanPurchases.Count,
                    TotalPurchaseAmount = purchaseAmountFarmers + purchaseAmountMiddlemen,
                    TotalCustomers = customers,
                    TotalSales = revenue,
                    TotalOrders = inRangeOrders.Count
                },
                PurchaseOverview = new VendorPurchaseOverviewDto
                {
                    FarmerPurchaseAmount = purchaseAmountFarmers,
                    FarmerPurchaseQuantity = inRangeFarmerPurchases.Sum(x => x.Quantity),
                    FarmerPurchaseCount = inRangeFarmerPurchases.Count,
                    MiddlemanPurchaseAmount = purchaseAmountMiddlemen,
                    MiddlemanPurchaseQuantity = inRangeMiddlemanPurchases.Sum(x => x.Quantity),
                    MiddlemanPurchaseCount = inRangeMiddlemanPurchases.Count
                },
                PurchaseTrend = BuildPurchaseTrend(inRangeFarmerPurchases, inRangeMiddlemanPurchases),
                RawMaterialInventoryByCrop = stocks
                    .GroupBy(x => new { x.CropName, x.Unit })
                    .Select(group => new VendorCropInventoryDto
                    {
                        CropName = group.Key.CropName,
                        Unit = group.Key.Unit,
                        AvailableQuantity = group.Sum(x => x.AvailableQuantity)
                    })
                    .OrderByDescending(x => x.AvailableQuantity)
                    .ToList(),
                FinishedProducts = finishedProducts,
                SalesAnalytics = BuildSalesAnalytics(inRangeOrders),
                EstimatedProfitLoss = new VendorEstimatedProfitLossDto
                {
                    RawMaterialCost = estimatedCostOfGoods,
                    ProcessingExpenses = processingExpenses,
                    SalesRevenue = revenue,
                    EstimatedProfit = revenue - estimatedCostOfGoods - processingExpenses,
                    CalculationNote = "Estimated using matched finished-product production cost multiplied by sold quantity, plus processing expenses. Orders without a matching finished product are excluded from cost of goods."
                },
                PendingOtpConfirmations = pendingOtps
            };
        }

        public async Task<VendorDashboardTransactionPageDto> GetTransactionsAsync(
            long vendorId,
            VendorDashboardTransactionQueryDto query,
            CancellationToken cancellationToken = default)
        {
            var (start, endExclusive) = NormalizeRange(query.FromDate, query.ToDate);
            var transactions = await LoadTransactionsAsync(vendorId, start, endExclusive, cancellationToken);

            if (!string.IsNullOrWhiteSpace(query.Type))
                transactions = transactions.Where(x => EqualsIgnoreCase(x.Type, query.Type)).ToList();
            if (!string.IsNullOrWhiteSpace(query.Status))
                transactions = transactions.Where(x => EqualsIgnoreCase(x.Status, query.Status)).ToList();
            if (!string.IsNullOrWhiteSpace(query.Search))
            {
                var term = query.Search.Trim();
                transactions = transactions.Where(x => ContainsIgnoreCase(x.TransactionId, term)
                    || ContainsIgnoreCase(x.PartyName, term)
                    || ContainsIgnoreCase(x.Product, term)).ToList();
            }

            var page = Math.Max(1, query.Page);
            var pageSize = Math.Clamp(query.PageSize, 1, 100);
            var total = transactions.Count;
            return new VendorDashboardTransactionPageDto
            {
                Page = page,
                PageSize = pageSize,
                TotalRecords = total,
                TotalPages = total == 0 ? 0 : (int)Math.Ceiling(total / (double)pageSize),
                Items = transactions.Skip((page - 1) * pageSize).Take(pageSize).ToList()
            };
        }

        public async Task<VendorDashboardOtpVerificationDto?> VerifyOtpAsync(
            long vendorId, string partnerType, long confirmationId, string otp, CancellationToken cancellationToken = default)
        {
            var suppliedOtp = Encoding.UTF8.GetBytes(otp.Trim());
            if (partnerType.Equals("Farmer", StringComparison.OrdinalIgnoreCase))
            {
                var log = await _context.FarmerOtpLogs
                    .FirstOrDefaultAsync(x => x.Id == confirmationId && x.Farmer != null && x.Farmer.VendorId == vendorId, cancellationToken);
                if (log == null || !IsPending(log.Status) || !OtpMatches(log.OtpCode, suppliedOtp)) return null;
                log.Status = "Verified";
                log.VerifiedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync(cancellationToken);
                return new VendorDashboardOtpVerificationDto { Verified = true, PartnerType = "Farmer", ConfirmationId = log.Id, VerifiedAt = log.VerifiedAt };
            }

            if (partnerType.Equals("Middleman", StringComparison.OrdinalIgnoreCase))
            {
                var log = await _context.MiddlemanOtpLogs
                    .FirstOrDefaultAsync(x => x.Id == confirmationId && x.Middleman != null && x.Middleman.VendorId == vendorId, cancellationToken);
                if (log == null || !IsPending(log.Status) || !OtpMatches(log.OtpCode, suppliedOtp)) return null;
                log.Status = "Verified";
                log.VerifiedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync(cancellationToken);
                return new VendorDashboardOtpVerificationDto { Verified = true, PartnerType = "Middleman", ConfirmationId = log.Id, VerifiedAt = log.VerifiedAt };
            }

            return null;
        }

        public Task<List<VendorDashboardOtpConfirmationDto>> GetPendingOtpConfirmationsAsync(
            long vendorId, DateTime? fromDate, DateTime? toDate, bool includeSandboxOtps, CancellationToken cancellationToken = default)
        {
            var (start, endExclusive) = NormalizeRange(fromDate, toDate);
            return LoadPendingOtpConfirmationsAsync(vendorId, start, endExclusive, includeSandboxOtps, cancellationToken);
        }

        public async Task<List<VendorDashboardSearchResultDto>> SearchAsync(
            long vendorId, string search, int take = 20, CancellationToken cancellationToken = default)
        {
            var term = search.Trim();
            var limit = Math.Clamp(take, 1, 50);
            var results = new List<VendorDashboardSearchResultDto>();

            results.AddRange(await _context.Farmers.AsNoTracking()
                .Where(x => x.VendorId == vendorId && (x.FarmerCode.Contains(term) || x.FullName.Contains(term) || x.MobileNumber.Contains(term)))
                .OrderBy(x => x.FarmerCode).Take(limit)
                .Select(x => new VendorDashboardSearchResultDto { EntityType = "Farmer", EntityId = x.FarmerCode, Title = x.FullName, Subtitle = x.MobileNumber, NavigationPath = $"/vendor/farmers/{x.FarmerCode}" })
                .ToListAsync(cancellationToken));
            results.AddRange(await _context.Middlemen.AsNoTracking()
                .Where(x => x.VendorId == vendorId && (x.MiddlemanCode.Contains(term) || x.FullName.Contains(term) || x.BusinessName.Contains(term) || x.MobileNumber.Contains(term)))
                .OrderBy(x => x.MiddlemanCode).Take(limit)
                .Select(x => new VendorDashboardSearchResultDto { EntityType = "Middleman", EntityId = x.MiddlemanCode, Title = x.BusinessName, Subtitle = x.FullName, NavigationPath = $"/vendor/middlemen/{x.MiddlemanCode}" })
                .ToListAsync(cancellationToken));
            results.AddRange(await _context.Customers.AsNoTracking()
                .Where(x => x.VendorId == vendorId && (x.CustomerCode.Contains(term) || x.CustomerName.Contains(term) || x.BusinessName.Contains(term) || x.MobileNumber.Contains(term)))
                .OrderBy(x => x.CustomerCode).Take(limit)
                .Select(x => new VendorDashboardSearchResultDto { EntityType = "Customer", EntityId = x.CustomerCode, Title = x.CustomerName, Subtitle = x.BusinessName, NavigationPath = $"/vendor/customers/{x.CustomerCode}" })
                .ToListAsync(cancellationToken));
            results.AddRange(await _context.RawMaterialStocks.AsNoTracking()
                .Where(x => x.VendorId == vendorId && (x.StockCode.Contains(term) || x.CropName.Contains(term) || x.BatchNumber.Contains(term)))
                .OrderBy(x => x.StockCode).Take(limit)
                .Select(x => new VendorDashboardSearchResultDto { EntityType = "RawMaterial", EntityId = x.StockCode, Title = x.CropName, Subtitle = x.BatchNumber, NavigationPath = $"/vendor/raw-material-inventory/{x.StockCode}" })
                .ToListAsync(cancellationToken));
            results.AddRange(await _context.ProcessingBatches.AsNoTracking()
                .Where(x => x.VendorId == vendorId && (x.ProcessingCode.Contains(term) || x.BatchNumber.Contains(term) || x.RawMaterialName.Contains(term)))
                .OrderBy(x => x.ProcessingDate).Take(limit)
                .Select(x => new VendorDashboardSearchResultDto { EntityType = "ProcessingBatch", EntityId = x.ProcessingCode, Title = x.RawMaterialName, Subtitle = x.BatchNumber, NavigationPath = $"/vendor/processing/batches/{x.ProcessingCode}" })
                .ToListAsync(cancellationToken));
            results.AddRange(await _context.FinishedProducts.AsNoTracking()
                .Where(x => x.VendorId == vendorId && (x.ProductCode.Contains(term) || x.ProductName.Contains(term) || x.BrandName.Contains(term)))
                .OrderBy(x => x.ProductName).Take(limit)
                .Select(x => new VendorDashboardSearchResultDto { EntityType = "FinishedProduct", EntityId = x.ProductCode, Title = x.ProductName, Subtitle = x.BrandName, NavigationPath = $"/vendor/finished-products/{x.ProductCode}" })
                .ToListAsync(cancellationToken));

            var byType = results.GroupBy(x => x.EntityType).Select(group => group.ToList()).ToList();
            var balanced = new List<VendorDashboardSearchResultDto>(limit);
            for (var index = 0; balanced.Count < limit && byType.Any(group => index < group.Count); index++)
            {
                foreach (var group in byType)
                {
                    if (index < group.Count) balanced.Add(group[index]);
                    if (balanced.Count == limit) break;
                }
            }
            return balanced;
        }

        private async Task<List<VendorDashboardTransactionDto>> LoadTransactionsAsync(
            long vendorId, DateTime? start, DateTime? endExclusive, CancellationToken ct)
        {
            var farmer = await _context.FarmerPurchases.AsNoTracking()
                .Where(x => x.Farmer != null && x.Farmer.VendorId == vendorId)
                .Select(x => new VendorDashboardTransactionDto
                {
                    TransactionId = x.PurchaseCode,
                    Date = x.PurchaseDate,
                    PartyName = x.Farmer!.FullName,
                    Type = "Farmer Purchase",
                    Product = x.CropName,
                    Quantity = x.Quantity,
                    Unit = x.Unit,
                    Amount = x.TotalAmount,
                    DueAmount = x.DueAmount,
                    Status = x.PaymentStatus
                })
                .ToListAsync(ct);
            var middlemen = await _context.MiddlemanPurchases.AsNoTracking()
                .Where(x => x.Middleman != null && x.Middleman.VendorId == vendorId)
                .Select(x => new VendorDashboardTransactionDto
                {
                    TransactionId = x.PurchaseCode,
                    Date = x.PurchaseDate,
                    PartyName = x.Middleman!.BusinessName,
                    Type = "Middleman Purchase",
                    Product = x.CropName,
                    Quantity = x.Quantity,
                    Unit = x.Unit,
                    Amount = x.TotalAmount,
                    DueAmount = x.DueAmount,
                    Status = x.PaymentStatus
                })
                .ToListAsync(ct);
            var customerOrders = await _context.CustomerOrders.AsNoTracking()
                .Where(x => x.Customer != null && x.Customer.VendorId == vendorId)
                .Select(x => new VendorDashboardTransactionDto
                {
                    TransactionId = x.OrderCode,
                    Date = x.OrderDate,
                    PartyName = x.Customer!.CustomerName,
                    Type = "Customer Sale",
                    Product = x.ProductName,
                    Quantity = x.Quantity,
                    Unit = x.Unit,
                    Amount = x.TotalAmount,
                    DueAmount = x.DueAmount,
                    Status = x.OrderStatus
                })
                .ToListAsync(ct);
            var batches = await _context.ProcessingBatches.AsNoTracking()
                .Where(x => x.VendorId == vendorId)
                .Select(x => new VendorDashboardTransactionDto
                {
                    TransactionId = x.ProcessingCode,
                    Date = x.ProcessingDate,
                    PartyName = "Vendor Processing",
                    Type = "Processing",
                    Product = x.RawMaterialName,
                    Quantity = x.InputQuantity,
                    Unit = x.Unit,
                    Amount = x.TotalBatchCost,
                    Status = x.Status
                })
                .ToListAsync(ct);

            return farmer.Concat(middlemen).Concat(customerOrders).Concat(batches)
                .Where(x => InRange(x.Date, start, endExclusive))
                .OrderByDescending(x => x.Date)
                .ToList();
        }

        private async Task<List<VendorDashboardOtpConfirmationDto>> LoadPendingOtpConfirmationsAsync(
            long vendorId, DateTime? start, DateTime? endExclusive, bool includeSandboxOtps, CancellationToken ct)
        {
            var farmerLogs = await _context.FarmerOtpLogs.AsNoTracking()
                .Where(x => x.Farmer != null && x.Farmer.VendorId == vendorId
                    && (x.Status.ToLower() == "pending" || x.Status.ToLower() == "sent"))
                .Select(x => new VendorDashboardOtpConfirmationDto
                {
                    Id = x.Id,
                    PartnerType = "Farmer",
                    PartnerName = x.Farmer!.FullName,
                    PartnerCode = x.Farmer.FarmerCode,
                    Purpose = x.Purpose,
                    ActionDetails = x.ActionDetails,
                    Status = x.Status,
                    CreatedAt = x.CreatedAt,
                    SandboxOtp = includeSandboxOtps ? x.OtpCode : null
                })
                .ToListAsync(ct);
            var middlemanLogs = await _context.MiddlemanOtpLogs.AsNoTracking()
                .Where(x => x.Middleman != null && x.Middleman.VendorId == vendorId
                    && (x.Status.ToLower() == "pending" || x.Status.ToLower() == "sent"))
                .Select(x => new VendorDashboardOtpConfirmationDto
                {
                    Id = x.Id,
                    PartnerType = "Middleman",
                    PartnerName = x.Middleman!.BusinessName,
                    PartnerCode = x.Middleman.MiddlemanCode,
                    Purpose = x.Purpose,
                    ActionDetails = x.ActionDetails,
                    Status = x.Status,
                    CreatedAt = x.CreatedAt,
                    SandboxOtp = includeSandboxOtps ? x.OtpCode : null
                })
                .ToListAsync(ct);

            return farmerLogs.Concat(middlemanLogs)
                .Where(x => InRange(x.CreatedAt, start, endExclusive))
                .OrderByDescending(x => x.CreatedAt)
                .ToList();
        }

        private static List<VendorPurchaseTrendDto> BuildPurchaseTrend(
            List<PurchaseMetric> farmerPurchases, List<PurchaseMetric> middlemanPurchases)
        {
            var map = new SortedDictionary<DateTime, VendorPurchaseTrendDto>();
            foreach (var row in farmerPurchases)
            {
                var key = row.PurchaseDate.Date;
                if (!map.TryGetValue(key, out var point)) map[key] = point = new VendorPurchaseTrendDto { PeriodStart = key };
                point.FarmerPurchaseAmount += row.TotalAmount;
                point.FarmerPurchaseQuantity += row.Quantity;
            }
            foreach (var row in middlemanPurchases)
            {
                var key = row.PurchaseDate.Date;
                if (!map.TryGetValue(key, out var point)) map[key] = point = new VendorPurchaseTrendDto { PeriodStart = key };
                point.MiddlemanPurchaseAmount += row.TotalAmount;
                point.MiddlemanPurchaseQuantity += row.Quantity;
            }
            return map.Values.ToList();
        }

        private static VendorSalesAnalyticsDto BuildSalesAnalytics(List<OrderMetric> orders)
        {
            var revenueTrend = orders.GroupBy(x => x.OrderDate.Date)
                .OrderBy(x => x.Key)
                .Select(group => new VendorRevenueTrendDto
                {
                    PeriodStart = group.Key,
                    Revenue = group.Sum(x => x.TotalAmount)
                }).ToList();
            var productRevenue = orders.GroupBy(x => x.ProductName, StringComparer.OrdinalIgnoreCase)
                .Select(group => new VendorProductRevenueDto
                {
                    ProductName = group.Key,
                    Revenue = group.Sum(x => x.TotalAmount)
                })
                .OrderByDescending(x => x.Revenue)
                .ToList();
            var totalRevenue = orders.Sum(x => x.TotalAmount);
            return new VendorSalesAnalyticsDto
            {
                TotalRevenue = totalRevenue,
                NumberOfOrders = orders.Count,
                SalesVolume = orders.Sum(x => x.Quantity),
                AverageOrderValue = orders.Count == 0 ? 0 : totalRevenue / orders.Count,
                RevenueTrend = revenueTrend,
                ProductRevenue = productRevenue
            };
        }

        private static (DateTime? Start, DateTime? EndExclusive) NormalizeRange(DateTime? from, DateTime? to)
        {
            var start = from?.Date;
            var endExclusive = to?.Date.AddDays(1);
            return (start, endExclusive);
        }

        private static bool InRange(DateTime value, DateTime? start, DateTime? endExclusive) =>
            (!start.HasValue || value >= start.Value) && (!endExclusive.HasValue || value < endExclusive.Value);

        private static bool IsActive(string status) => EqualsIgnoreCase(status, "Active");
        private static bool IsPending(string? status) => EqualsIgnoreCase(status, "Pending") || EqualsIgnoreCase(status, "Sent");
        private static bool OtpMatches(string expectedOtp, byte[] suppliedOtp)
        {
            var expected = Encoding.UTF8.GetBytes(expectedOtp.Trim());
            return expected.Length == suppliedOtp.Length && CryptographicOperations.FixedTimeEquals(expected, suppliedOtp);
        }
        private static bool EqualsIgnoreCase(string? a, string? b) => string.Equals(a?.Trim(), b?.Trim(), StringComparison.OrdinalIgnoreCase);
        private static bool ContainsIgnoreCase(string? value, string term) => value?.Contains(term, StringComparison.OrdinalIgnoreCase) == true;
    }
}
