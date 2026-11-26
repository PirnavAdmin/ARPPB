using AgriPurchaseBilling.Application.DTOs;
using AgriPurchaseBilling.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AgriPurchaseBilling.Api.Controllers
{
    /// <summary>
    /// Read-only Customer Marketplace APIs exposing eligible vendor-listed finished products
    /// from the shared `vendor_finished_products` catalog.
    /// </summary>
    [ApiController]
    [Authorize(Roles = "Customer")]
    [Route("api/v1/customer/marketplace")]
    [Produces("application/json")]
    public sealed class CustomerMarketplaceController : ControllerBase
    {
        private readonly ICustomerMarketplaceService _marketplaceService;

        public CustomerMarketplaceController(ICustomerMarketplaceService marketplaceService)
        {
            _marketplaceService = marketplaceService;
        }

        /// <summary>
        /// Returns distinct product categories derived from eligible, active, in-stock vendor products,
        /// along with product counts and total available quantity.
        /// </summary>
        [HttpGet("categories")]
        [ProducesResponseType(typeof(ApiResponse<List<CustomerMarketplaceCategoryDto>>), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        public async Task<IActionResult> GetCategories(CancellationToken cancellationToken)
        {
            var result = await _marketplaceService.GetCategoriesAsync(cancellationToken);
            return Ok(result);
        }

        /// <summary>
        /// Returns a paginated list of eligible vendor products supporting filtering by category,
        /// search term (product name, brand, product code, category, district, or state), location,
        /// district, state, vendorId (Vendors.Id only), price range, stockStatus (all, in_stock [qty &gt; 20],
        /// low_stock [0 &lt; qty &lt;= 20], out_of_stock [qty &lt;= 0]), backward-compatible inStockOnly
        /// (qty &gt; 0 when stockStatus is omitted), and sorting (popular, price_asc, price_desc, recent, newest).
        /// </summary>
        [HttpGet("products")]
        [ProducesResponseType(typeof(ApiResponse<CustomerMarketplacePagedProductsDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<CustomerMarketplacePagedProductsDto>), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        public async Task<IActionResult> GetProducts(
            [FromQuery] CustomerMarketplaceProductQueryDto query,
            CancellationToken cancellationToken)
        {
            var result = await _marketplaceService.GetProductsAsync(query, cancellationToken);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        /// <summary>
        /// Returns customer-safe product details and vendor information for a single eligible product.
        /// </summary>
        [HttpGet("products/{id:long}")]
        [ProducesResponseType(typeof(ApiResponse<CustomerMarketplaceProductDetailDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<CustomerMarketplaceProductDetailDto>), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(ApiResponse<CustomerMarketplaceProductDetailDto>), StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        public async Task<IActionResult> GetProductById(
            [FromRoute] long id,
            CancellationToken cancellationToken)
        {
            if (id <= 0)
            {
                return BadRequest(ApiResponse<CustomerMarketplaceProductDetailDto>.Fail("Invalid product ID."));
            }

            var result = await _marketplaceService.GetProductByIdAsync(id, cancellationToken);
            return result.Success ? Ok(result) : NotFound(result);
        }
    }
}

