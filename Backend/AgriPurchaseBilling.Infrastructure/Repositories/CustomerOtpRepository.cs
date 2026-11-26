using AgriPurchaseBilling.Application.DTOs;
using AgriPurchaseBilling.Application.Interfaces;
using AgriPurchaseBilling.Domain.Entities;
using AgriPurchaseBilling.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace AgriPurchaseBilling.Infrastructure.Repositories
{
    public class CustomerOtpRepository : ICustomerOtpRepository
    {
        private static readonly TimeZoneInfo BusinessTimeZone = ResolveBusinessTimeZone();
        private readonly AppDbContext _context;

        public CustomerOtpRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<CustomerConfirmationPagedDto> GetConfirmationsAsync(
            long customerUserId,
            CustomerConfirmationQueryDto query,
            CancellationToken cancellationToken = default)
        {
            string customerCode = $"CUST-2026-{customerUserId:D4}";

            // Query strictly scoped to the authenticated customer
            var baseQuery = _context.VpOtpConfirmations
                .AsNoTracking()
                .Include(c => c.Sale)
                .Where(c => (c.Sale != null && c.Sale.CustomerUserId == customerUserId) ||
                            (c.PartyCategory == "Customer" && c.PartyCode == customerCode));

            // Search filter
            if (!string.IsNullOrWhiteSpace(query.Search))
            {
                string search = query.Search.Trim().ToLower();
                baseQuery = baseQuery.Where(c =>
                    (c.ConfirmationCode != null && c.ConfirmationCode.ToLower().Contains(search)) ||
                    c.TransactionCode.ToLower().Contains(search) ||
                    (c.Product != null && c.Product.ToLower().Contains(search)) ||
                    (c.Sale != null && c.Sale.OrderCode.ToLower().Contains(search)));
            }

            // Status filter
            if (!string.IsNullOrWhiteSpace(query.Status) &&
                !query.Status.Equals("all", StringComparison.OrdinalIgnoreCase) &&
                !query.Status.Equals("all orders", StringComparison.OrdinalIgnoreCase))
            {
                string status = query.Status.Trim().ToLower();
                if (status == "pending" || status == "sent")
                {
                    baseQuery = baseQuery.Where(c => c.OtpStatus == "Pending" || c.OtpStatus == "Sent");
                }
                else if (status == "confirmed" || status == "verified")
                {
                    baseQuery = baseQuery.Where(c => c.OtpStatus == "Confirmed" || c.OtpStatus == "Verified");
                }
                else
                {
                    baseQuery = baseQuery.Where(c => c.OtpStatus.ToLower() == status);
                }
            }

            // Date filtering
            if (query.StartDate.HasValue)
            {
                baseQuery = baseQuery.Where(c => c.SentAt >= query.StartDate.Value);
            }
            if (query.EndDate.HasValue)
            {
                baseQuery = baseQuery.Where(c => c.SentAt <= query.EndDate.Value);
            }

            int totalCount = await baseQuery.CountAsync(cancellationToken);

            // Sorting
            string sortBy = (query.SortBy ?? "requestDate").ToLowerInvariant();
            bool desc = string.Equals(query.SortOrder, "desc", StringComparison.OrdinalIgnoreCase);

            baseQuery = sortBy switch
            {
                "confirmationcode" => desc ? baseQuery.OrderByDescending(c => c.ConfirmationCode) : baseQuery.OrderBy(c => c.ConfirmationCode),
                "transactionid" => desc ? baseQuery.OrderByDescending(c => c.TransactionCode) : baseQuery.OrderBy(c => c.TransactionCode),
                "productname" => desc ? baseQuery.OrderByDescending(c => c.Product) : baseQuery.OrderBy(c => c.Product),
                "totalamount" => desc ? baseQuery.OrderByDescending(c => c.Amount) : baseQuery.OrderBy(c => c.Amount),
                "otpstatus" => desc ? baseQuery.OrderByDescending(c => c.OtpStatus) : baseQuery.OrderBy(c => c.OtpStatus),
                _ => desc ? baseQuery.OrderByDescending(c => c.SentAt) : baseQuery.OrderBy(c => c.SentAt)
            };

            int page = Math.Max(1, query.Page);
            int pageSize = Math.Clamp(query.PageSize, 1, 50);

            var items = await baseQuery
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync(cancellationToken);

            var vendorIds = items.Select(c => c.VendorId).Distinct().ToList();
            var vendorProfiles = await _context.VendorProfiles
                .AsNoTracking()
                .Where(vp => vp.VendorId.HasValue && vendorIds.Contains(vp.VendorId.Value))
                .Select(vp => new
                {
                    VendorId = vp.VendorId!.Value,
                    Name = !string.IsNullOrWhiteSpace(vp.BusinessName) ? vp.BusinessName : vp.OwnerName
                })
                .ToDictionaryAsync(
                    vp => vp.VendorId,
                    vp => vp.Name,
                    cancellationToken);

            var dtos = items.Select(c =>
            {
                string seller = vendorProfiles.TryGetValue(c.VendorId, out var name) ? name : $"Vendor #{c.VendorId}";
                decimal unitPrice = c.Quantity > 0 ? Math.Round(c.Amount / c.Quantity, 2) : c.Amount;

                return new CustomerConfirmationListDto
                {
                    Id = c.Id,
                    ConfirmationCode = c.ConfirmationCode ?? $"OTP-{c.Id:D4}",
                    OrderId = c.Sale?.OrderCode ?? $"ORD-{c.SaleId ?? c.Id:D4}",
                    TransactionId = c.TransactionCode,
                    ProductName = c.Product ?? "Agricultural Harvest",
                    Quantity = c.Quantity,
                    Unit = c.Unit ?? "Unit",
                    UnitPrice = unitPrice,
                    TotalAmount = c.Amount,
                    RequestDate = c.SentAt,
                    ExpiresAt = c.ExpiresAt,
                    OtpStatus = c.OtpStatus,
                    Attempts = c.Attempts,
                    SellerName = seller
                };
            }).ToList();

            return new CustomerConfirmationPagedDto
            {
                Items = dtos,
                Page = page,
                PageSize = pageSize,
                TotalCount = totalCount,
                TotalPages = (int)Math.Ceiling((double)totalCount / pageSize)
            };
        }

        public async Task<CustomerConfirmationDetailDto?> GetConfirmationByIdAsync(
            long customerUserId,
            string idOrCode,
            CancellationToken cancellationToken = default)
        {
            var entity = await FindConfirmationEntityAsync(customerUserId, idOrCode, cancellationToken);
            if (entity == null)
            {
                return null;
            }

            var vendorName = await _context.VendorProfiles
                .AsNoTracking()
                .Where(vp => vp.VendorId == entity.VendorId)
                .Select(vp => !string.IsNullOrWhiteSpace(vp.BusinessName) ? vp.BusinessName : vp.OwnerName)
                .FirstOrDefaultAsync(cancellationToken);

            string sellerName = !string.IsNullOrWhiteSpace(vendorName)
                ? vendorName
                : $"Vendor #{entity.VendorId}";

            decimal unitPrice = entity.Quantity > 0 ? Math.Round(entity.Amount / entity.Quantity, 2) : entity.Amount;

            var auditHistory = new List<CustomerConfirmationAuditDto>
            {
                new()
                {
                    Status = "Sent",
                    Timestamp = entity.SentAt,
                    Note = $"6-digit confirmation OTP dispatched for order {entity.Sale?.OrderCode ?? entity.TransactionCode}."
                }
            };

            if (entity.Attempts > 0)
            {
                auditHistory.Add(new()
                {
                    Status = entity.OtpStatus == "Failed" ? "Failed" : "Attempt Recorded",
                    Timestamp = entity.UpdatedAt,
                    Note = $"Verification attempted: {entity.Attempts}/3 attempts recorded."
                });
            }

            if (entity.ConfirmedAt.HasValue)
            {
                auditHistory.Add(new()
                {
                    Status = "Verified",
                    Timestamp = entity.ConfirmedAt.Value,
                    Note = "Customer successfully verified OTP. Purchase confirmed for dispatch."
                });
            }
            else if (string.Equals(entity.OtpStatus, "Rejected", StringComparison.OrdinalIgnoreCase))
            {
                auditHistory.Add(new()
                {
                    Status = "Rejected",
                    Timestamp = entity.UpdatedAt,
                    Note = $"Purchase declined by customer. Reason: {entity.Sale?.CancelReason ?? "Declined by customer"}."
                });
            }
            else if (string.Equals(entity.OtpStatus, "Expired", StringComparison.OrdinalIgnoreCase))
            {
                auditHistory.Add(new()
                {
                    Status = "Expired",
                    Timestamp = entity.ExpiresAt ?? entity.UpdatedAt,
                    Note = "OTP timer expired before customer verification was completed."
                });
            }

            return new CustomerConfirmationDetailDto
            {
                Id = entity.Id,
                ConfirmationCode = entity.ConfirmationCode ?? $"OTP-{entity.Id:D4}",
                OrderId = entity.Sale?.OrderCode ?? $"ORD-{entity.SaleId ?? entity.Id:D4}",
                TransactionId = entity.TransactionCode,
                ProductName = entity.Product ?? "Agricultural Harvest",
                Quantity = entity.Quantity,
                Unit = entity.Unit ?? "Unit",
                UnitPrice = unitPrice,
                TotalAmount = entity.Amount,
                RequestDate = entity.SentAt,
                ExpiresAt = entity.ExpiresAt,
                ConfirmedAt = entity.ConfirmedAt,
                OtpStatus = entity.OtpStatus,
                Attempts = entity.Attempts,
                MaxAttempts = 3,
                SellerName = sellerName,
                RejectionReason = entity.Sale?.CancelReason,
                AuditHistory = auditHistory
            };
        }

        public async Task<VpOtpConfirmation?> GetConfirmationEntityByIdAsync(
            long customerUserId,
            string idOrCode,
            CancellationToken cancellationToken = default)
        {
            return await FindConfirmationEntityAsync(customerUserId, idOrCode, cancellationToken);
        }

        public async Task<VpSale?> GetSaleByIdAsync(long saleId, CancellationToken cancellationToken = default)
        {
            return await _context.VpSales
                .FirstOrDefaultAsync(s => s.Id == saleId, cancellationToken);
        }

        public async Task UpdateConfirmationAsync(VpOtpConfirmation confirmation, CancellationToken cancellationToken = default)
        {
            confirmation.UpdatedAt = DateTime.UtcNow;
            _context.VpOtpConfirmations.Update(confirmation);
            await _context.SaveChangesAsync(cancellationToken);
        }

        public async Task UpdateSaleAsync(VpSale sale, CancellationToken cancellationToken = default)
        {
            sale.UpdatedAt = DateTime.UtcNow;
            _context.VpSales.Update(sale);
            await _context.SaveChangesAsync(cancellationToken);
        }

        public async Task AddNotificationAsync(CustomerNotification notification, CancellationToken cancellationToken = default)
        {
            _context.CustomerNotifications.Add(notification);
            await _context.SaveChangesAsync(cancellationToken);
        }

        private async Task<VpOtpConfirmation?> FindConfirmationEntityAsync(
            long customerUserId,
            string idOrCode,
            CancellationToken cancellationToken)
        {
            string customerCode = $"CUST-2026-{customerUserId:D4}";
            string trimmed = idOrCode.Trim();

            var query = _context.VpOtpConfirmations
                .Include(c => c.Sale)
                .Where(c => (c.Sale != null && c.Sale.CustomerUserId == customerUserId) ||
                            (c.PartyCategory == "Customer" && c.PartyCode == customerCode));

            if (long.TryParse(trimmed, out long numericId))
            {
                var match = await query.FirstOrDefaultAsync(c => c.Id == numericId, cancellationToken);
                if (match != null) return match;
            }

            return await query.FirstOrDefaultAsync(c =>
                c.ConfirmationCode == trimmed ||
                c.TransactionCode == trimmed ||
                (c.Sale != null && c.Sale.OrderCode == trimmed),
                cancellationToken);
        }

        private static TimeZoneInfo ResolveBusinessTimeZone()
        {
            try { return TimeZoneInfo.FindSystemTimeZoneById("India Standard Time"); }
            catch (Exception) { }
            try { return TimeZoneInfo.FindSystemTimeZoneById("Asia/Kolkata"); }
            catch (Exception) { }
            return TimeZoneInfo.CreateCustomTimeZone("IST_Fallback", TimeSpan.FromHours(5.5), "India Standard Time", "India Standard Time");
        }
    }
}

