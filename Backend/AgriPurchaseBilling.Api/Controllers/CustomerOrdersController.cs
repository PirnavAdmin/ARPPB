using AgriPurchaseBilling.Application.DTOs;
using AgriPurchaseBilling.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace AgriPurchaseBilling.Api.Controllers
{
    /// <summary>
    /// Customer Portal – My Orders APIs strictly scoped to the authenticated Customer's JWT identity.
    /// Exposes order list with search, status tabs, date presets, and comprehensive order details.
    /// </summary>
    [ApiController]
    [Authorize(Roles = "Customer")]
    [Route("api/v1/customer/orders")]
    [Produces("application/json")]
    public sealed class CustomerOrdersController : ControllerBase
    {
        private readonly ICustomerOrderService _orderService;

        public CustomerOrdersController(ICustomerOrderService orderService)
        {
            _orderService = orderService;
        }

        /// <summary>
        /// Retrieves the paginated list of orders placed by the authenticated customer.
        /// Supports search (order code, transaction code, product, batch), status filtering,
        /// category filtering, date presets (today, last 7/30 days, this/last month), sorting, and pagination.
        /// </summary>
        [HttpGet]
        [ProducesResponseType(typeof(ApiResponse<CustomerOrderPagedDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<CustomerOrderPagedDto>), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        public async Task<IActionResult> GetOrders(
            [FromQuery] CustomerOrderQueryDto query,
            CancellationToken cancellationToken)
        {
            if (!TryGetAuthenticatedCustomerUserId(out long customerUserId))
            {
                return Unauthorized(ApiResponse<CustomerOrderPagedDto>.Fail("Invalid or missing customer authentication claim."));
            }

            var result = await _orderService.GetOrdersAsync(customerUserId, query, cancellationToken);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        /// <summary>
        /// Retrieves complete details for a single customer order by numeric ID or order code (e.g. ORD-0001).
        /// Enforces strict ownership: customers can only view their own orders.
        /// </summary>
        [HttpGet("{id}")]
        [ProducesResponseType(typeof(ApiResponse<CustomerOrderDetailDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<CustomerOrderDetailDto>), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(ApiResponse<CustomerOrderDetailDto>), StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        public async Task<IActionResult> GetOrderById(
            [FromRoute] string id,
            CancellationToken cancellationToken)
        {
            if (!TryGetAuthenticatedCustomerUserId(out long customerUserId))
            {
                return Unauthorized(ApiResponse<CustomerOrderDetailDto>.Fail("Invalid or missing customer authentication claim."));
            }

            if (string.IsNullOrWhiteSpace(id))
            {
                return BadRequest(ApiResponse<CustomerOrderDetailDto>.Fail("Order identifier is required."));
            }

            var result = await _orderService.GetOrderByIdAsync(customerUserId, id, cancellationToken);
            if (!result.Success)
            {
                if (result.Message.Contains("not found", StringComparison.OrdinalIgnoreCase))
                {
                    return NotFound(result);
                }

                return BadRequest(result);
            }

            return Ok(result);
        }

        private bool TryGetAuthenticatedCustomerUserId(out long customerUserId)
        {
            string? claimValue = User.FindFirstValue(ClaimTypes.NameIdentifier);
            return long.TryParse(claimValue, out customerUserId) && customerUserId > 0;
        }
    }
}

