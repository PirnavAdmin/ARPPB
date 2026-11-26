using AgriPurchaseBilling.Application.DTOs;
using AgriPurchaseBilling.Application.Interfaces;
using AgriPurchaseBilling.Application.Security;
using AgriPurchaseBilling.Domain.Entities;
using Microsoft.Extensions.Hosting;

namespace AgriPurchaseBilling.Application.Services
{
    public class CustomerCartService : ICustomerCartService
    {
        private const decimal LowStockThreshold = 20m;
        private static readonly TimeZoneInfo BusinessTimeZone = ResolveBusinessTimeZone();
        private static readonly System.Collections.Concurrent.ConcurrentDictionary<long, SemaphoreSlim> _customerLocks = new();
        private static readonly System.Collections.Concurrent.ConcurrentDictionary<string, (DateTime Timestamp, CustomerCheckoutResultDto Result)> _idempotencyCache = new();

        private readonly ICustomerCartRepository _repository;
        private readonly IHostEnvironment _environment;

        public CustomerCartService(ICustomerCartRepository repository, IHostEnvironment environment)
        {
            _repository = repository;
            _environment = environment;
        }

        public async Task<ApiResponse<CustomerCartDto>> GetCartAsync(long customerUserId, CancellationToken cancellationToken = default)
        {
            if (customerUserId <= 0)
            {
                return ApiResponse<CustomerCartDto>.Fail("Invalid authenticated customer identity.");
            }

            var cartDto = await BuildCartDtoAsync(customerUserId, cancellationToken);
            return ApiResponse<CustomerCartDto>.Ok(cartDto, "Cart retrieved successfully.");
        }

        public async Task<ApiResponse<CustomerCartDto>> AddToCartAsync(
            long customerUserId,
            AddToCartRequestDto request,
            CancellationToken cancellationToken = default)
        {
            if (customerUserId <= 0)
            {
                return ApiResponse<CustomerCartDto>.Fail("Invalid authenticated customer identity.");
            }

            if (request == null)
            {
                return ApiResponse<CustomerCartDto>.Fail("Request payload is required.");
            }

            if (request.ProductId <= 0)
            {
                return ApiResponse<CustomerCartDto>.Fail("ProductId must be greater than zero.");
            }

            if (request.Quantity <= 0)
            {
                return ApiResponse<CustomerCartDto>.Fail("Quantity must be greater than zero.");
            }

            var product = await _repository.GetProductByIdAsync(request.ProductId, cancellationToken);
            if (product == null)
            {
                return ApiResponse<CustomerCartDto>.Fail("Product not found.");
            }

            if (!string.Equals(product.Status, "Active", StringComparison.OrdinalIgnoreCase))
            {
                return ApiResponse<CustomerCartDto>.Fail("Product is currently inactive and cannot be added to cart.");
            }

            DateTime todayBusinessDate = GetBusinessTodayDate(DateTime.UtcNow);
            if (product.ExpiryDate.Date < todayBusinessDate)
            {
                return ApiResponse<CustomerCartDto>.Fail("Product has expired and cannot be added to cart.");
            }

            if (product.AvailableQuantity <= 0)
            {
                return ApiResponse<CustomerCartDto>.Fail("Product is currently out of stock.");
            }

            var existingItem = await _repository.GetCartItemByProductAsync(customerUserId, request.ProductId, cancellationToken);
            if (existingItem != null)
            {
                decimal proposedQuantity = existingItem.Quantity + request.Quantity;
                if (proposedQuantity > product.AvailableQuantity)
                {
                    return ApiResponse<CustomerCartDto>.Fail(
                        $"Requested total quantity ({proposedQuantity} {product.Unit}) exceeds available stock ({product.AvailableQuantity} {product.Unit}). Already in cart: {existingItem.Quantity} {product.Unit}.");
                }

                existingItem.Quantity = proposedQuantity;
                existingItem.UpdatedAt = DateTime.UtcNow;
                await _repository.UpdateItemAsync(existingItem, cancellationToken);
            }
            else
            {
                if (request.Quantity > product.AvailableQuantity)
                {
                    return ApiResponse<CustomerCartDto>.Fail(
                        $"Requested quantity ({request.Quantity} {product.Unit}) exceeds available stock ({product.AvailableQuantity} {product.Unit}).");
                }

                var newItem = new CustomerCartItem
                {
                    CustomerUserId = customerUserId,
                    ProductId = request.ProductId,
                    Quantity = request.Quantity,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                await _repository.AddItemAsync(newItem, cancellationToken);
            }

            var updatedCart = await BuildCartDtoAsync(customerUserId, cancellationToken);
            return ApiResponse<CustomerCartDto>.Ok(updatedCart, "Product added to cart successfully.");
        }

        public async Task<ApiResponse<CustomerCartDto>> UpdateQuantityAsync(
            long customerUserId,
            long cartItemId,
            UpdateCartItemRequestDto request,
            CancellationToken cancellationToken = default)
        {
            if (customerUserId <= 0)
            {
                return ApiResponse<CustomerCartDto>.Fail("Invalid authenticated customer identity.");
            }

            if (cartItemId <= 0)
            {
                return ApiResponse<CustomerCartDto>.Fail("Invalid cart item ID.");
            }

            if (request == null || request.Quantity <= 0)
            {
                return ApiResponse<CustomerCartDto>.Fail("Quantity must be greater than zero.");
            }

            var cartItem = await _repository.GetCartItemByIdAsync(customerUserId, cartItemId, cancellationToken);
            if (cartItem == null)
            {
                return ApiResponse<CustomerCartDto>.Fail("Cart item not found.");
            }

            var product = cartItem.Product ?? await _repository.GetProductByIdAsync(cartItem.ProductId, cancellationToken);
            if (product == null)
            {
                return ApiResponse<CustomerCartDto>.Fail("Associated product not found.");
            }

            if (!string.Equals(product.Status, "Active", StringComparison.OrdinalIgnoreCase))
            {
                return ApiResponse<CustomerCartDto>.Fail("Product is currently inactive.");
            }

            DateTime todayBusinessDate = GetBusinessTodayDate(DateTime.UtcNow);
            if (product.ExpiryDate.Date < todayBusinessDate)
            {
                return ApiResponse<CustomerCartDto>.Fail("Product has expired.");
            }

            if (request.Quantity > product.AvailableQuantity)
            {
                return ApiResponse<CustomerCartDto>.Fail(
                    $"Requested quantity ({request.Quantity} {product.Unit}) exceeds available stock ({product.AvailableQuantity} {product.Unit}).");
            }

            cartItem.Quantity = request.Quantity;
            cartItem.UpdatedAt = DateTime.UtcNow;
            await _repository.UpdateItemAsync(cartItem, cancellationToken);

            var updatedCart = await BuildCartDtoAsync(customerUserId, cancellationToken);
            return ApiResponse<CustomerCartDto>.Ok(updatedCart, "Cart item quantity updated successfully.");
        }

        public async Task<ApiResponse<CustomerCartDto>> RemoveItemAsync(
            long customerUserId,
            long cartItemId,
            CancellationToken cancellationToken = default)
        {
            if (customerUserId <= 0)
            {
                return ApiResponse<CustomerCartDto>.Fail("Invalid authenticated customer identity.");
            }

            if (cartItemId <= 0)
            {
                return ApiResponse<CustomerCartDto>.Fail("Invalid cart item ID.");
            }

            var cartItem = await _repository.GetCartItemByIdAsync(customerUserId, cartItemId, cancellationToken);
            if (cartItem == null)
            {
                return ApiResponse<CustomerCartDto>.Fail("Cart item not found.");
            }

            await _repository.DeleteItemAsync(cartItem, cancellationToken);

            var updatedCart = await BuildCartDtoAsync(customerUserId, cancellationToken);
            return ApiResponse<CustomerCartDto>.Ok(updatedCart, "Item removed from cart successfully.");
        }

        public async Task<ApiResponse<CustomerCartDto>> ClearCartAsync(long customerUserId, CancellationToken cancellationToken = default)
        {
            if (customerUserId <= 0)
            {
                return ApiResponse<CustomerCartDto>.Fail("Invalid authenticated customer identity.");
            }

            int deletedCount = await _repository.ClearCartAsync(customerUserId, cancellationToken);

            var emptyCart = new CustomerCartDto
            {
                TotalItems = 0,
                TotalQuantity = 0m,
                ItemsSubtotal = 0m,
                CartTotal = 0m,
                HasUnavailableItems = false,
                Items = new List<CustomerCartItemDto>()
            };

            return ApiResponse<CustomerCartDto>.Ok(emptyCart, $"Cart cleared successfully ({deletedCount} item(s) removed).");
        }

        public async Task<ApiResponse<CustomerCheckoutResultDto>> CheckoutAsync(
            long customerUserId,
            CustomerCheckoutRequestDto request,
            CancellationToken cancellationToken = default)
        {
            if (customerUserId <= 0)
            {
                return ApiResponse<CustomerCheckoutResultDto>.Fail("Invalid authenticated customer identity.");
            }

            // 1. In-flight checkout locking to prevent double-submission / race conditions
            var semaphore = _customerLocks.GetOrAdd(customerUserId, _ => new SemaphoreSlim(1, 1));
            bool acquired = await semaphore.WaitAsync(0, cancellationToken);
            if (!acquired)
            {
                return ApiResponse<CustomerCheckoutResultDto>.Fail("A checkout transaction is currently in progress for your account. Please wait.");
            }

            try
            {
                // 2. Idempotency cache check
                if (!string.IsNullOrWhiteSpace(request?.IdempotencyKey))
                {
                    string cacheKey = $"{customerUserId}:{request.IdempotencyKey.Trim()}";
                    if (_idempotencyCache.TryGetValue(cacheKey, out var cached) &&
                        (DateTime.UtcNow - cached.Timestamp).TotalMinutes < 10)
                    {
                        return ApiResponse<CustomerCheckoutResultDto>.Ok(cached.Result, "Checkout already processed (idempotent submission).");
                    }
                }

                // 3. Fetch Cart Items
                var cartItems = await _repository.GetCartItemsAsync(customerUserId, cancellationToken);
                if (cartItems.Count == 0)
                {
                    return ApiResponse<CustomerCheckoutResultDto>.Fail("Cart is empty. Add products to cart before checkout.");
                }

                // 4. Fetch fresh product details from catalogue (never trust frontend or cached prices)
                var productIds = cartItems.Select(c => c.ProductId).Distinct().ToList();
                var products = await _repository.GetProductsByIdsAsync(productIds, cancellationToken);
                var productDict = products.ToDictionary(p => p.Id);

                DateTime todayBusinessDate = GetBusinessTodayDate(DateTime.UtcNow);

                // 5. Validate products, status, expiry, and stock
                foreach (var item in cartItems)
                {
                    if (!productDict.TryGetValue(item.ProductId, out var product))
                    {
                        return ApiResponse<CustomerCheckoutResultDto>.Fail($"Product ID {item.ProductId} is no longer available in the catalogue.");
                    }

                    if (item.Quantity <= 0)
                    {
                        return ApiResponse<CustomerCheckoutResultDto>.Fail($"Invalid quantity ({item.Quantity}) for product '{product.ProductName}'.");
                    }

                    if (!string.Equals(product.Status, "Active", StringComparison.OrdinalIgnoreCase))
                    {
                        return ApiResponse<CustomerCheckoutResultDto>.Fail($"Product '{product.ProductName}' is no longer active.");
                    }

                    if (product.ExpiryDate.Date < todayBusinessDate)
                    {
                        return ApiResponse<CustomerCheckoutResultDto>.Fail($"Product '{product.ProductName}' has expired and cannot be ordered.");
                    }

                    if (product.AvailableQuantity <= 0)
                    {
                        return ApiResponse<CustomerCheckoutResultDto>.Fail($"Product '{product.ProductName}' is currently out of stock.");
                    }

                    if (item.Quantity > product.AvailableQuantity)
                    {
                        return ApiResponse<CustomerCheckoutResultDto>.Fail(
                            $"Insufficient stock for product '{product.ProductName}'. Available: {product.AvailableQuantity} {product.Unit}, Requested: {item.Quantity} {product.Unit}.");
                    }
                }

                // 6. Delivery Address Resolution and Ownership Validation
                string formattedAddress = string.Empty;
                string customerDistrict = string.Empty;
                string customerState = string.Empty;

                if (request?.DeliveryAddressId.HasValue == true && request.DeliveryAddressId.Value > 0)
                {
                    var savedAddr = await _repository.GetDeliveryAddressByIdAsync(request.DeliveryAddressId.Value, customerUserId, cancellationToken);
                    if (savedAddr == null)
                    {
                        return ApiResponse<CustomerCheckoutResultDto>.Fail("Selected delivery address does not exist or does not belong to you.");
                    }

                    formattedAddress = $"{savedAddr.FullAddress}, {savedAddr.District}, {savedAddr.State} - {savedAddr.PinCode}".Trim();
                    customerDistrict = savedAddr.District;
                    customerState = savedAddr.State;
                }
                else if (!string.IsNullOrWhiteSpace(request?.DeliveryAddress))
                {
                    formattedAddress = request.DeliveryAddress.Trim();
                    var profile = await _repository.GetCustomerProfileAsync(customerUserId, cancellationToken);
                    if (profile != null)
                    {
                        customerDistrict = profile.District;
                        customerState = profile.State;
                    }
                }
                else
                {
                    var defaultAddr = await _repository.GetDefaultDeliveryAddressAsync(customerUserId, cancellationToken);
                    if (defaultAddr != null)
                    {
                        formattedAddress = $"{defaultAddr.FullAddress}, {defaultAddr.District}, {defaultAddr.State} - {defaultAddr.PinCode}".Trim();
                        customerDistrict = defaultAddr.District;
                        customerState = defaultAddr.State;
                    }
                    else
                    {
                        var profile = await _repository.GetCustomerProfileAsync(customerUserId, cancellationToken);
                        if (profile != null && !string.IsNullOrWhiteSpace(profile.Address))
                        {
                            formattedAddress = $"{profile.Address}, {profile.District}, {profile.State} - {profile.PinCode}".Trim();
                            customerDistrict = profile.District;
                            customerState = profile.State;
                        }
                    }
                }

                if (string.IsNullOrWhiteSpace(formattedAddress))
                {
                    return ApiResponse<CustomerCheckoutResultDto>.Fail("Delivery address is required for checkout.");
                }

                // 7. Customer User Information
                var user = await _repository.GetUserByIdAsync(customerUserId, cancellationToken);
                string customerName = !string.IsNullOrWhiteSpace(user?.FullName) ? user.FullName : $"Customer #{customerUserId}";
                string customerCode = $"CUST-2026-{customerUserId:D4}";
                string? customerMobile = user?.Mobile;
                string? customerEmail = user?.Email;

                // 8. Group cart items by vendor (multi-vendor order creation)
                var vendorGroups = cartItems
                    .GroupBy(c => productDict[c.ProductId].VendorId)
                    .ToList();

                var vendorIds = vendorGroups.Select(g => g.Key).ToList();
                var vendorNames = await _repository.GetVendorNamesAsync(vendorIds, cancellationToken);

                var ordersToInsert = new List<VpSale>();
                var confirmationsToInsert = new List<VpOtpConfirmation>();
                var notificationsToInsert = new List<CustomerNotification>();
                var orderSummaryDtos = new List<CustomerOrderSummaryDto>();
                var checkoutOtpDtos = new List<CustomerCheckoutOtpDto>();

                for (int i = 0; i < vendorGroups.Count; i++)
                {
                    var group = vendorGroups[i];
                    long vendorId = group.Key;
                    string sellerName = vendorNames.TryGetValue(vendorId, out var vn) ? vn : $"Vendor #{vendorId}";

                    string orderCode = await _repository.GetNextOrderCodeAsync(i, cancellationToken);
                    string saleCode = await _repository.GetNextSaleCodeAsync(i, cancellationToken);
                    string confirmationCode = await _repository.GetNextConfirmationCodeAsync(i, cancellationToken);

                    // Generate 6-digit mock OTP and PBKDF2 hash using existing OtpSecurityHelper
                    string mockOtp = OtpSecurityHelper.Generate6DigitOtp();
                    string otpHash = OtpSecurityHelper.HashOtp(mockOtp);

                    decimal itemsSubtotal = 0m;
                    var saleItems = new List<VpSaleItem>();
                    var itemDtos = new List<CustomerOrderItemDto>();

                    foreach (var cartItem in group)
                    {
                        var product = productDict[cartItem.ProductId];
                        decimal pricePerUnit = product.SellingPrice; // Strictly database catalog price
                        decimal lineTotal = Math.Round(cartItem.Quantity * pricePerUnit, 2, MidpointRounding.AwayFromZero);
                        itemsSubtotal += lineTotal;

                        var saleItem = new VpSaleItem
                        {
                            FinishedBatchId = product.Id,
                            ProductName = product.ProductName,
                            BatchCode = product.ProductCode,
                            ProcessingBatchRef = "CUSTOMER-ORDER",
                            Quantity = cartItem.Quantity,
                            Unit = product.Unit,
                            PricePerUnit = pricePerUnit,
                            CostPerUnit = product.ProductionCost,
                            LineTotal = lineTotal
                        };
                        saleItems.Add(saleItem);

                        itemDtos.Add(new CustomerOrderItemDto
                        {
                            Id = 0,
                            FinishedBatchId = product.Id,
                            ProductName = product.ProductName,
                            Category = product.Category,
                            BatchCode = product.ProductCode,
                            Quantity = cartItem.Quantity,
                            Unit = product.Unit,
                            PricePerUnit = pricePerUnit,
                            UnitPrice = pricePerUnit,
                            LineTotal = lineTotal
                        });
                    }

                    decimal totalAmount = itemsSubtotal; // Standard order total

                    var sale = new VpSale
                    {
                        VendorId = vendorId,
                        SaleCode = saleCode,
                        OrderCode = orderCode,
                        CustomerUserId = customerUserId,
                        CustomerCode = customerCode,
                        CustomerName = customerName,
                        CustomerMobile = customerMobile,
                        CustomerEmail = customerEmail,
                        CustomerDistrict = customerDistrict,
                        CustomerState = customerState,
                        DeliveryAddress = formattedAddress,
                        ItemsSubtotal = itemsSubtotal,
                        DiscountAmount = 0m,
                        TaxAmount = 0m,
                        OtherCharges = 0m,
                        TotalAmount = totalAmount,
                        AmountReceived = 0m,
                        SaleDate = todayBusinessDate,
                        ExpectedDeliveryDate = todayBusinessDate.AddDays(4),
                        ExpectedPaymentDate = todayBusinessDate.AddDays(15),
                        PaymentTerms = !string.IsNullOrWhiteSpace(request?.PaymentTerms) ? request.PaymentTerms : "Net 15 Days",
                        Notes = !string.IsNullOrWhiteSpace(request?.Notes) ? request.Notes : "Order placed via Customer Cart checkout.",
                        OtpStatus = "Pending",
                        PaymentStatus = "Unpaid",
                        OrderStatus = "New",
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow,
                        Items = saleItems
                    };

                    ordersToInsert.Add(sale);

                    string productSummary = string.Join(", ", saleItems.Select(s => s.ProductName));
                    if (productSummary.Length > 240)
                    {
                        productSummary = productSummary.Substring(0, 237) + "...";
                    }

                    var confirmation = new VpOtpConfirmation
                    {
                        VendorId = vendorId,
                        ConfirmationCode = confirmationCode,
                        TransactionCode = saleCode,
                        PartyCategory = "Customer",
                        PartyName = customerName,
                        PartyCode = customerCode,
                        Mobile = customerMobile,
                        TransactionType = "Sale",
                        Product = productSummary,
                        Quantity = saleItems.Sum(s => s.Quantity),
                        Unit = saleItems.FirstOrDefault()?.Unit ?? "Unit",
                        Amount = totalAmount,
                        OtpHash = otpHash,
                        OtpStatus = "Pending",
                        Attempts = 0,
                        SentAt = DateTime.UtcNow,
                        ExpiresAt = DateTime.UtcNow.AddMinutes(10),
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow,
                        Sale = sale
                    };

                    confirmationsToInsert.Add(confirmation);

                    notificationsToInsert.Add(new CustomerNotification
                    {
                        CustomerUserId = customerUserId,
                        Title = $"Order {orderCode} Placed",
                        Message = $"Your order {orderCode} for {saleItems.Count} product(s) (₹{totalAmount:N2}) has been placed. Status: New, Awaiting OTP Confirmation.",
                        Type = "Order Created",
                        Priority = "Medium",
                        OrderCode = orderCode,
                        TransactionCode = saleCode,
                        IsRead = false,
                        CreatedAt = DateTime.UtcNow
                    });

                    orderSummaryDtos.Add(new CustomerOrderSummaryDto
                    {
                        Id = 0,
                        OrderId = orderCode,
                        TransactionId = saleCode,
                        VendorId = vendorId,
                        SellerName = sellerName,
                        OrderDate = todayBusinessDate,
                        OrderStatus = "New",
                        PaymentStatus = "Unpaid",
                        OtpStatus = "Pending",
                        OtpId = confirmationCode,
                        DemoOtpCode = _environment.IsDevelopment() ? mockOtp : null,
                        DeliveryAddress = formattedAddress,
                        ExpectedDeliveryDate = todayBusinessDate.AddDays(4),
                        ExpectedPaymentDate = todayBusinessDate.AddDays(15),
                        ItemsSubtotal = itemsSubtotal,
                        TotalAmount = totalAmount,
                        ItemCount = saleItems.Count,
                        Items = itemDtos
                    });

                    checkoutOtpDtos.Add(new CustomerCheckoutOtpDto
                    {
                        ConfirmationId = 0,
                        ConfirmationCode = confirmationCode,
                        OrderId = orderCode,
                        TransactionId = saleCode,
                        SellerName = sellerName,
                        ProductName = productSummary,
                        Quantity = saleItems.Sum(s => s.Quantity),
                        Unit = saleItems.FirstOrDefault()?.Unit ?? "Unit",
                        TotalAmount = totalAmount,
                        OtpStatus = "Pending",
                        DemoOtpCode = _environment.IsDevelopment() ? mockOtp : null,
                        ExpiresAt = confirmation.ExpiresAt!.Value
                    });
                }

                // 9. Stock deductions map
                var stockDeltas = cartItems
                    .GroupBy(c => c.ProductId)
                    .ToDictionary(g => g.Key, g => g.Sum(c => c.Quantity));

                // 10. Execute Transaction in Repository
                var createdOrders = await _repository.ExecuteCheckoutTransactionAsync(
                    customerUserId,
                    ordersToInsert,
                    confirmationsToInsert,
                    notificationsToInsert,
                    stockDeltas,
                    cancellationToken);

                // Update returned DTOs with auto-generated database IDs
                for (int i = 0; i < createdOrders.Count && i < orderSummaryDtos.Count; i++)
                {
                    orderSummaryDtos[i].Id = createdOrders[i].Id;
                }
                for (int i = 0; i < confirmationsToInsert.Count && i < checkoutOtpDtos.Count; i++)
                {
                    checkoutOtpDtos[i].ConfirmationId = confirmationsToInsert[i].Id;
                }

                decimal grandTotal = orderSummaryDtos.Sum(o => o.TotalAmount);
                var resultDto = new CustomerCheckoutResultDto
                {
                    Orders = orderSummaryDtos,
                    Otps = checkoutOtpDtos,
                    TotalOrdersCreated = orderSummaryDtos.Count,
                    TotalAmount = grandTotal,
                    Message = $"{orderSummaryDtos.Count} order(s) placed successfully. Please confirm via OTP Confirmations."
                };

                // Cache for idempotency if key provided
                if (!string.IsNullOrWhiteSpace(request?.IdempotencyKey))
                {
                    string cacheKey = $"{customerUserId}:{request.IdempotencyKey.Trim()}";
                    _idempotencyCache[cacheKey] = (DateTime.UtcNow, resultDto);
                }

                var response = ApiResponse<CustomerCheckoutResultDto>.Ok(resultDto, "Checkout completed successfully.");
                if (_environment.IsDevelopment() && checkoutOtpDtos.Any())
                {
                    response.DevOtp = checkoutOtpDtos.First().DemoOtpCode;
                }
                return response;
            }
            catch (Exception ex)
            {
                return ApiResponse<CustomerCheckoutResultDto>.Fail($"Checkout failed: {ex.Message}");
            }
            finally
            {
                semaphore.Release();
            }
        }

        private async Task<CustomerCartDto> BuildCartDtoAsync(long customerUserId, CancellationToken cancellationToken)
        {
            var cartItems = await _repository.GetCartItemsAsync(customerUserId, cancellationToken);
            DateTime todayBusinessDate = GetBusinessTodayDate(DateTime.UtcNow);

            var itemDtos = new List<CustomerCartItemDto>();
            bool hasUnavailable = false;

            foreach (var item in cartItems)
            {
                var prod = item.Product;
                decimal unitPrice = prod?.SellingPrice ?? 0m;
                decimal lineTotal = Math.Round(item.Quantity * unitPrice, 2, MidpointRounding.AwayFromZero);
                decimal stock = prod?.AvailableQuantity ?? 0m;

                bool isProductActive = prod != null && string.Equals(prod.Status, "Active", StringComparison.OrdinalIgnoreCase);
                bool isProductUnexpired = prod != null && prod.ExpiryDate.Date >= todayBusinessDate;
                bool isStockSufficient = stock >= item.Quantity && stock > 0;
                bool isAvailable = isProductActive && isProductUnexpired && isStockSufficient;

                if (!isAvailable)
                {
                    hasUnavailable = true;
                }

                string stockStatus;
                if (stock <= 0m)
                {
                    stockStatus = "out_of_stock";
                }
                else if (stock <= LowStockThreshold)
                {
                    stockStatus = "low_stock";
                }
                else
                {
                    stockStatus = "in_stock";
                }

                itemDtos.Add(new CustomerCartItemDto
                {
                    CartItemId = item.Id,
                    ProductId = item.ProductId,
                    ProductCode = prod?.ProductCode ?? string.Empty,
                    ProductName = prod?.ProductName ?? string.Empty,
                    Category = prod?.Category ?? string.Empty,
                    Unit = prod?.Unit ?? string.Empty,
                    UnitPrice = unitPrice,
                    Quantity = item.Quantity,
                    LineTotal = lineTotal,
                    AvailableStock = stock,
                    StockStatus = stockStatus,
                    IsAvailable = isAvailable,
                    ImageUrl = prod?.ImageUrl,
                    VendorId = prod?.VendorId ?? 0
                });
            }

            decimal itemsSubtotal = Math.Round(itemDtos.Sum(x => x.LineTotal), 2, MidpointRounding.AwayFromZero);
            decimal totalQuantity = Math.Round(itemDtos.Sum(x => x.Quantity), 2, MidpointRounding.AwayFromZero);

            return new CustomerCartDto
            {
                TotalItems = itemDtos.Count,
                TotalQuantity = totalQuantity,
                ItemsSubtotal = itemsSubtotal,
                CartTotal = itemsSubtotal,
                HasUnavailableItems = hasUnavailable,
                Items = itemDtos
            };
        }

        private static DateTime GetBusinessTodayDate(DateTime utcNow)
        {
            return TimeZoneInfo.ConvertTimeFromUtc(utcNow, BusinessTimeZone).Date;
        }

        private static TimeZoneInfo ResolveBusinessTimeZone()
        {
            try
            {
                return TimeZoneInfo.FindSystemTimeZoneById("India Standard Time");
            }
            catch (TimeZoneNotFoundException)
            {
            }
            catch (InvalidTimeZoneException)
            {
            }

            try
            {
                return TimeZoneInfo.FindSystemTimeZoneById("Asia/Kolkata");
            }
            catch (TimeZoneNotFoundException)
            {
            }
            catch (InvalidTimeZoneException)
            {
            }

            return TimeZoneInfo.CreateCustomTimeZone(
                "IST_Fallback",
                TimeSpan.FromHours(5.5),
                "India Standard Time",
                "India Standard Time");
        }
    }
}

