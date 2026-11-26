using AgriPurchaseBilling.Application.DTOs;
using AgriPurchaseBilling.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace AgriPurchaseBilling.Api.Controllers
{
    /// <summary>
    /// Customer Portal – My Cart APIs strictly scoped to the authenticated Customer's JWT identity.
    /// Handles cart retrieval, item additions, quantity updates, removals, and cart clearing.
    /// Server-side prices and stock limits are strictly enforced against trusted database records.
    /// </summary>
    [ApiController]
    [Authorize(Roles = "Customer")]
    [Route("api/v1/customer/cart")]
    [Produces("application/json")]
    public sealed class CustomerCartController : ControllerBase
    {
        private readonly ICustomerCartService _cartService;

        public CustomerCartController(ICustomerCartService cartService)
        {
            _cartService = cartService;
        }

        /// <summary>
        /// Retrieves the current customer's shopping cart, complete with enriched product details,
        /// line item subtotals, live stock status, and overall cart total.
        /// </summary>
        [HttpGet]
        [ProducesResponseType(typeof(ApiResponse<CustomerCartDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        public async Task<IActionResult> GetCart(CancellationToken cancellationToken)
        {
            if (!TryGetAuthenticatedCustomerUserId(out long customerUserId))
            {
                return Unauthorized(ApiResponse<CustomerCartDto>.Fail("Invalid or missing customer authentication claim."));
            }

            var result = await _cartService.GetCartAsync(customerUserId, cancellationToken);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        /// <summary>
        /// Adds a product to the customer's cart. If the product already exists in the cart,
        /// increments the quantity up to available inventory. Server calculates price from catalog.
        /// </summary>
        [HttpPost("items")]
        [ProducesResponseType(typeof(ApiResponse<CustomerCartDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<CustomerCartDto>), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(ApiResponse<CustomerCartDto>), StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        public async Task<IActionResult> AddToCart(
            [FromBody] AddToCartRequestDto request,
            CancellationToken cancellationToken)
        {
            if (!TryGetAuthenticatedCustomerUserId(out long customerUserId))
            {
                return Unauthorized(ApiResponse<CustomerCartDto>.Fail("Invalid or missing customer authentication claim."));
            }

            if (!ModelState.IsValid)
            {
                return BadRequest(ApiResponse<CustomerCartDto>.Fail("Invalid request payload."));
            }

            var result = await _cartService.AddToCartAsync(customerUserId, request, cancellationToken);
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

        /// <summary>
        /// Updates the quantity of an existing item in the customer's cart.
        /// Validates stock availability before applying the update.
        /// </summary>
        [HttpPut("items/{id:long}")]
        [HttpPatch("items/{id:long}")]
        [ProducesResponseType(typeof(ApiResponse<CustomerCartDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<CustomerCartDto>), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(ApiResponse<CustomerCartDto>), StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        public async Task<IActionResult> UpdateQuantity(
            [FromRoute] long id,
            [FromBody] UpdateCartItemRequestDto request,
            CancellationToken cancellationToken)
        {
            if (!TryGetAuthenticatedCustomerUserId(out long customerUserId))
            {
                return Unauthorized(ApiResponse<CustomerCartDto>.Fail("Invalid or missing customer authentication claim."));
            }

            if (id <= 0)
            {
                return BadRequest(ApiResponse<CustomerCartDto>.Fail("Invalid cart item ID."));
            }

            if (!ModelState.IsValid)
            {
                return BadRequest(ApiResponse<CustomerCartDto>.Fail("Invalid request payload."));
            }

            var result = await _cartService.UpdateQuantityAsync(customerUserId, id, request, cancellationToken);
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

        /// <summary>
        /// Removes an individual item from the customer's cart by cart item ID.
        /// Returns 404 if the item does not exist or belongs to another customer.
        /// </summary>
        [HttpDelete("items/{id:long}")]
        [ProducesResponseType(typeof(ApiResponse<CustomerCartDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<CustomerCartDto>), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(ApiResponse<CustomerCartDto>), StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        public async Task<IActionResult> RemoveItem(
            [FromRoute] long id,
            CancellationToken cancellationToken)
        {
            if (!TryGetAuthenticatedCustomerUserId(out long customerUserId))
            {
                return Unauthorized(ApiResponse<CustomerCartDto>.Fail("Invalid or missing customer authentication claim."));
            }

            if (id <= 0)
            {
                return BadRequest(ApiResponse<CustomerCartDto>.Fail("Invalid cart item ID."));
            }

            var result = await _cartService.RemoveItemAsync(customerUserId, id, cancellationToken);
            if (!result.Success)
            {
                return NotFound(result);
            }

            return Ok(result);
        }

        /// <summary>
        /// Clears all items from the customer's cart.
        /// </summary>
        [HttpDelete]
        [ProducesResponseType(typeof(ApiResponse<CustomerCartDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        public async Task<IActionResult> ClearCart(CancellationToken cancellationToken)
        {
            if (!TryGetAuthenticatedCustomerUserId(out long customerUserId))
            {
                return Unauthorized(ApiResponse<CustomerCartDto>.Fail("Invalid or missing customer authentication claim."));
            }

            var result = await _cartService.ClearCartAsync(customerUserId, cancellationToken);
            return Ok(result);
        }

        /// <summary>
        /// Executes checkout for the authenticated Customer. Reads cart items from the database,
        /// verifies stock availability, calculates prices server-side, verifies delivery address ownership,
        /// decrements inventory, creates order(s) transactionally, sends notifications, and clears the cart.
        /// </summary>
        [HttpPost("checkout")]
        [ProducesResponseType(typeof(ApiResponse<CustomerCheckoutResultDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<CustomerCheckoutResultDto>), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        public async Task<IActionResult> Checkout(
            [FromBody] CustomerCheckoutRequestDto? request,
            CancellationToken cancellationToken)
        {
            if (!TryGetAuthenticatedCustomerUserId(out long customerUserId))
            {
                return Unauthorized(ApiResponse<CustomerCheckoutResultDto>.Fail("Invalid or missing customer authentication claim."));
            }

            var result = await _cartService.CheckoutAsync(customerUserId, request ?? new CustomerCheckoutRequestDto(), cancellationToken);
            if (!result.Success)
            {
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

