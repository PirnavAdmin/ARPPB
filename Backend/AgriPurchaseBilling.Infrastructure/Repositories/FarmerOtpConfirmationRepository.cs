using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using AgriPurchaseBilling.Application.DTOs;
using AgriPurchaseBilling.Application.Interfaces;
using AgriPurchaseBilling.Domain.Entities;
using AgriPurchaseBilling.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace AgriPurchaseBilling.Infrastructure.Repositories
{
    public class FarmerOtpConfirmationRepository : IFarmerOtpConfirmationRepository
    {
        private readonly AppDbContext _context;

        public FarmerOtpConfirmationRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<Farmer?> GetFarmerByUserIdAsync(long userId, CancellationToken cancellationToken = default)
        {
            var farmer = await _context.Farmers.FirstOrDefaultAsync(f => f.UserId == userId || f.Id == userId, cancellationToken);
            if (farmer != null) return farmer;

            return await _context.Farmers.FirstOrDefaultAsync(cancellationToken);
        }

        public async Task<FarmerOtpSummaryDto> GetSummaryAsync(long farmerId, CancellationToken cancellationToken = default)
        {
            DateTime now = DateTime.UtcNow;

            // 1. Pending Authorizations: Orders awaiting OTP confirmation (not expired)
            int pendingCount = await _context.FarmerSellProducts
                .CountAsync(s => s.FarmerId == farmerId 
                              && s.IsActive 
                              && s.OtpStatus == "Pending" 
                              && (s.OtpExpiresAt == null || s.OtpExpiresAt >= now), cancellationToken);

            // 2. Confirmed Transactions: Successfully verified sales
            int confirmedCount = 0;
            decimal confirmedRevenue = 0.00m;
            var confirmedSellIds = new List<long>();

            try
            {
                confirmedCount = await _context.FarmerMySales
                    .CountAsync(m => m.FarmerId == farmerId && m.IsActive, cancellationToken);

                confirmedRevenue = await _context.FarmerMySales
                    .Where(m => m.FarmerId == farmerId && m.IsActive)
                    .SumAsync(m => (decimal?)m.TotalRevenue, cancellationToken) ?? 0.00m;

                confirmedSellIds = await _context.FarmerMySales
                    .Where(m => m.FarmerId == farmerId && m.SellProductId != null)
                    .Select(m => m.SellProductId!.Value)
                    .ToListAsync(cancellationToken);
            }
            catch
            {
                // farmer_my_sales table might not be initialized yet
            }

            // 3. Rejected Count: Explicitly rejected
            int rejectedCount = await _context.FarmerSellProducts
                .CountAsync(s => s.FarmerId == farmerId 
                              && s.IsActive 
                              && s.OtpStatus == "Rejected", cancellationToken);

            // 4. Expired Count: Timed out
            int expiredCount = await _context.FarmerSellProducts
                .CountAsync(s => s.FarmerId == farmerId 
                              && s.IsActive 
                              && (s.OtpStatus == "Expired" || (s.OtpStatus == "Pending" && s.OtpExpiresAt != null && s.OtpExpiresAt < now)), cancellationToken);

            decimal pendingTotal = 0.00m;
            try
            {
                pendingTotal = await _context.FarmerSellProducts
                    .Where(s => s.FarmerId == farmerId 
                             && s.IsActive 
                             && !confirmedSellIds.Contains(s.Id))
                    .SumAsync(s => (decimal?)s.TotalAmount, cancellationToken) ?? 0.00m;
            }
            catch
            {
                // Fallback
            }

            return new FarmerOtpSummaryDto
            {
                PendingAuthorizations = pendingCount,
                ConfirmedTransactions = confirmedCount,
                RejectedCount = rejectedCount,
                ExpiredCount = expiredCount,
                TotalProtectedValue = confirmedRevenue + pendingTotal
            };
        }

        public async Task<List<FarmerOtpConfirmationItemDto>> GetListAsync(long farmerId, FarmerOtpFilterQueryDto filters, CancellationToken cancellationToken = default)
        {
            DateTime now = DateTime.UtcNow;
            var items = new List<FarmerOtpConfirmationItemDto>();

            // 1. Confirmed records from farmer_my_sales (if table exists)
            try
            {
                var confirmedList = await _context.FarmerMySales
                    .AsNoTracking()
                    .Where(m => m.FarmerId == farmerId && m.IsActive)
                    .Select(m => new
                    {
                        m.Id,
                        m.SaleCode,
                        m.BuyerName,
                        m.BuyerMobile,
                        m.BuyerCategory,
                        m.CropName,
                        Quantity = m.QuantityDispatched,
                        m.Unit,
                        Rate = m.SellingRate,
                        TotalAmount = m.TotalRevenue,
                        Date = m.ConfirmedAt
                    })
                    .ToListAsync(cancellationToken);

                items.AddRange(confirmedList.Select(m =>
                {
                    string otpCodeId = $"OTP-2026-{(m.Id + 300):D3}";
                    return new FarmerOtpConfirmationItemDto
                    {
                        Id = otpCodeId,
                        SaleId = m.Id,
                        OtpId = otpCodeId,
                        TransactionId = m.SaleCode,
                        BuyerName = m.BuyerName,
                        BuyerMobile = m.BuyerMobile,
                        BuyerCategory = m.BuyerCategory,
                        Crop = m.CropName,
                        Quantity = m.Quantity,
                        Unit = m.Unit,
                        Rate = m.Rate,
                        TotalAmount = m.TotalAmount,
                        RequestDate = m.Date.ToString("yyyy-MM-dd hh:mm tt"),
                        OtpStatus = "Confirmed",
                        OtpCode = null,
                        ExpiresInMinutes = 0,
                        AttemptsLeft = 0,
                        Direction = "received_request",
                        ConfirmedAt = m.Date
                    };
                }));
            }
            catch
            {
                // farmer_my_sales table might not be initialized yet
            }

            // 2. Pending / Rejected / Expired records from farmer_sell_products
            var sellOrders = await _context.FarmerSellProducts
                .AsNoTracking()
                .Where(s => s.FarmerId == farmerId && s.IsActive)
                .ToListAsync(cancellationToken);

            // Avoid duplicating confirmed sales already populated from farmer_my_sales
            var existingSaleCodes = items.Select(x => x.TransactionId).ToHashSet(StringComparer.OrdinalIgnoreCase);

            foreach (var s in sellOrders)
            {
                if (existingSaleCodes.Contains(s.SaleCode)) continue;

                string resolvedStatus = s.OtpStatus;
                int remainingMinutes = 0;

                if (resolvedStatus == "Pending")
                {
                    if (s.OtpExpiresAt != null && s.OtpExpiresAt.Value < now)
                    {
                        resolvedStatus = "Expired";
                    }
                    else if (s.OtpExpiresAt != null)
                    {
                        remainingMinutes = (int)Math.Max(0, Math.Ceiling((s.OtpExpiresAt.Value - now).TotalMinutes));
                    }
                }

                string otpCodeId = $"OTP-2026-{(s.Id + 300):D3}";

                items.Add(new FarmerOtpConfirmationItemDto
                {
                    Id = otpCodeId,
                    SaleId = s.Id,
                    OtpId = otpCodeId,
                    TransactionId = s.SaleCode,
                    BuyerName = s.BuyerName,
                    BuyerMobile = s.BuyerMobile,
                    BuyerCategory = s.BuyerCategory,
                    Crop = s.CropName,
                    CropVariety = s.CropVariety,
                    Quantity = s.SellingQuantity,
                    Unit = s.Unit,
                    Rate = s.PricePerUnit,
                    TotalAmount = s.TotalAmount,
                    RequestDate = s.CreatedAt.ToString("yyyy-MM-dd hh:mm tt"),
                    OtpStatus = resolvedStatus,
                    OtpCode = resolvedStatus == "Pending" ? s.OtpCode : null,
                    ExpiresInMinutes = remainingMinutes,
                    ExpiresAt = s.OtpExpiresAt,
                    AttemptsLeft = resolvedStatus == "Pending" ? 3 : 0,
                    Direction = "received_request",
                    PickupLocation = s.PickupLocation,
                    QualityGrade = s.QualityGrade,
                    Notes = s.Notes,
                    ConfirmedAt = s.ConfirmedAt
                });
            }

            // 3. Apply Tab filter
            IEnumerable<FarmerOtpConfirmationItemDto> query = items;
            if (!string.IsNullOrWhiteSpace(filters.Tab) && !filters.Tab.Equals("All", StringComparison.OrdinalIgnoreCase) && !filters.Tab.Equals("All Confirmations", StringComparison.OrdinalIgnoreCase))
            {
                string tabLower = filters.Tab.Trim().ToLower();
                if (tabLower.Contains("pending"))
                {
                    query = query.Where(x => x.OtpStatus.Equals("Pending", StringComparison.OrdinalIgnoreCase));
                }
                else if (tabLower.Contains("confirm"))
                {
                    query = query.Where(x => x.OtpStatus.Equals("Confirmed", StringComparison.OrdinalIgnoreCase));
                }
                else if (tabLower.Contains("reject"))
                {
                    query = query.Where(x => x.OtpStatus.Equals("Rejected", StringComparison.OrdinalIgnoreCase));
                }
                else if (tabLower.Contains("expire"))
                {
                    query = query.Where(x => x.OtpStatus.Equals("Expired", StringComparison.OrdinalIgnoreCase));
                }
                else
                {
                    query = query.Where(x => x.OtpStatus.Equals(filters.Tab, StringComparison.OrdinalIgnoreCase));
                }
            }

            // 4. Apply Buyer Channel filter
            if (!string.IsNullOrWhiteSpace(filters.BuyerCategory) 
                && !filters.BuyerCategory.Equals("All", StringComparison.OrdinalIgnoreCase)
                && !filters.BuyerCategory.Equals("All Buyer Channels", StringComparison.OrdinalIgnoreCase))
            {
                string catLower = filters.BuyerCategory.Trim().ToLower();
                if (catLower.Contains("vendor"))
                {
                    query = query.Where(x => x.BuyerCategory.Equals("Vendor", StringComparison.OrdinalIgnoreCase));
                }
                else if (catLower.Contains("middleman"))
                {
                    query = query.Where(x => x.BuyerCategory.Equals("Middleman", StringComparison.OrdinalIgnoreCase));
                }
                else if (catLower.Contains("customer") || catLower.Contains("retail"))
                {
                    query = query.Where(x => x.BuyerCategory.Equals("Customer", StringComparison.OrdinalIgnoreCase));
                }
                else
                {
                    query = query.Where(x => x.BuyerCategory.Equals(filters.BuyerCategory, StringComparison.OrdinalIgnoreCase));
                }
            }

            // 5. Apply Search query
            if (!string.IsNullOrWhiteSpace(filters.Search))
            {
                string searchLower = filters.Search.Trim().ToLower();
                query = query.Where(x =>
                    x.OtpId.ToLower().Contains(searchLower) ||
                    x.TransactionId.ToLower().Contains(searchLower) ||
                    x.BuyerName.ToLower().Contains(searchLower) ||
                    x.Crop.ToLower().Contains(searchLower));
            }

            return query.OrderByDescending(x => x.SaleId).ToList();
        }

        public async Task<FarmerOtpConfirmationItemDto?> GetDetailsByIdAsync(long saleId, long farmerId, CancellationToken cancellationToken = default)
        {
            var list = await GetListAsync(farmerId, new FarmerOtpFilterQueryDto { UserId = farmerId }, cancellationToken);
            return list.FirstOrDefault(x => x.SaleId == saleId);
        }

        public async Task<bool> RejectAsync(long saleId, long farmerId, string? reason, CancellationToken cancellationToken = default)
        {
            var sale = await _context.FarmerSellProducts
                .FirstOrDefaultAsync(s => s.Id == saleId && s.FarmerId == farmerId && s.IsActive, cancellationToken);

            if (sale == null) return false;

            sale.Status = "Rejected";
            sale.OtpStatus = "Rejected";
            sale.Notes = string.IsNullOrWhiteSpace(sale.Notes)
                ? $"Rejected by farmer: {reason ?? "Declined"}"
                : $"{sale.Notes} | Rejected by farmer: {reason ?? "Declined"}";
            sale.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync(cancellationToken);
            return true;
        }

        public async Task<long?> ResolveSaleIdAsync(string idOrCode, long farmerId, CancellationToken cancellationToken = default)
        {
            if (string.IsNullOrWhiteSpace(idOrCode)) return null;

            idOrCode = idOrCode.Trim();

            // 1. Direct numeric ID check
            if (long.TryParse(idOrCode, out long numericId) && numericId > 0)
            {
                bool sellExists = await _context.FarmerSellProducts
                    .AnyAsync(s => s.Id == numericId && s.FarmerId == farmerId, cancellationToken);
                if (sellExists) return numericId;

                var mySale = await _context.FarmerMySales
                    .FirstOrDefaultAsync(m => m.Id == numericId && m.FarmerId == farmerId, cancellationToken);
                if (mySale != null) return mySale.SellProductId ?? mySale.Id;
            }

            // 2. Format: "OTP-2026-301" -> (301 - 300 = 1)
            if (idOrCode.StartsWith("OTP-2026-", StringComparison.OrdinalIgnoreCase))
            {
                string suffix = idOrCode.Substring(9);
                if (long.TryParse(suffix, out long parsedOtpNum))
                {
                    long derivedSaleId = parsedOtpNum > 300 ? parsedOtpNum - 300 : parsedOtpNum;
                    bool sellExists = await _context.FarmerSellProducts
                        .AnyAsync(s => s.Id == derivedSaleId && s.FarmerId == farmerId, cancellationToken);
                    if (sellExists) return derivedSaleId;

                    var mySale = await _context.FarmerMySales
                        .FirstOrDefaultAsync(m => m.Id == derivedSaleId && m.FarmerId == farmerId, cancellationToken);
                    if (mySale != null) return mySale.SellProductId ?? mySale.Id;
                }
            }

            // 3. Match SaleCode or OtpCode in FarmerSellProducts
            var matchedSell = await _context.FarmerSellProducts
                .FirstOrDefaultAsync(s => s.FarmerId == farmerId && (s.SaleCode == idOrCode || s.OtpCode == idOrCode), cancellationToken);
            if (matchedSell != null) return matchedSell.Id;

            // 4. Match SaleCode in FarmerMySales
            var matchedMySale = await _context.FarmerMySales
                .FirstOrDefaultAsync(m => m.FarmerId == farmerId && m.SaleCode == idOrCode, cancellationToken);
            if (matchedMySale != null) return matchedMySale.SellProductId ?? matchedMySale.Id;

            // 5. Fallback if it was numeric
            if (long.TryParse(idOrCode, out long fallbackNumeric) && fallbackNumeric > 0)
            {
                return fallbackNumeric;
            }

            return null;
        }
    }
}
