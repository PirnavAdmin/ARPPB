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
    [Route("api/v1/vendor/finished-products")]
    [Route("api/v1/vendor/products")]
    [Produces("application/json")]
    public sealed class VendorFinishedProductsController : ControllerBase
    {
        private readonly IVendorInventoryProcessingService _inventoryService;
        private readonly IVendorResolver _vendorResolver;

        public VendorFinishedProductsController(
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
        [ProducesResponseType(typeof(ApiResponse<VendorFinishedProductsOverviewDto>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetOverview(CancellationToken cancellationToken)
        {
            var vendorId = await ResolveVendorIdAsync(cancellationToken);
            var overview = await _inventoryService.GetFinishedProductsOverviewAsync(vendorId, cancellationToken);
            return Ok(ApiResponse<VendorFinishedProductsOverviewDto>.Ok(overview, "Finished products inventory overview retrieved successfully."));
        }

        [HttpGet]
        [ProducesResponseType(typeof(ApiResponse<List<VendorFinishedProductDto>>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetProducts(
            [FromQuery] string? search = null,
            [FromQuery] string? category = null,
            [FromQuery] string? sourceRawMaterial = null,
            [FromQuery] string? status = null,
            CancellationToken cancellationToken = default)
        {
            var vendorId = await ResolveVendorIdAsync(cancellationToken);
            var products = await _inventoryService.GetFinishedProductsAsync(
                vendorId, search, category, sourceRawMaterial, status, cancellationToken);
            return Ok(ApiResponse<List<VendorFinishedProductDto>>.Ok(products, "Finished products retrieved successfully."));
        }

        [HttpGet("{productId}")]
        [ProducesResponseType(typeof(ApiResponse<VendorFinishedProductDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<VendorFinishedProductDto>), StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetProductById(string productId, CancellationToken cancellationToken)
        {
            var vendorId = await ResolveVendorIdAsync(cancellationToken);
            var product = await _inventoryService.GetFinishedProductByIdAsync(vendorId, productId, cancellationToken);
            return product == null
                ? NotFound(ApiResponse<VendorFinishedProductDto>.Fail("Finished product not found."))
                : Ok(ApiResponse<VendorFinishedProductDto>.Ok(product, "Finished product details retrieved successfully."));
        }

        [HttpPost]
        [ProducesResponseType(typeof(ApiResponse<VendorFinishedProductDto>), StatusCodes.Status201Created)]
        [ProducesResponseType(typeof(ApiResponse<VendorFinishedProductDto>), StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> CreateProduct(
            [FromBody] CreateFinishedProductRequest request,
            CancellationToken cancellationToken)
        {
            var vendorId = await ResolveVendorIdAsync(cancellationToken);
            var created = await _inventoryService.CreateFinishedProductAsync(vendorId, request, cancellationToken);
            return CreatedAtAction(nameof(GetProductById), new { productId = created.ProductId },
                ApiResponse<VendorFinishedProductDto>.Ok(created, "Finished product created successfully."));
        }

        [HttpPut("{productId}")]
        [ProducesResponseType(typeof(ApiResponse<VendorFinishedProductDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<VendorFinishedProductDto>), StatusCodes.Status404NotFound)]
        public async Task<IActionResult> UpdateProduct(
            string productId,
            [FromBody] UpdateFinishedProductRequest request,
            CancellationToken cancellationToken)
        {
            var vendorId = await ResolveVendorIdAsync(cancellationToken);
            var updated = await _inventoryService.UpdateFinishedProductAsync(vendorId, productId, request, cancellationToken);
            return updated == null
                ? NotFound(ApiResponse<VendorFinishedProductDto>.Fail("Finished product not found."))
                : Ok(ApiResponse<VendorFinishedProductDto>.Ok(updated, "Finished product updated successfully."));
        }

        [HttpPost("{productId}/adjust-stock")]
        [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status404NotFound)]
        public async Task<IActionResult> AdjustStock(
            string productId,
            [FromBody] AdjustFinishedProductStockRequest request,
            CancellationToken cancellationToken)
        {
            var vendorId = await ResolveVendorIdAsync(cancellationToken);
            var success = await _inventoryService.AdjustFinishedProductStockAsync(vendorId, productId, request, cancellationToken);
            return success
                ? Ok(ApiResponse<bool>.Ok(true, "Finished product stock adjusted successfully."))
                : NotFound(ApiResponse<bool>.Fail("Finished product not found."));
        }

        [HttpGet("{productId}/movements")]
        [ProducesResponseType(typeof(ApiResponse<List<VendorFinishedProductMovementDto>>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetProductMovements(string productId, CancellationToken cancellationToken)
        {
            var vendorId = await ResolveVendorIdAsync(cancellationToken);
            var movements = await _inventoryService.GetFinishedProductMovementsAsync(vendorId, productId, cancellationToken);
            return Ok(ApiResponse<List<VendorFinishedProductMovementDto>>.Ok(movements, "Finished product stock movements retrieved successfully."));
        }

        [HttpPatch("{productId}/status")]
        [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status404NotFound)]
        public async Task<IActionResult> ToggleStatus(string productId, CancellationToken cancellationToken)
        {
            var vendorId = await ResolveVendorIdAsync(cancellationToken);
            var success = await _inventoryService.ToggleFinishedProductStatusAsync(vendorId, productId, cancellationToken);
            return success
                ? Ok(ApiResponse<bool>.Ok(true, "Finished product status toggled successfully."))
                : NotFound(ApiResponse<bool>.Fail("Finished product not found."));
        }

        [HttpGet("export")]
        public async Task<IActionResult> ExportCsv(CancellationToken cancellationToken)
        {
            var vendorId = await ResolveVendorIdAsync(cancellationToken);
            var csvBytes = await _inventoryService.ExportFinishedProductsCsvAsync(vendorId, cancellationToken);
            return File(csvBytes, "text/csv", $"finished-products-inventory-{DateTime.UtcNow:yyyyMMdd}.csv");
        }
    }
}
