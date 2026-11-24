using System.Globalization;

namespace AgriPurchaseBilling.Application.DTOs.VendorPortal
{
    /// <summary>Shapes notifications for the Notifications screen and its filter dropdowns.</summary>
    public static class VendorNotificationMapper
    {
        // The screen's 13 alert categories, in dropdown order.
        public static readonly string[] ScreenCategories =
        {
            "New Farmer Purchase", "New Middleman Purchase", "Purchase Confirmed", "OTP Verification", "Inventory Updated",
            "Processing Completed", "Customer Order Received", "Customer Order Confirmed", "Product Sold",
            "Expected Payment", "Payment Due", "Payment Delayed", "Low Stock"
        };

        /// <summary>Stored category -> the screen's wording.</summary>
        public static string CategoryLabel(string category) => category switch
        {
            "Sale Confirmed" => "Customer Order Confirmed",
            "OTP Confirmation" => "OTP Verification",
            _ => category
        };

        public static NotificationDto Enrich(NotificationDto n)
        {
            n.NotificationCode = "NTF-" + n.Id.ToString("D4", CultureInfo.InvariantCulture);
            n.TransactionId = n.ReferenceCode;
            n.TargetPath = n.ModuleLink;
            n.Date = n.CreatedAt.ToString("yyyy-MM-dd HH:mm", CultureInfo.InvariantCulture);
            n.Category = CategoryLabel(n.Category);
            return n;
        }

        /// <summary>true = read only, false = unread only, null = all (IsRead wins over ReadStatus).</summary>
        public static bool? ResolveRead(NotificationQuery q)
        {
            if (q.IsRead.HasValue) return q.IsRead;
            return q.ReadStatus?.Trim().ToLowerInvariant() switch
            {
                "unread" or "unread only" => false,
                "read" or "read only" => true,
                _ => null
            };
        }

        /// <summary>The dropdowns: the screen's 13 categories (plus any other category in the data), priorities, read states, dates.</summary>
        public static NotificationFilterOptionsDto BuildFilterOptions(IEnumerable<(string Category, long Count)> stored)
        {
            var counts = new Dictionary<string, long>(StringComparer.OrdinalIgnoreCase);
            foreach (var (category, count) in stored)
            {
                var label = CategoryLabel(category);
                counts[label] = counts.GetValueOrDefault(label) + count;
            }

            var categories = new List<NotificationFilterOptionDto> { new() { Label = "All Categories", Value = string.Empty, Count = counts.Values.Sum() } };
            categories.AddRange(ScreenCategories.Select(c => new NotificationFilterOptionDto { Label = c, Value = c, Count = counts.GetValueOrDefault(c) }));
            // Categories raised by the system that the screen's list does not name (e.g. "Order Update").
            categories.AddRange(counts.Keys
                .Where(k => !ScreenCategories.Contains(k, StringComparer.OrdinalIgnoreCase))
                .OrderBy(k => k)
                .Select(k => new NotificationFilterOptionDto { Label = k, Value = k, Count = counts[k] }));

            return new NotificationFilterOptionsDto
            {
                Categories = categories,
                Priorities = Options(("All Priorities", ""), ("High Priority", "High"), ("Medium Priority", "Medium"), ("Low Priority", "Low")),
                ReadStates = Options(("All Notifications", ""), ("Unread Only", "Unread"), ("Read Only", "Read")),
                DateRanges = Options(("All Time", ""), ("Today", "Today"), ("Yesterday", "Yesterday"), ("Last 7 Days", "Last 7 Days"),
                    ("This Month", "This Month"), ("Last Month", "Last Month"))
            };
        }

        private static List<NotificationFilterOptionDto> Options(params (string Label, string Value)[] items) =>
            items.Select(i => new NotificationFilterOptionDto { Label = i.Label, Value = i.Value }).ToList();
    }
}
