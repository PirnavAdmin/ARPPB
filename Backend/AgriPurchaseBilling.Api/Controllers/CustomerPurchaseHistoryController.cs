using AgriPurchaseBilling.Application.DTOs;
using AgriPurchaseBilling.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace AgriPurchaseBilling.Api.Controllers
{
    /// <summary>
    /// Read-only Customer Purchase History APIs exposing purchase line items, summary cards,
    /// and transaction details strictly scoped to the authenticated customer's JWT identity.
    /// </summary>
    [ApiController]
    [Authorize(Roles = "Customer")]
    [Route("api/v1/customer/purchases")]
    [Produces("application/json")]
    public sealed class CustomerPurchaseHistoryController : ControllerBase
    {
        private readonly ICustomerPurchaseHistoryService _purchaseHistoryService;

        public CustomerPurchaseHistoryController(ICustomerPurchaseHistoryService purchaseHistoryService)
        {
            _purchaseHistoryService = purchaseHistoryService;
        }

        /// <summary>
        /// Returns a paginated list of eligible (non-draft, non-cancelled) purchase line items
        /// belonging to the authenticated customer, supporting search, status, date presets/range,
        /// allowlisted sorting, and pagination.
        /// </summary>
        [HttpGet]
        [ProducesResponseType(typeof(ApiResponse<CustomerPurchaseHistoryPagedDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<CustomerPurchaseHistoryPagedDto>), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        public async Task<IActionResult> GetPurchaseHistory(
            [FromQuery] CustomerPurchaseHistoryQueryDto query,
            CancellationToken cancellationToken)
        {
            if (!TryGetAuthenticatedCustomerUserId(out long customerUserId))
            {
                return Unauthorized(ApiResponse<CustomerPurchaseHistoryPagedDto>.Fail("Invalid or missing customer authentication claim."));
            }

            var result = await _purchaseHistoryService.GetPurchaseHistoryAsync(customerUserId, query, cancellationToken);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        /// <summary>
        /// Returns purchase summary metrics (confirmedPurchases, completedOrders, inFulfilment,
        /// totalPurchaseSpend) for the authenticated customer across distinct eligible orders.
        /// </summary>
        [HttpGet("summary")]
        [ProducesResponseType(typeof(ApiResponse<CustomerPurchaseSummaryDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        public async Task<IActionResult> GetPurchaseSummary(CancellationToken cancellationToken)
        {
            if (!TryGetAuthenticatedCustomerUserId(out long customerUserId))
            {
                return Unauthorized(ApiResponse<CustomerPurchaseSummaryDto>.Fail("Invalid or missing customer authentication claim."));
            }

            var result = await _purchaseHistoryService.GetPurchaseSummaryAsync(customerUserId, cancellationToken);
            return Ok(result);
        }

        /// <summary>
        /// Returns customer-safe purchase details for a single line item belonging to the
        /// authenticated customer. Returns 404 if the item does not exist, is draft/cancelled,
        /// or belongs to another customer.
        /// </summary>
        [HttpGet("{id:long}")]
        [ProducesResponseType(typeof(ApiResponse<CustomerPurchaseDetailDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<CustomerPurchaseDetailDto>), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(ApiResponse<CustomerPurchaseDetailDto>), StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        public async Task<IActionResult> GetPurchaseById(
            [FromRoute] long id,
            CancellationToken cancellationToken)
        {
            if (!TryGetAuthenticatedCustomerUserId(out long customerUserId))
            {
                return Unauthorized(ApiResponse<CustomerPurchaseDetailDto>.Fail("Invalid or missing customer authentication claim."));
            }

            if (id <= 0)
            {
                return BadRequest(ApiResponse<CustomerPurchaseDetailDto>.Fail("Invalid purchase ID."));
            }

            var result = await _purchaseHistoryService.GetPurchaseByIdAsync(customerUserId, id, cancellationToken);
            return result.Success ? Ok(result) : NotFound(result);
        }

        private bool TryGetAuthenticatedCustomerUserId(out long customerUserId)
        {
            string? claimValue = User.FindFirstValue(ClaimTypes.NameIdentifier);
            return long.TryParse(claimValue, out customerUserId) && customerUserId > 0;
        }
    }
}

