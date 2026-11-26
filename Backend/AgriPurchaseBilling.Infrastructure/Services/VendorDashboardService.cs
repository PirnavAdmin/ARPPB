using System;
using System.Collections.Generic;
using System.Data;
using System.Data.Common;
using System.Globalization;
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

        public VendorDashboardService(VendorOperationsDbContext context)
        {
            _context = context;
        }

        private async Task<DbConnection> GetOpenConnectionAsync(CancellationToken cancellationToken)
        {
            var conn = _context.Database.GetDbConnection();
            if (conn.State != ConnectionState.Open)
            {
                await conn.OpenAsync(cancellationToken);
            }
            return conn;
        }

        public async Task<VendorDashboardDto> GetDashboardAsync(
            long vendorId,
            DateTime? fromDate,
            DateTime? toDate,
            bool includeSandboxOtps,
            CancellationToken cancellationToken = default)
        {
            var (start, endExclusive) = NormalizeRange(fromDate, toDate);

            var kpis = new VendorDashboardKpisDto();
            var overview = new VendorPurchaseOverviewDto();
            var purchaseTrend = new List<VendorPurchaseTrendDto>();
            var cropInventory = new List<VendorCropInventoryDto>();
            var finishedProducts = new List<VendorDashboardFinishedProductDto>();
            var salesAnalytics = new VendorSalesAnalyticsDto();
            var profitLoss = new VendorEstimatedProfitLossDto();

            var conn = await GetOpenConnectionAsync(cancellationToken);
            await using (var cmd = conn.CreateCommand())
            {
                cmd.CommandText = "CALL sp_VendorDashboard_GetSummary(@p_vendor_id, @p_from_date, @p_to_date);";
                AddParam(cmd, "@p_vendor_id", vendorId, DbType.Int64);
                AddParam(cmd, "@p_from_date", start, DbType.DateTime);
                AddParam(cmd, "@p_to_date", endExclusive, DbType.DateTime);

                await using var reader = await cmd.ExecuteReaderAsync(cancellationToken);

                // Result Set 1: KPIs & Financial Summary
                if (await reader.ReadAsync(cancellationToken))
                {
                    var totalFarmers = SafeInt(reader["TotalFarmers"]);
                    var activeFarmers = SafeInt(reader["ActiveFarmers"]);
                    var totalMiddlemen = SafeInt(reader["TotalMiddlemen"]);
                    var activeMiddlemen = SafeInt(reader["ActiveMiddlemen"]);
                    var totalCustomers = SafeInt(reader["TotalCustomers"]);

                    var farmerCount = SafeInt(reader["FarmerPurchaseCount"]);
                    var farmerQty = SafeDecimal(reader["FarmerPurchaseQuantity"]);
                    var farmerAmount = SafeDecimal(reader["FarmerPurchaseAmount"]);

                    var middlemanCount = SafeInt(reader["MiddlemanPurchaseCount"]);
                    var middlemanQty = SafeDecimal(reader["MiddlemanPurchaseQuantity"]);
                    var middlemanAmount = SafeDecimal(reader["MiddlemanPurchaseAmount"]);

                    var totalOrders = SafeInt(reader["TotalOrders"]);
                    var salesVolume = SafeDecimal(reader["SalesVolume"]);
                    var totalSales = SafeDecimal(reader["TotalSales"]);
                    var processingExpenses = SafeDecimal(reader["ProcessingExpenses"]);
                    var rawMaterialCost = SafeDecimal(reader["RawMaterialCost"]);

                    kpis = new VendorDashboardKpisDto
                    {
                        TotalFarmers = totalFarmers,
                        ActiveFarmers = activeFarmers,
                        TotalMiddlemen = totalMiddlemen,
                        ActiveMiddlemen = activeMiddlemen,
                        TotalPurchases = farmerCount + middlemanCount,
                        TotalPurchaseAmount = farmerAmount + middlemanAmount,
                        TotalCustomers = totalCustomers,
                        TotalSales = totalSales,
                        TotalOrders = totalOrders
                    };

                    overview = new VendorPurchaseOverviewDto
                    {
                        FarmerPurchaseAmount = farmerAmount,
                        FarmerPurchaseQuantity = farmerQty,
                        FarmerPurchaseCount = farmerCount,
                        MiddlemanPurchaseAmount = middlemanAmount,
                        MiddlemanPurchaseQuantity = middlemanQty,
                        MiddlemanPurchaseCount = middlemanCount,
                        QuantityUnit = "Quintal"
                    };

                    salesAnalytics.TotalRevenue = totalSales;
                    salesAnalytics.NumberOfOrders = totalOrders;
                    salesAnalytics.SalesVolume = salesVolume;
                    salesAnalytics.AverageOrderValue = totalOrders == 0 ? 0 : totalSales / totalOrders;

                    profitLoss = new VendorEstimatedProfitLossDto
                    {
                        IsEstimate = true,
                        RawMaterialCost = rawMaterialCost,
                        ProcessingExpenses = processingExpenses,
                        SalesRevenue = totalSales,
                        EstimatedProfit = totalSales - rawMaterialCost - processingExpenses,
                        CalculationNote = "Estimated using matched finished-product production cost multiplied by sold quantity, plus processing expenses. Orders without a matching finished product are excluded from cost of goods."
                    };
                }

                // Result Set 2: Purchase Trend
                if (await reader.NextResultAsync(cancellationToken))
                {
                    while (await reader.ReadAsync(cancellationToken))
                    {
                        purchaseTrend.Add(new VendorPurchaseTrendDto
                        {
                            PeriodStart = SafeDateTime(reader["PeriodStart"]),
                            FarmerPurchaseAmount = SafeDecimal(reader["FarmerPurchaseAmount"]),
                            FarmerPurchaseQuantity = SafeDecimal(reader["FarmerPurchaseQuantity"]),
                            MiddlemanPurchaseAmount = SafeDecimal(reader["MiddlemanPurchaseAmount"]),
                            MiddlemanPurchaseQuantity = SafeDecimal(reader["MiddlemanPurchaseQuantity"])
                        });
                    }
                }

                // Result Set 3: Crop Inventory
                if (await reader.NextResultAsync(cancellationToken))
                {
                    while (await reader.ReadAsync(cancellationToken))
                    {
                        cropInventory.Add(new VendorCropInventoryDto
                        {
                            CropName = SafeString(reader["CropName"]),
                            Unit = SafeString(reader["Unit"]),
                            AvailableQuantity = SafeDecimal(reader["AvailableQuantity"])
                        });
                    }
                }

                // Result Set 4: Finished Products
                if (await reader.NextResultAsync(cancellationToken))
                {
                    while (await reader.ReadAsync(cancellationToken))
                    {
                        finishedProducts.Add(new VendorDashboardFinishedProductDto
                        {
                            ProductId = SafeString(reader["ProductId"]),
                            ProductName = SafeString(reader["ProductName"]),
                            BrandName = SafeString(reader["BrandName"]),
                            AvailableQuantity = SafeDecimal(reader["AvailableQuantity"]),
                            SoldQuantity = SafeDecimal(reader["SoldQuantity"]),
                            Unit = SafeString(reader["Unit"]),
                            SellingPrice = SafeDecimal(reader["SellingPrice"]),
                            MinThresholdQuantity = SafeDecimal(reader["MinThresholdQuantity"]),
                            IsLowStock = SafeBool(reader["IsLowStock"])
                        });
                    }
                }

                // Result Set 5: Sales Revenue Trend
                if (await reader.NextResultAsync(cancellationToken))
                {
                    while (await reader.ReadAsync(cancellationToken))
                    {
                        salesAnalytics.RevenueTrend.Add(new VendorRevenueTrendDto
                        {
                            PeriodStart = SafeDateTime(reader["PeriodStart"]),
                            Revenue = SafeDecimal(reader["Revenue"])
                        });
                    }
                }

                // Result Set 6: Product Revenue Breakdown
                if (await reader.NextResultAsync(cancellationToken))
                {
                    while (await reader.ReadAsync(cancellationToken))
                    {
                        salesAnalytics.ProductRevenue.Add(new VendorProductRevenueDto
                        {
                            ProductName = SafeString(reader["ProductName"]),
                            Revenue = SafeDecimal(reader["Revenue"])
                        });
                    }
                }
            }

            var pendingOtps = await GetPendingOtpConfirmationsAsync(
                vendorId, fromDate, toDate, includeSandboxOtps, cancellationToken);

            var recentTxnsPage = await GetTransactionsAsync(
                vendorId,
                new VendorDashboardTransactionQueryDto
                {
                    FromDate = fromDate,
                    ToDate = toDate,
                    Page = 1,
                    PageSize = 20
                },
                cancellationToken);

            return new VendorDashboardDto
            {
                GeneratedAtUtc = DateTime.UtcNow,
                FromDate = start,
                ToDate = endExclusive?.AddTicks(-1),
                Kpis = kpis,
                PurchaseOverview = overview,
                PurchaseTrend = purchaseTrend,
                RawMaterialInventoryByCrop = cropInventory,
                FinishedProducts = finishedProducts,
                SalesAnalytics = salesAnalytics,
                EstimatedProfitLoss = profitLoss,
                PendingOtpConfirmations = pendingOtps,
                RecentTransactions = recentTxnsPage.Items
            };
        }

        public async Task<VendorDashboardTransactionPageDto> GetTransactionsAsync(
            long vendorId,
            VendorDashboardTransactionQueryDto query,
            CancellationToken cancellationToken = default)
        {
            var (start, endExclusive) = NormalizeRange(query.FromDate, query.ToDate);
            var page = Math.Max(1, query.Page);
            var pageSize = Math.Clamp(query.PageSize, 1, 100);
            var offset = (page - 1) * pageSize;

            var items = new List<VendorDashboardTransactionDto>();
            var totalRecords = 0;

            var conn = await GetOpenConnectionAsync(cancellationToken);
            await using (var cmd = conn.CreateCommand())
            {
                cmd.CommandText = "CALL sp_VendorDashboard_GetTransactions(@p_vendor_id, @p_from_date, @p_to_date, @p_type, @p_status, @p_search, @p_offset, @p_limit);";
                AddParam(cmd, "@p_vendor_id", vendorId, DbType.Int64);
                AddParam(cmd, "@p_from_date", start, DbType.DateTime);
                AddParam(cmd, "@p_to_date", endExclusive, DbType.DateTime);
                AddParam(cmd, "@p_type", string.IsNullOrWhiteSpace(query.Type) ? null : query.Type.Trim(), DbType.String);
                AddParam(cmd, "@p_status", string.IsNullOrWhiteSpace(query.Status) ? null : query.Status.Trim(), DbType.String);
                AddParam(cmd, "@p_search", string.IsNullOrWhiteSpace(query.Search) ? null : query.Search.Trim(), DbType.String);
                AddParam(cmd, "@p_offset", offset, DbType.Int32);
                AddParam(cmd, "@p_limit", pageSize, DbType.Int32);

                await using var reader = await cmd.ExecuteReaderAsync(cancellationToken);

                // Result Set 1: Transaction rows
                while (await reader.ReadAsync(cancellationToken))
                {
                    items.Add(new VendorDashboardTransactionDto
                    {
                        TransactionId = SafeString(reader["TransactionId"]),
                        Date = SafeDateTime(reader["Date"]),
                        PartyName = SafeString(reader["PartyName"]),
                        Type = SafeString(reader["Type"]),
                        Product = SafeString(reader["Product"]),
                        Quantity = SafeDecimal(reader["Quantity"]),
                        Unit = SafeString(reader["Unit"]),
                        Amount = SafeDecimal(reader["Amount"]),
                        DueAmount = SafeNullableDecimal(reader["DueAmount"]),
                        Status = SafeString(reader["Status"]),
                        OtpStatus = SafeString(reader["OtpStatus"]),
                        ExpectedPaymentDate = SafeNullableDateTime(reader["ExpectedPaymentDate"])
                    });
                }

                // Result Set 2: Total count
                if (await reader.NextResultAsync(cancellationToken) && await reader.ReadAsync(cancellationToken))
                {
                    totalRecords = SafeInt(reader["TotalRecords"]);
                }
            }

            return new VendorDashboardTransactionPageDto
            {
                Page = page,
                PageSize = pageSize,
                TotalRecords = totalRecords,
                TotalPages = totalRecords == 0 ? 0 : (int)Math.Ceiling(totalRecords / (double)pageSize),
                Items = items
            };
        }

        public async Task<List<VendorDashboardSearchResultDto>> SearchAsync(
            long vendorId,
            string search,
            int take = 20,
            CancellationToken cancellationToken = default)
        {
            var term = search.Trim();
            var limit = Math.Clamp(take, 1, 50);
            var results = new List<VendorDashboardSearchResultDto>();

            var conn = await GetOpenConnectionAsync(cancellationToken);
            await using (var cmd = conn.CreateCommand())
            {
                cmd.CommandText = "CALL sp_VendorDashboard_Search(@p_vendor_id, @p_search, @p_limit);";
                AddParam(cmd, "@p_vendor_id", vendorId, DbType.Int64);
                AddParam(cmd, "@p_search", term, DbType.String);
                AddParam(cmd, "@p_limit", limit, DbType.Int32);

                await using var reader = await cmd.ExecuteReaderAsync(cancellationToken);
                while (await reader.ReadAsync(cancellationToken))
                {
                    results.Add(new VendorDashboardSearchResultDto
                    {
                        EntityType = SafeString(reader["EntityType"]),
                        EntityId = SafeString(reader["EntityId"]),
                        Title = SafeString(reader["Title"]),
                        Subtitle = SafeString(reader["Subtitle"]),
                        NavigationPath = SafeString(reader["NavigationPath"])
                    });
                }
            }

            return results;
        }

        public async Task<List<VendorDashboardOtpConfirmationDto>> GetPendingOtpConfirmationsAsync(
            long vendorId,
            DateTime? fromDate,
            DateTime? toDate,
            bool includeSandboxOtps,
            CancellationToken cancellationToken = default)
        {
            var (start, endExclusive) = NormalizeRange(fromDate, toDate);
            var list = new List<VendorDashboardOtpConfirmationDto>();

            var conn = await GetOpenConnectionAsync(cancellationToken);
            await using (var cmd = conn.CreateCommand())
            {
                cmd.CommandText = "CALL sp_VendorDashboard_GetPendingOtpConfirmations(@p_vendor_id, @p_from_date, @p_to_date);";
                AddParam(cmd, "@p_vendor_id", vendorId, DbType.Int64);
                AddParam(cmd, "@p_from_date", start, DbType.DateTime);
                AddParam(cmd, "@p_to_date", endExclusive, DbType.DateTime);

                await using var reader = await cmd.ExecuteReaderAsync(cancellationToken);
                while (await reader.ReadAsync(cancellationToken))
                {
                    list.Add(new VendorDashboardOtpConfirmationDto
                    {
                        Id = SafeLong(reader["Id"]),
                        PartnerType = SafeString(reader["PartnerType"]),
                        PartnerName = SafeString(reader["PartnerName"]),
                        PartnerCode = SafeString(reader["PartnerCode"]),
                        Purpose = SafeString(reader["Purpose"]),
                        ActionDetails = SafeString(reader["ActionDetails"]),
                        Status = SafeString(reader["Status"]),
                        CreatedAt = SafeDateTime(reader["CreatedAt"]),
                        SandboxOtp = includeSandboxOtps ? SafeString(reader["SandboxOtp"]) : null
                    });
                }
            }

            return list;
        }

        public async Task<VendorDashboardOtpVerificationDto?> VerifyOtpAsync(
            long vendorId,
            string partnerType,
            long confirmationId,
            string otp,
            CancellationToken cancellationToken = default)
        {
            var conn = await GetOpenConnectionAsync(cancellationToken);
            await using var cmd = conn.CreateCommand();
            cmd.CommandText = "CALL sp_VendorDashboard_VerifyOtp(@p_vendor_id, @p_partner_type, @p_confirmation_id, @p_otp);";
            AddParam(cmd, "@p_vendor_id", vendorId, DbType.Int64);
            AddParam(cmd, "@p_partner_type", partnerType.Trim(), DbType.String);
            AddParam(cmd, "@p_confirmation_id", confirmationId, DbType.Int64);
            AddParam(cmd, "@p_otp", otp.Trim(), DbType.String);

            await using var reader = await cmd.ExecuteReaderAsync(cancellationToken);
            if (await reader.ReadAsync(cancellationToken))
            {
                var isVerified = SafeBool(reader["Verified"]);
                if (isVerified)
                {
                    return new VendorDashboardOtpVerificationDto
                    {
                        Verified = true,
                        PartnerType = SafeString(reader["PartnerType"]),
                        ConfirmationId = SafeLong(reader["ConfirmationId"]),
                        VerifiedAt = SafeNullableDateTime(reader["VerifiedAt"])
                    };
                }
            }

            return null;
        }

        private static (DateTime? Start, DateTime? EndExclusive) NormalizeRange(DateTime? from, DateTime? to)
        {
            var start = from?.Date;
            var endExclusive = to?.Date.AddDays(1);
            return (start, endExclusive);
        }

        private static void AddParam(DbCommand cmd, string name, object? value, DbType? dbType = null)
        {
            var p = cmd.CreateParameter();
            p.ParameterName = name;
            p.Value = value ?? DBNull.Value;
            if (dbType.HasValue) p.DbType = dbType.Value;
            cmd.Parameters.Add(p);
        }

        private static string SafeString(object? val) => val == null || val is DBNull ? string.Empty : val.ToString() ?? string.Empty;
        private static decimal SafeDecimal(object? val) => val == null || val is DBNull ? 0m : Convert.ToDecimal(val, CultureInfo.InvariantCulture);
        private static int SafeInt(object? val) => val == null || val is DBNull ? 0 : Convert.ToInt32(val, CultureInfo.InvariantCulture);
        private static long SafeLong(object? val) => val == null || val is DBNull ? 0L : Convert.ToInt64(val, CultureInfo.InvariantCulture);
        private static DateTime SafeDateTime(object? val) => val == null || val is DBNull ? DateTime.MinValue : Convert.ToDateTime(val, CultureInfo.InvariantCulture);
        private static DateTime? SafeNullableDateTime(object? val) => val == null || val is DBNull ? null : Convert.ToDateTime(val, CultureInfo.InvariantCulture);
        private static decimal? SafeNullableDecimal(object? val) => val == null || val is DBNull ? null : Convert.ToDecimal(val, CultureInfo.InvariantCulture);
        private static bool SafeBool(object? val) => val != null && !(val is DBNull) && (val is bool b ? b : Convert.ToInt32(val) != 0);
    }
}
