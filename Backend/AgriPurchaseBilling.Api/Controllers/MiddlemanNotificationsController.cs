
using AgriPurchaseBilling.Application.DTOs;
using AgriPurchaseBilling.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Backend.AgriPurchaseBilling.Api.Controllers
{
    [ApiController]
    [Route("api/v1/notifications")]
    [Authorize(Roles = "Middleman")]
    [Produces("application/json")]
    public sealed class MiddlemanNotificationsController(IMiddlemanNotificationService service) : ControllerBase
    {
        private long? CurrentUserId
        {
            get
            {
                var claim = User.FindFirstValue(ClaimTypes.NameIdentifier);
                return long.TryParse(claim, out var id) ? id : null;
            }
        }

        // GET /api/v1/notifications?search=chilli&category=Farmer%20Purchase%20Confirmation&priority=High&status=Unread&timeRange=Last7Days&page=1&pageSize=10
        [HttpGet]
        public async Task<IActionResult> Get([FromQuery] MiddlemanNotificationQuery query, CancellationToken ct)
        {
            if (CurrentUserId is not long userId) return Unauthorized();
            if (query.Status is not ("All" or "Read" or "Unread"))
                return BadRequest(new { message = "status must be All, Read or Unread." });
            if (query.TimeRange is not ("All" or "Today" or "Last7Days" or "Last30Days"))
                return BadRequest(new { message = "timeRange must be All, Today, Last7Days or Last30Days." });
            return Ok(await service.GetPageAsync(userId, query, ct));
        }

        [HttpGet("status")]
        public async Task<IActionResult> Status(CancellationToken ct)
        {
            if (CurrentUserId is not long userId) return Unauthorized();
            return Ok(await service.GetStatsAsync(userId, ct));
        }

        // Used by the bell/dropdown. Default: latest five.
        [HttpGet("latest")]
        public async Task<IActionResult> Latest([FromQuery] int take = 5, CancellationToken ct = default)
        {
            if (CurrentUserId is not long userId) return Unauthorized();
            return Ok(await service.GetLatestAsync(userId, take, ct));
        }

        [HttpPatch("{id:long}/read")]
        public async Task<IActionResult> MarkRead(long id, CancellationToken ct)
        {
            if (CurrentUserId is not long userId) return Unauthorized();
            return await service.MarkReadAsync(userId, id, ct)
                ? Ok(new { message = "Notification marked as read." })
                : NotFound(new { message = "Notification not found." });
        }

        [HttpPatch("read-all")]
        public async Task<IActionResult> MarkAllRead(CancellationToken ct)
        {
            if (CurrentUserId is not long userId) return Unauthorized();
            var affected = await service.MarkAllReadAsync(userId, ct);
            return Ok(new { message = "Unread notifications marked as read.", updatedCount = affected });
        }

        [HttpDelete("{id:long}")]
        public async Task<IActionResult> Delete(long id, CancellationToken ct)
        {
            if (CurrentUserId is not long userId) return Unauthorized();
            return await service.DeleteAsync(userId, id, ct)
                ? Ok(new { message = "Notification deleted." })
                : NotFound(new { message = "Notification not found." });
        }
    }
}
