using AgriPurchaseBilling.Application.DTOs.VendorPortal;
using AgriPurchaseBilling.Application.Interfaces.VendorPortal;
using Microsoft.AspNetCore.Mvc;

namespace AgriPurchaseBilling.Api.Controllers.VendorPortal
{
    /// <summary>
    /// "System Notifications &amp; Operational Alerts" screen and the header badges. Notifications are created by the
    /// system (order / OTP / payment stored procedures), so there is no create endpoint.
    /// </summary>
    [Route("api/v1/vendor/notifications")]
    public sealed class VendorNotificationsController : VendorPortalControllerBase
    {
        private const int AllNotificationsPageSize = 200;

        private readonly IVendorNotificationsRepository _notifications;

        public VendorNotificationsController(IVendorResolver resolver, IVendorNotificationsRepository notifications)
            : base(resolver)
        {
            _notifications = notifications;
        }

        /// <summary>KPI cards: total, unread, high-priority unread, acknowledged/read, categories.</summary>
        [HttpGet("summary")]
        public async Task<IActionResult> GetSummary(CancellationToken ct) =>
            Success(await _notifications.GetSummaryAsync(await VendorIdAsync(ct), ct));

        /// <summary>
        /// Header badges for every vendor page: <c>unreadNotifications</c> (bell), <c>pendingOtps</c> ("OTP Queue" button,
        /// which opens <c>otpQueuePath</c> = /vendor/confirmations) and <c>highPriorityUnread</c>.
        /// </summary>
        [HttpGet("header-counts")]
        public async Task<IActionResult> GetHeaderCounts(CancellationToken ct) =>
            Success(await _notifications.GetHeaderCountsAsync(await VendorIdAsync(ct), ct));

        /// <summary>Every dropdown of the screen: categories (with counts), priorities, read states and date ranges.</summary>
        [HttpGet("filters")]
        public async Task<IActionResult> GetFilters(CancellationToken ct) =>
            Success(await _notifications.GetFilterOptionsAsync(await VendorIdAsync(ct), ct));

        /// <summary>
        /// Alert list, newest first. Filters: search, category (the screen's names, e.g. Customer Order Confirmed),
        /// priority (High | Medium | Low), readStatus (All | Unread | Read) or isRead,
        /// datePreset (Today, Yesterday, Last 7 Days, This Month, Last Month) or from/to, paging.
        /// Unless pageSize is given, up to 200 notifications are returned.
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetNotifications([FromQuery] NotificationQuery query, CancellationToken ct)
        {
            // Query keys are case-insensitive.
            if (!Request.Query.ContainsKey("pageSize"))
            {
                query.PageSize = AllNotificationsPageSize;
            }
            return Success(await _notifications.GetAsync(await VendorIdAsync(ct), query, ct));
        }

        /// <summary>"Mark Read" on one notification. The id may be numeric or NTF-0007.</summary>
        [HttpPut("{idOrCode}/read")]
        public async Task<IActionResult> MarkRead(string idOrCode, CancellationToken ct)
        {
            var row = await _notifications.MarkReadAsync(await VendorIdAsync(ct), ParseId(idOrCode), ct);
            return row is null ? NotFoundResponse("Notification not found.") : Success(row, "Notification marked as read.");
        }

        /// <summary>"Mark All as Read". Message: "All notifications marked as read." (the screen's confirmation popup).</summary>
        [HttpPut("read-all")]
        public async Task<IActionResult> MarkAllRead(CancellationToken ct)
        {
            var updated = await _notifications.MarkAllReadAsync(await VendorIdAsync(ct), ct);
            return Success(new MarkAllReadResultDto { Updated = updated }, "All notifications marked as read.");
        }

        /// <summary>Trash icon: removes one notification. The id may be numeric or NTF-0007.</summary>
        [HttpDelete("{idOrCode}")]
        public async Task<IActionResult> Delete(string idOrCode, CancellationToken ct)
        {
            var deleted = await _notifications.DeleteAsync(await VendorIdAsync(ct), ParseId(idOrCode), ct);
            return deleted ? Success(new { deleted = true }, "Notification deleted.") : NotFoundResponse("Notification not found.");
        }

        private static long ParseId(string value) =>
            VendorLedgerMapper.TryParseId(value, out var id)
                ? id
                : throw new VendorPortalException(404, "Notification not found.");
    }
}
