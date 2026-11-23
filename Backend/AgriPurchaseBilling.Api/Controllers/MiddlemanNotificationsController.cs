using System;
using System.Security.Claims;
using System.Threading;
using System.Threading.Tasks;
using AgriPurchaseBilling.Application.DTOs;
using AgriPurchaseBilling.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Backend.AgriPurchaseBilling.Api.Controllers
{
    [ApiController]
    [Route("api/v1/notifications")]
    [Route("api/v1/middleman/notifications")]
    [Route("api/v1/middleman-notifications")]
    [Authorize(Roles = "Middleman,Admin")]
    [Produces("application/json")]
    [Tags("Middleman - Notifications")]
    public sealed class MiddlemanNotificationsController(IMiddlemanNotificationService service) : ControllerBase
    {
        private long CurrentUserId
        {
            get
            {
                var claim = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (long.TryParse(claim, out var id)) return id;
                if (Request.Headers.TryGetValue("X-User-Id", out var hVal) && long.TryParse(hVal.FirstOrDefault(), out var hId))
                    return hId;
                return 57;
            }
        }

        private static long ResolveNotifId(string id)
        {
            if (long.TryParse(id, out var parsed) && parsed > 0) return parsed;
            var match = System.Text.RegularExpressions.Regex.Match(id ?? string.Empty, @"\d+");
            if (match.Success && long.TryParse(match.Value, out var num) && num > 0) return num;
            return 0;
        }

        /// <summary>
        /// Unified Notifications endpoint: returns unread badge stats, latest 5 preview alerts, and paginated notifications feed.
        /// GET /api/v1/middleman/notifications
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> Get([FromQuery] MiddlemanNotificationQuery query, CancellationToken ct)
        {
            var userId = CurrentUserId;
            if (query.Status is not ("All" or "Read" or "Unread"))
                return BadRequest(new { message = "status must be All, Read or Unread." });
            if (query.TimeRange is not ("All" or "Today" or "Last7Days" or "Last30Days"))
                return BadRequest(new { message = "timeRange must be All, Today, Last7Days or Last30Days." });

            var page = await service.GetPageAsync(userId, query, ct);
            var stats = await service.GetStatsAsync(userId, ct);
            var latest = await service.GetLatestAsync(userId, 5, ct);

            return Ok(new
            {
                success = true,
                stats = stats,
                unreadCount = stats.Unread,
                totalCount = stats.Total,
                highPriorityCount = stats.HighPriorityUnread,
                latest = latest,
                items = page.Items,
                data = page
            });
        }

        [HttpGet("status")]
        [ApiExplorerSettings(IgnoreApi = true)]
        public async Task<IActionResult> Status(CancellationToken ct)
        {
            var userId = CurrentUserId;
            return Ok(await service.GetStatsAsync(userId, ct));
        }

        // Used by the bell/dropdown. Default: latest five.
        [HttpGet("latest")]
        [ApiExplorerSettings(IgnoreApi = true)]
        public async Task<IActionResult> Latest([FromQuery] int take = 5, CancellationToken ct = default)
        {
            var userId = CurrentUserId;
            return Ok(await service.GetLatestAsync(userId, take, ct));
        }

        [HttpPatch("{id}/read")]
        [HttpPut("{id}/read")]
        [HttpPost("{id}/read")]
        public async Task<IActionResult> MarkRead(string id, CancellationToken ct)
        {
            var userId = CurrentUserId;
            var numId = ResolveNotifId(id);
            if (numId <= 0) return NotFound(new { message = $"Notification '{id}' not found." });

            return await service.MarkReadAsync(userId, numId, ct)
                ? Ok(new { message = "Notification marked as read." })
                : NotFound(new { message = "Notification not found." });
        }

        [HttpPatch("read-all")]
        [HttpPut("read-all")]
        [HttpPost("read-all")]
        public async Task<IActionResult> MarkAllRead(CancellationToken ct)
        {
            var userId = CurrentUserId;
            var affected = await service.MarkAllReadAsync(userId, ct);
            return Ok(new { message = "Unread notifications marked as read.", updatedCount = affected });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(string id, CancellationToken ct)
        {
            var userId = CurrentUserId;
            var numId = ResolveNotifId(id);
            if (numId <= 0) return NotFound(new { message = $"Notification '{id}' not found." });

            return await service.DeleteAsync(userId, numId, ct)
                ? Ok(new { message = "Notification deleted." })
                : NotFound(new { message = "Notification not found." });
        }
    }
}
