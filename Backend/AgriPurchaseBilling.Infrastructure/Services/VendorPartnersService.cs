using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using AgriPurchaseBilling.Application.DTOs.VendorOperations;
using AgriPurchaseBilling.Application.Interfaces;
using AgriPurchaseBilling.Domain.Entities.VendorOperations;
using AgriPurchaseBilling.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace AgriPurchaseBilling.Infrastructure.Services
{
    public class VendorPartnersService : IVendorPartnersService
    {
        private readonly VendorOperationsDbContext _context;

        public VendorPartnersService(VendorOperationsDbContext context)
        {
            _context = context;
        }

        // ==========================================
        // FARMERS DIRECTORY & PROFILE
        // ==========================================

        public async Task<VendorFarmersOverviewDto> GetFarmersOverviewAsync(long vendorId, CancellationToken cancellationToken = default)
        {
            var farmers = await _context.Farmers.AsNoTracking()
                .Where(f => f.VendorId == vendorId)
                .Include(f => f.Purchases)
                .ToListAsync(cancellationToken);

            var totalPurchasesCount = farmers.SelectMany(f => f.Purchases).Count();
            var totalQty = farmers.SelectMany(f => f.Purchases).Sum(p => p.Quantity);
            var totalAmount = farmers.SelectMany(f => f.Purchases).Sum(p => p.TotalAmount);
            var totalDue = farmers.SelectMany(f => f.Purchases).Sum(p => p.DueAmount);

            return new VendorFarmersOverviewDto
            {
                TotalFarmers = farmers.Count,
                ActiveFarmers = farmers.Count(f => string.Equals(f.Status, "Active", StringComparison.OrdinalIgnoreCase)),
                InactiveFarmers = farmers.Count(f => !string.Equals(f.Status, "Active", StringComparison.OrdinalIgnoreCase)),
                TotalPurchases = totalPurchasesCount,
                TotalQuantityProcured = totalQty,
                QuantityUnit = "Qtl",
                TotalPurchaseAmount = totalAmount,
                TotalPayablesDue = totalDue
            };
        }

        public async Task<List<VendorFarmerSummaryDto>> GetFarmersAsync(
            long vendorId, string? search, string? district, string? state, string? crop, string? status, CancellationToken cancellationToken = default)
        {
            var query = _context.Farmers.AsNoTracking()
                .Where(f => f.VendorId == vendorId)
                .Include(f => f.Purchases)
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(district) && !district.Equals("All", StringComparison.OrdinalIgnoreCase))
            {
                query = query.Where(f => f.District.ToLower() == district.ToLower());
            }

            if (!string.IsNullOrWhiteSpace(state) && !state.Equals("All", StringComparison.OrdinalIgnoreCase))
            {
                query = query.Where(f => f.State.ToLower() == state.ToLower());
            }

            if (!string.IsNullOrWhiteSpace(status) && !status.Equals("All", StringComparison.OrdinalIgnoreCase))
            {
                query = query.Where(f => f.Status.ToLower() == status.ToLower());
            }

            if (!string.IsNullOrWhiteSpace(crop) && !crop.Equals("All", StringComparison.OrdinalIgnoreCase))
            {
                query = query.Where(f => f.RegisteredCrops.ToLower().Contains(crop.ToLower()));
            }

            if (!string.IsNullOrWhiteSpace(search))
            {
                var term = search.Trim().ToLower();
                query = query.Where(f =>
                    f.FarmerCode.ToLower().Contains(term) ||
                    f.FullName.ToLower().Contains(term) ||
                    f.MobileNumber.ToLower().Contains(term) ||
                    f.Village.ToLower().Contains(term) ||
                    f.District.ToLower().Contains(term));
            }

            var farmers = await query.OrderBy(f => f.FarmerCode).ToListAsync(cancellationToken);

            return farmers.Select(f => new VendorFarmerSummaryDto
            {
                Id = f.Id,
                FarmerCode = f.FarmerCode,
                FarmerName = f.FullName,
                FatherOrSpouseName = f.FatherOrSpouseName,
                RegisteredCrops = f.RegisteredCrops,
                MobileNumber = f.MobileNumber,
                Village = f.Village,
                District = f.District,
                State = f.State,
                TotalPurchases = f.Purchases.Count,
                TotalPurchaseQuantity = f.Purchases.Sum(p => p.Quantity),
                QuantityUnit = "Qtl",
                TotalPurchaseAmount = f.Purchases.Sum(p => p.TotalAmount),
                DueAmount = f.Purchases.Sum(p => p.DueAmount),
                Status = f.Status
            }).ToList();
        }

        public async Task<VendorFarmerDetailDto?> GetFarmerByIdAsync(long vendorId, string farmerCodeOrId, CancellationToken cancellationToken = default)
        {
            var query = _context.Farmers.AsNoTracking()
                .Where(f => f.VendorId == vendorId)
                .Include(f => f.Purchases)
                .Include(f => f.Payments)
                .Include(f => f.OtpLogs)
                .AsQueryable();

            if (long.TryParse(farmerCodeOrId, out var id))
            {
                query = query.Where(f => f.Id == id || f.FarmerCode == farmerCodeOrId);
            }
            else
            {
                query = query.Where(f => f.FarmerCode == farmerCodeOrId);
            }

            var farmer = await query.FirstOrDefaultAsync(cancellationToken);
            if (farmer == null) return null;

            var purchases = farmer.Purchases.OrderByDescending(p => p.PurchaseDate).ToList();
            var payments = farmer.Payments.OrderByDescending(p => p.PaymentDate).ToList();
            var otpLogs = farmer.OtpLogs.OrderByDescending(o => o.CreatedAt).ToList();

            var totalPurchaseAmt = purchases.Sum(p => p.TotalAmount);
            var completedPayments = payments.Where(p => string.Equals(p.Status, "Completed", StringComparison.OrdinalIgnoreCase)).Sum(p => p.Amount);
            var pendingPayments = purchases.Sum(p => p.DueAmount);

            return new VendorFarmerDetailDto
            {
                Id = farmer.Id,
                FarmerCode = farmer.FarmerCode,
                FullName = farmer.FullName,
                FatherOrSpouseName = farmer.FatherOrSpouseName,
                MobileNumber = farmer.MobileNumber,
                Email = farmer.Email,
                Village = farmer.Village,
                District = farmer.District,
                State = farmer.State,
                PinCode = farmer.PinCode,
                LandAcres = farmer.LandAcres,
                RegisteredCrops = farmer.RegisteredCrops,
                BankAccountNumber = farmer.BankAccountNumber,
                IfscCode = farmer.IfscCode,
                BankName = farmer.BankName,
                AadhaarNumber = farmer.AadhaarNumber,
                Status = farmer.Status,
                RegisteredAt = farmer.RegisteredAt,

                AssociatedPurchasesCount = purchases.Count,
                AssociatedPurchasesQuantity = purchases.Sum(p => p.Quantity),
                ConfirmedPurchasesCount = purchases.Count(p => !string.Equals(p.PaymentStatus, "Draft", StringComparison.OrdinalIgnoreCase)),
                PendingPurchasesCount = purchases.Count(p => string.Equals(p.PaymentStatus, "Draft", StringComparison.OrdinalIgnoreCase)),
                TotalPurchaseAmount = totalPurchaseAmt,
                CompletedPayments = completedPayments,
                PendingPayments = pendingPayments,

                Transactions = purchases.Select(p => new VendorFarmerTransactionDto
                {
                    Id = p.Id,
                    PurchaseCode = p.PurchaseCode,
                    BillNumber = p.BillNumber,
                    CropName = p.CropName,
                    CropVariety = p.CropVariety,
                    Quantity = p.Quantity,
                    Unit = p.Unit,
                    RatePerUnit = p.RatePerUnit,
                    TotalAmount = p.TotalAmount,
                    DueAmount = p.DueAmount,
                    PaymentStatus = p.PaymentStatus,
                    PurchaseDate = p.PurchaseDate
                }).ToList(),

                Payments = payments.Select(p => new VendorFarmerPaymentDto
                {
                    Id = p.Id,
                    PaymentCode = p.PaymentCode,
                    VoucherNumber = p.VoucherNumber,
                    Amount = p.Amount,
                    PaymentMethod = p.PaymentMethod,
                    PaymentDate = p.PaymentDate,
                    ReferenceNumber = p.ReferenceNumber,
                    Status = p.Status,
                    Notes = p.Notes
                }).ToList(),

                OtpLogs = otpLogs.Select(o => new VendorFarmerOtpLogDto
                {
                    Id = o.Id,
                    OtpCode = o.OtpCode,
                    Purpose = o.Purpose,
                    ActionDetails = o.ActionDetails,
                    Status = o.Status,
                    VerifiedAt = o.VerifiedAt,
                    CreatedAt = o.CreatedAt
                }).ToList()
            };
        }

        public async Task<VendorFarmerDetailDto> CreateFarmerAsync(long vendorId, CreateVendorFarmerRequest request, CancellationToken cancellationToken = default)
        {
            var count = await _context.Farmers.CountAsync(f => f.VendorId == vendorId, cancellationToken);
            var nextCode = $"FARM-{(count + 1):D4}";

            var entity = new VendorFarmer
            {
                VendorId = vendorId,
                FarmerCode = nextCode,
                FullName = request.FullName.Trim(),
                FatherOrSpouseName = request.FatherOrSpouseName?.Trim(),
                MobileNumber = request.MobileNumber.Trim(),
                Email = request.Email?.Trim(),
                Village = request.Village.Trim(),
                District = request.District.Trim(),
                State = request.State.Trim(),
                PinCode = request.PinCode?.Trim(),
                LandAcres = request.LandAcres,
                RegisteredCrops = request.RegisteredCrops.Trim(),
                BankAccountNumber = request.BankAccountNumber?.Trim(),
                IfscCode = request.IfscCode?.Trim(),
                BankName = request.BankName?.Trim(),
                AadhaarNumber = request.AadhaarNumber?.Trim(),
                Status = "Active",
                RegisteredAt = DateTime.UtcNow,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Farmers.Add(entity);
            await _context.SaveChangesAsync(cancellationToken);

            return (await GetFarmerByIdAsync(vendorId, entity.FarmerCode, cancellationToken))!;
        }

        public async Task<VendorFarmerDetailDto?> UpdateFarmerAsync(long vendorId, string farmerCodeOrId, UpdateVendorFarmerRequest request, CancellationToken cancellationToken = default)
        {
            var entity = await FindFarmerEntityAsync(vendorId, farmerCodeOrId, cancellationToken);
            if (entity == null) return null;

            entity.FullName = request.FullName.Trim();
            entity.FatherOrSpouseName = request.FatherOrSpouseName?.Trim();
            entity.MobileNumber = request.MobileNumber.Trim();
            entity.Email = request.Email?.Trim();
            entity.Village = request.Village.Trim();
            entity.District = request.District.Trim();
            entity.State = request.State.Trim();
            entity.PinCode = request.PinCode?.Trim();
            entity.LandAcres = request.LandAcres;
            entity.RegisteredCrops = request.RegisteredCrops.Trim();
            entity.BankAccountNumber = request.BankAccountNumber?.Trim();
            entity.IfscCode = request.IfscCode?.Trim();
            entity.BankName = request.BankName?.Trim();
            entity.AadhaarNumber = request.AadhaarNumber?.Trim();
            if (!string.IsNullOrWhiteSpace(request.Status))
            {
                entity.Status = request.Status.Trim();
            }
            entity.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync(cancellationToken);
            return await GetFarmerByIdAsync(vendorId, entity.FarmerCode, cancellationToken);
        }

        public async Task<bool> ToggleFarmerStatusAsync(long vendorId, string farmerCodeOrId, CancellationToken cancellationToken = default)
        {
            var entity = await FindFarmerEntityAsync(vendorId, farmerCodeOrId, cancellationToken);
            if (entity == null) return false;

            entity.Status = string.Equals(entity.Status, "Active", StringComparison.OrdinalIgnoreCase) ? "Inactive" : "Active";
            entity.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync(cancellationToken);
            return true;
        }

        public async Task<List<VendorFarmerTransactionDto>> GetFarmerTransactionsAsync(long vendorId, string farmerCodeOrId, CancellationToken cancellationToken = default)
        {
            var farmer = await FindFarmerEntityAsync(vendorId, farmerCodeOrId, cancellationToken);
            if (farmer == null) return new List<VendorFarmerTransactionDto>();

            return await _context.FarmerPurchases.AsNoTracking()
                .Where(p => p.FarmerId == farmer.Id)
                .OrderByDescending(p => p.PurchaseDate)
                .Select(p => new VendorFarmerTransactionDto
                {
                    Id = p.Id,
                    PurchaseCode = p.PurchaseCode,
                    BillNumber = p.BillNumber,
                    CropName = p.CropName,
                    CropVariety = p.CropVariety,
                    Quantity = p.Quantity,
                    Unit = p.Unit,
                    RatePerUnit = p.RatePerUnit,
                    TotalAmount = p.TotalAmount,
                    DueAmount = p.DueAmount,
                    PaymentStatus = p.PaymentStatus,
                    PurchaseDate = p.PurchaseDate
                }).ToListAsync(cancellationToken);
        }

        public async Task<List<VendorFarmerPaymentDto>> GetFarmerPaymentsAsync(long vendorId, string farmerCodeOrId, CancellationToken cancellationToken = default)
        {
            var farmer = await FindFarmerEntityAsync(vendorId, farmerCodeOrId, cancellationToken);
            if (farmer == null) return new List<VendorFarmerPaymentDto>();

            return await _context.FarmerPayments.AsNoTracking()
                .Where(p => p.FarmerId == farmer.Id)
                .OrderByDescending(p => p.PaymentDate)
                .Select(p => new VendorFarmerPaymentDto
                {
                    Id = p.Id,
                    PaymentCode = p.PaymentCode,
                    VoucherNumber = p.VoucherNumber,
                    Amount = p.Amount,
                    PaymentMethod = p.PaymentMethod,
                    PaymentDate = p.PaymentDate,
                    ReferenceNumber = p.ReferenceNumber,
                    Status = p.Status,
                    Notes = p.Notes
                }).ToListAsync(cancellationToken);
        }

        public async Task<List<VendorFarmerOtpLogDto>> GetFarmerOtpLogsAsync(long vendorId, string farmerCodeOrId, CancellationToken cancellationToken = default)
        {
            var farmer = await FindFarmerEntityAsync(vendorId, farmerCodeOrId, cancellationToken);
            if (farmer == null) return new List<VendorFarmerOtpLogDto>();

            return await _context.FarmerOtpLogs.AsNoTracking()
                .Where(o => o.FarmerId == farmer.Id)
                .OrderByDescending(o => o.CreatedAt)
                .Select(o => new VendorFarmerOtpLogDto
                {
                    Id = o.Id,
                    OtpCode = o.OtpCode,
                    Purpose = o.Purpose,
                    ActionDetails = o.ActionDetails,
                    Status = o.Status,
                    VerifiedAt = o.VerifiedAt,
                    CreatedAt = o.CreatedAt
                }).ToListAsync(cancellationToken);
        }

        public async Task<byte[]> ExportFarmersCsvAsync(long vendorId, CancellationToken cancellationToken = default)
        {
            var farmers = await GetFarmersAsync(vendorId, null, null, null, null, null, cancellationToken);
            var sb = new StringBuilder();
            sb.AppendLine("Farmer ID,Farmer Name,Father/Spouse,Mobile,Village,District,State,Registered Crops,Total Purchases,Total Quantity,Total Amount,Due Amount,Status");

            foreach (var f in farmers)
            {
                sb.AppendLine($"\"{f.FarmerCode}\",\"{f.FarmerName}\",\"{f.FatherOrSpouseName}\",\"{f.MobileNumber}\",\"{f.Village}\",\"{f.District}\",\"{f.State}\",\"{f.RegisteredCrops}\",{f.TotalPurchases},{f.TotalPurchaseQuantity} {f.QuantityUnit},{f.TotalPurchaseAmount},{f.DueAmount},\"{f.Status}\"");
            }

            return Encoding.UTF8.GetBytes(sb.ToString());
        }

        private async Task<VendorFarmer?> FindFarmerEntityAsync(long vendorId, string farmerCodeOrId, CancellationToken cancellationToken)
        {
            if (long.TryParse(farmerCodeOrId, out var id))
            {
                return await _context.Farmers.FirstOrDefaultAsync(f => f.VendorId == vendorId && (f.Id == id || f.FarmerCode == farmerCodeOrId), cancellationToken);
            }
            return await _context.Farmers.FirstOrDefaultAsync(f => f.VendorId == vendorId && f.FarmerCode == farmerCodeOrId, cancellationToken);
        }

        // ==========================================
        // MIDDLEMEN DIRECTORY & PROFILE
        // ==========================================

        public async Task<VendorMiddlemenOverviewDto> GetMiddlemenOverviewAsync(long vendorId, CancellationToken cancellationToken = default)
        {
            var middlemen = await _context.Middlemen.AsNoTracking()
                .Where(m => m.VendorId == vendorId)
                .Include(m => m.Purchases)
                .ToListAsync(cancellationToken);

            var totalTx = middlemen.SelectMany(m => m.Purchases).Count();
            var totalQty = middlemen.SelectMany(m => m.Purchases).Sum(p => p.Quantity);
            var totalAmt = middlemen.SelectMany(m => m.Purchases).Sum(p => p.TotalAmount);
            var totalDue = middlemen.SelectMany(m => m.Purchases).Sum(p => p.DueAmount);

            return new VendorMiddlemenOverviewDto
            {
                TotalMiddlemen = middlemen.Count,
                ActiveMiddlemen = middlemen.Count(m => string.Equals(m.Status, "Active", StringComparison.OrdinalIgnoreCase)),
                InactiveMiddlemen = middlemen.Count(m => !string.Equals(m.Status, "Active", StringComparison.OrdinalIgnoreCase)),
                TotalTransactions = totalTx,
                TotalQuantityProcured = totalQty,
                QuantityUnit = "Qtl",
                TotalTransactionAmount = totalAmt,
                TotalPayablesDue = totalDue
            };
        }

        public async Task<List<VendorMiddlemanSummaryDto>> GetMiddlemenAsync(
            long vendorId, string? search, string? district, string? state, string? status, CancellationToken cancellationToken = default)
        {
            var query = _context.Middlemen.AsNoTracking()
                .Where(m => m.VendorId == vendorId)
                .Include(m => m.Purchases)
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(district) && !district.Equals("All", StringComparison.OrdinalIgnoreCase))
            {
                query = query.Where(m => m.District.ToLower() == district.ToLower());
            }

            if (!string.IsNullOrWhiteSpace(state) && !state.Equals("All", StringComparison.OrdinalIgnoreCase))
            {
                query = query.Where(m => m.State.ToLower() == state.ToLower());
            }

            if (!string.IsNullOrWhiteSpace(status) && !status.Equals("All", StringComparison.OrdinalIgnoreCase))
            {
                query = query.Where(m => m.Status.ToLower() == status.ToLower());
            }

            if (!string.IsNullOrWhiteSpace(search))
            {
                var term = search.Trim().ToLower();
                query = query.Where(m =>
                    m.MiddlemanCode.ToLower().Contains(term) ||
                    m.FullName.ToLower().Contains(term) ||
                    m.BusinessName.ToLower().Contains(term) ||
                    m.MobileNumber.ToLower().Contains(term) ||
                    m.Gstin.ToLower().Contains(term));
            }

            var list = await query.OrderBy(m => m.MiddlemanCode).ToListAsync(cancellationToken);

            return list.Select(m => new VendorMiddlemanSummaryDto
            {
                Id = m.Id,
                MiddlemanCode = m.MiddlemanCode,
                MiddlemanName = m.FullName,
                Email = m.Email,
                MobileNumber = m.MobileNumber,
                BusinessName = m.BusinessName,
                Gstin = m.Gstin,
                MarketYardLocation = m.MarketYardLocation,
                District = m.District,
                State = m.State,
                TotalTransactions = m.Purchases.Count,
                TotalTransactionQuantity = m.Purchases.Sum(p => p.Quantity),
                QuantityUnit = "Qtl",
                TotalTransactionAmount = m.Purchases.Sum(p => p.TotalAmount),
                DueAmount = m.Purchases.Sum(p => p.DueAmount),
                Status = m.Status
            }).ToList();
        }

        public async Task<VendorMiddlemanDetailDto?> GetMiddlemanByIdAsync(long vendorId, string middlemanCodeOrId, CancellationToken cancellationToken = default)
        {
            var query = _context.Middlemen.AsNoTracking()
                .Where(m => m.VendorId == vendorId)
                .Include(m => m.Purchases)
                .Include(m => m.Payments)
                .Include(m => m.OtpLogs)
                .AsQueryable();

            if (long.TryParse(middlemanCodeOrId, out var id))
            {
                query = query.Where(m => m.Id == id || m.MiddlemanCode == middlemanCodeOrId);
            }
            else
            {
                query = query.Where(m => m.MiddlemanCode == middlemanCodeOrId);
            }

            var m = await query.FirstOrDefaultAsync(cancellationToken);
            if (m == null) return null;

            var purchases = m.Purchases.OrderByDescending(p => p.PurchaseDate).ToList();
            var payments = m.Payments.OrderByDescending(p => p.PaymentDate).ToList();
            var otpLogs = m.OtpLogs.OrderByDescending(o => o.CreatedAt).ToList();

            var settled = payments.Where(p => string.Equals(p.Status, "Completed", StringComparison.OrdinalIgnoreCase)).Sum(p => p.Amount);
            var payables = purchases.Sum(p => p.DueAmount);

            return new VendorMiddlemanDetailDto
            {
                Id = m.Id,
                MiddlemanCode = m.MiddlemanCode,
                FullName = m.FullName,
                Email = m.Email,
                MobileNumber = m.MobileNumber,
                BusinessName = m.BusinessName,
                Gstin = m.Gstin,
                Pan = m.Pan,
                MarketYardLocation = m.MarketYardLocation,
                District = m.District,
                State = m.State,
                PinCode = m.PinCode,
                OpeningBalance = m.OpeningBalance,
                Status = m.Status,
                RegisteredAt = m.RegisteredAt,

                TotalTransactionsCount = purchases.Count,
                TotalTransactionsQuantity = purchases.Sum(p => p.Quantity),
                TotalTransactionAmount = purchases.Sum(p => p.TotalAmount),
                PaymentsSettled = settled,
                OutstandingPayables = payables,

                Transactions = purchases.Select(p => new VendorMiddlemanTransactionDto
                {
                    Id = p.Id,
                    PurchaseCode = p.PurchaseCode,
                    BillNumber = p.BillNumber,
                    CropName = p.CropName,
                    CropVariety = p.CropVariety,
                    Quantity = p.Quantity,
                    Unit = p.Unit,
                    RatePerUnit = p.RatePerUnit,
                    TotalAmount = p.TotalAmount,
                    DueAmount = p.DueAmount,
                    PaymentStatus = p.PaymentStatus,
                    PurchaseDate = p.PurchaseDate
                }).ToList(),

                Payments = payments.Select(p => new VendorMiddlemanPaymentDto
                {
                    Id = p.Id,
                    PaymentCode = p.PaymentCode,
                    VoucherNumber = p.VoucherNumber,
                    Amount = p.Amount,
                    PaymentMethod = p.PaymentMethod,
                    PaymentDate = p.PaymentDate,
                    ReferenceNumber = p.ReferenceNumber,
                    Status = p.Status,
                    Notes = p.Notes
                }).ToList(),

                OtpLogs = otpLogs.Select(o => new VendorMiddlemanOtpLogDto
                {
                    Id = o.Id,
                    OtpCode = o.OtpCode,
                    Purpose = o.Purpose,
                    ActionDetails = o.ActionDetails,
                    Status = o.Status,
                    VerifiedAt = o.VerifiedAt,
                    CreatedAt = o.CreatedAt
                }).ToList()
            };
        }

        public async Task<VendorMiddlemanDetailDto> CreateMiddlemanAsync(long vendorId, CreateVendorMiddlemanRequest request, CancellationToken cancellationToken = default)
        {
            var count = await _context.Middlemen.CountAsync(m => m.VendorId == vendorId, cancellationToken);
            var nextCode = $"MID-{(count + 1):D4}";

            var entity = new VendorMiddleman
            {
                VendorId = vendorId,
                MiddlemanCode = nextCode,
                FullName = request.FullName.Trim(),
                Email = request.Email?.Trim(),
                MobileNumber = request.MobileNumber.Trim(),
                BusinessName = request.BusinessName.Trim(),
                Gstin = (request.Gstin ?? string.Empty).Trim().ToUpperInvariant(),
                Pan = (request.Pan ?? string.Empty).Trim().ToUpperInvariant(),
                MarketYardLocation = request.MarketYardLocation.Trim(),
                District = request.District.Trim(),
                State = request.State.Trim(),
                PinCode = request.PinCode?.Trim(),
                OpeningBalance = request.OpeningBalance,
                Status = "Active",
                RegisteredAt = DateTime.UtcNow,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Middlemen.Add(entity);
            await _context.SaveChangesAsync(cancellationToken);

            return (await GetMiddlemanByIdAsync(vendorId, entity.MiddlemanCode, cancellationToken))!;
        }

        public async Task<VendorMiddlemanDetailDto?> UpdateMiddlemanAsync(long vendorId, string middlemanCodeOrId, UpdateVendorMiddlemanRequest request, CancellationToken cancellationToken = default)
        {
            var entity = await FindMiddlemanEntityAsync(vendorId, middlemanCodeOrId, cancellationToken);
            if (entity == null) return null;

            entity.FullName = request.FullName.Trim();
            entity.Email = request.Email?.Trim();
            entity.MobileNumber = request.MobileNumber.Trim();
            entity.BusinessName = request.BusinessName.Trim();
            entity.Gstin = (request.Gstin ?? entity.Gstin).Trim().ToUpperInvariant();
            entity.Pan = (request.Pan ?? entity.Pan).Trim().ToUpperInvariant();
            entity.MarketYardLocation = request.MarketYardLocation.Trim();
            entity.District = request.District.Trim();
            entity.State = request.State.Trim();
            entity.PinCode = request.PinCode?.Trim();
            entity.OpeningBalance = request.OpeningBalance;
            if (!string.IsNullOrWhiteSpace(request.Status))
            {
                entity.Status = request.Status.Trim();
            }
            entity.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync(cancellationToken);
            return await GetMiddlemanByIdAsync(vendorId, entity.MiddlemanCode, cancellationToken);
        }

        public async Task<bool> ToggleMiddlemanStatusAsync(long vendorId, string middlemanCodeOrId, CancellationToken cancellationToken = default)
        {
            var entity = await FindMiddlemanEntityAsync(vendorId, middlemanCodeOrId, cancellationToken);
            if (entity == null) return false;

            entity.Status = string.Equals(entity.Status, "Active", StringComparison.OrdinalIgnoreCase) ? "Inactive" : "Active";
            entity.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync(cancellationToken);
            return true;
        }

        public async Task<List<VendorMiddlemanTransactionDto>> GetMiddlemanTransactionsAsync(long vendorId, string middlemanCodeOrId, CancellationToken cancellationToken = default)
        {
            var mid = await FindMiddlemanEntityAsync(vendorId, middlemanCodeOrId, cancellationToken);
            if (mid == null) return new List<VendorMiddlemanTransactionDto>();

            return await _context.MiddlemanPurchases.AsNoTracking()
                .Where(p => p.MiddlemanId == mid.Id)
                .OrderByDescending(p => p.PurchaseDate)
                .Select(p => new VendorMiddlemanTransactionDto
                {
                    Id = p.Id,
                    PurchaseCode = p.PurchaseCode,
                    BillNumber = p.BillNumber,
                    CropName = p.CropName,
                    CropVariety = p.CropVariety,
                    Quantity = p.Quantity,
                    Unit = p.Unit,
                    RatePerUnit = p.RatePerUnit,
                    TotalAmount = p.TotalAmount,
                    DueAmount = p.DueAmount,
                    PaymentStatus = p.PaymentStatus,
                    PurchaseDate = p.PurchaseDate
                }).ToListAsync(cancellationToken);
        }

        public async Task<List<VendorMiddlemanPaymentDto>> GetMiddlemanPaymentsAsync(long vendorId, string middlemanCodeOrId, CancellationToken cancellationToken = default)
        {
            var mid = await FindMiddlemanEntityAsync(vendorId, middlemanCodeOrId, cancellationToken);
            if (mid == null) return new List<VendorMiddlemanPaymentDto>();

            return await _context.MiddlemanPayments.AsNoTracking()
                .Where(p => p.MiddlemanId == mid.Id)
                .OrderByDescending(p => p.PaymentDate)
                .Select(p => new VendorMiddlemanPaymentDto
                {
                    Id = p.Id,
                    PaymentCode = p.PaymentCode,
                    VoucherNumber = p.VoucherNumber,
                    Amount = p.Amount,
                    PaymentMethod = p.PaymentMethod,
                    PaymentDate = p.PaymentDate,
                    ReferenceNumber = p.ReferenceNumber,
                    Status = p.Status,
                    Notes = p.Notes
                }).ToListAsync(cancellationToken);
        }

        public async Task<List<VendorMiddlemanOtpLogDto>> GetMiddlemanOtpLogsAsync(long vendorId, string middlemanCodeOrId, CancellationToken cancellationToken = default)
        {
            var mid = await FindMiddlemanEntityAsync(vendorId, middlemanCodeOrId, cancellationToken);
            if (mid == null) return new List<VendorMiddlemanOtpLogDto>();

            return await _context.MiddlemanOtpLogs.AsNoTracking()
                .Where(o => o.MiddlemanId == mid.Id)
                .OrderByDescending(o => o.CreatedAt)
                .Select(o => new VendorMiddlemanOtpLogDto
                {
                    Id = o.Id,
                    OtpCode = o.OtpCode,
                    Purpose = o.Purpose,
                    ActionDetails = o.ActionDetails,
                    Status = o.Status,
                    VerifiedAt = o.VerifiedAt,
                    CreatedAt = o.CreatedAt
                }).ToListAsync(cancellationToken);
        }

        public async Task<byte[]> ExportMiddlemenCsvAsync(long vendorId, CancellationToken cancellationToken = default)
        {
            var middlemen = await GetMiddlemenAsync(vendorId, null, null, null, null, cancellationToken);
            var sb = new StringBuilder();
            sb.AppendLine("Middleman ID,Name,Business Name,GSTIN,Mobile,Location,District,State,Total Transactions,Quantity,Total Amount,Due Amount,Status");

            foreach (var m in middlemen)
            {
                sb.AppendLine($"\"{m.MiddlemanCode}\",\"{m.MiddlemanName}\",\"{m.BusinessName}\",\"{m.Gstin}\",\"{m.MobileNumber}\",\"{m.MarketYardLocation}\",\"{m.District}\",\"{m.State}\",{m.TotalTransactions},{m.TotalTransactionQuantity} {m.QuantityUnit},{m.TotalTransactionAmount},{m.DueAmount},\"{m.Status}\"");
            }

            return Encoding.UTF8.GetBytes(sb.ToString());
        }

        private async Task<VendorMiddleman?> FindMiddlemanEntityAsync(long vendorId, string middlemanCodeOrId, CancellationToken cancellationToken)
        {
            if (long.TryParse(middlemanCodeOrId, out var id))
            {
                return await _context.Middlemen.FirstOrDefaultAsync(m => m.VendorId == vendorId && (m.Id == id || m.MiddlemanCode == middlemanCodeOrId), cancellationToken);
            }
            return await _context.Middlemen.FirstOrDefaultAsync(m => m.VendorId == vendorId && m.MiddlemanCode == middlemanCodeOrId, cancellationToken);
        }

        // ==========================================
        // CUSTOMERS DIRECTORY
        // ==========================================

        public async Task<VendorCustomersOverviewDto> GetCustomersOverviewAsync(long vendorId, CancellationToken cancellationToken = default)
        {
            var customers = await _context.Customers.AsNoTracking()
                .Where(c => c.VendorId == vendorId)
                .Include(c => c.Orders)
                .ToListAsync(cancellationToken);

            var totalOrders = customers.SelectMany(c => c.Orders).Count();
            var totalSales = customers.SelectMany(c => c.Orders).Sum(o => o.TotalAmount);
            var totalDue = customers.SelectMany(c => c.Orders).Sum(o => o.DueAmount);

            return new VendorCustomersOverviewDto
            {
                TotalCustomers = customers.Count,
                ActiveCustomers = customers.Count(c => string.Equals(c.Status, "Active", StringComparison.OrdinalIgnoreCase)),
                InactiveCustomers = customers.Count(c => !string.Equals(c.Status, "Active", StringComparison.OrdinalIgnoreCase)),
                TotalOrders = totalOrders,
                TotalSalesAmount = totalSales,
                TotalReceivablesDue = totalDue
            };
        }

        public async Task<List<VendorCustomerSummaryDto>> GetCustomersAsync(
            long vendorId, string? search, string? district, string? state, string? status, CancellationToken cancellationToken = default)
        {
            var query = _context.Customers.AsNoTracking()
                .Where(c => c.VendorId == vendorId)
                .Include(c => c.Orders)
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(district) && !district.Equals("All", StringComparison.OrdinalIgnoreCase))
            {
                query = query.Where(c => c.District.ToLower() == district.ToLower());
            }

            if (!string.IsNullOrWhiteSpace(state) && !state.Equals("All", StringComparison.OrdinalIgnoreCase))
            {
                query = query.Where(c => c.State.ToLower() == state.ToLower());
            }

            if (!string.IsNullOrWhiteSpace(status) && !status.Equals("All", StringComparison.OrdinalIgnoreCase))
            {
                query = query.Where(c => c.Status.ToLower() == status.ToLower());
            }

            if (!string.IsNullOrWhiteSpace(search))
            {
                var term = search.Trim().ToLower();
                query = query.Where(c =>
                    c.CustomerCode.ToLower().Contains(term) ||
                    c.CustomerName.ToLower().Contains(term) ||
                    c.BusinessName.ToLower().Contains(term) ||
                    c.MobileNumber.ToLower().Contains(term) ||
                    c.District.ToLower().Contains(term));
            }

            var list = await query.OrderBy(c => c.CustomerCode).ToListAsync(cancellationToken);

            return list.Select(c => new VendorCustomerSummaryDto
            {
                Id = c.Id,
                CustomerCode = c.CustomerCode,
                CustomerName = c.CustomerName,
                BusinessName = c.BusinessName,
                CustomerType = c.CustomerType,
                MobileNumber = c.MobileNumber,
                Email = c.Email,
                Address = c.Address,
                District = c.District,
                State = c.State,
                TotalOrders = c.Orders.Count,
                TotalPurchaseQuantity = c.Orders.Sum(o => o.Quantity),
                QuantityUnit = c.Orders.FirstOrDefault()?.Unit ?? "Quintal",
                TotalSalesAmount = c.Orders.Sum(o => o.TotalAmount),
                ReceivableAmount = c.Orders.Sum(o => o.DueAmount),
                Status = c.Status
            }).ToList();
        }

        public async Task<VendorCustomerDetailDto?> GetCustomerByIdAsync(long vendorId, string customerCodeOrId, CancellationToken cancellationToken = default)
        {
            var query = _context.Customers.AsNoTracking()
                .Where(c => c.VendorId == vendorId)
                .Include(c => c.Orders)
                .AsQueryable();

            if (long.TryParse(customerCodeOrId, out var id))
            {
                query = query.Where(c => c.Id == id || c.CustomerCode == customerCodeOrId);
            }
            else
            {
                query = query.Where(c => c.CustomerCode == customerCodeOrId);
            }

            var c = await query.FirstOrDefaultAsync(cancellationToken);
            if (c == null) return null;

            return new VendorCustomerDetailDto
            {
                Id = c.Id,
                CustomerCode = c.CustomerCode,
                CustomerName = c.CustomerName,
                BusinessName = c.BusinessName,
                CustomerType = c.CustomerType,
                MobileNumber = c.MobileNumber,
                Email = c.Email,
                Address = c.Address,
                District = c.District,
                State = c.State,
                PinCode = c.PinCode,
                Gstin = c.Gstin,
                CreditLimit = c.CreditLimit,
                TotalOrders = c.Orders.Count,
                TotalPurchaseQuantity = c.Orders.Sum(o => o.Quantity),
                QuantityUnit = c.Orders.FirstOrDefault()?.Unit ?? "Quintal",
                TotalSalesAmount = c.Orders.Sum(o => o.TotalAmount),
                ReceivableAmount = c.Orders.Sum(o => o.DueAmount),
                Status = c.Status,
                Orders = c.Orders.OrderByDescending(o => o.OrderDate).Select(o => new VendorCustomerOrderDto
                {
                    Id = o.Id,
                    OrderCode = o.OrderCode,
                    ProductName = o.ProductName,
                    Quantity = o.Quantity,
                    Unit = o.Unit,
                    TotalAmount = o.TotalAmount,
                    DueAmount = o.DueAmount,
                    OrderStatus = o.OrderStatus,
                    OrderDate = o.OrderDate
                }).ToList()
            };
        }

        public async Task<VendorCustomerDetailDto> CreateCustomerAsync(long vendorId, CreateVendorCustomerRequest request, CancellationToken cancellationToken = default)
        {
            var count = await _context.Customers.CountAsync(c => c.VendorId == vendorId, cancellationToken);
            var nextCode = $"CUST-{(count + 1):D4}";

            var entity = new VendorCustomer
            {
                VendorId = vendorId,
                CustomerCode = nextCode,
                CustomerName = request.CustomerName.Trim(),
                BusinessName = request.BusinessName.Trim(),
                CustomerType = request.CustomerType.Trim(),
                MobileNumber = request.MobileNumber.Trim(),
                Email = request.Email?.Trim(),
                Address = request.Address.Trim(),
                District = request.District.Trim(),
                State = request.State.Trim(),
                PinCode = request.PinCode?.Trim(),
                Gstin = request.Gstin?.Trim().ToUpperInvariant(),
                CreditLimit = request.CreditLimit,
                Status = "Active",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Customers.Add(entity);
            await _context.SaveChangesAsync(cancellationToken);

            return (await GetCustomerByIdAsync(vendorId, entity.CustomerCode, cancellationToken))!;
        }

        public async Task<VendorCustomerDetailDto?> UpdateCustomerAsync(long vendorId, string customerCodeOrId, UpdateVendorCustomerRequest request, CancellationToken cancellationToken = default)
        {
            var entity = await FindCustomerEntityAsync(vendorId, customerCodeOrId, cancellationToken);
            if (entity == null) return null;

            entity.CustomerName = request.CustomerName.Trim();
            entity.BusinessName = request.BusinessName.Trim();
            entity.CustomerType = request.CustomerType.Trim();
            entity.MobileNumber = request.MobileNumber.Trim();
            entity.Email = request.Email?.Trim();
            entity.Address = request.Address.Trim();
            entity.District = request.District.Trim();
            entity.State = request.State.Trim();
            entity.PinCode = request.PinCode?.Trim();
            entity.Gstin = request.Gstin?.Trim().ToUpperInvariant();
            entity.CreditLimit = request.CreditLimit;
            if (!string.IsNullOrWhiteSpace(request.Status))
            {
                entity.Status = request.Status.Trim();
            }
            entity.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync(cancellationToken);
            return await GetCustomerByIdAsync(vendorId, entity.CustomerCode, cancellationToken);
        }

        public async Task<bool> ToggleCustomerStatusAsync(long vendorId, string customerCodeOrId, CancellationToken cancellationToken = default)
        {
            var entity = await FindCustomerEntityAsync(vendorId, customerCodeOrId, cancellationToken);
            if (entity == null) return false;

            entity.Status = string.Equals(entity.Status, "Active", StringComparison.OrdinalIgnoreCase) ? "Inactive" : "Active";
            entity.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync(cancellationToken);
            return true;
        }

        public async Task<byte[]> ExportCustomersCsvAsync(long vendorId, CancellationToken cancellationToken = default)
        {
            var customers = await GetCustomersAsync(vendorId, null, null, null, null, cancellationToken);
            var sb = new StringBuilder();
            sb.AppendLine("Customer ID,Customer Name,Business Name,Type,Mobile,Address,District,State,Total Orders,Total Quantity,Total Sales Amount,Receivables Due,Status");

            foreach (var c in customers)
            {
                sb.AppendLine($"\"{c.CustomerCode}\",\"{c.CustomerName}\",\"{c.BusinessName}\",\"{c.CustomerType}\",\"{c.MobileNumber}\",\"{c.Address}\",\"{c.District}\",\"{c.State}\",{c.TotalOrders},{c.TotalPurchaseQuantity} {c.QuantityUnit},{c.TotalSalesAmount},{c.ReceivableAmount},\"{c.Status}\"");
            }

            return Encoding.UTF8.GetBytes(sb.ToString());
        }

        private async Task<VendorCustomer?> FindCustomerEntityAsync(long vendorId, string customerCodeOrId, CancellationToken cancellationToken)
        {
            if (long.TryParse(customerCodeOrId, out var id))
            {
                return await _context.Customers.FirstOrDefaultAsync(c => c.VendorId == vendorId && (c.Id == id || c.CustomerCode == customerCodeOrId), cancellationToken);
            }
            return await _context.Customers.FirstOrDefaultAsync(c => c.VendorId == vendorId && c.CustomerCode == customerCodeOrId, cancellationToken);
        }
    }
}
