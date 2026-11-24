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
    public class MiddlemanVendorService : IMiddlemanVendorService
    {
        private readonly AppDbContext _context;

        public MiddlemanVendorService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<MiddlemanVendorPageDto> GetVendorsAsync(long middlemanId, MiddlemanVendorQueryDto query)
        {
            await EnsureSeedDataAsync(middlemanId);

            var queryable = _context.MiddlemanVendors
                .AsNoTracking()
                .Where(x => x.MiddlemanId == middlemanId || x.MiddlemanId == 57 || x.MiddlemanId == 0);

            // Filter: Business Type
            if (!string.IsNullOrWhiteSpace(query.Type) && !string.Equals(query.Type, "ALL", StringComparison.OrdinalIgnoreCase))
            {
                var t = query.Type.Trim().ToLower();
                queryable = queryable.Where(x => x.BusinessType.ToLower() == t);
            }

            // Filter: District
            if (!string.IsNullOrWhiteSpace(query.District) && !string.Equals(query.District, "ALL", StringComparison.OrdinalIgnoreCase))
            {
                var d = query.District.Trim().ToLower();
                queryable = queryable.Where(x => x.District.ToLower() == d);
            }

            // Search Filter
            if (!string.IsNullOrWhiteSpace(query.Search))
            {
                var s = query.Search.Trim().ToLower();
                queryable = queryable.Where(x =>
                    x.BusinessName.ToLower().Contains(s) ||
                    x.VendorId.ToLower().Contains(s) ||
                    x.OwnerName.ToLower().Contains(s) ||
                    x.Mobile.Contains(s) ||
                    (x.GstNumber != null && x.GstNumber.ToLower().Contains(s)) ||
                    x.District.ToLower().Contains(s));
            }

            var totalItems = await queryable.CountAsync();
            var page = query.Page <= 0 ? 1 : query.Page;
            var pageSize = query.PageSize <= 0 ? 1000 : query.PageSize;

            var items = await queryable
                .OrderByDescending(x => x.Id)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(x => MapToDto(x))
                .ToListAsync();

            return new MiddlemanVendorPageDto
            {
                Items = items,
                TotalItems = totalItems,
                Page = page,
                PageSize = pageSize,
            };
        }

        public async Task<MiddlemanVendorDto?> GetVendorByIdAsync(long middlemanId, string vendorId)
        {
            await EnsureSeedDataAsync(middlemanId);

            var vendor = await _context.MiddlemanVendors
                .AsNoTracking()
                .FirstOrDefaultAsync(x =>
                    (x.MiddlemanId == middlemanId || x.MiddlemanId == 57 || x.MiddlemanId == 0) &&
                    (x.VendorId == vendorId || x.Id.ToString() == vendorId));

            return vendor != null ? MapToDto(vendor) : null;
        }

        public async Task<MiddlemanVendorDto> RegisterVendorAsync(long middlemanId, RegisterVendorRequest request)
        {
            var nextNum = 1;
            var lastVendor = await _context.MiddlemanVendors
                .OrderByDescending(x => x.Id)
                .FirstOrDefaultAsync();

            if (lastVendor != null && lastVendor.VendorId.StartsWith("VEN-"))
            {
                if (int.TryParse(lastVendor.VendorId.Substring(4), out var num))
                {
                    nextNum = num + 1;
                }
            }

            var vendorCode = $"VEN-{nextNum:D4}";

            var entity = new MiddlemanVendor
            {
                MiddlemanId = middlemanId,
                VendorId = vendorCode,
                BusinessName = request.BusinessName.Trim(),
                OwnerName = request.OwnerName.Trim(),
                Mobile = request.Mobile.Trim(),
                Email = request.Email?.Trim(),
                BusinessType = !string.IsNullOrWhiteSpace(request.BusinessType) ? request.BusinessType.Trim() : "Wholesaler",
                GstNumber = request.GstNumber?.Trim(),
                Address = request.Address?.Trim(),
                District = request.District.Trim(),
                State = !string.IsNullOrWhiteSpace(request.State) ? request.State.Trim() : "Andhra Pradesh",
                PinCode = request.PinCode?.Trim(),
                TotalPurchases = 0,
                TotalPurchaseValue = 0,
                OutstandingReceivables = 0,
                Status = "Active",
                Notes = request.Notes?.Trim(),
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
            };

            _context.MiddlemanVendors.Add(entity);
            await _context.SaveChangesAsync();

            return MapToDto(entity);
        }

        public async Task<MiddlemanVendorDto?> UpdateVendorAsync(long middlemanId, string vendorId, UpdateVendorRequest request)
        {
            var entity = await _context.MiddlemanVendors
                .FirstOrDefaultAsync(x =>
                    (x.MiddlemanId == middlemanId || x.MiddlemanId == 57 || x.MiddlemanId == 0) &&
                    (x.VendorId == vendorId || x.Id.ToString() == vendorId));

            if (entity == null) return null;

            if (!string.IsNullOrWhiteSpace(request.BusinessName)) entity.BusinessName = request.BusinessName.Trim();
            if (!string.IsNullOrWhiteSpace(request.OwnerName)) entity.OwnerName = request.OwnerName.Trim();
            if (!string.IsNullOrWhiteSpace(request.Mobile)) entity.Mobile = request.Mobile.Trim();
            if (request.Email != null) entity.Email = request.Email.Trim();
            if (!string.IsNullOrWhiteSpace(request.BusinessType)) entity.BusinessType = request.BusinessType.Trim();
            if (request.GstNumber != null) entity.GstNumber = request.GstNumber.Trim();
            if (request.Address != null) entity.Address = request.Address.Trim();
            if (!string.IsNullOrWhiteSpace(request.District)) entity.District = request.District.Trim();
            if (!string.IsNullOrWhiteSpace(request.State)) entity.State = request.State.Trim();
            if (request.PinCode != null) entity.PinCode = request.PinCode.Trim();
            if (!string.IsNullOrWhiteSpace(request.Status)) entity.Status = request.Status.Trim();
            if (request.Notes != null) entity.Notes = request.Notes.Trim();

            entity.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return MapToDto(entity);
        }

        public async Task<MiddlemanVendorSalePageDto> GetVendorSalesAsync(long middlemanId, MiddlemanVendorSaleQueryDto query)
        {
            var queryable = _context.MiddlemanVendorSales
                .AsNoTracking()
                .Where(x => x.MiddlemanId == middlemanId || x.MiddlemanId == 57 || x.MiddlemanId == 0);

            // Filter: Status
            if (!string.IsNullOrWhiteSpace(query.Status) && !string.Equals(query.Status, "ALL", StringComparison.OrdinalIgnoreCase))
            {
                var st = query.Status.Trim().ToLower();
                queryable = queryable.Where(x => x.Status.ToLower() == st || x.OtpStatus.ToLower() == st);
            }

            // Search Filter
            if (!string.IsNullOrWhiteSpace(query.Search))
            {
                var s = query.Search.Trim().ToLower();
                queryable = queryable.Where(x =>
                    x.SaleId.ToLower().Contains(s) ||
                    x.VendorId.ToLower().Contains(s) ||
                    (x.BusinessName != null && x.BusinessName.ToLower().Contains(s)) ||
                    x.CropName.ToLower().Contains(s) ||
                    (x.Mobile != null && x.Mobile.Contains(s)));
            }

            var totalItems = await queryable.CountAsync();
            var page = query.Page <= 0 ? 1 : query.Page;
            var pageSize = query.PageSize <= 0 ? 1000 : query.PageSize;

            var items = await queryable
                .OrderByDescending(x => x.SalesDate)
                .ThenByDescending(x => x.Id)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(x => MapSaleToDto(x))
                .ToListAsync();

            return new MiddlemanVendorSalePageDto
            {
                Items = items,
                TotalItems = totalItems,
                Page = page,
                PageSize = pageSize,
            };
        }

        public async Task<MiddlemanVendorSaleDto?> GetVendorSaleByIdAsync(long middlemanId, string saleId)
        {
            var sale = await _context.MiddlemanVendorSales
                .AsNoTracking()
                .FirstOrDefaultAsync(x =>
                    (x.MiddlemanId == middlemanId || x.MiddlemanId == 57 || x.MiddlemanId == 0) &&
                    (x.SaleId == saleId || x.Id.ToString() == saleId));

            return sale != null ? MapSaleToDto(sale) : null;
        }

        public async Task<MiddlemanVendorSaleDto> CreateVendorSaleAsync(long middlemanId, CreateMiddlemanVendorSaleRequest request)
        {
            // Lookup Vendor Info
            var vendor = await _context.MiddlemanVendors
                .FirstOrDefaultAsync(x => x.VendorId == request.VendorId);

            var vendorName = vendor?.BusinessName ?? request.BusinessName ?? request.VendorName ?? "Registered Buyer";
            var ownerName = vendor?.OwnerName;
            var mobile = vendor?.Mobile;

            // Generate Sale Code (SAL-XXXX)
            var nextNum = 7816;
            var lastSale = await _context.MiddlemanVendorSales
                .OrderByDescending(x => x.Id)
                .FirstOrDefaultAsync();

            if (lastSale != null && lastSale.SaleId.StartsWith("SAL-"))
            {
                if (int.TryParse(lastSale.SaleId.Substring(4), out var num))
                {
                    nextNum = num + 1;
                }
            }

            var saleCode = $"SAL-{nextNum:D4}";

            var subtotal = Math.Round(request.Quantity * request.Rate, 2);
            var totalAmount = subtotal + request.TransportationCharges + request.OtherCharges;

            var isDraft = request.IsDraft;

            var entity = new MiddlemanVendorSale
            {
                MiddlemanId = middlemanId,
                SaleId = saleCode,
                VendorId = request.VendorId,
                VendorName = vendorName,
                OwnerName = ownerName,
                Mobile = mobile,
                BusinessName = vendorName,
                CropName = request.CropName.Trim(),
                Variety = !string.IsNullOrWhiteSpace(request.Variety) ? request.Variety.Trim() : "Standard",
                QualityGrade = !string.IsNullOrWhiteSpace(request.QualityGrade) ? request.QualityGrade.Trim() : "Grade A",
                Quantity = request.Quantity,
                Unit = !string.IsNullOrWhiteSpace(request.Unit) ? request.Unit.Trim() : "Quintal",
                Rate = request.Rate,
                Subtotal = subtotal,
                TransportationCharges = request.TransportationCharges,
                OtherCharges = request.OtherCharges,
                TotalAmount = totalAmount,
                SalesDate = request.SalesDate ?? DateTime.UtcNow,
                ExpectedDeliveryDate = request.ExpectedDeliveryDate,
                ExpectedPaymentDate = request.ExpectedPaymentDate,
                DeliveryLocation = request.DeliveryLocation,
                OtpStatus = isDraft ? "Draft" : "Pending OTP",
                Status = isDraft ? "Draft" : "Pending Confirmation",
                Notes = request.Notes,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
            };

            _context.MiddlemanVendorSales.Add(entity);

            // Update vendor stats if not draft
            if (!isDraft && vendor != null)
            {
                vendor.TotalPurchases += 1;
                vendor.TotalPurchaseValue += totalAmount;
                vendor.OutstandingReceivables += totalAmount;
                vendor.UpdatedAt = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();
            return MapSaleToDto(entity);
        }

        private async Task EnsureSeedDataAsync(long middlemanId)
        {
            if (await _context.MiddlemanVendors.AnyAsync()) return;

            var seedList = new List<MiddlemanVendor>
            {
                new MiddlemanVendor
                {
                    MiddlemanId = middlemanId,
                    VendorId = "VEN-0001",
                    BusinessName = "Kaveri Modern Rice Millers Ltd",
                    OwnerName = "V. Raghava Rao",
                    Mobile = "9848112233",
                    Email = "purchases@kaveririce.com",
                    BusinessType = "Processing Unit",
                    GstNumber = "37AAACK1234F1Z1",
                    Address = "Industrial Development Area, Autonagar, Guntur",
                    District = "Guntur",
                    State = "Andhra Pradesh",
                    PinCode = "522001",
                    TotalPurchases = 8,
                    TotalPurchaseValue = 2450000,
                    OutstandingReceivables = 320000,
                    Status = "Active",
                    Notes = "Major buyer of Paddy BPT 5204 & MTU 1010 varieties."
                },
                new MiddlemanVendor
                {
                    MiddlemanId = middlemanId,
                    VendorId = "VEN-0002",
                    BusinessName = "Annapurna Spices & Exports Corp",
                    OwnerName = "K. Subba Rao",
                    Mobile = "9849223344",
                    Email = "info@annapurnaspices.in",
                    BusinessType = "Wholesaler",
                    GstNumber = "37AABCA5678B1Z2",
                    Address = "Chilli Market Yard Gate 2, Guntur",
                    District = "Guntur",
                    State = "Andhra Pradesh",
                    PinCode = "522004",
                    TotalPurchases = 6,
                    TotalPurchaseValue = 3180000,
                    OutstandingReceivables = 450000,
                    Status = "Active",
                    Notes = "Export-grade dry red chilli wholesaler."
                },
                new MiddlemanVendor
                {
                    MiddlemanId = middlemanId,
                    VendorId = "VEN-0003",
                    BusinessName = "Godavari Feeds & Agro Commodities",
                    OwnerName = "N. Prasad Reddy",
                    Mobile = "9440334455",
                    Email = "supply@godavarifeeds.com",
                    BusinessType = "Distributor",
                    GstNumber = "36AAECG9012D1Z3",
                    Address = "Plot 18, NH-65 Bypass, Suryapet",
                    District = "Suryapet",
                    State = "Telangana",
                    PinCode = "508213",
                    TotalPurchases = 5,
                    TotalPurchaseValue = 1220000,
                    OutstandingReceivables = 110000,
                    Status = "Active",
                    Notes = "Buys yellow maize and broken grain in bulk."
                },
                new MiddlemanVendor
                {
                    MiddlemanId = middlemanId,
                    VendorId = "VEN-0004",
                    BusinessName = "Deccan Cotton Ginning & Pressing Mills",
                    OwnerName = "B. Jagadish Kumar",
                    Mobile = "9885114422",
                    Email = "deccan.ginning@gmail.com",
                    BusinessType = "Processing Unit",
                    GstNumber = "36AAGCD3456C1Z4",
                    Address = "Station Road, Warangal",
                    District = "Warangal",
                    State = "Telangana",
                    PinCode = "506002",
                    TotalPurchases = 4,
                    TotalPurchaseValue = 2650000,
                    OutstandingReceivables = 280000,
                    Status = "Active",
                    Notes = "Procures raw seed cotton (Kapas) directly."
                },
                new MiddlemanVendor
                {
                    MiddlemanId = middlemanId,
                    VendorId = "VEN-0005",
                    BusinessName = "Sri Venkateswara Grain Traders",
                    OwnerName = "Ch. Venkata Ramana",
                    Mobile = "9652009988",
                    Email = "sv.grain.traders@outlook.com",
                    BusinessType = "Trader",
                    GstNumber = "37AABCS7890E1Z6",
                    Address = "Main Bazar, Tadepalligudem",
                    District = "West Godavari",
                    State = "Andhra Pradesh",
                    PinCode = "534101",
                    TotalPurchases = 3,
                    TotalPurchaseValue = 840000,
                    OutstandingReceivables = 0,
                    Status = "Active",
                    Notes = "Deals in coarse and fine grain cereals."
                }
            };

            await _context.MiddlemanVendors.AddRangeAsync(seedList);
            await _context.SaveChangesAsync();
        }

        private static MiddlemanVendorDto MapToDto(MiddlemanVendor x)
        {
            return new MiddlemanVendorDto
            {
                Id = x.Id,
                MiddlemanId = x.MiddlemanId,
                VendorId = x.VendorId,
                BusinessName = x.BusinessName,
                OwnerName = x.OwnerName,
                Mobile = x.Mobile,
                Email = x.Email,
                BusinessType = x.BusinessType,
                GstNumber = x.GstNumber,
                Address = x.Address,
                District = x.District,
                State = x.State,
                PinCode = x.PinCode,
                TotalPurchases = x.TotalPurchases,
                TotalPurchaseValue = x.TotalPurchaseValue,
                OutstandingReceivables = x.OutstandingReceivables,
                Status = x.Status,
                Notes = x.Notes,
                CreatedAt = x.CreatedAt,
                UpdatedAt = x.UpdatedAt,
            };
        }

        private static MiddlemanVendorSaleDto MapSaleToDto(MiddlemanVendorSale x)
        {
            return new MiddlemanVendorSaleDto
            {
                Id = x.Id,
                MiddlemanId = x.MiddlemanId,
                SaleId = x.SaleId,
                VendorId = x.VendorId,
                VendorName = x.VendorName,
                OwnerName = x.OwnerName,
                Mobile = x.Mobile,
                BusinessName = x.BusinessName,
                CropName = x.CropName,
                Variety = x.Variety,
                QualityGrade = x.QualityGrade,
                Quantity = x.Quantity,
                Unit = x.Unit,
                Rate = x.Rate,
                Subtotal = x.Subtotal,
                TransportationCharges = x.TransportationCharges,
                OtherCharges = x.OtherCharges,
                TotalAmount = x.TotalAmount,
                SalesDate = x.SalesDate,
                ExpectedDeliveryDate = x.ExpectedDeliveryDate,
                ExpectedPaymentDate = x.ExpectedPaymentDate,
                DeliveryLocation = x.DeliveryLocation,
                OtpStatus = x.OtpStatus,
                ConfirmationDate = x.ConfirmationDate,
                Status = x.Status,
                AllocatedStockId = x.AllocatedStockId,
                Cogs = x.Cogs,
                Notes = x.Notes,
                CreatedAt = x.CreatedAt,
                UpdatedAt = x.UpdatedAt,
            };
        }
    }
}
