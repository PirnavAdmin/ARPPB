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
    [Route("api/v1/vendor/processing")]
    [Produces("application/json")]
    public sealed class VendorProcessingController : ControllerBase
    {
        private readonly IVendorInventoryProcessingService _inventoryService;
        private readonly IVendorResolver _vendorResolver;

        public VendorProcessingController(
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
        [ProducesResponseType(typeof(ApiResponse<VendorProcessingOverviewDto>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetOverview(CancellationToken cancellationToken)
        {
            var vendorId = await ResolveVendorIdAsync(cancellationToken);
            var overview = await _inventoryService.GetProcessingOverviewAsync(vendorId, cancellationToken);
            return Ok(ApiResponse<VendorProcessingOverviewDto>.Ok(overview, "Product processing overview retrieved successfully."));
        }

        [HttpGet("")]
        [HttpGet("batches")]
        [ProducesResponseType(typeof(ApiResponse<List<VendorProcessingBatchDto>>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetBatches(
            [FromQuery] string? search = null,
            [FromQuery] string? rawMaterial = null,
            [FromQuery] string? status = null,
            CancellationToken cancellationToken = default)
        {
            var vendorId = await ResolveVendorIdAsync(cancellationToken);
            var batches = await _inventoryService.GetProcessingBatchesAsync(
                vendorId, search, rawMaterial, status, cancellationToken);
            return Ok(ApiResponse<List<VendorProcessingBatchDto>>.Ok(batches, "Processing batches retrieved successfully."));
        }

        [HttpGet("{processingId}")]
        [HttpGet("batches/{processingId}")]
        [ProducesResponseType(typeof(ApiResponse<VendorProcessingBatchDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<VendorProcessingBatchDto>), StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetBatchById(string processingId, CancellationToken cancellationToken)
        {
            var vendorId = await ResolveVendorIdAsync(cancellationToken);
            var batch = await _inventoryService.GetProcessingBatchByIdAsync(vendorId, processingId, cancellationToken);
            return batch == null
                ? NotFound(ApiResponse<VendorProcessingBatchDto>.Fail("Processing batch not found."))
                : Ok(ApiResponse<VendorProcessingBatchDto>.Ok(batch, "Processing batch details retrieved successfully."));
        }

        [HttpPost("")]
        [HttpPost("batches")]
        [ProducesResponseType(typeof(ApiResponse<VendorProcessingBatchDto>), StatusCodes.Status201Created)]
        [ProducesResponseType(typeof(ApiResponse<VendorProcessingBatchDto>), StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> CreateBatch(
            [FromBody] CreateProcessingBatchRequest request,
            CancellationToken cancellationToken)
        {
            var vendorId = await ResolveVendorIdAsync(cancellationToken);
            var created = await _inventoryService.CreateProcessingBatchAsync(vendorId, request, cancellationToken);
            return CreatedAtAction(nameof(GetBatchById), new { processingId = created.ProcessingId },
                ApiResponse<VendorProcessingBatchDto>.Ok(created, "Processing batch created successfully."));
        }

        [HttpGet("export")]
        public async Task<IActionResult> ExportCsv(CancellationToken cancellationToken)
        {
            var vendorId = await ResolveVendorIdAsync(cancellationToken);
            var csvBytes = await _inventoryService.ExportProcessingBatchesCsvAsync(vendorId, cancellationToken);
            return File(csvBytes, "text/csv", $"product-processing-batches-{DateTime.UtcNow:yyyyMMdd}.csv");
        }
    }
}
