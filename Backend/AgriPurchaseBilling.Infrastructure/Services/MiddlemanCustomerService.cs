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

            // Fetch portal registered customers
            var portalCustomers = await _context.Users
                .AsNoTracking()
                .Include(u => u.Customer)
                .Where(u => u.Role == AgriPurchaseBilling.Domain.Enums.UserRole.Customer)
                .ToListAsync();

            var customerProfiles = await _context.CustomerProfiles
                .AsNoTracking()
                .ToDictionaryAsync(p => p.UserId);

            // Fetch offline Middleman customers
            var offlineCustomers = await _context.MiddlemanCustomers
                .AsNoTracking()
                .Where(x => x.MiddlemanId == middlemanId || x.MiddlemanId == 57 || x.MiddlemanId == 0)
                .ToListAsync();

            var list = new List<MiddlemanCustomerDto>();
            var seenMobiles = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

            foreach (var u in portalCustomers)
            {
                var mob = u.Mobile ?? string.Empty;
                seenMobiles.Add(mob);

                customerProfiles.TryGetValue(u.Id, out var profile);

                list.Add(new MiddlemanCustomerDto
                {
                    Id = u.Id,
                    MiddlemanId = middlemanId,
                    CustomerId = u.Customer?.CustomerCode ?? $"CUST-{u.Id:D4}",
                    Name = u.FullName,
                    Mobile = mob,
                    Email = u.Email,
                    Address = profile?.Address,
                    District = profile?.District ?? string.Empty,
                    State = profile?.State ?? "Andhra Pradesh",
                    PinCode = profile?.PinCode,
                    TotalPurchases = 0,
                    TotalPurchaseValue = 0m,
                    OutstandingReceivables = 0m,
                    Status = u.IsActive ? "Active" : "Inactive",
                    Role = "Customer",
                    UserType = "Customer",
                    SourcePortal = "Customer Portal",
                    CreatedAt = u.CreatedAt,
                    UpdatedAt = u.UpdatedAt
                });
            }

            foreach (var mc in offlineCustomers)
            {
                var mob = mc.Mobile ?? string.Empty;
                if (!string.IsNullOrWhiteSpace(mob) && seenMobiles.Contains(mob))
                {
                    continue; // Skip duplicate, prefer portal registered
                }
                seenMobiles.Add(mob);

                var dto = MapToCustomerDto(mc);
                dto.SourcePortal = "Middleman Offline";
                list.Add(dto);
            }

            var queryable = list.AsEnumerable();

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

            var totalItems = queryable.Count();
            var page = query.Page <= 0 ? 1 : query.Page;
            var pageSize = query.PageSize <= 0 ? 1000 : query.PageSize;

            var items = queryable
                .OrderByDescending(x => x.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToList();

            var customerIds = items.Select(x => x.CustomerId).ToList();
            var dues = await _context.MiddlemanLedgers.AsNoTracking()
                .Where(l => l.PartyCategory == "Customer" && customerIds.Contains(l.PartyId ?? string.Empty))
                .GroupBy(l => l.PartyId!)
                .Select(g => new
                {
                    PartyId = g.Key,
                    TotalCount = g.Count(),
                    TotalValue = g.Sum(x => x.Debit),
                    TotalReceived = g.Sum(x => x.SettledAmount),
                    TotalDue = g.Sum(x => x.OutstandingAmount),
                    Unpaid = g.Count(x => x.OutstandingAmount > 0 && x.SettledAmount == 0),
                    Partial = g.Count(x => x.OutstandingAmount > 0 && x.SettledAmount > 0),
                    Paid = g.Count(x => x.OutstandingAmount <= 0.001m && (x.Debit > 0 || x.Credit > 0))
                })
                .ToDictionaryAsync(x => x.PartyId, x => x, StringComparer.OrdinalIgnoreCase);

            foreach (var dto in items)
            {
                if (dues.TryGetValue(dto.CustomerId, out var dueStat))
                {
                    if (dueStat.TotalCount > 0) dto.TotalPurchases = dueStat.TotalCount;
                    if (dueStat.TotalValue > 0) dto.TotalPurchaseValue = dueStat.TotalValue;
                    dto.TotalReceived = dueStat.TotalReceived;
                    dto.OutstandingReceivables = dueStat.TotalDue;
                    dto.UnpaidCount = dueStat.Unpaid;
                    dto.PartiallyPaidCount = dueStat.Partial;
                    dto.PaidCount = dueStat.Paid;
                }
            }

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

            // 1. Check in Portal Customers
            if (long.TryParse(customerId, out var uid))
            {
                var portalUser = await _context.Users
                    .AsNoTracking()
                    .Include(u => u.Customer)
                    .FirstOrDefaultAsync(u => u.Role == AgriPurchaseBilling.Domain.Enums.UserRole.Customer && (u.Id == uid || (u.Customer != null && u.Customer.CustomerCode == customerId)));
                if (portalUser != null)
                {
                    var profile = await _context.CustomerProfiles.AsNoTracking().FirstOrDefaultAsync(p => p.UserId == portalUser.Id);
                    return new MiddlemanCustomerDto
                    {
                        Id = portalUser.Id,
                        MiddlemanId = middlemanId,
                        CustomerId = portalUser.Customer?.CustomerCode ?? $"CUST-{portalUser.Id:D4}",
                        Name = portalUser.FullName,
                        Mobile = portalUser.Mobile,
                        Email = portalUser.Email,
                        Address = profile?.Address,
                        District = profile?.District ?? string.Empty,
                        State = profile?.State ?? "Andhra Pradesh",
                        PinCode = profile?.PinCode,
                        Status = portalUser.IsActive ? "Active" : "Inactive",
                        Role = "Customer",
                        UserType = "Customer",
                        SourcePortal = "Customer Portal",
                        CreatedAt = portalUser.CreatedAt,
                        UpdatedAt = portalUser.UpdatedAt
                    };
                }
            }
            else
            {
                var portalUser = await _context.Users
                    .AsNoTracking()
                    .Include(u => u.Customer)
                    .FirstOrDefaultAsync(u => u.Role == AgriPurchaseBilling.Domain.Enums.UserRole.Customer && u.Customer != null && u.Customer.CustomerCode == customerId);
                if (portalUser != null)
                {
                    var profile = await _context.CustomerProfiles.AsNoTracking().FirstOrDefaultAsync(p => p.UserId == portalUser.Id);
                    return new MiddlemanCustomerDto
                    {
                        Id = portalUser.Id,
                        MiddlemanId = middlemanId,
                        CustomerId = portalUser.Customer?.CustomerCode ?? $"CUST-{portalUser.Id:D4}",
                        Name = portalUser.FullName,
                        Mobile = portalUser.Mobile,
                        Email = portalUser.Email,
                        Address = profile?.Address,
                        District = profile?.District ?? string.Empty,
                        State = profile?.State ?? "Andhra Pradesh",
                        PinCode = profile?.PinCode,
                        Status = portalUser.IsActive ? "Active" : "Inactive",
                        Role = "Customer",
                        UserType = "Customer",
                        SourcePortal = "Customer Portal",
                        CreatedAt = portalUser.CreatedAt,
                        UpdatedAt = portalUser.UpdatedAt
                    };
                }
            }

            // 2. Check offline Middleman customers
            var customer = await _context.MiddlemanCustomers
                .AsNoTracking()
                .FirstOrDefaultAsync(x =>
                    (x.MiddlemanId == middlemanId || x.MiddlemanId == 57 || x.MiddlemanId == 0) &&
                    (x.CustomerId == customerId || x.Id.ToString() == customerId));

            if (customer == null) return null;

            var dto = MapToCustomerDto(customer);
            var due = await _context.MiddlemanLedgers.AsNoTracking()
                .Where(l => l.PartyCategory == "Customer" && (l.PartyId == customer.CustomerId || l.PartyName == customer.Name))
                .SumAsync(l => l.OutstandingAmount);
            dto.OutstandingReceivables = due;
            return dto;
        }

        public async Task<MiddlemanCustomerDto> RegisterCustomerAsync(long middlemanId, RegisterCustomerRequest request)
        {
            var nextNum = 1;
            var lastCustomer = await _context.MiddlemanCustomers
                .OrderByDescending(x => x.Id)
                .FirstOrDefaultAsync();

            if (lastCustomer != null)
            {
                var digits = new string(lastCustomer.CustomerId.Where(char.IsDigit).ToArray());
                if (int.TryParse(digits, out var num))
                {
                    nextNum = num + 1;
                }
            }

            var custCode = $"CUS-{nextNum:D4}";

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

            // Filter: Customer ID
            if (!string.IsNullOrWhiteSpace(query.CustomerId))
            {
                var cid = query.CustomerId.Trim();
                queryable = queryable.Where(x => x.BuyerId == cid);
            }

            // Filter: Crop Name
            if (!string.IsNullOrWhiteSpace(query.CropName) && !string.Equals(query.CropName, "ALL", StringComparison.OrdinalIgnoreCase))
            {
                var cn = query.CropName.Trim().ToLower();
                queryable = queryable.Where(x => x.CropName.ToLower() == cn);
            }

            // Filter: Status
            if (!string.IsNullOrWhiteSpace(query.Status) && !string.Equals(query.Status, "ALL", StringComparison.OrdinalIgnoreCase))
            {
                var st = query.Status.Trim().ToLower();
                queryable = queryable.Where(x => x.Status.ToLower() == st || x.OtpStatus.ToLower() == st);
            }

            // Search
            if (!string.IsNullOrWhiteSpace(query.Search))
            {
                var s = query.Search.Trim().ToLower();
                queryable = queryable.Where(x =>
                    x.SaleCode.ToLower().Contains(s) ||
                    x.BuyerName.ToLower().Contains(s) ||
                    x.CropName.ToLower().Contains(s) ||
                    (x.BuyerMobile != null && x.BuyerMobile.Contains(s)));
            }

            var totalItems = await queryable.CountAsync();
            var page = query.Page <= 0 ? 1 : query.Page;
            var pageSize = query.PageSize <= 0 ? 1000 : query.PageSize;

            var rawSales = await queryable
                .OrderByDescending(x => x.Id)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            var saleCodes = rawSales.Select(x => x.SaleCode).ToList();
            var ledgers = await _context.MiddlemanLedgers.AsNoTracking()
                .Where(l => saleCodes.Contains(l.TransactionId ?? string.Empty))
                .ToListAsync();
            var ledgerMap = ledgers
                .Where(l => !string.IsNullOrWhiteSpace(l.TransactionId))
                .GroupBy(l => l.TransactionId!.Trim(), StringComparer.OrdinalIgnoreCase)
                .ToDictionary(g => g.Key, g => g.First(), StringComparer.OrdinalIgnoreCase);

            var payments = await _context.MiddlemanPayments.AsNoTracking()
                .Where(p => saleCodes.Contains(p.TransactionId))
                .OrderBy(p => p.PaymentDate)
                .ToListAsync();
            var paymentMap = payments
                .Where(p => !string.IsNullOrWhiteSpace(p.TransactionId))
                .GroupBy(p => p.TransactionId.Trim(), StringComparer.OrdinalIgnoreCase)
                .ToDictionary(g => g.Key, g => g.ToList(), StringComparer.OrdinalIgnoreCase);

            var items = rawSales.Select(s =>
            {
                var dto = MapToSaleDto(s);
                if (ledgerMap.TryGetValue(s.SaleCode.Trim(), out var led))
                {
                    dto.PaidAmount = led.SettledAmount;
                    dto.OutstandingAmount = Math.Max(0, dto.FinalAmount - led.SettledAmount);
                    dto.PaymentStatus = dto.OutstandingAmount <= 0 && dto.FinalAmount > 0
                        ? "Paid"
                        : (dto.PaidAmount > 0 ? "Partially Paid" : "Unpaid");
                }
                else
                {
                    dto.PaidAmount = 0;
                    dto.OutstandingAmount = dto.FinalAmount;
                    dto.PaymentStatus = dto.FinalAmount > 0 ? "Unpaid" : "Paid";
                }

                if (paymentMap.TryGetValue(s.SaleCode.Trim(), out var pmts))
                {
                    dto.PaymentHistory = pmts.Select(MapPaymentToDto).ToList();
                }

                return dto;
            }).ToList();

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

            if (sale == null) return null;

            var dto = MapToSaleDto(sale);
            var led = await _context.MiddlemanLedgers.AsNoTracking()
                .FirstOrDefaultAsync(l => l.TransactionId == sale.SaleCode);
            if (led != null)
            {
                dto.PaidAmount = led.SettledAmount;
                dto.OutstandingAmount = Math.Max(0, dto.FinalAmount - led.SettledAmount);
                dto.PaymentStatus = dto.OutstandingAmount <= 0 && dto.FinalAmount > 0
                    ? "Paid"
                    : (dto.PaidAmount > 0 ? "Partially Paid" : "Unpaid");
            }
            else
            {
                dto.PaidAmount = 0;
                dto.OutstandingAmount = dto.FinalAmount;
                dto.PaymentStatus = dto.FinalAmount > 0 ? "Unpaid" : "Paid";
            }

            var pmts = await _context.MiddlemanPayments.AsNoTracking()
                .Where(p => p.TransactionId == sale.SaleCode)
                .OrderBy(p => p.PaymentDate)
                .ToListAsync();
            dto.PaymentHistory = pmts.Select(MapPaymentToDto).ToList();

            return dto;
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
                BuyerId = !string.IsNullOrWhiteSpace(request.CustomerId) ? request.CustomerId.Trim() : "CUS-0001",
                BuyerName = !string.IsNullOrWhiteSpace(request.CustomerName) ? request.CustomerName.Trim() : "Direct Customer",
                BuyerMobile = request.Mobile?.Trim(),
                CropName = request.CropName.Trim(),
                Variety = !string.IsNullOrWhiteSpace(request.Variety) ? request.Variety.Trim() : "Standard",
                QualityGrade = !string.IsNullOrWhiteSpace(request.QualityGrade) ? request.QualityGrade.Trim() : "Grade A",
                Quantity = request.Quantity,
                Unit = !string.IsNullOrWhiteSpace(request.Unit) ? request.Unit.Trim() : "Quintal",
                PricePerUnit = request.Rate,
                Subtotal = request.Subtotal > 0 ? request.Subtotal : (request.Quantity * request.Rate),
                DeliveryCharges = request.DeliveryCharges,
                DeliveryAddress = request.DeliveryAddress?.Trim(),
                TotalAmount = request.FinalAmount > 0 ? request.FinalAmount : ((request.Quantity * request.Rate) + request.DeliveryCharges),
                SaleDate = request.SalesDate ?? DateTime.UtcNow,
                ExpectedPaymentDate = request.ExpectedPaymentDate,
                ExpectedDeliveryDate = request.ExpectedDeliveryDate,
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
                    OtpCode = "488031",
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
                        CustomerId = "CUS-0001",
                        Name = "Raju Kirana & Agro Stores",
                        Mobile = "9849556677",
                        Email = "raju.kirana@gmail.com",
                        Address = "Shop No 14, Gandhi Chowk, Tenali",
                        District = "Guntur",
                        State = "Andhra Pradesh",
                        PinCode = "522201",
                        TotalPurchases = 5,
                        TotalPurchaseValue = 320000.00m,
                        OutstandingReceivables = 35000.00m,
                        Status = "Active",
                        Notes = "Regular retail store buyer for milled rice and whole spices.",
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow,
                    },
                    new MiddlemanCustomer
                    {
                        MiddlemanId = middlemanId > 0 ? middlemanId : 57,
                        CustomerId = "CUS-0002",
                        Name = "Balaji Grain & Oil Mart",
                        Mobile = "9440667788",
                        Email = null,
                        Address = "Near Old Bus Stand, Vijayawada",
                        District = "NTR (Krishna)",
                        State = "Andhra Pradesh",
                        PinCode = "520001",
                        TotalPurchases = 4,
                        TotalPurchaseValue = 285000.00m,
                        OutstandingReceivables = 0.00m,
                        Status = "Active",
                        Notes = "Groundnut pod and seed buyer.",
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow,
                    },
                    new MiddlemanCustomer
                    {
                        MiddlemanId = middlemanId > 0 ? middlemanId : 57,
                        CustomerId = "CUS-0003",
                        Name = "Sai Ram Cattle & Poultry Feeds",
                        Mobile = "9989778899",
                        Email = "sairamfeeds@yahoo.com",
                        Address = "Ring Road, Miryalaguda",
                        District = "Nalgonda",
                        State = "Telangana",
                        PinCode = "508207",
                        TotalPurchases = 3,
                        TotalPurchaseValue = 195000.00m,
                        OutstandingReceivables = 45000.00m,
                        Status = "Active",
                        Notes = "Procures broken rice and feed maize.",
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow,
                    },
                    new MiddlemanCustomer
                    {
                        MiddlemanId = middlemanId > 0 ? middlemanId : 57,
                        CustomerId = "CUS-0004",
                        Name = "Kisan Seed Stores & Organics",
                        Mobile = "9701889900",
                        Email = null,
                        Address = "Station Road, Khammam",
                        District = "Khammam",
                        State = "Telangana",
                        PinCode = "507001",
                        TotalPurchases = 2,
                        TotalPurchaseValue = 140000.00m,
                        OutstandingReceivables = 20000.00m,
                        Status = "Active",
                        Notes = "Buys graded wheat and certified grain lots.",
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
                QualityGrade = entity.QualityGrade ?? "Grade A",
                Quantity = entity.Quantity,
                Unit = entity.Unit,
                Rate = entity.PricePerUnit,
                Subtotal = entity.Subtotal,
                DeliveryCharges = entity.DeliveryCharges,
                DeliveryAddress = entity.DeliveryAddress,
                FinalAmount = entity.TotalAmount,
                SalesDate = entity.SaleDate,
                ExpectedPaymentDate = entity.ExpectedPaymentDate,
                ExpectedDeliveryDate = entity.ExpectedDeliveryDate,
                Status = entity.Status,
                OtpStatus = entity.OtpStatus,
                ConfirmationDate = entity.ConfirmationDate,
                Notes = entity.Notes,
                CreatedAt = entity.CreatedAt,
                UpdatedAt = entity.UpdatedAt,
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
    }
}
