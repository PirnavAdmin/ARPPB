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
    public class MiddlemanCustomerService : IMiddlemanCustomerService
    {
        private readonly AppDbContext _context;

        public MiddlemanCustomerService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<MiddlemanCustomerPageDto> GetCustomersAsync(long middlemanId, MiddlemanCustomerQueryDto query)
        {
            await EnsureCustomerSeedDataAsync(middlemanId);

            var queryable = _context.MiddlemanCustomers
                .AsNoTracking()
                .Where(x => x.MiddlemanId == middlemanId || x.MiddlemanId == 57 || x.MiddlemanId == 0);

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

            // Search
            if (!string.IsNullOrWhiteSpace(query.Search))
            {
                var s = query.Search.Trim().ToLower();
                queryable = queryable.Where(x =>
                    x.Name.ToLower().Contains(s) ||
                    x.CustomerId.ToLower().Contains(s) ||
                    x.Mobile.Contains(s) ||
                    (x.Address != null && x.Address.ToLower().Contains(s)) ||
                    x.District.ToLower().Contains(s));
            }

            var totalItems = await queryable.CountAsync();
            var page = query.Page <= 0 ? 1 : query.Page;
            var pageSize = query.PageSize <= 0 ? 10 : query.PageSize;

            var items = await queryable
                .OrderBy(x => x.Id)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(x => MapToCustomerDto(x))
                .ToListAsync();

            return new MiddlemanCustomerPageDto
            {
                Items = items,
                TotalItems = totalItems,
                Page = page,
                PageSize = pageSize,
            };
        }

        public async Task<MiddlemanCustomerDto?> GetCustomerByIdAsync(long middlemanId, string customerId)
        {
            await EnsureCustomerSeedDataAsync(middlemanId);

            var customer = await _context.MiddlemanCustomers
                .AsNoTracking()
                .FirstOrDefaultAsync(x =>
                    (x.MiddlemanId == middlemanId || x.MiddlemanId == 57 || x.MiddlemanId == 0) &&
                    (x.CustomerId == customerId || x.Id.ToString() == customerId));

            return customer != null ? MapToCustomerDto(customer) : null;
        }

        public async Task<MiddlemanCustomerDto> RegisterCustomerAsync(long middlemanId, RegisterCustomerRequest request)
        {
            var nextNum = 1;
            var lastCustomer = await _context.MiddlemanCustomers
                .OrderByDescending(x => x.Id)
                .FirstOrDefaultAsync();

            if (lastCustomer != null && lastCustomer.CustomerId.StartsWith("CUST-"))
            {
                if (int.TryParse(lastCustomer.CustomerId.Substring(5), out var num))
                {
                    nextNum = num + 1;
                }
            }

            var custCode = $"CUST-{nextNum:D4}";

            var entity = new MiddlemanCustomer
            {
                MiddlemanId = middlemanId > 0 ? middlemanId : 57,
                CustomerId = custCode,
                Name = request.Name.Trim(),
                Mobile = request.Mobile.Trim(),
                Email = request.Email?.Trim(),
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

            _context.MiddlemanCustomers.Add(entity);
            await _context.SaveChangesAsync();

            return MapToCustomerDto(entity);
        }

        public async Task<MiddlemanCustomerDto?> UpdateCustomerAsync(long middlemanId, string customerId, UpdateCustomerRequest request)
        {
            var customer = await _context.MiddlemanCustomers
                .FirstOrDefaultAsync(x =>
                    (x.MiddlemanId == middlemanId || x.MiddlemanId == 57 || x.MiddlemanId == 0) &&
                    (x.CustomerId == customerId || x.Id.ToString() == customerId));

            if (customer == null) return null;

            if (!string.IsNullOrWhiteSpace(request.Name)) customer.Name = request.Name.Trim();
            if (!string.IsNullOrWhiteSpace(request.Mobile)) customer.Mobile = request.Mobile.Trim();
            if (request.Email != null) customer.Email = request.Email.Trim();
            if (request.Address != null) customer.Address = request.Address.Trim();
            if (!string.IsNullOrWhiteSpace(request.District)) customer.District = request.District.Trim();
            if (!string.IsNullOrWhiteSpace(request.State)) customer.State = request.State.Trim();
            if (request.PinCode != null) customer.PinCode = request.PinCode.Trim();
            if (!string.IsNullOrWhiteSpace(request.Status)) customer.Status = request.Status.Trim();
            if (request.Notes != null) customer.Notes = request.Notes.Trim();
            customer.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return MapToCustomerDto(customer);
        }

        public async Task<MiddlemanCustomerSalePageDto> GetCustomerSalesAsync(long middlemanId, MiddlemanCustomerSaleQueryDto query)
        {
            var queryable = _context.MiddlemanSales
                .AsNoTracking()
                .Where(x => (x.MiddlemanId == middlemanId || x.MiddlemanId == 57 || x.MiddlemanId == 0) &&
                            x.BuyerType == "Customer");

            if (!string.IsNullOrWhiteSpace(query.CustomerId))
            {
                queryable = queryable.Where(x => x.BuyerId == query.CustomerId);
            }

            if (!string.IsNullOrWhiteSpace(query.CropName) && !string.Equals(query.CropName, "ALL", StringComparison.OrdinalIgnoreCase))
            {
                queryable = queryable.Where(x => x.CropName.ToLower() == query.CropName.ToLower());
            }

            if (!string.IsNullOrWhiteSpace(query.Status) && !string.Equals(query.Status, "ALL", StringComparison.OrdinalIgnoreCase))
            {
                var st = query.Status.Trim().ToLower();
                queryable = queryable.Where(x => x.OtpStatus.ToLower() == st || x.Status.ToLower() == st);
            }

            if (!string.IsNullOrWhiteSpace(query.Search))
            {
                var s = query.Search.Trim().ToLower();
                queryable = queryable.Where(x =>
                    x.SaleCode.ToLower().Contains(s) ||
                    x.BuyerName.ToLower().Contains(s) ||
                    x.CropName.ToLower().Contains(s));
            }

            var totalItems = await queryable.CountAsync();
            var page = query.Page <= 0 ? 1 : query.Page;
            var pageSize = query.PageSize <= 0 ? 10 : query.PageSize;

            var items = await queryable
                .OrderByDescending(x => x.Id)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(x => MapToSaleDto(x))
                .ToListAsync();

            return new MiddlemanCustomerSalePageDto
            {
                Items = items,
                TotalItems = totalItems,
                Page = page,
                PageSize = pageSize,
            };
        }

        public async Task<MiddlemanCustomerSaleDto?> GetCustomerSaleByIdAsync(long middlemanId, string saleId)
        {
            var sale = await _context.MiddlemanSales
                .AsNoTracking()
                .FirstOrDefaultAsync(x =>
                    (x.MiddlemanId == middlemanId || x.MiddlemanId == 57 || x.MiddlemanId == 0) &&
                    x.BuyerType == "Customer" &&
                    (x.SaleCode == saleId || x.Id.ToString() == saleId));

            return sale != null ? MapToSaleDto(sale) : null;
        }

        public async Task<MiddlemanCustomerSaleDto> CreateCustomerSaleAsync(long middlemanId, CreateMiddlemanCustomerSaleRequest request)
        {
            var nextNum = new Random().Next(1000, 9999);
            var saleCode = $"CUS-SAL-{nextNum}";

            var status = request.IsDraft ? "Draft" : "Pending Confirmation";
            var otpStatus = request.IsDraft ? "Draft" : "Pending";

            var sale = new MiddlemanSale
            {
                MiddlemanId = middlemanId > 0 ? middlemanId : 57,
                SaleCode = saleCode,
                BuyerType = "Customer",
                BuyerId = !string.IsNullOrWhiteSpace(request.CustomerId) ? request.CustomerId.Trim() : "CUST-0001",
                BuyerName = !string.IsNullOrWhiteSpace(request.CustomerName) ? request.CustomerName.Trim() : "Direct Customer",
                BuyerMobile = request.Mobile?.Trim(),
                CropName = request.CropName.Trim(),
                Variety = !string.IsNullOrWhiteSpace(request.Variety) ? request.Variety.Trim() : "Standard",
                Quantity = request.Quantity,
                Unit = !string.IsNullOrWhiteSpace(request.Unit) ? request.Unit.Trim() : "Quintal",
                PricePerUnit = request.Rate,
                Subtotal = request.Subtotal > 0 ? request.Subtotal : (request.Quantity * request.Rate),
                DeliveryCharges = request.DeliveryCharges,
                TotalAmount = request.FinalAmount > 0 ? request.FinalAmount : ((request.Quantity * request.Rate) + request.DeliveryCharges),
                SaleDate = request.SalesDate ?? DateTime.UtcNow,
                ExpectedPaymentDate = request.ExpectedPaymentDate,
                Status = status,
                OtpStatus = otpStatus,
                Notes = request.Notes?.Trim(),
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
            };

            _context.MiddlemanSales.Add(sale);
            await _context.SaveChangesAsync();

            // If not draft, also log in MiddlemanConfirmations for OTP verification
            if (!request.IsDraft)
            {
                var confId = $"CONF-C-{sale.Id:D4}";
                var conf = new MiddlemanConfirmation
                {
                    MiddlemanId = sale.MiddlemanId,
                    ConfirmationCode = confId,
                    TransactionId = sale.SaleCode,
                    TransactionType = "Customer Sale",
                    PartyType = "Customer",
                    PartyId = sale.BuyerId,
                    PartyName = sale.BuyerName,
                    PartyMobile = sale.BuyerMobile,
                    Crop = sale.CropName,
                    Variety = sale.Variety,
                    Quantity = sale.Quantity,
                    Unit = sale.Unit,
                    PricePerUnit = sale.PricePerUnit,
                    TransactionAmount = sale.TotalAmount,
                    OtpStatus = "Pending",
                    RequestDate = DateTime.UtcNow,
                    ExpiryDate = DateTime.UtcNow.AddHours(48),
                    Notes = sale.Notes,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow,
                };
                _context.MiddlemanConfirmations.Add(conf);
                await _context.SaveChangesAsync();
            }

            return MapToSaleDto(sale);
        }

        private async Task EnsureCustomerSeedDataAsync(long middlemanId)
        {
            var hasAny = await _context.MiddlemanCustomers.AnyAsync();
            if (!hasAny)
            {
                _context.MiddlemanCustomers.AddRange(new List<MiddlemanCustomer>
                {
                    new MiddlemanCustomer
                    {
                        MiddlemanId = middlemanId > 0 ? middlemanId : 57,
                        CustomerId = "CUST-0001",
                        Name = "Annapurna Wholesale Supermart Pvt. Ltd.",
                        Mobile = "9848500111",
                        Email = "annapurna.mart@gmail.com",
                        Address = "Ring Road, Near NTR Stadium",
                        District = "Guntur",
                        State = "Andhra Pradesh",
                        PinCode = "522002",
                        TotalPurchases = 3,
                        TotalPurchaseValue = 438000.00m,
                        OutstandingReceivables = 0.00m,
                        Status = "Active",
                        Notes = "Regular buyer of fine Paddy and Chilli produce.",
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow,
                    },
                    new MiddlemanCustomer
                    {
                        MiddlemanId = middlemanId > 0 ? middlemanId : 57,
                        CustomerId = "CUST-0002",
                        Name = "Raju Kirana & Agro Stores",
                        Mobile = "9849123456",
                        Email = "raju.kirana@gmail.com",
                        Address = "Shop 12, Main Road",
                        District = "Krishna",
                        State = "Andhra Pradesh",
                        PinCode = "521301",
                        TotalPurchases = 2,
                        TotalPurchaseValue = 195000.00m,
                        OutstandingReceivables = 0.00m,
                        Status = "Active",
                        Notes = "Retail store ordering weekly pulses and grains.",
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow,
                    },
                    new MiddlemanCustomer
                    {
                        MiddlemanId = middlemanId > 0 ? middlemanId : 57,
                        CustomerId = "CUST-0003",
                        Name = "Balaji Provision & Retail Store",
                        Mobile = "9440556677",
                        Email = "balaji.stores@yahoo.com",
                        Address = "Trunk Road, Opposite Bus Stand",
                        District = "Prakasam",
                        State = "Andhra Pradesh",
                        PinCode = "523001",
                        TotalPurchases = 1,
                        TotalPurchaseValue = 85000.00m,
                        OutstandingReceivables = 0.00m,
                        Status = "Active",
                        Notes = "Consumer grain buyer.",
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow,
                    },
                    new MiddlemanCustomer
                    {
                        MiddlemanId = middlemanId > 0 ? middlemanId : 57,
                        CustomerId = "CUST-0004",
                        Name = "Kisan Direct Retail Outlet",
                        Mobile = "9652889900",
                        Email = "kisan.direct@outlook.com",
                        Address = "Market Yard Gate 1",
                        District = "Guntur",
                        State = "Andhra Pradesh",
                        PinCode = "522201",
                        TotalPurchases = 1,
                        TotalPurchaseValue = 120000.00m,
                        OutstandingReceivables = 0.00m,
                        Status = "Active",
                        Notes = "Direct farm-to-consumer store.",
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow,
                    }
                });
                await _context.SaveChangesAsync();
            }
        }

        private static MiddlemanCustomerDto MapToCustomerDto(MiddlemanCustomer entity)
        {
            return new MiddlemanCustomerDto
            {
                Id = entity.Id,
                MiddlemanId = entity.MiddlemanId,
                CustomerId = entity.CustomerId,
                Name = entity.Name,
                Mobile = entity.Mobile,
                Email = entity.Email,
                Address = entity.Address,
                District = entity.District,
                State = entity.State,
                PinCode = entity.PinCode,
                TotalPurchases = entity.TotalPurchases,
                TotalPurchaseValue = entity.TotalPurchaseValue,
                OutstandingReceivables = entity.OutstandingReceivables,
                Status = entity.Status,
                Notes = entity.Notes,
                CreatedAt = entity.CreatedAt,
                UpdatedAt = entity.UpdatedAt,
            };
        }

        private static MiddlemanCustomerSaleDto MapToSaleDto(MiddlemanSale entity)
        {
            return new MiddlemanCustomerSaleDto
            {
                Id = entity.Id,
                MiddlemanId = entity.MiddlemanId,
                SaleId = entity.SaleCode,
                CustomerId = entity.BuyerId,
                CustomerName = entity.BuyerName,
                Mobile = entity.BuyerMobile,
                CropName = entity.CropName,
                Variety = entity.Variety,
                Quantity = entity.Quantity,
                Unit = entity.Unit,
                Rate = entity.PricePerUnit,
                Subtotal = entity.Subtotal,
                DeliveryCharges = entity.DeliveryCharges,
                FinalAmount = entity.TotalAmount,
                SalesDate = entity.SaleDate,
                ExpectedPaymentDate = entity.ExpectedPaymentDate,
                Status = entity.Status,
                OtpStatus = entity.OtpStatus,
                ConfirmationDate = entity.ConfirmationDate,
                Notes = entity.Notes,
                CreatedAt = entity.CreatedAt,
                UpdatedAt = entity.UpdatedAt,
            };
        }
    }
}
