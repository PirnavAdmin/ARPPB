using System.Security.Claims;
using AgriPurchaseBilling.Application.DTOs;
using AgriPurchaseBilling.Application.DTOs.VendorOperations;
using AgriPurchaseBilling.Application.Interfaces;
using AgriPurchaseBilling.Application.Interfaces.VendorPortal;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace AgriPurchaseBilling.Api.Controllers
{
    [ApiController]
    [Authorize(Roles = "Vendor")]
    [Route("api/v1/vendor/inventory/raw-materials")]
    [Route("api/v1/vendor/inventory")]
    [Produces("application/json")]
    public sealed class VendorRawMaterialInventoryController : ControllerBase
    {
        private readonly IVendorInventoryProcessingService _inventoryService;
        private readonly IVendorResolver _vendorResolver;

        public VendorRawMaterialInventoryController(
            IVendorInventoryProcessingService inventoryService,
            IVendorResolver vendorResolver)
        {
            _inventoryService = inventoryService;
            _vendorResolver = vendorResolver;
        }

        private async Task<long> ResolveVendorIdAsync(CancellationToken cancellationToken)
        {
            var value = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (long.TryParse(value, out var userId) && userId > 0)
            {
                return await _vendorResolver.GetVendorIdAsync(userId, cancellationToken);
            }
            return 1;
        }

        [HttpGet("overview")]
        [ProducesResponseType(typeof(ApiResponse<VendorRawMaterialOverviewDto>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetOverview(CancellationToken cancellationToken)
        {
            var vendorId = await ResolveVendorIdAsync(cancellationToken);
            var overview = await _inventoryService.GetRawMaterialOverviewAsync(vendorId, cancellationToken);
            return Ok(ApiResponse<VendorRawMaterialOverviewDto>.Ok(overview, "Raw material inventory overview retrieved successfully."));
        }

        [HttpGet]
        [ProducesResponseType(typeof(ApiResponse<List<VendorRawMaterialStockDto>>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetStocks(
            [FromQuery] string? search = null,
            [FromQuery] string? crop = null,
            [FromQuery] string? supplierType = null,
            [FromQuery] string? grade = null,
            [FromQuery] string? stockStatus = null,
            CancellationToken cancellationToken = default)
        {
            var vendorId = await ResolveVendorIdAsync(cancellationToken);
            var stocks = await _inventoryService.GetRawMaterialStocksAsync(
                vendorId, search, crop, supplierType, grade, stockStatus, cancellationToken);
            return Ok(ApiResponse<List<VendorRawMaterialStockDto>>.Ok(stocks, "Raw material stocks retrieved successfully."));
        }

        [HttpGet("{stockId}")]
        [ProducesResponseType(typeof(ApiResponse<VendorRawMaterialStockDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<VendorRawMaterialStockDto>), StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetStockById(string stockId, CancellationToken cancellationToken)
        {
            var vendorId = await ResolveVendorIdAsync(cancellationToken);
            var stock = await _inventoryService.GetRawMaterialStockByIdAsync(vendorId, stockId, cancellationToken);
            return stock == null
                ? NotFound(ApiResponse<VendorRawMaterialStockDto>.Fail("Raw material stock lot not found."))
                : Ok(ApiResponse<VendorRawMaterialStockDto>.Ok(stock, "Raw material stock lot retrieved successfully."));
        }

        [HttpPost]
        [ProducesResponseType(typeof(ApiResponse<VendorRawMaterialStockDto>), StatusCodes.Status201Created)]
        [ProducesResponseType(typeof(ApiResponse<VendorRawMaterialStockDto>), StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> CreateStock(
            [FromBody] CreateRawMaterialStockRequest request,
            CancellationToken cancellationToken)
        {
            try
            {
                var vendorId = await ResolveVendorIdAsync(cancellationToken);
                var created = await _inventoryService.CreateRawMaterialStockAsync(vendorId, request, cancellationToken);
                return StatusCode(StatusCodes.Status201Created, ApiResponse<VendorRawMaterialStockDto>.Ok(created, "Raw material stock batch created successfully."));
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ApiResponse<VendorRawMaterialStockDto>.Fail(ex.Message));
            }
        }

        [HttpGet("movements")]
        [ProducesResponseType(typeof(ApiResponse<List<VendorStockMovementDto>>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetStockMovements(CancellationToken cancellationToken)
        {
            var vendorId = await ResolveVendorIdAsync(cancellationToken);
            var movements = await _inventoryService.GetStockMovementsAsync(vendorId, cancellationToken);
            return Ok(ApiResponse<List<VendorStockMovementDto>>.Ok(movements, "Stock movement history ledger retrieved successfully."));
        }

        [HttpGet("export")]
        public async Task<IActionResult> ExportCsv(CancellationToken cancellationToken)
        {
            var vendorId = await ResolveVendorIdAsync(cancellationToken);
            var csvBytes = await _inventoryService.ExportRawMaterialsCsvAsync(vendorId, cancellationToken);
            return File(csvBytes, "text/csv", $"raw-materials-inventory-{DateTime.UtcNow:yyyyMMdd}.csv");
        }
    }
}
