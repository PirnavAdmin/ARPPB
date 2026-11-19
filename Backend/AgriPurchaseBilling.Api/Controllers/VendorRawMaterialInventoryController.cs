using System.Security.Claims;
using AgriPurchaseBilling.Application.DTOs;
using AgriPurchaseBilling.Application.DTOs.VendorOperations;
using AgriPurchaseBilling.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace AgriPurchaseBilling.Api.Controllers
{
    [ApiController]
    [Authorize(Roles = "Vendor")]
    [Route("api/v1/vendor/inventory/raw-materials")]
    [Produces("application/json")]
    public sealed class VendorRawMaterialInventoryController : ControllerBase
    {
        private readonly IVendorInventoryProcessingService _inventoryService;

        public VendorRawMaterialInventoryController(IVendorInventoryProcessingService inventoryService)
        {
            _inventoryService = inventoryService;
        }

        private long CurrentVendorId
        {
            get
            {
                var value = User.FindFirstValue(ClaimTypes.NameIdentifier);
                return long.TryParse(value, out var userId) && userId > 0 ? userId : 1;
            }
        }

        [HttpGet("overview")]
        [ProducesResponseType(typeof(ApiResponse<VendorRawMaterialOverviewDto>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetOverview(CancellationToken cancellationToken)
        {
            var overview = await _inventoryService.GetRawMaterialOverviewAsync(CurrentVendorId, cancellationToken);
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
            var stocks = await _inventoryService.GetRawMaterialStocksAsync(
                CurrentVendorId, search, crop, supplierType, grade, stockStatus, cancellationToken);
            return Ok(ApiResponse<List<VendorRawMaterialStockDto>>.Ok(stocks, "Raw material stocks retrieved successfully."));
        }

        [HttpGet("{stockId}")]
        [ProducesResponseType(typeof(ApiResponse<VendorRawMaterialStockDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<VendorRawMaterialStockDto>), StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetStockById(string stockId, CancellationToken cancellationToken)
        {
            var stock = await _inventoryService.GetRawMaterialStockByIdAsync(CurrentVendorId, stockId, cancellationToken);
            return stock == null
                ? NotFound(ApiResponse<VendorRawMaterialStockDto>.Fail("Raw material stock lot not found."))
                : Ok(ApiResponse<VendorRawMaterialStockDto>.Ok(stock, "Raw material stock lot retrieved successfully."));
        }

        [HttpGet("movements")]
        [ProducesResponseType(typeof(ApiResponse<List<VendorStockMovementDto>>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetStockMovements(CancellationToken cancellationToken)
        {
            var movements = await _inventoryService.GetStockMovementsAsync(CurrentVendorId, cancellationToken);
            return Ok(ApiResponse<List<VendorStockMovementDto>>.Ok(movements, "Stock movement history ledger retrieved successfully."));
        }

        [HttpGet("export")]
        public async Task<IActionResult> ExportCsv(CancellationToken cancellationToken)
        {
            var csvBytes = await _inventoryService.ExportRawMaterialsCsvAsync(CurrentVendorId, cancellationToken);
            return File(csvBytes, "text/csv", $"raw-materials-inventory-{DateTime.UtcNow:yyyyMMdd}.csv");
        }
    }
}
