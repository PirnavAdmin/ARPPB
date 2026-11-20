using AgriPurchaseBilling.Application.Interfaces;
using AgriPurchaseBilling.Domain.Entities;
using AgriPurchaseBilling.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace AgriPurchaseBilling.Infrastructure.Repositories
{
    public class CustomerCartRepository : ICustomerCartRepository
    {
        private readonly AppDbContext _context;

        public CustomerCartRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<List<CustomerCartItem>> GetCartItemsAsync(long customerUserId, CancellationToken cancellationToken = default)
        {
            return await _context.CustomerCartItems
                .AsNoTracking()
                .Include(c => c.Product)
                .Where(c => c.CustomerUserId == customerUserId)
                .OrderBy(c => c.CreatedAt)
                .ThenBy(c => c.Id)
                .ToListAsync(cancellationToken);
        }

        public async Task<CustomerCartItem?> GetCartItemByIdAsync(long customerUserId, long cartItemId, CancellationToken cancellationToken = default)
        {
            return await _context.CustomerCartItems
                .Include(c => c.Product)
                .FirstOrDefaultAsync(c => c.Id == cartItemId && c.CustomerUserId == customerUserId, cancellationToken);
        }

        public async Task<CustomerCartItem?> GetCartItemByProductAsync(long customerUserId, long productId, CancellationToken cancellationToken = default)
        {
            return await _context.CustomerCartItems
                .Include(c => c.Product)
                .FirstOrDefaultAsync(c => c.CustomerUserId == customerUserId && c.ProductId == productId, cancellationToken);
        }

        public async Task<VendorFinishedProduct?> GetProductByIdAsync(long productId, CancellationToken cancellationToken = default)
        {
            return await _context.VendorFinishedProducts
                .AsNoTracking()
                .FirstOrDefaultAsync(p => p.Id == productId, cancellationToken);
        }

        public async Task<CustomerCartItem> AddItemAsync(CustomerCartItem cartItem, CancellationToken cancellationToken = default)
        {
            _context.CustomerCartItems.Add(cartItem);
            await _context.SaveChangesAsync(cancellationToken);
            return cartItem;
        }

        public async Task UpdateItemAsync(CustomerCartItem cartItem, CancellationToken cancellationToken = default)
        {
            _context.CustomerCartItems.Update(cartItem);
            await _context.SaveChangesAsync(cancellationToken);
        }

        public async Task DeleteItemAsync(CustomerCartItem cartItem, CancellationToken cancellationToken = default)
        {
            _context.CustomerCartItems.Remove(cartItem);
            await _context.SaveChangesAsync(cancellationToken);
        }

        public async Task<int> ClearCartAsync(long customerUserId, CancellationToken cancellationToken = default)
        {
            var items = await _context.CustomerCartItems
                .Where(c => c.CustomerUserId == customerUserId)
                .ToListAsync(cancellationToken);

            if (items.Count == 0)
            {
                return 0;
            }

            _context.CustomerCartItems.RemoveRange(items);
            return await _context.SaveChangesAsync(cancellationToken);
        }

        public async Task<CustomerDeliveryAddressEntity?> GetDeliveryAddressByIdAsync(long addressId, long customerUserId, CancellationToken cancellationToken = default)
        {
            return await _context.CustomerDeliveryAddresses
                .AsNoTracking()
                .FirstOrDefaultAsync(a => a.Id == addressId && a.UserId == customerUserId, cancellationToken);
        }

        public async Task<CustomerDeliveryAddressEntity?> GetDefaultDeliveryAddressAsync(long customerUserId, CancellationToken cancellationToken = default)
        {
            return await _context.CustomerDeliveryAddresses
                .AsNoTracking()
                .Where(a => a.UserId == customerUserId)
                .OrderByDescending(a => a.IsDefault)
                .ThenByDescending(a => a.Id)
                .FirstOrDefaultAsync(cancellationToken);
        }

        public async Task<CustomerProfileEntity?> GetCustomerProfileAsync(long customerUserId, CancellationToken cancellationToken = default)
        {
            return await _context.CustomerProfiles
                .AsNoTracking()
                .FirstOrDefaultAsync(p => p.UserId == customerUserId, cancellationToken);
        }

        public async Task<User?> GetUserByIdAsync(long customerUserId, CancellationToken cancellationToken = default)
        {
            return await _context.Users
                .AsNoTracking()
                .FirstOrDefaultAsync(u => u.Id == customerUserId, cancellationToken);
        }

        public async Task<List<VendorFinishedProduct>> GetProductsByIdsAsync(IEnumerable<long> productIds, CancellationToken cancellationToken = default)
        {
            var ids = productIds.Distinct().ToList();
            return await _context.VendorFinishedProducts
                .AsNoTracking()
                .Where(p => ids.Contains(p.Id))
                .ToListAsync(cancellationToken);
        }

        public async Task<string> GetNextOrderCodeAsync(int offset = 0, CancellationToken cancellationToken = default)
        {
            var existingCodes = await _context.VpSales
                .AsNoTracking()
                .Select(s => s.OrderCode)
                .ToListAsync(cancellationToken);

            int maxSeq = 0;
            foreach (var code in existingCodes)
            {
                if (code != null && code.StartsWith("ORD-", StringComparison.OrdinalIgnoreCase))
                {
                    var parts = code.Split('-');
                    if (parts.Length > 1 && int.TryParse(parts[parts.Length - 1], out int num))
                    {
                        if (num > maxSeq) maxSeq = num;
                    }
                }
            }

            int next = maxSeq + 1 + offset;
            string candidate = $"ORD-{next:D4}";
            while (existingCodes.Contains(candidate, StringComparer.OrdinalIgnoreCase))
            {
                next++;
                candidate = $"ORD-{next:D4}";
            }
            return candidate;
        }

        public async Task<string> GetNextSaleCodeAsync(int offset = 0, CancellationToken cancellationToken = default)
        {
            var existingCodes = await _context.VpSales
                .AsNoTracking()
                .Select(s => s.SaleCode)
                .ToListAsync(cancellationToken);

            int maxSeq = 0;
            foreach (var code in existingCodes)
            {
                if (code != null && code.StartsWith("SALE-", StringComparison.OrdinalIgnoreCase))
                {
                    var parts = code.Split('-');
                    if (parts.Length > 1 && int.TryParse(parts[parts.Length - 1], out int num))
                    {
                        if (num > maxSeq) maxSeq = num;
                    }
                }
            }

            int next = maxSeq + 1 + offset;
            string candidate = $"SALE-{next:D4}";
            while (existingCodes.Contains(candidate, StringComparer.OrdinalIgnoreCase))
            {
                next++;
                candidate = $"SALE-{next:D4}";
            }
            return candidate;
        }

        public async Task<string> GetNextConfirmationCodeAsync(int offset = 0, CancellationToken cancellationToken = default)
        {
            var existingCodes = await _context.VpOtpConfirmations
                .AsNoTracking()
                .Select(c => c.ConfirmationCode)
                .ToListAsync(cancellationToken);

            int maxSeq = 0;
            foreach (var code in existingCodes)
            {
                if (code != null && code.StartsWith("OTP-", StringComparison.OrdinalIgnoreCase))
                {
                    var parts = code.Split('-');
                    if (parts.Length > 1 && int.TryParse(parts[parts.Length - 1], out int num))
                    {
                        if (num > maxSeq) maxSeq = num;
                    }
                }
            }

            int next = maxSeq + 1 + offset;
            string candidate = $"OTP-{next:D4}";
            while (existingCodes.Contains(candidate, StringComparer.OrdinalIgnoreCase))
            {
                next++;
                candidate = $"OTP-{next:D4}";
            }
            return candidate;
        }

        public async Task<Dictionary<long, string>> GetVendorNamesAsync(IEnumerable<long> vendorIds, CancellationToken cancellationToken = default)
        {
            var distinctIds = vendorIds.Distinct().ToList();
            var profiles = await _context.VendorProfiles
                .AsNoTracking()
                .Where(vp => vp.VendorId.HasValue && distinctIds.Contains(vp.VendorId.Value))
                .ToDictionaryAsync(
                    vp => vp.VendorId!.Value,
                    vp => !string.IsNullOrWhiteSpace(vp.BusinessName) ? vp.BusinessName : vp.OwnerName,
                    cancellationToken);

            foreach (var id in distinctIds)
            {
                if (!profiles.ContainsKey(id))
                {
                    profiles[id] = $"Vendor #{id}";
                }
            }

            return profiles;
        }

        public async Task<List<VpSale>> ExecuteCheckoutTransactionAsync(
            long customerUserId,
            List<VpSale> orders,
            List<VpOtpConfirmation> confirmations,
            List<CustomerNotification> notifications,
            Dictionary<long, decimal> stockDeltas,
            CancellationToken cancellationToken = default)
        {
            bool isRelational = _context.Database.IsRelational();
            if (isRelational)
            {
                var strategy = _context.Database.CreateExecutionStrategy();
                return await strategy.ExecuteAsync(async () =>
                {
                    using var tx = await _context.Database.BeginTransactionAsync(cancellationToken);
                    try
                    {
                        await ApplyCheckoutChangesAsync(customerUserId, orders, confirmations, notifications, stockDeltas, cancellationToken);
                        await tx.CommitAsync(cancellationToken);
                        return orders;
                    }
                    catch
                    {
                        await tx.RollbackAsync(cancellationToken);
                        throw;
                    }
                });
            }
            else
            {
                await ApplyCheckoutChangesAsync(customerUserId, orders, confirmations, notifications, stockDeltas, cancellationToken);
                return orders;
            }
        }

        private async Task ApplyCheckoutChangesAsync(
            long customerUserId,
            List<VpSale> orders,
            List<VpOtpConfirmation> confirmations,
            List<CustomerNotification> notifications,
            Dictionary<long, decimal> stockDeltas,
            CancellationToken cancellationToken)
        {
            // 1. Decrement product stock in vendor_finished_products
            var productIds = stockDeltas.Keys.ToList();
            var products = await _context.VendorFinishedProducts
                .Where(p => productIds.Contains(p.Id))
                .ToListAsync(cancellationToken);

            foreach (var product in products)
            {
                if (stockDeltas.TryGetValue(product.Id, out decimal qtyDeduction))
                {
                    if (product.AvailableQuantity < qtyDeduction)
                    {
                        throw new InvalidOperationException(
                            $"Insufficient stock for product '{product.ProductName}'. Available: {product.AvailableQuantity} {product.Unit}, Requested: {qtyDeduction} {product.Unit}.");
                    }
                    product.AvailableQuantity -= qtyDeduction;
                    product.SoldQuantity += qtyDeduction;
                    product.UpdatedAt = DateTime.UtcNow;
                }
            }

            // 2. Insert orders and items
            foreach (var order in orders)
            {
                _context.VpSales.Add(order);
            }

            // 3. Insert OTP confirmations
            if (confirmations.Count > 0)
            {
                _context.VpOtpConfirmations.AddRange(confirmations);
            }

            // 4. Insert customer notifications
            if (notifications.Count > 0)
            {
                _context.CustomerNotifications.AddRange(notifications);
            }

            // 5. Clear customer cart
            var cartItems = await _context.CustomerCartItems
                .Where(c => c.CustomerUserId == customerUserId)
                .ToListAsync(cancellationToken);

            if (cartItems.Count > 0)
            {
                _context.CustomerCartItems.RemoveRange(cartItems);
            }

            await _context.SaveChangesAsync(cancellationToken);
        }
    }
}

