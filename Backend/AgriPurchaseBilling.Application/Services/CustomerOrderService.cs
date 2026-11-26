using AgriPurchaseBilling.Application.DTOs;
using AgriPurchaseBilling.Application.Interfaces;

namespace AgriPurchaseBilling.Application.Services
{
    public class CustomerOrderService : ICustomerOrderService
    {
        private const int MaxPageSize = 100;

        private static readonly HashSet<string> AllowedSortOrders = new(StringComparer.OrdinalIgnoreCase)
        {
            "asc",
            "desc"
        };

        private static readonly Dictionary<string, string> SortByAllowlist = new(StringComparer.OrdinalIgnoreCase)
        {
            ["orderdate"] = "orderdate",
            ["order_date"] = "orderdate",
            ["date"] = "orderdate",
            ["ordercode"] = "ordercode",
            ["order_code"] = "ordercode",
            ["orderid"] = "ordercode",
            ["id"] = "ordercode",
            ["totalamount"] = "totalamount",
            ["total_amount"] = "totalamount",
            ["amount"] = "totalamount",
            ["orderstatus"] = "orderstatus",
            ["order_status"] = "orderstatus",
            ["status"] = "orderstatus"
        };

        private static readonly Dictionary<string, string> StatusNormalizationMap = new(StringComparer.OrdinalIgnoreCase)
        {
            ["all"] = "all",
            ["all orders"] = "all",
            ["new"] = "new",
            ["confirmed"] = "confirmed",
            ["processing"] = "processing",
            ["packed"] = "packed",
            ["shipped"] = "shipped",
            ["dispatched"] = "shipped",
            ["in transit"] = "shipped",
            ["in_transit"] = "shipped",
            ["out for delivery"] = "shipped",
            ["out_for_delivery"] = "shipped",
            ["delivered"] = "delivered",
            ["completed"] = "completed",
            ["cancelled"] = "cancelled",
            ["canceled"] = "cancelled"
        };

        private static readonly Dictionary<string, string> DatePresetNormalizationMap = new(StringComparer.OrdinalIgnoreCase)
        {
            ["all"] = "all_time",
            ["all_time"] = "all_time",
            ["today"] = "today",
            ["last7"] = "last_7_days",
            ["last_7_days"] = "last_7_days",
            ["last30"] = "last_30_days",
            ["last_30_days"] = "last_30_days",
            ["thismonth"] = "this_month",
            ["this_month"] = "this_month",
            ["lastmonth"] = "last_month",
            ["last_month"] = "last_month",
            ["custom"] = "custom"
        };

        private readonly ICustomerOrderRepository _orderRepository;

        public CustomerOrderService(ICustomerOrderRepository orderRepository)
        {
            _orderRepository = orderRepository;
        }

        public async Task<ApiResponse<CustomerOrderPagedDto>> GetOrdersAsync(
            long customerUserId,
            CustomerOrderQueryDto query,
            CancellationToken cancellationToken = default)
        {
            if (customerUserId <= 0)
            {
                return ApiResponse<CustomerOrderPagedDto>.Fail("Invalid authenticated customer identity.");
            }

            query ??= new CustomerOrderQueryDto();

            if (query.Page < 1)
            {
                return ApiResponse<CustomerOrderPagedDto>.Fail("Page must be greater than or equal to 1.");
            }

            if (query.PageSize < 1 || query.PageSize > MaxPageSize)
            {
                return ApiResponse<CustomerOrderPagedDto>.Fail($"PageSize must be between 1 and {MaxPageSize}.");
            }

            string? normalizedStatus = null;
            if (!string.IsNullOrWhiteSpace(query.Status))
            {
                string rawStatus = query.Status.Trim();
                if (!StatusNormalizationMap.TryGetValue(rawStatus, out string? mappedStatus))
                {
                    return ApiResponse<CustomerOrderPagedDto>.Fail(
                        "Invalid status value. Supported values are: all, new, confirmed, processing, packed, shipped, delivered, completed, cancelled.");
                }

                normalizedStatus = mappedStatus == "all" ? null : mappedStatus;
            }

            string? normalizedCategory = null;
            if (!string.IsNullOrWhiteSpace(query.Category) &&
                !string.Equals(query.Category.Trim(), "all", StringComparison.OrdinalIgnoreCase))
            {
                normalizedCategory = query.Category.Trim().ToLowerInvariant();
            }

            string normalizedDatePreset = "all_time";
            if (!string.IsNullOrWhiteSpace(query.DatePreset))
            {
                string rawPreset = query.DatePreset.Trim();
                if (!DatePresetNormalizationMap.TryGetValue(rawPreset, out string? mappedPreset))
                {
                    return ApiResponse<CustomerOrderPagedDto>.Fail(
                        "Invalid datePreset value. Supported values are: all, today, last_7_days, last_30_days, this_month, last_month, custom.");
                }

                normalizedDatePreset = mappedPreset;
            }

            if (query.FromDate.HasValue && query.ToDate.HasValue && query.FromDate.Value.Date > query.ToDate.Value.Date)
            {
                return ApiResponse<CustomerOrderPagedDto>.Fail("fromDate cannot be greater than toDate.");
            }

            if (normalizedDatePreset == "custom" && !query.FromDate.HasValue && !query.ToDate.HasValue)
            {
                return ApiResponse<CustomerOrderPagedDto>.Fail(
                    "At least one of fromDate or toDate is required when datePreset is custom.");
            }

            string rawSortBy = string.IsNullOrWhiteSpace(query.SortBy) ? "orderDate" : query.SortBy.Trim();
            if (!SortByAllowlist.TryGetValue(rawSortBy, out string? normalizedSortBy))
            {
                return ApiResponse<CustomerOrderPagedDto>.Fail(
                    "Invalid sortBy value. Supported values are: orderDate, orderCode, totalAmount, orderStatus.");
            }

            string rawSortOrder = string.IsNullOrWhiteSpace(query.SortOrder) ? "desc" : query.SortOrder.Trim();
            if (!AllowedSortOrders.Contains(rawSortOrder))
            {
                return ApiResponse<CustomerOrderPagedDto>.Fail(
                    "Invalid sortOrder value. Supported values are: asc, desc.");
            }

            bool isAsc = string.Equals(rawSortOrder, "asc", StringComparison.OrdinalIgnoreCase);

            DateTime today = GetBusinessTodayDate(DateTime.UtcNow);
            var (effectiveFromDate, effectiveToDate) = ResolveDateRange(normalizedDatePreset, query.FromDate, query.ToDate, today);

            var pagedResult = await _orderRepository.GetOrdersAsync(
                customerUserId,
                query,
                effectiveFromDate,
                effectiveToDate,
                normalizedStatus,
                normalizedCategory,
                normalizedSortBy,
                isAsc,
                cancellationToken);

            return ApiResponse<CustomerOrderPagedDto>.Ok(
                pagedResult,
                "Customer orders retrieved successfully.");
        }

        public async Task<ApiResponse<CustomerOrderDetailDto>> GetOrderByIdAsync(
            long customerUserId,
            string orderIdentifier,
            CancellationToken cancellationToken = default)
        {
            if (customerUserId <= 0)
            {
                return ApiResponse<CustomerOrderDetailDto>.Fail("Invalid authenticated customer identity.");
            }

            if (string.IsNullOrWhiteSpace(orderIdentifier))
            {
                return ApiResponse<CustomerOrderDetailDto>.Fail("Order identifier is required.");
            }

            var detail = await _orderRepository.GetOrderByIdAsync(customerUserId, orderIdentifier.Trim(), cancellationToken);
            if (detail == null)
            {
                return ApiResponse<CustomerOrderDetailDto>.Fail("Order not found.");
            }

            return ApiResponse<CustomerOrderDetailDto>.Ok(
                detail,
                "Customer order details retrieved successfully.");
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
                "today" => (today, today),
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

            try
            {
                var istZone = TimeZoneInfo.FindSystemTimeZoneById("India Standard Time");
                return TimeZoneInfo.ConvertTimeFromUtc(normalizedUtc, istZone).Date;
            }
            catch (TimeZoneNotFoundException)
            {
                return normalizedUtc.AddHours(5).AddMinutes(30).Date;
            }
        }
    }
}

