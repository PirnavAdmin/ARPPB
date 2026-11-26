using AgriPurchaseBilling.Application.DTOs;
using AgriPurchaseBilling.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace AgriPurchaseBilling.Api.Controllers
{
    /// <summary>
    /// Customer Notifications Center APIs strictly scoped to the authenticated Customer's JWT identity.
    /// </summary>
    [ApiController]
    [Authorize(Roles = "Customer")]
    [Route("api/v1/customer/notifications")]
    [Produces("application/json")]
    public sealed class CustomerNotificationsController : ControllerBase
    {
        private readonly ICustomerNotificationService _notificationService;

        public CustomerNotificationsController(ICustomerNotificationService notificationService)
        {
            _notificationService = notificationService;
        }

        /// <summary>
        /// Returns paginated notifications belonging to the authenticated customer with optional
        /// search (title, message, type, orderCode, transactionCode), type, priority, isRead,
        /// and createdAt sorting.
        /// </summary>
        [HttpGet]
        [ProducesResponseType(typeof(ApiResponse<CustomerNotificationPagedDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<CustomerNotificationPagedDto>), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        public async Task<IActionResult> GetNotifications(
            [FromQuery] CustomerNotificationQueryDto query,
            CancellationToken cancellationToken)
        {
            if (!TryGetAuthenticatedCustomerUserId(out long customerUserId))
            {
                return Unauthorized(ApiResponse<CustomerNotificationPagedDto>.Fail("Invalid or missing customer authentication claim."));
            }

            var result = await _notificationService.GetNotificationsAsync(customerUserId, query, cancellationToken);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        /// <summary>
        /// Returns total, unread, read, and high-priority unread notification counts for the authenticated customer.
        /// </summary>
        [HttpGet("summary")]
        [ProducesResponseType(typeof(ApiResponse<CustomerNotificationSummaryDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        public async Task<IActionResult> GetSummary(CancellationToken cancellationToken)
        {
            if (!TryGetAuthenticatedCustomerUserId(out long customerUserId))
            {
                return Unauthorized(ApiResponse<CustomerNotificationSummaryDto>.Fail("Invalid or missing customer authentication claim."));
            }

            var result = await _notificationService.GetSummaryAsync(customerUserId, cancellationToken);
            return Ok(result);
        }

        /// <summary>
        /// Marks a single notification belonging to the authenticated customer as read.
        /// Returns 404 if the notification does not exist or belongs to another customer.
        /// </summary>
        [HttpPatch("{id:long}/read")]
        [ProducesResponseType(typeof(ApiResponse<CustomerNotificationDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<CustomerNotificationDto>), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(ApiResponse<CustomerNotificationDto>), StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        public async Task<IActionResult> MarkAsRead(
            [FromRoute] long id,
            CancellationToken cancellationToken)
        {
            if (!TryGetAuthenticatedCustomerUserId(out long customerUserId))
            {
                return Unauthorized(ApiResponse<CustomerNotificationDto>.Fail("Invalid or missing customer authentication claim."));
            }

            if (id <= 0)
            {
                return BadRequest(ApiResponse<CustomerNotificationDto>.Fail("Invalid notification ID."));
            }

            var result = await _notificationService.MarkAsReadAsync(customerUserId, id, cancellationToken);
            return result.Success ? Ok(result) : NotFound(result);
        }

        /// <summary>
        /// Marks all unread notifications belonging to the authenticated customer as read.
        /// </summary>
        [HttpPatch("read-all")]
        [ProducesResponseType(typeof(ApiResponse<CustomerNotificationMarkAllReadDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        public async Task<IActionResult> MarkAllAsRead(CancellationToken cancellationToken)
        {
            if (!TryGetAuthenticatedCustomerUserId(out long customerUserId))
            {
                return Unauthorized(ApiResponse<CustomerNotificationMarkAllReadDto>.Fail("Invalid or missing customer authentication claim."));
            }

            var result = await _notificationService.MarkAllAsReadAsync(customerUserId, cancellationToken);
            return Ok(result);
        }

        /// <summary>
        /// Deletes a single notification belonging to the authenticated customer.
        /// Returns 404 if the notification does not exist or belongs to another customer.
        /// </summary>
        [HttpDelete("{id:long}")]
        [ProducesResponseType(typeof(ApiResponse<object?>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<object?>), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(ApiResponse<object?>), StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        public async Task<IActionResult> DeleteNotification(
            [FromRoute] long id,
            CancellationToken cancellationToken)
        {
            if (!TryGetAuthenticatedCustomerUserId(out long customerUserId))
            {
                return Unauthorized(ApiResponse<object?>.Fail("Invalid or missing customer authentication claim."));
            }

            if (id <= 0)
            {
                return BadRequest(ApiResponse<object?>.Fail("Invalid notification ID."));
            }

            var result = await _notificationService.DeleteAsync(customerUserId, id, cancellationToken);
            return result.Success ? Ok(result) : NotFound(result);
        }

        private bool TryGetAuthenticatedCustomerUserId(out long customerUserId)
        {
            string? claimValue = User.FindFirstValue(ClaimTypes.NameIdentifier);
            return long.TryParse(claimValue, out customerUserId) && customerUserId > 0;
        }
    }
}

