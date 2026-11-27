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
    public class MiddlemanFarmerService : IMiddlemanFarmerService
    {
        private readonly AppDbContext _context;

        public MiddlemanFarmerService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<MiddlemanFarmerPageDto> GetFarmersAsync(long middlemanId, MiddlemanFarmerQueryDto query)
        {
            await EnsureSeedDataAsync(middlemanId);

            var queryable = _context.MiddlemanFarmers
                .AsNoTracking()
                .Where(x => x.MiddlemanId == middlemanId || x.MiddlemanId == 57 || x.MiddlemanId == 0);

            // Filter: Crop
            if (!string.IsNullOrWhiteSpace(query.Crop) && !string.Equals(query.Crop, "ALL", StringComparison.OrdinalIgnoreCase))
            {
                var c = query.Crop.Trim().ToLower();
                queryable = queryable.Where(x => x.Crops.ToLower().Contains(c));
            }

            // Filter: District
            if (!string.IsNullOrWhiteSpace(query.District) && !string.Equals(query.District, "ALL", StringComparison.OrdinalIgnoreCase))
            {
                var d = query.District.Trim().ToLower();
                queryable = queryable.Where(x => x.District.ToLower() == d);
            }

            // Filter: Status
            if (!string.IsNullOrWhiteSpace(query.Status) && !string.Equals(query.Status, "ALL", StringComparison.OrdinalIgnoreCase))
            {
                var st = query.Status.Trim().ToLower();
                queryable = queryable.Where(x => x.Status.ToLower() == st);
            }

            // Search Filter
            if (!string.IsNullOrWhiteSpace(query.Search))
            {
                var s = query.Search.Trim().ToLower();
                queryable = queryable.Where(x =>
                    x.Name.ToLower().Contains(s) ||
                    x.FarmerCode.ToLower().Contains(s) ||
                    x.Mobile.Contains(s) ||
                    x.Village.ToLower().Contains(s) ||
                    x.District.ToLower().Contains(s));
            }

            var totalItems = await queryable.CountAsync();
            var activeSupplying = await queryable.CountAsync(x => x.Status == "Active");

            var page = query.Page > 0 ? query.Page : 1;
            var pageSize = query.PageSize > 0 ? query.PageSize : 1000;

            var items = await queryable
                .OrderByDescending(x => x.Id)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            // Dynamically calculate real-time OutstandingPayables from MiddlemanLedgers
            var farmerIds = items.Select(x => x.FarmerCode).Concat(items.Select(x => x.Id.ToString())).Distinct().ToList();
            var farmerNames = items.Select(x => x.Name).Distinct().ToList();

            var balances = await _context.MiddlemanLedgers
                .AsNoTracking()
                .Where(x => (x.MiddlemanId == middlemanId || x.MiddlemanId == 57 || x.MiddlemanId == 0) &&
                            (farmerIds.Contains(x.PartyId) || farmerNames.Contains(x.PartyName)))
                .GroupBy(x => !string.IsNullOrEmpty(x.PartyId) ? x.PartyId : x.PartyName)
                .Select(g => new { Party = g.Key, Outstanding = g.Sum(x => x.OutstandingAmount) })
                .ToListAsync();

            var dtos = items.Select(MapToDto).ToList();
            foreach (var dto in dtos)
            {
                var b = balances.FirstOrDefault(x => x.Party == dto.FarmerId || x.Party == dto.Name || x.Party == dto.Id.ToString());
                if (b != null)
                {
                    dto.OutstandingPayables = b.Outstanding;
                }
            }

            return new MiddlemanFarmerPageDto
            {
                Items = dtos,
                TotalItems = totalItems,
                ActiveSupplying = activeSupplying,
                Page = page,
                PageSize = pageSize
            };
        }

        public async Task<MiddlemanFarmerDto?> GetFarmerByIdAsync(long middlemanId, string farmerId)
        {
            await EnsureSeedDataAsync(middlemanId);

            var queryable = _context.MiddlemanFarmers
                .AsNoTracking()
                .Where(x => x.MiddlemanId == middlemanId || x.MiddlemanId == 57 || x.MiddlemanId == 0);

            MiddlemanFarmer? entity = null;
            if (long.TryParse(farmerId, out var id))
            {
                entity = await queryable.FirstOrDefaultAsync(x => x.Id == id || x.FarmerCode == farmerId);
            }
            else
            {
                entity = await queryable.FirstOrDefaultAsync(x => x.FarmerCode == farmerId);
            }

            if (entity != null)
            {
                var dto = MapToDto(entity);
                var outstanding = await _context.MiddlemanLedgers
                    .AsNoTracking()
                    .Where(x => (x.MiddlemanId == middlemanId || x.MiddlemanId == 57 || x.MiddlemanId == 0) &&
                                (x.PartyId == dto.FarmerId || x.PartyId == dto.Id.ToString() || x.PartyName == dto.Name))
                    .SumAsync(x => x.OutstandingAmount);
                dto.OutstandingPayables = outstanding;
                return dto;
            }

            return null;
        }

        public async Task<MiddlemanFarmerDto> RegisterFarmerAsync(long middlemanId, RegisterFarmerRequest request)
        {
            var count = await _context.MiddlemanFarmers.CountAsync();
            var farmerCode = $"FAR-{(count + 1):D4}";

            var cropsStr = request.Crops != null && request.Crops.Count > 0
                ? string.Join(",", request.Crops)
                : "Paddy,Chilli";

            var entity = new MiddlemanFarmer
            {
                MiddlemanId = middlemanId > 0 ? middlemanId : 57,
                FarmerCode = farmerCode,
                Name = request.Name,
                Mobile = request.Mobile,
                Email = request.Email,
                Village = request.Village,
                Mandal = request.Mandal ?? request.Village,
                District = request.District,
                State = !string.IsNullOrWhiteSpace(request.State) ? request.State : "Andhra Pradesh",
                PinCode = request.PinCode,
                CompleteAddress = request.CompleteAddress,
                Crops = cropsStr,
                Notes = request.Notes,
                TotalPurchases = 0,
                TotalQuantityPurchased = 0,
                TotalPurchaseValue = 0,
                OutstandingPayables = 0,
                PendingConfirmations = 0,
                Status = "Active",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.MiddlemanFarmers.Add(entity);
            await _context.SaveChangesAsync();

            return MapToDto(entity);
        }

        public async Task<MiddlemanFarmerDto?> UpdateFarmerAsync(long middlemanId, string farmerId, UpdateFarmerRequest request)
        {
            var entity = await _context.MiddlemanFarmers
                .FirstOrDefaultAsync(x => (x.FarmerCode == farmerId || x.Id.ToString() == farmerId) &&
                                          (x.MiddlemanId == middlemanId || x.MiddlemanId == 57 || x.MiddlemanId == 0));

            if (entity == null) return null;

            if (!string.IsNullOrWhiteSpace(request.Name)) entity.Name = request.Name;
            if (!string.IsNullOrWhiteSpace(request.Mobile)) entity.Mobile = request.Mobile;
            if (request.Email != null) entity.Email = request.Email;
            if (!string.IsNullOrWhiteSpace(request.Village)) entity.Village = request.Village;
            if (!string.IsNullOrWhiteSpace(request.Mandal)) entity.Mandal = request.Mandal;
            if (!string.IsNullOrWhiteSpace(request.District)) entity.District = request.District;
            if (!string.IsNullOrWhiteSpace(request.State)) entity.State = request.State;
            if (!string.IsNullOrWhiteSpace(request.PinCode)) entity.PinCode = request.PinCode;
            if (!string.IsNullOrWhiteSpace(request.CompleteAddress)) entity.CompleteAddress = request.CompleteAddress;
            if (request.Crops != null && request.Crops.Count > 0) entity.Crops = string.Join(",", request.Crops);
            if (request.Notes != null) entity.Notes = request.Notes;
            if (!string.IsNullOrWhiteSpace(request.Status)) entity.Status = request.Status;

            entity.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return MapToDto(entity);
        }

        public async Task<MiddlemanFarmerHistoryDto> GetFarmerHistoryAsync(long middlemanId, string farmerId)
        {
            var farmer = await GetFarmerByIdAsync(middlemanId, farmerId);
            var fName = farmer?.Name ?? "Farmer";

            var purchases = await _context.MiddlemanPurchases
                .AsNoTracking()
                .Where(x => (x.MiddlemanId == middlemanId || x.MiddlemanId == 57 || x.MiddlemanId == 0) &&
                            (x.FarmerId == farmerId || x.FarmerName == fName))
                .OrderByDescending(x => x.PurchaseDate)
                .ToListAsync();

            var purchaseCodes = purchases.Select(p => p.PurchaseCode).Distinct().ToList();
            var ledgers = await _context.MiddlemanLedgers
                .AsNoTracking()
                .Where(x => (x.MiddlemanId == middlemanId || x.MiddlemanId == 57 || x.MiddlemanId == 0) &&
                            (purchaseCodes.Contains(x.TransactionId) || x.PartyId == farmerId || x.PartyName == fName))
                .ToListAsync();

            var ledgerIds = ledgers.Select(l => l.Id).Distinct().ToList();
            var payments = await _context.MiddlemanPayments
                .AsNoTracking()
                .Where(p => purchaseCodes.Contains(p.TransactionId) || (p.LedgerId.HasValue && ledgerIds.Contains(p.LedgerId.Value)))
                .OrderByDescending(p => p.PaymentDate)
                .ToListAsync();

            var purchaseDtos = purchases.Select(x =>
            {
                var ledger = ledgers.FirstOrDefault(l => l.TransactionId == x.PurchaseCode);
                var relPayments = payments.Where(p => p.TransactionId == x.PurchaseCode || (ledger != null && p.LedgerId == ledger.Id)).ToList();

                decimal total = x.TotalAmount;
                decimal paid = relPayments.Count > 0 ? relPayments.Sum(p => p.PaymentAmount) : (ledger != null ? ledger.SettledAmount : 0m);
                decimal outstanding = ledger != null ? ledger.OutstandingAmount : Math.Max(0m, total - paid);
                string paymentStatus = outstanding <= 0 ? "Paid" : (paid > 0 ? "Partially Paid" : "Unpaid");

                return new MiddlemanPurchaseDto
                {
                    Id = x.Id,
                    MiddlemanId = x.MiddlemanId,
                    PurchaseId = x.PurchaseCode,
                    FarmerId = x.FarmerId,
                    FarmerName = x.FarmerName,
                    FarmerMobile = x.FarmerMobile,
                    CropName = x.CropName,
                    Variety = x.Variety,
                    QualityGrade = x.QualityGrade,
                    Quantity = x.Quantity,
                    Unit = x.Unit,
                    Rate = x.Rate,
                    Subtotal = x.Subtotal,
                    TransportationCharges = x.TransportationCharges,
                    LoadingCharges = x.LoadingCharges,
                    OtherCharges = x.OtherCharges,
                    AdditionalCharges = x.AdditionalCharges,
                    TotalAmount = x.TotalAmount,
                    PurchaseDate = x.PurchaseDate,
                    ExpectedPaymentDate = x.ExpectedPaymentDate,
                    PickupLocation = x.PickupLocation,
                    DeliveryDate = x.DeliveryDate,
                    Status = x.Status,
                    OtpStatus = x.OtpStatus,
                    Notes = x.Notes,
                    PaidAmount = paid,
                    OutstandingAmount = outstanding,
                    PaymentStatus = paymentStatus,
                    PaymentHistory = relPayments.Select(MapPaymentToDto).ToList(),
                    CreatedAt = x.CreatedAt,
                    UpdatedAt = x.UpdatedAt
                };
            }).ToList();

            var ledgerEntries = ledgers
                .OrderByDescending(x => x.Date)
                .Select(x =>
                {
                    var relPayments = payments.Where(p => p.LedgerId == x.Id || (!string.IsNullOrEmpty(x.TransactionId) && p.TransactionId == x.TransactionId)).ToList();
                    decimal paid = relPayments.Count > 0 ? relPayments.Sum(p => p.PaymentAmount) : x.SettledAmount;
                    decimal outstanding = x.OutstandingAmount;
                    string status = outstanding <= 0 ? "Paid" : (paid > 0 ? "Partially Paid" : "Unpaid");

                    return new MiddlemanLedgerDto
                    {
                        Id = x.Id,
                        LedgerId = x.LedgerCode,
                        Date = x.Date.ToString("yyyy-MM-dd"),
                        TransactionId = x.TransactionId,
                        Category = x.Category,
                        Description = x.Description,
                        PartyId = x.PartyId,
                        PartyName = x.PartyName,
                        PartyCategory = x.PartyCategory,
                        Debit = x.Debit,
                        Credit = x.Credit,
                        ProcessingExpenses = x.ProcessingExpenses,
                        SettledAmount = x.SettledAmount,
                        OutstandingAmount = x.OutstandingAmount,
                        ExpectedPaymentDate = x.ExpectedPaymentDate.HasValue ? x.ExpectedPaymentDate.Value.ToString("yyyy-MM-dd") : null,
                        Status = status,
                        PaymentHistory = relPayments.Select(MapPaymentToDto).ToList()
                    };
                })
                .ToList();

            return new MiddlemanFarmerHistoryDto
            {
                FarmerId = farmerId,
                FarmerName = fName,
                Purchases = purchaseDtos,
                LedgerEntries = ledgerEntries
            };
        }

        private static MiddlemanPaymentDto MapPaymentToDto(MiddlemanPayment p)
        {
            return new MiddlemanPaymentDto
            {
                Id = p.Id,
                PaymentCode = p.PaymentCode,
                LedgerId = p.LedgerId,
                TransactionId = p.TransactionId,
                PartyCategory = p.PartyCategory,
                PartyId = p.PartyId,
                PartyName = p.PartyName,
                PaymentDirection = p.PaymentDirection,
                OriginalAmount = p.OriginalAmount,
                PaymentAmount = p.PaymentAmount,
                TotalPaidAfter = p.TotalPaidAfter,
                BalanceAfter = p.BalanceAfter,
                PaymentMode = p.PaymentMode,
                ReferenceNo = p.ReferenceNo,
                Status = p.Status,
                Notes = p.Notes,
                PaymentDate = p.PaymentDate.ToString("yyyy-MM-dd HH:mm")
            };
        }

        private static MiddlemanFarmerDto MapToDto(MiddlemanFarmer x)
        {
            var cropsList = !string.IsNullOrWhiteSpace(x.Crops)
                ? x.Crops.Split(',', StringSplitOptions.RemoveEmptyEntries).Select(c => c.Trim()).ToList()
                : new List<string>();

            return new MiddlemanFarmerDto
            {
                Id = x.Id,
                MiddlemanId = x.MiddlemanId,
                FarmerId = x.FarmerCode,
                Name = x.Name,
                Mobile = x.Mobile,
                Email = x.Email,
                Village = x.Village,
                Mandal = x.Mandal,
                District = x.District,
                State = x.State,
                PinCode = x.PinCode,
                CompleteAddress = x.CompleteAddress,
                Crops = cropsList,
                Notes = x.Notes,
                TotalPurchases = x.TotalPurchases,
                TotalQuantityPurchased = x.TotalQuantityPurchased,
                TotalPurchaseValue = x.TotalPurchaseValue,
                OutstandingPayables = x.OutstandingPayables,
                PendingConfirmations = x.PendingConfirmations,
                Status = x.Status,
                CreatedAt = x.CreatedAt,
                UpdatedAt = x.UpdatedAt
            };
        }

        private async Task EnsureSeedDataAsync(long middlemanId)
        {
            var exists = await _context.MiddlemanFarmers.AnyAsync(x => x.MiddlemanId == middlemanId || x.MiddlemanId == 57);
            if (exists) return;

            var defaultFarmers = new List<MiddlemanFarmer>
            {
                new()
                {
                    MiddlemanId = middlemanId > 0 ? middlemanId : 57,
                    FarmerCode = "FAR-0001",
                    Name = "M. Chenna Reddy",
                    Mobile = "9849123450",
                    Email = "chenna.reddy@gmail.com",
                    Village = "Pedanandipadu",
                    Mandal = "Pedanandipadu",
                    District = "Guntur",
                    State = "Andhra Pradesh",
                    PinCode = "522235",
                    CompleteAddress = "Door No. 3-45, Main Bazar, Pedanandipadu Village, Guntur Dist.",
                    Crops = "Chilli,Cotton,Paddy",
                    Notes = "Premium Teja chilli producer. Consistent Grade-A quality.",
                    TotalPurchases = 6,
                    TotalQuantityPurchased = 450m,
                    TotalPurchaseValue = 1825000m,
                    OutstandingPayables = 175000m,
                    PendingConfirmations = 0,
                    Status = "Active",
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                new()
                {
                    MiddlemanId = middlemanId > 0 ? middlemanId : 57,
                    FarmerCode = "FAR-0002",
                    Name = "B. Srinivasulu",
                    Mobile = "9440187654",
                    Email = "",
                    Village = "Appikatla",
                    Mandal = "Bapatla",
                    District = "Bapatla",
                    State = "Andhra Pradesh",
                    PinCode = "522310",
                    CompleteAddress = "H.No. 1-12, Rythu Sangham Street, Appikatla, Bapatla Dist.",
                    Crops = "Paddy,Maize",
                    Notes = "Cultivates BPT 5204 fine rice paddy.",
                    TotalPurchases = 4,
                    TotalQuantityPurchased = 380m,
                    TotalPurchaseValue = 912000m,
                    OutstandingPayables = 0m,
                    PendingConfirmations = 1,
                    Status = "Active",
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                new()
                {
                    MiddlemanId = middlemanId > 0 ? middlemanId : 57,
                    FarmerCode = "FAR-0003",
                    Name = "G. Rama Krishna",
                    Mobile = "9989345612",
                    Email = "gramakrishna.farmer@yahoo.com",
                    Village = "Vemuru",
                    Mandal = "Vemuru",
                    District = "Guntur",
                    State = "Andhra Pradesh",
                    PinCode = "522261",
                    CompleteAddress = "Near Sub Station, Vemuru, Guntur Dist.",
                    Crops = "Maize,Groundnut",
                    Notes = "High-yield hybrid maize grower.",
                    TotalPurchases = 5,
                    TotalQuantityPurchased = 290m,
                    TotalPurchaseValue = 685000m,
                    OutstandingPayables = 45000m,
                    PendingConfirmations = 0,
                    Status = "Active",
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                new()
                {
                    MiddlemanId = middlemanId > 0 ? middlemanId : 57,
                    FarmerCode = "FAR-0004",
                    Name = "K. Tirupathi Rao",
                    Mobile = "9701238901",
                    Email = "",
                    Village = "Jannaram",
                    Mandal = "Jannaram",
                    District = "Mancherial",
                    State = "Telangana",
                    PinCode = "504205",
                    CompleteAddress = "Plot No 14, Agricultural Market Road, Jannaram.",
                    Crops = "Cotton,Paddy",
                    Notes = "Long-staple cotton specialist.",
                    TotalPurchases = 3,
                    TotalQuantityPurchased = 210m,
                    TotalPurchaseValue = 1470000m,
                    OutstandingPayables = 0m,
                    PendingConfirmations = 0,
                    Status = "Active",
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                new()
                {
                    MiddlemanId = middlemanId > 0 ? middlemanId : 57,
                    FarmerCode = "FAR-0005",
                    Name = "V. Satyanarayana",
                    Mobile = "9491234567",
                    Email = "vsatya.farmer@gmail.com",
                    Village = "Kovvur",
                    Mandal = "Kovvur",
                    District = "East Godavari",
                    State = "Andhra Pradesh",
                    PinCode = "534350",
                    CompleteAddress = "Godavari Bund Road, Kovvur, East Godavari Dist.",
                    Crops = "Wheat,Paddy",
                    Notes = "Organic and premium grain cultivator.",
                    TotalPurchases = 4,
                    TotalQuantityPurchased = 270m,
                    TotalPurchaseValue = 715500m,
                    OutstandingPayables = 35000m,
                    PendingConfirmations = 0,
                    Status = "Active",
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                new()
                {
                    MiddlemanId = middlemanId > 0 ? middlemanId : 57,
                    FarmerCode = "FAR-0006",
                    Name = "P. Ravindra Reddy",
                    Mobile = "9848012345",
                    Email = "",
                    Village = "Tenali",
                    Mandal = "Tenali",
                    District = "Guntur",
                    State = "Andhra Pradesh",
                    PinCode = "522201",
                    CompleteAddress = "Bose Road, Tenali, Guntur Dist.",
                    Crops = "Groundnut,Chilli",
                    Notes = "Specializes in bold seed groundnut pods.",
                    TotalPurchases = 2,
                    TotalQuantityPurchased = 140m,
                    TotalPurchaseValue = 952000m,
                    OutstandingPayables = 0m,
                    PendingConfirmations = 0,
                    Status = "Active",
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                }
            };

            await _context.MiddlemanFarmers.AddRangeAsync(defaultFarmers);
            await _context.SaveChangesAsync();
        }
    }
}
