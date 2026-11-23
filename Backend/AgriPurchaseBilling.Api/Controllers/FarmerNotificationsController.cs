using System;
using System.Security.Claims;
using System.Threading;
using System.Threading.Tasks;
using AgriPurchaseBilling.Application.DTOs;
using AgriPurchaseBilling.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace Backend.AgriPurchaseBilling.Api.Controllers
{
    /// <summary>
    /// APIs dedicated to the "Farmer Notifications & Operational Alerts" page:
    /// - Summary KPI metrics (Total, Unread, OTP Alerts, Action Required)
    /// - Paginated list of notifications with multi-filter (Category, Search, Unread)
    /// - Mark single / all notifications as read
    /// - Dismiss / delete notifications
    /// - Create new notifications
    /// </summary>
    [ApiController]
    [Route("api/v1/farmer/notifications")]
    [Produces("application/json")]
    public class FarmerNotificationsController : ControllerBase
    {
        private readonly IFarmerNotificationService _notificationService;

        public FarmerNotificationsController(IFarmerNotificationService notificationService)
        {
            _notificationService = notificationService;
        }

        /// <summary>
        /// Retrieves the 4 KPI summary cards (Total Notifications, Unread Alerts, OTP &amp; Security Alerts, Action Required).
        /// </summary>
        [HttpGet("stats")]
        [AllowAnonymous]
        [ProducesResponseType(typeof(ApiResponse<FarmerNotificationStatsDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<FarmerNotificationStatsDto>), StatusCodes.Status401Unauthorized)]
        public async Task<IActionResult> GetStats(
            [FromQuery] long? userId = null,
            CancellationToken ct = default)
        {
            long resolvedUserId = ResolveUserId(userId);
            if (resolvedUserId <= 0)
            {
                return Unauthorized(ApiResponse<FarmerNotificationStatsDto>.Fail("Unable to determine authenticated user. Please login or provide userId."));
            }

            var result = await _notificationService.GetStatsAsync(resolvedUserId, ct);
            if (!result.Success)
            {
                return BadRequest(result);
            }

            return Ok(result);
        }

        /// <summary>
        /// Retrieves paginated list of farmer notifications with filters (Category, Status, Search, UnreadOnly).
        /// </summary>
        [HttpGet]
        [AllowAnonymous]
        [ProducesResponseType(typeof(ApiResponse<FarmerNotificationPagedResponseDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<FarmerNotificationPagedResponseDto>), StatusCodes.Status401Unauthorized)]
        public async Task<IActionResult> GetNotifications(
            [FromQuery] FarmerNotificationQueryDto query,
            [FromQuery] long? userId = null,
            CancellationToken ct = default)
        {
            long resolvedUserId = ResolveUserId(userId ?? query.UserId);
            if (resolvedUserId <= 0)
            {
                return Unauthorized(ApiResponse<FarmerNotificationPagedResponseDto>.Fail("Unable to determine authenticated user. Please login or provide userId."));
            }

            var result = await _notificationService.GetNotificationsAsync(resolvedUserId, query, ct);
            if (!result.Success)
            {
                return BadRequest(result);
            }

            return Ok(result);
        }

        /// <summary>
        /// Marks a single notification as read by ID or NotificationCode.
        /// </summary>
        [HttpPatch("{id}/read")]
        [AllowAnonymous]
        [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> MarkRead(
            [FromRoute] string id,
            [FromQuery] long? userId = null,
            CancellationToken ct = default)
        {
            long resolvedUserId = ResolveUserId(userId);
            if (resolvedUserId <= 0)
            {
                return Unauthorized(ApiResponse<bool>.Fail("Unable to determine authenticated user. Please login or provide userId."));
            }

            var result = await _notificationService.MarkReadAsync(resolvedUserId, id, ct);
            if (!result.Success)
            {
                return BadRequest(result);
            }

            return Ok(result);
        }

        /// <summary>
        /// Marks all active unread notifications as read for the logged-in farmer.
        /// </summary>
        [HttpPatch("read-all")]
        [AllowAnonymous]
        [ProducesResponseType(typeof(ApiResponse<int>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<int>), StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> MarkAllRead(
            [FromQuery] long? userId = null,
            CancellationToken ct = default)
        {
            long resolvedUserId = ResolveUserId(userId);
            if (resolvedUserId <= 0)
            {
                return Unauthorized(ApiResponse<int>.Fail("Unable to determine authenticated user. Please login or provide userId."));
            }

            var result = await _notificationService.MarkAllReadAsync(resolvedUserId, ct);
            if (!result.Success)
            {
                return BadRequest(result);
            }

            return Ok(result);
        }

        /// <summary>
        /// Dismisses / deletes a notification for the logged-in farmer.
        /// </summary>
        [HttpDelete("{id}")]
        [AllowAnonymous]
        [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> Dismiss(
            [FromRoute] string id,
            [FromQuery] long? userId = null,
            CancellationToken ct = default)
        {
            long resolvedUserId = ResolveUserId(userId);
            if (resolvedUserId <= 0)
            {
                return Unauthorized(ApiResponse<bool>.Fail("Unable to determine authenticated user. Please login or provide userId."));
            }

            var result = await _notificationService.DismissAsync(resolvedUserId, id, ct);
            if (!result.Success)
            {
                return BadRequest(result);
            }

            return Ok(result);
        }

        /// <summary>
        /// Creates a new notification for the logged-in farmer (useful for testing or system alert triggers).
        /// </summary>
        [HttpPost]
        [AllowAnonymous]
        [ProducesResponseType(typeof(ApiResponse<FarmerNotificationDto>), StatusCodes.Status201Created)]
        [ProducesResponseType(typeof(ApiResponse<FarmerNotificationDto>), StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> CreateNotification(
            [FromBody] CreateFarmerNotificationRequestDto request,
            [FromQuery] long? userId = null,
            CancellationToken ct = default)
        {
            long resolvedUserId = ResolveUserId(userId);
            if (resolvedUserId <= 0)
            {
                return Unauthorized(ApiResponse<FarmerNotificationDto>.Fail("Unable to determine authenticated user. Please login or provide userId."));
            }

            var result = await _notificationService.CreateNotificationAsync(resolvedUserId, request, ct);
            if (!result.Success)
            {
                return BadRequest(result);
            }

            return StatusCode(StatusCodes.Status201Created, result);
        }

        private long ResolveUserId(long? explicitUserId)
        {
            if (explicitUserId.HasValue && explicitUserId.Value > 0)
            {
                return explicitUserId.Value;
            }

            var claim = User.FindFirst(ClaimTypes.NameIdentifier) ?? User.FindFirst("sub") ?? User.FindFirst("userId");
            if (claim != null && long.TryParse(claim.Value, out long parsedId) && parsedId > 0)
            {
                return parsedId;
            }

            return 0;
        }
    }
}
