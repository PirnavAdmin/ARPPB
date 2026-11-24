using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using AgriPurchaseBilling.Application.DTOs;
using AgriPurchaseBilling.Application.Interfaces;
using AgriPurchaseBilling.Domain.Entities;
using AgriPurchaseBilling.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace AgriPurchaseBilling.Infrastructure.Services
{
    public class MiddlemanPurchaseService : IMiddlemanPurchaseService
    {
        private readonly AppDbContext _context;

        public MiddlemanPurchaseService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<MiddlemanPurchasePageDto> GetPurchasesAsync(long middlemanId, MiddlemanPurchaseQueryDto query)
        {
            await EnsureSeedPurchasesAsync(middlemanId);

            var queryable = _context.MiddlemanPurchases
                .AsNoTracking()
                .Where(x => x.MiddlemanId == middlemanId || x.MiddlemanId == 57 || x.MiddlemanId == 0);

            // Filter: Status
            if (!string.IsNullOrWhiteSpace(query.Status) && !string.Equals(query.Status, "ALL", StringComparison.OrdinalIgnoreCase))
            {
                var st = query.Status.Trim().ToLower();
                queryable = queryable.Where(x => x.Status.ToLower() == st || x.OtpStatus.ToLower() == st);
            }

            // Filter: Search
            if (!string.IsNullOrWhiteSpace(query.Search))
            {
                var s = query.Search.Trim().ToLower();
                queryable = queryable.Where(x =>
                    x.PurchaseCode.ToLower().Contains(s) ||
                    x.FarmerName.ToLower().Contains(s) ||
                    x.CropName.ToLower().Contains(s) ||
                    x.FarmerId.ToLower().Contains(s));
            }

            var totalItems = await queryable.CountAsync();
            var page = query.Page > 0 ? query.Page : 1;
            var pageSize = query.PageSize > 0 ? query.PageSize : 1000;

            var items = await queryable
                .OrderByDescending(x => x.PurchaseDate)
                .ThenByDescending(x => x.Id)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return new MiddlemanPurchasePageDto
            {
                Items = items.Select(MapToDto).ToList(),
                TotalItems = totalItems,
                Page = page,
                PageSize = pageSize
            };
        }

        public async Task<MiddlemanPurchaseDto?> GetPurchaseByIdAsync(long middlemanId, string purchaseId)
        {
            await EnsureSeedPurchasesAsync(middlemanId);

            var queryable = _context.MiddlemanPurchases
                .AsNoTracking()
                .Where(x => x.MiddlemanId == middlemanId || x.MiddlemanId == 57 || x.MiddlemanId == 0);

            MiddlemanPurchase? entity = null;
            if (long.TryParse(purchaseId, out var id))
            {
                entity = await queryable.FirstOrDefaultAsync(x => x.Id == id || x.PurchaseCode == purchaseId);
            }
            else
            {
                entity = await queryable.FirstOrDefaultAsync(x => x.PurchaseCode == purchaseId);
            }

            return entity == null ? null : MapToDto(entity);
        }

        public async Task<MiddlemanPurchaseDto> CreatePurchaseAsync(long middlemanId, CreateMiddlemanPurchaseRequest request)
        {
            // Lookup Farmer Name and Mobile if not provided
            var farmerName = request.FarmerName ?? string.Empty;
            var farmerMobile = request.FarmerMobile ?? string.Empty;

            if (!string.IsNullOrWhiteSpace(request.FarmerId))
            {
                var farmer = await _context.MiddlemanFarmers
                    .AsNoTracking()
                    .FirstOrDefaultAsync(f => (f.MiddlemanId == middlemanId || f.MiddlemanId == 57 || f.MiddlemanId == 0) &&
                                              (f.FarmerCode == request.FarmerId || f.Id.ToString() == request.FarmerId));
                if (farmer != null)
                {
                    if (string.IsNullOrWhiteSpace(farmerName)) farmerName = farmer.Name;
                    if (string.IsNullOrWhiteSpace(farmerMobile)) farmerMobile = farmer.Mobile;
                }
            }

            if (string.IsNullOrWhiteSpace(farmerName))
            {
                farmerName = request.IsDraft ? "Unknown Farmer" : "Registered Farmer";
            }

            var nextCount = await _context.MiddlemanPurchases.CountAsync() + 1;
            var purchaseCode = $"PUR-{nextCount + 7199}"; // PUR-7200, etc.

            var subtotal = Math.Round(request.Quantity * request.PricePerQuintal, 2);
            var additionalCharges = Math.Round(request.TransportationCharges + request.LoadingCharges + request.OtherCharges, 2);
            var totalAmount = subtotal + additionalCharges;

            var status = request.IsDraft ? "Draft" : "Pending Confirmation";
            var otpStatus = request.IsDraft ? "Draft" : "Pending OTP";

            var purchase = new MiddlemanPurchase
            {
                MiddlemanId = middlemanId,
                PurchaseCode = purchaseCode,
                FarmerId = request.FarmerId,
                FarmerName = farmerName,
                FarmerMobile = farmerMobile,
                CropName = request.CropName,
                Variety = string.IsNullOrWhiteSpace(request.Variety) ? "Standard" : request.Variety,
                QualityGrade = string.IsNullOrWhiteSpace(request.QualityGrade) ? "Grade A" : request.QualityGrade,
                Quantity = request.Quantity,
                Unit = string.IsNullOrWhiteSpace(request.Unit) ? "Quintal" : request.Unit,
                Rate = request.PricePerQuintal,
                Subtotal = subtotal,
                TransportationCharges = request.TransportationCharges,
                LoadingCharges = request.LoadingCharges,
                OtherCharges = request.OtherCharges,
                AdditionalCharges = additionalCharges,
                TotalAmount = totalAmount,
                PurchaseDate = request.PurchaseDate ?? DateTime.UtcNow,
                ExpectedPaymentDate = request.ExpectedPaymentDate,
                PickupLocation = string.IsNullOrWhiteSpace(request.PickupLocation) ? request.FarmerLocation : request.PickupLocation,
                DeliveryDate = request.DeliveryDate,
                Status = status,
                OtpStatus = otpStatus,
                Notes = request.Notes,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.MiddlemanPurchases.Add(purchase);

            // If not draft and farmer exists, update farmer's aggregate counters
            if (!request.IsDraft && !string.IsNullOrWhiteSpace(request.FarmerId))
            {
                var farmer = await _context.MiddlemanFarmers
                    .FirstOrDefaultAsync(f => (f.MiddlemanId == middlemanId || f.MiddlemanId == 57 || f.MiddlemanId == 0) &&
                                              (f.FarmerCode == request.FarmerId || f.Id.ToString() == request.FarmerId));
                if (farmer != null)
                {
                    farmer.TotalPurchases += 1;
                    farmer.TotalQuantityPurchased += request.Quantity;
                    farmer.TotalPurchaseValue += totalAmount;
                    farmer.PendingConfirmations += 1;
                    farmer.UpdatedAt = DateTime.UtcNow;
                }
            }

            await _context.SaveChangesAsync();

            return MapToDto(purchase);
        }

        private static MiddlemanPurchaseDto MapToDto(MiddlemanPurchase p)
        {
            return new MiddlemanPurchaseDto
            {
                Id = p.Id,
                MiddlemanId = p.MiddlemanId,
                PurchaseId = p.PurchaseCode,
                FarmerId = p.FarmerId,
                FarmerName = p.FarmerName,
                FarmerMobile = p.FarmerMobile,
                CropName = p.CropName,
                Variety = p.Variety,
                QualityGrade = p.QualityGrade,
                Quantity = p.Quantity,
                Unit = p.Unit,
                Rate = p.Rate,
                Subtotal = p.Subtotal,
                TransportationCharges = p.TransportationCharges,
                LoadingCharges = p.LoadingCharges,
                OtherCharges = p.OtherCharges,
                AdditionalCharges = p.AdditionalCharges,
                TotalAmount = p.TotalAmount,
                PurchaseDate = p.PurchaseDate,
                ExpectedPaymentDate = p.ExpectedPaymentDate,
                PickupLocation = p.PickupLocation,
                DeliveryDate = p.DeliveryDate,
                Status = p.Status,
                OtpStatus = p.OtpStatus,
                Notes = p.Notes,
                CreatedAt = p.CreatedAt,
                UpdatedAt = p.UpdatedAt
            };
        }

        private async Task EnsureSeedPurchasesAsync(long middlemanId)
        {
            var exists = await _context.MiddlemanPurchases
                .AnyAsync(x => x.MiddlemanId == middlemanId || x.MiddlemanId == 57 || x.MiddlemanId == 0);

            if (exists) return;

            var targetMid = middlemanId > 0 ? middlemanId : 57;

            var seeds = new List<MiddlemanPurchase>
            {
                new MiddlemanPurchase
                {
                    MiddlemanId = targetMid,
                    PurchaseCode = "PUR-7200",
                    FarmerId = "FAR-0001",
                    FarmerName = "M. Chenna Reddy",
                    FarmerMobile = "9849123450",
                    CropName = "Teja Chilli",
                    Variety = "Teja Premium",
                    QualityGrade = "Grade A",
                    Quantity = 80.00m,
                    Unit = "Quintal",
                    Rate = 18500.00m,
                    Subtotal = 1480000.00m,
                    TransportationCharges = 15000.00m,
                    LoadingCharges = 5000.00m,
                    OtherCharges = 2000.00m,
                    AdditionalCharges = 22000.00m,
                    TotalAmount = 1502000.00m,
                    PurchaseDate = DateTime.UtcNow.AddDays(-2),
                    ExpectedPaymentDate = DateTime.UtcNow.AddDays(12),
                    PickupLocation = "Farm gate - Pedanandipadu Yard",
                    DeliveryDate = DateTime.UtcNow.AddDays(-1),
                    Status = "Completed",
                    OtpStatus = "Confirmed",
                    ConfirmationDate = DateTime.UtcNow.AddDays(-1),
                    Notes = "High color ASTA grade Teja chilli lot.",
                    CreatedAt = DateTime.UtcNow.AddDays(-2),
                    UpdatedAt = DateTime.UtcNow.AddDays(-1)
                },
                new MiddlemanPurchase
                {
                    MiddlemanId = targetMid,
                    PurchaseCode = "PUR-7201",
                    FarmerId = "FAR-0002",
                    FarmerName = "B. Srinivasulu",
                    FarmerMobile = "9440187654",
                    CropName = "Sona Masoori",
                    Variety = "Raw Paddy BPT-5204",
                    QualityGrade = "Grade A",
                    Quantity = 120.00m,
                    Unit = "Quintal",
                    Rate = 2400.00m,
                    Subtotal = 288000.00m,
                    TransportationCharges = 8000.00m,
                    LoadingCharges = 3500.00m,
                    OtherCharges = 0.00m,
                    AdditionalCharges = 11500.00m,
                    TotalAmount = 299500.00m,
                    PurchaseDate = DateTime.UtcNow.AddDays(-5),
                    ExpectedPaymentDate = DateTime.UtcNow.AddDays(9),
                    PickupLocation = "Appikatla Village Storage Yard",
                    DeliveryDate = DateTime.UtcNow.AddDays(-4),
                    Status = "Completed",
                    OtpStatus = "Confirmed",
                    ConfirmationDate = DateTime.UtcNow.AddDays(-4),
                    Notes = "Moisture 13%, good milling recovery test.",
                    CreatedAt = DateTime.UtcNow.AddDays(-5),
                    UpdatedAt = DateTime.UtcNow.AddDays(-4)
                },
                new MiddlemanPurchase
                {
                    MiddlemanId = targetMid,
                    PurchaseCode = "PUR-7202",
                    FarmerId = "FAR-0003",
                    FarmerName = "G. Rama Krishna",
                    FarmerMobile = "9989345612",
                    CropName = "Yellow Corn / Maize",
                    Variety = "Kaveri 50",
                    QualityGrade = "Grade A",
                    Quantity = 150.00m,
                    Unit = "Quintal",
                    Rate = 2150.00m,
                    Subtotal = 322500.00m,
                    TransportationCharges = 9000.00m,
                    LoadingCharges = 4000.00m,
                    OtherCharges = 1000.00m,
                    AdditionalCharges = 14000.00m,
                    TotalAmount = 336500.00m,
                    PurchaseDate = DateTime.UtcNow.AddDays(-1),
                    ExpectedPaymentDate = DateTime.UtcNow.AddDays(14),
                    PickupLocation = "Vemuru Farm Yard",
                    DeliveryDate = DateTime.UtcNow,
                    Status = "Pending Confirmation",
                    OtpStatus = "Pending OTP",
                    Notes = "Pending farmer OTP verification slip.",
                    CreatedAt = DateTime.UtcNow.AddDays(-1),
                    UpdatedAt = DateTime.UtcNow.AddDays(-1)
                }
            };

            await _context.MiddlemanPurchases.AddRangeAsync(seeds);
            await _context.SaveChangesAsync();
        }
    }
}
