using AgriPurchaseBilling.Application.DTOs;
using AgriPurchaseBilling.Application.Interfaces;
using AgriPurchaseBilling.Application.Security;
using AgriPurchaseBilling.Domain.Entities;
using Microsoft.Extensions.Hosting;

namespace AgriPurchaseBilling.Application.Services
{
    public class CustomerOtpService : ICustomerOtpService
    {
        private const int MaxAllowedAttempts = 3;
        private const int ResendCooldownSeconds = 30;
        private static readonly TimeZoneInfo BusinessTimeZone = ResolveBusinessTimeZone();

        private static readonly HashSet<string> AllowedSortFields = new(StringComparer.OrdinalIgnoreCase)
        {
            "requestdate", "transactionid", "productname", "totalamount", "otpstatus", "confirmationcode"
        };

        private static readonly HashSet<string> AllowedSortOrders = new(StringComparer.OrdinalIgnoreCase)
        {
            "asc", "desc"
        };

        private static readonly HashSet<string> AllowedStatuses = new(StringComparer.OrdinalIgnoreCase)
        {
            "all", "all orders", "pending", "sent", "verified", "confirmed", "expired", "failed", "rejected"
        };

        private readonly ICustomerOtpRepository _repository;
        private readonly IHostEnvironment _environment;

        public CustomerOtpService(ICustomerOtpRepository repository, IHostEnvironment environment)
        {
            _repository = repository;
            _environment = environment;
        }

        public async Task<ApiResponse<CustomerConfirmationPagedDto>> GetConfirmationsAsync(
            long customerUserId,
            CustomerConfirmationQueryDto query,
            CancellationToken cancellationToken = default)
        {
            if (customerUserId <= 0)
            {
                return ApiResponse<CustomerConfirmationPagedDto>.Fail("Invalid authenticated customer identity.");
            }

            if (query.Page < 1)
            {
                return ApiResponse<CustomerConfirmationPagedDto>.Fail("Page must be greater than or equal to 1.");
            }

            if (query.PageSize < 1 || query.PageSize > 100)
            {
                return ApiResponse<CustomerConfirmationPagedDto>.Fail("PageSize must be between 1 and 100.");
            }

            if (!string.IsNullOrWhiteSpace(query.Status) && !AllowedStatuses.Contains(query.Status.Trim()))
            {
                return ApiResponse<CustomerConfirmationPagedDto>.Fail($"Invalid status filter '{query.Status}'.");
            }

            if (!string.IsNullOrWhiteSpace(query.SortBy) && !AllowedSortFields.Contains(query.SortBy.Trim()))
            {
                return ApiResponse<CustomerConfirmationPagedDto>.Fail($"Invalid sortBy field '{query.SortBy}'.");
            }

            if (!string.IsNullOrWhiteSpace(query.SortOrder) && !AllowedSortOrders.Contains(query.SortOrder.Trim()))
            {
                return ApiResponse<CustomerConfirmationPagedDto>.Fail($"Invalid sortOrder '{query.SortOrder}'. Must be 'asc' or 'desc'.");
            }

            // Calculate date preset ranges
            var dateError = ApplyDatePreset(query);
            if (dateError != null)
            {
                return ApiResponse<CustomerConfirmationPagedDto>.Fail(dateError);
            }

            var paged = await _repository.GetConfirmationsAsync(customerUserId, query, cancellationToken);
            return ApiResponse<CustomerConfirmationPagedDto>.Ok(paged, "Customer confirmations retrieved successfully.");
        }

        public async Task<ApiResponse<CustomerConfirmationDetailDto>> GetConfirmationByIdAsync(
            long customerUserId,
            string idOrCode,
            CancellationToken cancellationToken = default)
        {
            if (customerUserId <= 0)
            {
                return ApiResponse<CustomerConfirmationDetailDto>.Fail("Invalid authenticated customer identity.");
            }

            if (string.IsNullOrWhiteSpace(idOrCode))
            {
                return ApiResponse<CustomerConfirmationDetailDto>.Fail("Confirmation identifier cannot be empty.");
            }

            var detail = await _repository.GetConfirmationByIdAsync(customerUserId, idOrCode, cancellationToken);
            if (detail == null)
            {
                return ApiResponse<CustomerConfirmationDetailDto>.Fail("Confirmation request not found or not owned by you.");
            }

            return ApiResponse<CustomerConfirmationDetailDto>.Ok(detail, "Confirmation details retrieved successfully.");
        }

        public async Task<ApiResponse<CustomerConfirmationDetailDto>> VerifyOtpAsync(
            long customerUserId,
            string idOrCode,
            CustomerVerifyOtpRequestDto request,
            CancellationToken cancellationToken = default)
        {
            if (customerUserId <= 0)
            {
                return ApiResponse<CustomerConfirmationDetailDto>.Fail("Invalid authenticated customer identity.");
            }

            if (string.IsNullOrWhiteSpace(idOrCode))
            {
                return ApiResponse<CustomerConfirmationDetailDto>.Fail("Confirmation identifier cannot be empty.");
            }

            if (request == null || string.IsNullOrWhiteSpace(request.OtpCode))
            {
                return ApiResponse<CustomerConfirmationDetailDto>.Fail("Please enter a valid 6-digit numeric OTP.");
            }

            string cleanOtp = request.OtpCode.Trim();
            if (cleanOtp.Length != 6 || !cleanOtp.All(char.IsDigit))
            {
                return ApiResponse<CustomerConfirmationDetailDto>.Fail("Please enter a valid 6-digit numeric OTP.");
            }

            var entity = await _repository.GetConfirmationEntityByIdAsync(customerUserId, idOrCode, cancellationToken);
            if (entity == null)
            {
                return ApiResponse<CustomerConfirmationDetailDto>.Fail("Confirmation request not found or not owned by you.");
            }

            // Status checks
            if (string.Equals(entity.OtpStatus, "Verified", StringComparison.OrdinalIgnoreCase) ||
                string.Equals(entity.OtpStatus, "Confirmed", StringComparison.OrdinalIgnoreCase))
            {
                return ApiResponse<CustomerConfirmationDetailDto>.Fail("This transaction has already been verified and confirmed.");
            }

            if (string.Equals(entity.OtpStatus, "Rejected", StringComparison.OrdinalIgnoreCase))
            {
                return ApiResponse<CustomerConfirmationDetailDto>.Fail("This transaction was rejected and can no longer be verified.");
            }

            if (entity.Attempts >= MaxAllowedAttempts || string.Equals(entity.OtpStatus, "Failed", StringComparison.OrdinalIgnoreCase))
            {
                return ApiResponse<CustomerConfirmationDetailDto>.Fail("Maximum verification attempts (3) exceeded. Please click Resend OTP for a fresh code.");
            }

            if (entity.ExpiresAt.HasValue && entity.ExpiresAt.Value < DateTime.UtcNow)
            {
                entity.OtpStatus = "Expired";
                await _repository.UpdateConfirmationAsync(entity, cancellationToken);
                return ApiResponse<CustomerConfirmationDetailDto>.Fail("This OTP has expired. Please click Resend OTP to request a fresh code.");
            }

            // Cryptographic constant-time verification
            bool isValid = OtpSecurityHelper.VerifyOtp(cleanOtp, entity.OtpHash ?? string.Empty);
            if (!isValid)
            {
                entity.Attempts += 1;
                if (entity.Attempts >= MaxAllowedAttempts)
                {
                    entity.OtpStatus = "Failed";
                }
                await _repository.UpdateConfirmationAsync(entity, cancellationToken);

                int remaining = Math.Max(0, MaxAllowedAttempts - entity.Attempts);
                string failMsg = remaining == 0
                    ? "Incorrect OTP. Maximum 3 attempts reached. Please click Resend OTP for a fresh code."
                    : $"Incorrect OTP. {remaining} attempt{(remaining == 1 ? "" : "s")} remaining.";

                return ApiResponse<CustomerConfirmationDetailDto>.Fail(failMsg);
            }

            // OTP verified successfully!
            entity.OtpStatus = "Verified";
            entity.ConfirmedAt = DateTime.UtcNow;
            await _repository.UpdateConfirmationAsync(entity, cancellationToken);

            // Progress linked sale
            if (entity.SaleId.HasValue)
            {
                var sale = await _repository.GetSaleByIdAsync(entity.SaleId.Value, cancellationToken);
                if (sale != null)
                {
                    sale.OtpStatus = "Verified";
                    if (string.Equals(sale.OrderStatus, "New", StringComparison.OrdinalIgnoreCase))
                    {
                        sale.OrderStatus = "Confirmed";
                    }
                    await _repository.UpdateSaleAsync(sale, cancellationToken);
                }
            }

            // Insert notification
            await _repository.AddNotificationAsync(new CustomerNotification
            {
                CustomerUserId = customerUserId,
                Title = $"Purchase Confirmed: {entity.TransactionCode}",
                Message = "Transaction Confirmed Successfully! Your purchase has been authorized and confirmed for dispatch.",
                Type = "Purchase Confirmed",
                Priority = "Medium",
                OrderCode = entity.Sale?.OrderCode,
                TransactionCode = entity.TransactionCode,
                IsRead = false,
                CreatedAt = DateTime.UtcNow
            }, cancellationToken);

            var updatedDetail = await _repository.GetConfirmationByIdAsync(customerUserId, idOrCode, cancellationToken);
            return ApiResponse<CustomerConfirmationDetailDto>.Ok(updatedDetail!, "Transaction Confirmed Successfully!");
        }

        public async Task<ApiResponse<CustomerConfirmationDetailDto>> ResendOtpAsync(
            long customerUserId,
            string idOrCode,
            CancellationToken cancellationToken = default)
        {
            if (customerUserId <= 0)
            {
                return ApiResponse<CustomerConfirmationDetailDto>.Fail("Invalid authenticated customer identity.");
            }

            if (string.IsNullOrWhiteSpace(idOrCode))
            {
                return ApiResponse<CustomerConfirmationDetailDto>.Fail("Confirmation identifier cannot be empty.");
            }

            var entity = await _repository.GetConfirmationEntityByIdAsync(customerUserId, idOrCode, cancellationToken);
            if (entity == null)
            {
                return ApiResponse<CustomerConfirmationDetailDto>.Fail("Confirmation request not found or not owned by you.");
            }

            if (string.Equals(entity.OtpStatus, "Verified", StringComparison.OrdinalIgnoreCase) ||
                string.Equals(entity.OtpStatus, "Confirmed", StringComparison.OrdinalIgnoreCase))
            {
                return ApiResponse<CustomerConfirmationDetailDto>.Fail("Cannot resend OTP for an order that is already verified.");
            }

            if (string.Equals(entity.OtpStatus, "Rejected", StringComparison.OrdinalIgnoreCase))
            {
                return ApiResponse<CustomerConfirmationDetailDto>.Fail("Cannot resend OTP for a rejected order.");
            }

            // Enforce cooldown (30 seconds from SentAt)
            var elapsedSeconds = (DateTime.UtcNow - entity.SentAt).TotalSeconds;
            if (elapsedSeconds < ResendCooldownSeconds)
            {
                int remainingSeconds = ResendCooldownSeconds - (int)elapsedSeconds;
                return ApiResponse<CustomerConfirmationDetailDto>.Fail(
                    $"Please wait {remainingSeconds} second{(remainingSeconds == 1 ? "" : "s")} before requesting a new OTP.");
            }

            // Generate cryptographically secure OTP & hash
            string newOtp = OtpSecurityHelper.Generate6DigitOtp();
            string newHash = OtpSecurityHelper.HashOtp(newOtp);

            entity.OtpHash = newHash;
            entity.Attempts = 0;
            entity.SentAt = DateTime.UtcNow;
            entity.ExpiresAt = DateTime.UtcNow.AddMinutes(10);
            entity.OtpStatus = "Pending";

            await _repository.UpdateConfirmationAsync(entity, cancellationToken);

            // Add notification
            await _repository.AddNotificationAsync(new CustomerNotification
            {
                CustomerUserId = customerUserId,
                Title = $"New OTP Issued: {entity.TransactionCode}",
                Message = "A fresh 6-digit confirmation code has been dispatched. Timer reset to 10 minutes.",
                Type = "OTP Resent",
                Priority = "High",
                OrderCode = entity.Sale?.OrderCode,
                TransactionCode = entity.TransactionCode,
                IsRead = false,
                CreatedAt = DateTime.UtcNow
            }, cancellationToken);

            var updatedDetail = await _repository.GetConfirmationByIdAsync(customerUserId, idOrCode, cancellationToken);
            if (updatedDetail != null && _environment.IsDevelopment())
            {
                updatedDetail.DemoOtpCode = newOtp;
            }

            var response = ApiResponse<CustomerConfirmationDetailDto>.Ok(updatedDetail!, "Fresh OTP issued successfully.");
            if (_environment.IsDevelopment())
            {
                response.DevOtp = newOtp;
            }
            return response;
        }

        public async Task<ApiResponse<CustomerConfirmationDetailDto>> RejectOtpAsync(
            long customerUserId,
            string idOrCode,
            CustomerRejectOtpRequestDto request,
            CancellationToken cancellationToken = default)
        {
            if (customerUserId <= 0)
            {
                return ApiResponse<CustomerConfirmationDetailDto>.Fail("Invalid authenticated customer identity.");
            }

            if (string.IsNullOrWhiteSpace(idOrCode))
            {
                return ApiResponse<CustomerConfirmationDetailDto>.Fail("Confirmation identifier cannot be empty.");
            }

            var entity = await _repository.GetConfirmationEntityByIdAsync(customerUserId, idOrCode, cancellationToken);
            if (entity == null)
            {
                return ApiResponse<CustomerConfirmationDetailDto>.Fail("Confirmation request not found or not owned by you.");
            }

            if (string.Equals(entity.OtpStatus, "Verified", StringComparison.OrdinalIgnoreCase) ||
                string.Equals(entity.OtpStatus, "Confirmed", StringComparison.OrdinalIgnoreCase))
            {
                return ApiResponse<CustomerConfirmationDetailDto>.Fail("Cannot reject an order that has already been verified and confirmed.");
            }

            if (string.Equals(entity.OtpStatus, "Rejected", StringComparison.OrdinalIgnoreCase))
            {
                return ApiResponse<CustomerConfirmationDetailDto>.Fail("This transaction has already been rejected.");
            }

            string reason = !string.IsNullOrWhiteSpace(request?.RejectionReason)
                ? request.RejectionReason.Trim()
                : "Declined by customer";

            entity.OtpStatus = "Rejected";
            await _repository.UpdateConfirmationAsync(entity, cancellationToken);

            // Cancel linked sale
            if (entity.SaleId.HasValue)
            {
                var sale = await _repository.GetSaleByIdAsync(entity.SaleId.Value, cancellationToken);
                if (sale != null)
                {
                    sale.OrderStatus = "Cancelled";
                    sale.CancelReason = reason;
                    sale.OtpStatus = "Rejected";
                    await _repository.UpdateSaleAsync(sale, cancellationToken);
                }
            }

            // Insert notification
            await _repository.AddNotificationAsync(new CustomerNotification
            {
                CustomerUserId = customerUserId,
                Title = $"Purchase Declined: {entity.TransactionCode}",
                Message = $"Purchase was declined. Reason: {reason}",
                Type = "Order Cancelled",
                Priority = "Medium",
                OrderCode = entity.Sale?.OrderCode,
                TransactionCode = entity.TransactionCode,
                IsRead = false,
                CreatedAt = DateTime.UtcNow
            }, cancellationToken);

            var updatedDetail = await _repository.GetConfirmationByIdAsync(customerUserId, idOrCode, cancellationToken);
            return ApiResponse<CustomerConfirmationDetailDto>.Ok(updatedDetail!, "Transaction rejected successfully.");
        }

        private static string? ApplyDatePreset(CustomerConfirmationQueryDto query)
        {
            string preset = (query.DatePreset ?? "all").Trim().ToLowerInvariant();
            if (preset == "all" || string.IsNullOrEmpty(preset))
            {
                return null;
            }

            DateTime nowBusiness = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, BusinessTimeZone);
            DateTime today = nowBusiness.Date;

            switch (preset)
            {
                case "today":
                    query.StartDate = ConvertToUtc(today);
                    query.EndDate = ConvertToUtc(today.AddDays(1).AddTicks(-1));
                    break;
                case "last7":
                case "last_7_days":
                    query.StartDate = ConvertToUtc(today.AddDays(-6));
                    query.EndDate = ConvertToUtc(today.AddDays(1).AddTicks(-1));
                    break;
                case "last30":
                case "last_30_days":
                    query.StartDate = ConvertToUtc(today.AddDays(-29));
                    query.EndDate = ConvertToUtc(today.AddDays(1).AddTicks(-1));
                    break;
                case "this_month":
                    DateTime startOfMonth = new(today.Year, today.Month, 1);
                    query.StartDate = ConvertToUtc(startOfMonth);
                    query.EndDate = ConvertToUtc(today.AddDays(1).AddTicks(-1));
                    break;
                case "last_month":
                    DateTime firstOfThisMonth = new(today.Year, today.Month, 1);
                    DateTime lastMonthEnd = firstOfThisMonth.AddDays(-1);
                    DateTime lastMonthStart = new(lastMonthEnd.Year, lastMonthEnd.Month, 1);
                    query.StartDate = ConvertToUtc(lastMonthStart);
                    query.EndDate = ConvertToUtc(lastMonthEnd.AddDays(1).AddTicks(-1));
                    break;
                case "custom":
                    if (!query.StartDate.HasValue || !query.EndDate.HasValue)
                    {
                        return "Both StartDate and EndDate are required when datePreset is 'custom'.";
                    }
                    if (query.StartDate.Value > query.EndDate.Value)
                    {
                        return "StartDate cannot be later than EndDate.";
                    }
                    query.StartDate = ConvertToUtc(query.StartDate.Value.Date);
                    query.EndDate = ConvertToUtc(query.EndDate.Value.Date.AddDays(1).AddTicks(-1));
                    break;
                default:
                    return $"Invalid datePreset '{query.DatePreset}'.";
            }

            return null;
        }

        private static DateTime ConvertToUtc(DateTime businessDateTime)
        {
            return TimeZoneInfo.ConvertTimeToUtc(businessDateTime, BusinessTimeZone);
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

