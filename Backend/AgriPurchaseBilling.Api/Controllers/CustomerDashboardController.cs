using AgriPurchaseBilling.Application.DTOs;
using AgriPurchaseBilling.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace AgriPurchaseBilling.Api.Controllers
{
    /// <summary>
    /// Customer Portal – Dashboard APIs strictly scoped to the authenticated Customer's JWT identity.
    /// Exposes summary KPIs aggregated across orders, purchases, cart items, and notifications.
    /// </summary>
    [ApiController]
    [Authorize(Roles = "Customer")]
    [Route("api/v1/customer/dashboard")]
    [Produces("application/json")]
    public sealed class CustomerDashboardController : ControllerBase
    {
        private readonly ICustomerDashboardService _dashboardService;

        public CustomerDashboardController(ICustomerDashboardService dashboardService)
        {
            _dashboardService = dashboardService;
        }

        /// <summary>
        /// Retrieves aggregated KPI summary metrics for the authenticated customer's dashboard:
        /// total orders, active orders, completed orders, total purchase spend, pending confirmations,
        /// cart item count, and unread notification count.
        /// </summary>
        [HttpGet("summary")]
        [ProducesResponseType(typeof(ApiResponse<CustomerDashboardSummaryDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<CustomerDashboardSummaryDto>), StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(typeof(ApiResponse<CustomerDashboardSummaryDto>), StatusCodes.Status403Forbidden)]
        public async Task<IActionResult> GetSummary(CancellationToken cancellationToken)
        {
            if (!TryGetAuthenticatedCustomerUserId(out long customerUserId))
            {
                return Unauthorized(ApiResponse<CustomerDashboardSummaryDto>.Fail("Invalid or missing customer authentication claim."));
            }

            var result = await _dashboardService.GetDashboardSummaryAsync(customerUserId, cancellationToken);
            return Ok(result);
        }

        private bool TryGetAuthenticatedCustomerUserId(out long customerUserId)
        {
            string? claimValue = User.FindFirstValue(ClaimTypes.NameIdentifier);
            return long.TryParse(claimValue, out customerUserId) && customerUserId > 0;
        }
    }
}

