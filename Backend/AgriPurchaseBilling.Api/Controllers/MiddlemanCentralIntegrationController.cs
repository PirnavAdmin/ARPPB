using System.Linq;
using System.Security.Claims;
using System.Threading;
using System.Threading.Tasks;
using AgriPurchaseBilling.Application.DTOs;
using AgriPurchaseBilling.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace AgriPurchaseBilling.Api.Controllers
{
    /// <summary>
    /// Centralized Multi-Portal Integration APIs for Middleman Portal.
    /// Provides real-time cross-portal data access for Farmers, Vendors, Customers, Middlemen,
    /// farmer produce listings, and customer orders without data duplication.
    /// </summary>
    [ApiController]
    [Route("api/v1/middleman/central")]
    [Tags("Middleman - Centralized Multi-Portal Integration")]
    [Authorize(Roles = "Middleman,Admin")]
    [Produces("application/json")]
    public class MiddlemanCentralIntegrationController : ControllerBase
    {
        private readonly IMiddlemanCentralIntegrationService _centralService;

        public MiddlemanCentralIntegrationController(IMiddlemanCentralIntegrationService centralService)
        {
            _centralService = centralService;
        }

        private long GetUserId()
        {
            var value = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (long.TryParse(value, out var id)) return id;
            if (Request.Headers.TryGetValue("X-User-Id", out var hVal) && long.TryParse(hVal.FirstOrDefault(), out var hId))
                return hId;
            return 57;
        }

        /// <summary>
        /// Retrieves total counts of registered entities across all 4 portals (Farmers, Vendors, Customers, Middlemen).
        /// GET /api/v1/middleman/central/summary
        /// </summary>
        [HttpGet("summary")]
        [ProducesResponseType(typeof(ApiResponse<UnifiedPortalSummaryDto>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetSummary(CancellationToken ct)
        {
            var userId = GetUserId();
            var summary = await _centralService.GetPortalSummaryAsync(userId, ct);
            return Ok(ApiResponse<UnifiedPortalSummaryDto>.Ok(summary, "Portal registration summary retrieved successfully."));
        }

        /// <summary>
        /// Retrieves centralized list of registered Farmers (from Farmer Portal and Middleman offline records).
        /// Supports search, district, status, source filter (Portal/Middleman), and pagination.
        /// GET /api/v1/middleman/central/farmers
        /// </summary>
        [HttpGet("farmers")]
        [ProducesResponseType(typeof(ApiResponse<UnifiedPagedResultDto<UnifiedFarmerItemDto>>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetFarmers([FromQuery] UnifiedPortalQueryDto query, CancellationToken ct)
        {
            var userId = GetUserId();
            var result = await _centralService.GetFarmersAsync(userId, query, ct);
            return Ok(ApiResponse<UnifiedPagedResultDto<UnifiedFarmerItemDto>>.Ok(result, "Integrated farmers list retrieved successfully."));
        }

        /// <summary>
        /// Retrieves centralized list of registered Commercial Vendors (from Vendor Portal and Middleman offline records).
        /// Supports search, district, status, business type, and pagination.
        /// GET /api/v1/middleman/central/vendors
        /// </summary>
        [HttpGet("vendors")]
        [ProducesResponseType(typeof(ApiResponse<UnifiedPagedResultDto<UnifiedVendorItemDto>>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetVendors([FromQuery] UnifiedPortalQueryDto query, CancellationToken ct)
        {
            var userId = GetUserId();
            var result = await _centralService.GetVendorsAsync(userId, query, ct);
            return Ok(ApiResponse<UnifiedPagedResultDto<UnifiedVendorItemDto>>.Ok(result, "Integrated vendors list retrieved successfully."));
        }

        /// <summary>
        /// Retrieves centralized list of registered Customers (from Customer Portal and Middleman offline records).
        /// Supports search, district, status, and pagination.
        /// GET /api/v1/middleman/central/customers
        /// </summary>
        [HttpGet("customers")]
        [ProducesResponseType(typeof(ApiResponse<UnifiedPagedResultDto<UnifiedCustomerItemDto>>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetCustomers([FromQuery] UnifiedPortalQueryDto query, CancellationToken ct)
        {
            var userId = GetUserId();
            var result = await _centralService.GetCustomersAsync(userId, query, ct);
            return Ok(ApiResponse<UnifiedPagedResultDto<UnifiedCustomerItemDto>>.Ok(result, "Integrated customers list retrieved successfully."));
        }

        /// <summary>
        /// Retrieves centralized list of registered Middlemen across the platform.
        /// Supports search, district, status, and pagination.
        /// GET /api/v1/middleman/central/middlemen
        /// </summary>
        [HttpGet("middlemen")]
        [ProducesResponseType(typeof(ApiResponse<UnifiedPagedResultDto<UnifiedMiddlemanItemDto>>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetMiddlemen([FromQuery] UnifiedPortalQueryDto query, CancellationToken ct)
        {
            var userId = GetUserId();
            var result = await _centralService.GetMiddlemenAsync(userId, query, ct);
            return Ok(ApiResponse<UnifiedPagedResultDto<UnifiedMiddlemanItemDto>>.Ok(result, "Integrated middlemen list retrieved successfully."));
        }

        /// <summary>
        /// Retrieves cross-portal Farmer Sell Product listings (farmer produce available for middleman procurement).
        /// GET /api/v1/middleman/central/farmer-purchases
        /// </summary>
        [HttpGet("farmer-purchases")]
        [ProducesResponseType(typeof(ApiResponse<UnifiedPagedResultDto<SellOrderResponseDto>>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetFarmerPurchases([FromQuery] UnifiedPortalQueryDto query, CancellationToken ct)
        {
            var userId = GetUserId();
            var result = await _centralService.GetFarmerSellProductsAsync(userId, query, ct);
            return Ok(ApiResponse<UnifiedPagedResultDto<SellOrderResponseDto>>.Ok(result, "Farmer produce listings retrieved successfully."));
        }

        /// <summary>
        /// Retrieves purchases made from the Middleman by Customers and Vendors.
        /// Strictly includes transactions conducted through the Middleman (Middleman as seller).
        /// Supports search, status, buyer type filter (Source: 'Customer', 'Vendor', or 'ALL'), and pagination.
        /// GET /api/v1/middleman/central/customer-orders
        /// GET /api/v1/middleman/central/buyer-orders
        /// GET /api/v1/middleman/central/sales-orders
        /// </summary>
        [HttpGet("customer-orders")]
        [HttpGet("buyer-orders")]
        [HttpGet("sales-orders")]
        [ProducesResponseType(typeof(ApiResponse<UnifiedPagedResultDto<UnifiedMiddlemanBuyerOrderDto>>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetCustomerOrders([FromQuery] UnifiedPortalQueryDto query, CancellationToken ct)
        {
            var userId = GetUserId();
            var result = await _centralService.GetCustomerOrdersAsync(userId, query, ct);
            return Ok(ApiResponse<UnifiedPagedResultDto<UnifiedMiddlemanBuyerOrderDto>>.Ok(result, "Middleman buyer purchases and sales orders retrieved successfully."));
        }
    }
}
