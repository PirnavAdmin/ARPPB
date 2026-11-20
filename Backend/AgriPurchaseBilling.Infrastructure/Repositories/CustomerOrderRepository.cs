using AgriPurchaseBilling.Application.DTOs;
using AgriPurchaseBilling.Application.Interfaces;
using AgriPurchaseBilling.Domain.Entities;
using AgriPurchaseBilling.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace AgriPurchaseBilling.Infrastructure.Repositories
{
    /// <summary>
    /// Read-only repository executing order-level queries on vp_sales and vp_sale_items for Customer My Orders.
    /// Strictly scoped to the authenticated customer's user identity and excludes internal vendor drafts.
    /// </summary>
    public class CustomerOrderRepository : ICustomerOrderRepository
    {
        private readonly AppDbContext _context;

        public CustomerOrderRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<CustomerOrderPagedDto> GetOrdersAsync(
            long customerUserId,
            CustomerOrderQueryDto query,
            DateTime? effectiveFromDate,
            DateTime? effectiveToDate,
            string? normalizedStatus,
            string? normalizedCategory,
            string normalizedSortBy,
            bool isAsc,
            CancellationToken cancellationToken = default)
        {
            var baseQuery = _context.VpSales.AsNoTracking()
                .Where(s => s.CustomerUserId == customerUserId && s.OrderStatus.ToLower() != "draft");

            // Status filter
            if (!string.IsNullOrWhiteSpace(normalizedStatus) && normalizedStatus != "all")
            {
                if (normalizedStatus == "shipped")
                {
                    baseQuery = baseQuery.Where(s =>
                        s.OrderStatus.ToLower() == "shipped" ||
                        s.OrderStatus.ToLower() == "dispatched" ||
                        s.OrderStatus.ToLower() == "in transit" ||
                        s.OrderStatus.ToLower() == "out for delivery");
                }
                else
                {
                    baseQuery = baseQuery.Where(s => s.OrderStatus.ToLower() == normalizedStatus);
                }
            }

            // Date filtering
            if (effectiveFromDate.HasValue)
            {
                DateTime from = effectiveFromDate.Value.Date;
                baseQuery = baseQuery.Where(s => s.SaleDate >= from);
            }

            if (effectiveToDate.HasValue)
            {
                DateTime to = effectiveToDate.Value.Date;
                baseQuery = baseQuery.Where(s => s.SaleDate <= to);
            }

            // Category filter via item joined to vendor_finished_products
            if (!string.IsNullOrWhiteSpace(normalizedCategory) && normalizedCategory != "all")
            {
                baseQuery = baseQuery.Where(s => s.Items.Any(si =>
                    _context.VendorFinishedProducts.Any(p => p.Id == si.FinishedBatchId && p.Category.ToLower() == normalizedCategory)));
            }

            // Search filter
            if (!string.IsNullOrWhiteSpace(query.Search))
            {
                string term = query.Search.Trim().ToLower();
                baseQuery = baseQuery.Where(s =>
                    s.OrderCode.ToLower().Contains(term) ||
                    s.SaleCode.ToLower().Contains(term) ||
                    (s.Notes != null && s.Notes.ToLower().Contains(term)) ||
                    s.Items.Any(si =>
                        si.ProductName.ToLower().Contains(term) ||
                        si.BatchCode.ToLower().Contains(term) ||
                        (si.ProcessingBatchRef != null && si.ProcessingBatchRef.ToLower().Contains(term))));
            }

            int totalCount = await baseQuery.CountAsync(cancellationToken);
            int totalPages = totalCount == 0
                ? 0
                : (int)Math.Ceiling(totalCount / (double)query.PageSize);

            if (totalCount == 0 || (query.Page - 1) * query.PageSize >= totalCount)
            {
                return new CustomerOrderPagedDto
                {
                    Items = new List<CustomerOrderListDto>(),
                    Page = query.Page,
                    PageSize = query.PageSize,
                    TotalCount = totalCount,
                    TotalPages = totalPages,
                    HasNextPage = false,
                    HasPreviousPage = query.Page > 1 && totalCount > 0
                };
            }

            // Order sorting
            IQueryable<VpSale> ordered = (normalizedSortBy, isAsc) switch
            {
                ("ordercode", true) => baseQuery.OrderBy(s => s.OrderCode).ThenBy(s => s.Id),
                ("ordercode", false) => baseQuery.OrderByDescending(s => s.OrderCode).ThenByDescending(s => s.Id),
                ("totalamount", true) => baseQuery.OrderBy(s => s.TotalAmount).ThenBy(s => s.Id),
                ("totalamount", false) => baseQuery.OrderByDescending(s => s.TotalAmount).ThenByDescending(s => s.Id),
                ("orderstatus", true) => baseQuery.OrderBy(s => s.OrderStatus).ThenBy(s => s.Id),
                ("orderstatus", false) => baseQuery.OrderByDescending(s => s.OrderStatus).ThenByDescending(s => s.Id),
                ("orderdate", true) => baseQuery.OrderBy(s => s.SaleDate).ThenBy(s => s.CreatedAt).ThenBy(s => s.Id),
                _ => baseQuery.OrderByDescending(s => s.SaleDate).ThenByDescending(s => s.CreatedAt).ThenByDescending(s => s.Id)
            };

            var sales = await ordered
                .Include(s => s.Items)
                .Skip((query.Page - 1) * query.PageSize)
                .Take(query.PageSize)
                .ToListAsync(cancellationToken);

            // Fetch categories for all products present in the page's order items
            var batchIds = sales
                .SelectMany(s => s.Items)
                .Select(i => i.FinishedBatchId)
                .Distinct()
                .ToList();

            var categoryMap = await _context.VendorFinishedProducts.AsNoTracking()
                .Where(p => batchIds.Contains(p.Id))
                .ToDictionaryAsync(p => p.Id, p => p.Category, cancellationToken);

            var items = sales.Select(s =>
            {
                var firstItem = s.Items.FirstOrDefault();
                string productName = firstItem?.ProductName ?? "Agricultural Crop";
                if (s.Items.Count > 1)
                {
                    productName += $" (+{s.Items.Count - 1} more)";
                }

                string? category = null;
                if (firstItem != null && categoryMap.TryGetValue(firstItem.FinishedBatchId, out string? cat))
                {
                    category = cat;
                }

                decimal totalQty = s.Items.Sum(i => i.Quantity);
                string unit = firstItem?.Unit ?? string.Empty;

                return new CustomerOrderListDto
                {
                    Id = s.Id,
                    OrderId = s.OrderCode,
                    TransactionId = string.IsNullOrWhiteSpace(s.SaleCode) ? null : s.SaleCode,
                    OrderDate = s.SaleDate,
                    Product = productName,
                    Category = category,
                    Quantity = totalQty,
                    Unit = unit,
                    TotalAmount = s.TotalAmount,
                    OrderStatus = s.OrderStatus,
                    ExpectedDeliveryDate = s.ExpectedDeliveryDate,
                    ExpectedPaymentDate = s.ExpectedPaymentDate,
                    BatchReference = firstItem?.BatchCode
                };
            }).ToList();

            return new CustomerOrderPagedDto
            {
                Items = items,
                Page = query.Page,
                PageSize = query.PageSize,
                TotalCount = totalCount,
                TotalPages = totalPages,
                HasNextPage = query.Page < totalPages,
                HasPreviousPage = query.Page > 1
            };
        }

        public async Task<CustomerOrderDetailDto?> GetOrderByIdAsync(
            long customerUserId,
            string orderIdentifier,
            CancellationToken cancellationToken = default)
        {
            if (string.IsNullOrWhiteSpace(orderIdentifier))
            {
                return null;
            }

            string cleanId = orderIdentifier.Trim().ToLowerInvariant();
            bool isNumeric = long.TryParse(cleanId, out long numericId);

            var sale = await _context.VpSales.AsNoTracking()
                .Include(s => s.Items)
                .FirstOrDefaultAsync(s =>
                    s.CustomerUserId == customerUserId &&
                    s.OrderStatus.ToLower() != "draft" &&
                    ((isNumeric && s.Id == numericId) || s.OrderCode.ToLower() == cleanId),
                    cancellationToken);

            if (sale == null)
            {
                return null;
            }

            // Vendor / Seller Information
            var vendorProfile = await _context.VendorProfiles.AsNoTracking()
                .FirstOrDefaultAsync(vp => vp.VendorId == sale.VendorId, cancellationToken);

            var vendor = await _context.Vendors.AsNoTracking()
                .FirstOrDefaultAsync(v => v.Id == sale.VendorId, cancellationToken);

            string? sellerName = null;
            if (vendorProfile != null && !string.IsNullOrWhiteSpace(vendorProfile.BusinessName) && vendorProfile.BusinessName != "string")
            {
                sellerName = vendorProfile.BusinessName;
            }
            else if (vendorProfile != null && !string.IsNullOrWhiteSpace(vendorProfile.OwnerName) && vendorProfile.OwnerName != "string")
            {
                sellerName = vendorProfile.OwnerName;
            }
            else if (vendor != null)
            {
                sellerName = vendor.VendorCode;
            }

            string? sellerDistrict = vendorProfile?.District;
            string? sellerState = vendorProfile?.State;

            // Categories lookup for items
            var batchIds = sale.Items.Select(i => i.FinishedBatchId).Distinct().ToList();
            var productCategories = await _context.VendorFinishedProducts.AsNoTracking()
                .Where(p => batchIds.Contains(p.Id))
                .ToDictionaryAsync(p => p.Id, p => p.Category, cancellationToken);

            var firstItem = sale.Items.FirstOrDefault();
            string primaryProduct = firstItem?.ProductName ?? "Agricultural Crop";
            string? primaryCategory = null;
            if (firstItem != null && productCategories.TryGetValue(firstItem.FinishedBatchId, out string? cat))
            {
                primaryCategory = cat;
            }

            var lineItems = sale.Items.Select(i => new CustomerOrderItemDto
            {
                Id = i.Id,
                FinishedBatchId = i.FinishedBatchId,
                ProductName = i.ProductName,
                Category = productCategories.TryGetValue(i.FinishedBatchId, out string? c) ? c : null,
                BatchCode = string.IsNullOrWhiteSpace(i.BatchCode) ? i.ProcessingBatchRef : i.BatchCode,
                Quantity = i.Quantity,
                Unit = i.Unit,
                UnitPrice = i.PricePerUnit,
                LineTotal = i.LineTotal
            }).ToList();

            // Timeline derived strictly from real database timestamps (not fabricated)
            var timeline = new List<CustomerOrderTimelineDto>
            {
                new()
                {
                    Status = "New",
                    Timestamp = sale.CreatedAt.ToString("yyyy-MM-dd HH:mm:ss"),
                    Note = "Order placed and logged in system."
                }
            };

            if (!string.Equals(sale.OrderStatus, "New", StringComparison.OrdinalIgnoreCase) &&
                !string.Equals(sale.OrderStatus, "Draft", StringComparison.OrdinalIgnoreCase))
            {
                timeline.Add(new()
                {
                    Status = sale.OrderStatus,
                    Timestamp = sale.UpdatedAt.ToString("yyyy-MM-dd HH:mm:ss"),
                    Note = $"Order status progressed to {sale.OrderStatus}."
                });
            }

            if (sale.DeliveredAt.HasValue)
            {
                timeline.Add(new()
                {
                    Status = "Delivered",
                    Timestamp = sale.DeliveredAt.Value.ToString("yyyy-MM-dd HH:mm:ss"),
                    Note = "Order delivered to destination."
                });
            }

            return new CustomerOrderDetailDto
            {
                Id = sale.Id,
                OrderId = sale.OrderCode,
                TransactionId = string.IsNullOrWhiteSpace(sale.SaleCode) ? null : sale.SaleCode,
                OrderDate = sale.SaleDate,
                OrderStatus = sale.OrderStatus,
                ExpectedDeliveryDate = sale.ExpectedDeliveryDate,
                ExpectedPaymentDate = sale.ExpectedPaymentDate,
                TotalAmount = sale.TotalAmount,
                DeliveryAddress = sale.DeliveryAddress,
                CancellationReason = sale.CancelReason,
                SellerName = sellerName,
                Product = primaryProduct,
                Category = primaryCategory,
                BatchReference = firstItem?.BatchCode ?? firstItem?.ProcessingBatchRef,
                Quantity = sale.Items.Sum(i => i.Quantity),
                Unit = firstItem?.Unit ?? string.Empty,
                UnitPrice = firstItem?.PricePerUnit ?? 0m,
                Timeline = timeline
            };
        }
    }
}

