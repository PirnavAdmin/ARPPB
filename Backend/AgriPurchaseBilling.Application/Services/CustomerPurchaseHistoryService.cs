using AgriPurchaseBilling.Application.DTOs;
using AgriPurchaseBilling.Application.Interfaces;

namespace AgriPurchaseBilling.Application.Services
{
    public class CustomerPurchaseHistoryService : ICustomerPurchaseHistoryService
    {
        private const int MaxPageSize = 100;

        private static readonly TimeZoneInfo BusinessTimeZone = ResolveBusinessTimeZone();

        private static readonly Dictionary<string, string> StatusNormalizationMap = new(StringComparer.OrdinalIgnoreCase)
        {
            ["all"] = "all",
            ["all status"] = "all",
            ["all_status"] = "all",
            ["confirmed"] = "confirmed",
            ["in_fulfilment"] = "in_fulfilment",
            ["in fulfilment"] = "in_fulfilment",
            ["infulfilment"] = "in_fulfilment",
            ["in_fulfillment"] = "in_fulfilment",
            ["in fulfillment"] = "in_fulfilment",
            ["completed"] = "completed"
        };

        private static readonly Dictionary<string, string> DatePresetNormalizationMap = new(StringComparer.OrdinalIgnoreCase)
        {
            ["all_time"] = "all_time",
            ["all time"] = "all_time",
            ["alltime"] = "all_time",
            ["last_7_days"] = "last_7_days",
            ["last 7 days"] = "last_7_days",
            ["last7days"] = "last_7_days",
            ["last_30_days"] = "last_30_days",
            ["last 30 days"] = "last_30_days",
            ["last30days"] = "last_30_days",
            ["this_month"] = "this_month",
            ["this month"] = "this_month",
            ["thismonth"] = "this_month",
            ["last_month"] = "last_month",
            ["last month"] = "last_month",
            ["lastmonth"] = "last_month",
            ["custom"] = "custom",
            ["custom_range"] = "custom",
            ["custom range"] = "custom"
        };

        private static readonly Dictionary<string, string> SortByAllowlist = new(StringComparer.OrdinalIgnoreCase)
        {
            ["transactionid"] = "transactionId",
            ["purchasedate"] = "purchaseDate",
            ["productname"] = "productName",
            ["quantity"] = "quantity",
            ["unitprice"] = "unitPrice",
            ["totalamount"] = "totalAmount"
        };

        private static readonly HashSet<string> AllowedSortOrders = new(StringComparer.OrdinalIgnoreCase)
        {
            "asc",
            "desc"
        };

        private readonly ICustomerPurchaseHistoryRepository _repository;

        public CustomerPurchaseHistoryService(ICustomerPurchaseHistoryRepository repository)
        {
            _repository = repository;
        }

        public async Task<ApiResponse<CustomerPurchaseHistoryPagedDto>> GetPurchaseHistoryAsync(
            long customerUserId,
            CustomerPurchaseHistoryQueryDto query,
            CancellationToken cancellationToken = default)
        {
            if (customerUserId <= 0)
            {
                return ApiResponse<CustomerPurchaseHistoryPagedDto>.Fail("Invalid authenticated customer identity.");
            }

            query ??= new CustomerPurchaseHistoryQueryDto();

            if (query.Page < 1)
            {
                return ApiResponse<CustomerPurchaseHistoryPagedDto>.Fail("Page must be greater than or equal to 1.");
            }

            if (query.PageSize < 1 || query.PageSize > MaxPageSize)
            {
                return ApiResponse<CustomerPurchaseHistoryPagedDto>.Fail($"PageSize must be between 1 and {MaxPageSize}.");
            }

            if (IsConcreteCategoryFilter(query.Category))
            {
                return ApiResponse<CustomerPurchaseHistoryPagedDto>.Fail(
                    "Category filtering is not yet supported because vp_sales and vp_sale_items do not have a category column.");
            }

            string? normalizedStatus = null;
            if (!string.IsNullOrWhiteSpace(query.Status))
            {
                string rawStatus = query.Status.Trim();
                if (!StatusNormalizationMap.TryGetValue(rawStatus, out string? mappedStatus))
                {
                    return ApiResponse<CustomerPurchaseHistoryPagedDto>.Fail(
                        "Invalid status value. Supported values are: all, confirmed, in_fulfilment, completed.");
                }

                normalizedStatus = mappedStatus == "all" ? null : mappedStatus;
            }

            string normalizedDatePreset = "all_time";
            if (!string.IsNullOrWhiteSpace(query.DatePreset))
            {
                string rawPreset = query.DatePreset.Trim();
                if (!DatePresetNormalizationMap.TryGetValue(rawPreset, out string? mappedPreset))
                {
                    return ApiResponse<CustomerPurchaseHistoryPagedDto>.Fail(
                        "Invalid datePreset value. Supported values are: all_time, last_7_days, last_30_days, this_month, last_month, custom.");
                }

                normalizedDatePreset = mappedPreset;
            }

            if (query.FromDate.HasValue && query.ToDate.HasValue && query.FromDate.Value.Date > query.ToDate.Value.Date)
            {
                return ApiResponse<CustomerPurchaseHistoryPagedDto>.Fail("fromDate cannot be greater than toDate.");
            }

            if (normalizedDatePreset == "custom" && !query.FromDate.HasValue && !query.ToDate.HasValue)
            {
                return ApiResponse<CustomerPurchaseHistoryPagedDto>.Fail(
                    "At least one of fromDate or toDate is required when datePreset is custom.");
            }

            string rawSortBy = string.IsNullOrWhiteSpace(query.SortBy) ? "purchaseDate" : query.SortBy.Trim();
            if (!SortByAllowlist.TryGetValue(rawSortBy, out string? normalizedSortBy))
            {
                return ApiResponse<CustomerPurchaseHistoryPagedDto>.Fail(
                    "Invalid sortBy value. Supported values are: transactionId, purchaseDate, productName, quantity, unitPrice, totalAmount.");
            }

            string normalizedSortOrder = string.IsNullOrWhiteSpace(query.SortOrder)
                ? "desc"
                : query.SortOrder.Trim().ToLowerInvariant();
            if (!AllowedSortOrders.Contains(normalizedSortOrder))
            {
                return ApiResponse<CustomerPurchaseHistoryPagedDto>.Fail(
                    "Invalid sortOrder value. Supported values are: asc, desc.");
            }

            DateTime todayBusinessDate = GetBusinessTodayDate(DateTime.UtcNow);
            var (effectiveFromDate, effectiveToDate) = ResolveDateRange(
                normalizedDatePreset,
                query.FromDate,
                query.ToDate,
                todayBusinessDate);

            var sanitizedQuery = new CustomerPurchaseHistoryQueryDto
            {
                Page = query.Page,
                PageSize = query.PageSize,
                Search = string.IsNullOrWhiteSpace(query.Search) ? null : query.Search.Trim(),
                Category = null,
                Status = normalizedStatus,
                DatePreset = normalizedDatePreset,
                FromDate = effectiveFromDate,
                ToDate = effectiveToDate,
                SortBy = normalizedSortBy,
                SortOrder = normalizedSortOrder
            };

            var result = await _repository.GetPurchaseHistoryAsync(
                customerUserId,
                sanitizedQuery,
                effectiveFromDate,
                effectiveToDate,
                cancellationToken);

            return ApiResponse<CustomerPurchaseHistoryPagedDto>.Ok(
                result,
                $"Retrieved {result.Items.Count} purchase history record(s) successfully.");
        }

        public async Task<ApiResponse<CustomerPurchaseSummaryDto>> GetPurchaseSummaryAsync(
            long customerUserId,
            CancellationToken cancellationToken = default)
        {
            if (customerUserId <= 0)
            {
                return ApiResponse<CustomerPurchaseSummaryDto>.Fail("Invalid authenticated customer identity.");
            }

            var summary = await _repository.GetPurchaseSummaryAsync(customerUserId, cancellationToken);
            return ApiResponse<CustomerPurchaseSummaryDto>.Ok(
                summary,
                "Customer purchase summary retrieved successfully.");
        }

        public async Task<ApiResponse<CustomerPurchaseDetailDto>> GetPurchaseByIdAsync(
            long customerUserId,
            long purchaseItemId,
            CancellationToken cancellationToken = default)
        {
            if (customerUserId <= 0)
            {
                return ApiResponse<CustomerPurchaseDetailDto>.Fail("Invalid authenticated customer identity.");
            }

            if (purchaseItemId <= 0)
            {
                return ApiResponse<CustomerPurchaseDetailDto>.Fail("Invalid purchase ID.");
            }

            var detail = await _repository.GetPurchaseByIdAsync(customerUserId, purchaseItemId, cancellationToken);
            if (detail == null)
            {
                return ApiResponse<CustomerPurchaseDetailDto>.Fail("Purchase record not found.");
            }

            return ApiResponse<CustomerPurchaseDetailDto>.Ok(
                detail,
                "Purchase details retrieved successfully.");
        }

        public static (DateTime? FromDate, DateTime? ToDate) ResolveDateRange(
            string normalizedPreset,
            DateTime? fromDate,
            DateTime? toDate,
            DateTime todayBusinessDate)
        {
            DateTime today = todayBusinessDate.Date;

            return normalizedPreset switch
            {
                "last_7_days" => (today.AddDays(-6), today),
                "last_30_days" => (today.AddDays(-29), today),
                "this_month" => (new DateTime(today.Year, today.Month, 1), today),
                "last_month" => (
                    new DateTime(today.Year, today.Month, 1).AddMonths(-1),
                    new DateTime(today.Year, today.Month, 1).AddDays(-1)),
                "custom" => (fromDate?.Date, toDate?.Date),
                _ => (fromDate?.Date, toDate?.Date)
            };
        }

        public static DateTime GetBusinessTodayDate(DateTime utcNow)
        {
            DateTime normalizedUtc = utcNow.Kind == DateTimeKind.Utc
                ? utcNow
                : DateTime.SpecifyKind(utcNow, DateTimeKind.Utc);
            return TimeZoneInfo.ConvertTimeFromUtc(normalizedUtc, BusinessTimeZone).Date;
        }

        private static bool IsConcreteCategoryFilter(string? category)
        {
            if (string.IsNullOrWhiteSpace(category)) return false;
            string trimmed = category.Trim();
            return !string.Equals(trimmed, "all", StringComparison.OrdinalIgnoreCase) &&
                   !string.Equals(trimmed, "all categories", StringComparison.OrdinalIgnoreCase);
        }

        private static TimeZoneInfo ResolveBusinessTimeZone()
        {
            foreach (string tzId in new[] { "Asia/Kolkata", "India Standard Time" })
            {
                try
                {
                    return TimeZoneInfo.FindSystemTimeZoneById(tzId);
                }
                catch (TimeZoneNotFoundException)
                {
                }
                catch (InvalidTimeZoneException)
                {
                }
            }

            return TimeZoneInfo.CreateCustomTimeZone(
                "Asia/Kolkata",
                TimeSpan.FromHours(5.5),
                "India Standard Time",
                "India Standard Time");
        }
    }
}

