using AgriPurchaseBilling.Application.DTOs.VendorPortal;
using AgriPurchaseBilling.Application.Interfaces.VendorPortal;
using Microsoft.AspNetCore.Mvc;

namespace AgriPurchaseBilling.Api.Controllers.VendorPortal
{
    /// <summary>
    /// "System Notifications &amp; Operational Alerts" screen. Notifications are created by the system
    /// (order / OTP / payment stored procedures), so there is no create endpoint.
    /// </summary>
    [Route("api/v1/vendor/notifications")]
    public sealed class VendorNotificationsController : VendorPortalControllerBase
    {
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

        /// <summary>Alert list with search, category / priority / read-state / date filters and paging.</summary>
        [HttpGet]
        public async Task<IActionResult> GetNotifications([FromQuery] NotificationQuery query, CancellationToken ct) =>
            Success(await _notifications.GetAsync(await VendorIdAsync(ct), query, ct));

        /// <summary>"Mark Read" on one notification.</summary>
        [HttpPut("{id:long}/read")]
        public async Task<IActionResult> MarkRead(long id, CancellationToken ct)
        {
            var row = await _notifications.MarkReadAsync(await VendorIdAsync(ct), id, ct);
            return row is null ? NotFoundResponse("Notification not found.") : Success(row, "Notification marked as read.");
        }

        /// <summary>"Mark All as Read".</summary>
        [HttpPut("read-all")]
        public async Task<IActionResult> MarkAllRead(CancellationToken ct)
        {
            var updated = await _notifications.MarkAllReadAsync(await VendorIdAsync(ct), ct);
            return Success(new MarkAllReadResultDto { Updated = updated }, "All notifications marked as read.");
        }

        /// <summary>Trash icon: removes one notification.</summary>
        [HttpDelete("{id:long}")]
        public async Task<IActionResult> Delete(long id, CancellationToken ct)
        {
            var deleted = await _notifications.DeleteAsync(await VendorIdAsync(ct), id, ct);
            return deleted ? Success(new { deleted = true }, "Notification deleted.") : NotFoundResponse("Notification not found.");
        }
    }
}
