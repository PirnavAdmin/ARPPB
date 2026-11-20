using System;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using AgriPurchaseBilling.Application.DTOs;
using AgriPurchaseBilling.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AgriPurchaseBilling.Api.Controllers
{
    [ApiController]
    [Route("api/v1/middleman/inventory")]
    [Tags("Middleman - Inventory")]
    [Authorize(Roles = "Middleman,Admin")]
    public class MiddlemanInventoryController : ControllerBase
    {
        private readonly IMiddlemanInventoryService _inventoryService;

        public MiddlemanInventoryController(IMiddlemanInventoryService inventoryService)
        {
            _inventoryService = inventoryService;
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
        /// Get the full Inventory summary with 4 KPI metrics (Purchased: 770 Qtl, Sold: 520 Qtl, Available: 250 Qtl, Low Stock: 2 Batches) and active batches.
        /// GET /api/v1/middleman/inventory
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetInventory()
        {
            var userId = GetUserId();
            var summary = await _inventoryService.GetSummaryAsync(userId);
            return Ok(new { success = true, data = summary });
        }

        /// <summary>
        /// Get inventory summary cards metrics.
        /// GET /api/v1/middleman/inventory/summary
        /// </summary>
        [HttpGet("summary")]
        public async Task<IActionResult> GetSummary()
        {
            var userId = GetUserId();
            var summary = await _inventoryService.GetSummaryAsync(userId);
            return Ok(new { success = true, data = summary });
        }

        /// <summary>
        /// Get filtered and paginated inventory batches.
        /// GET /api/v1/middleman/inventory/batches
        /// </summary>
        [HttpGet("batches")]
        public async Task<IActionResult> GetBatches([FromQuery] MiddlemanInventoryQueryDto query)
        {
            var userId = GetUserId();
            var page = await _inventoryService.GetBatchesAsync(userId, query);
            return Ok(new { success = true, data = page });
        }

        /// <summary>
        /// Get single batch traceability details by ID or Stock Code (e.g. STK-0001).
        /// GET /api/v1/middleman/inventory/batches/{id}
        /// </summary>
        [HttpGet("batches/{id}")]
        public async Task<IActionResult> GetBatchById(string id)
        {
            var userId = GetUserId();
            var batch = await _inventoryService.GetBatchByIdAsync(userId, id);
            if (batch == null) return NotFound(new { success = false, message = $"Stock batch '{id}' not found." });
            return Ok(new { success = true, data = batch });
        }

        /// <summary>
        /// Procure new stock / create new inventory batch.
        /// POST /api/v1/middleman/inventory/batches
        /// </summary>
        [HttpPost("batches")]
        public async Task<IActionResult> CreateBatch([FromBody] CreateInventoryBatchRequest request)
        {
            if (request == null || string.IsNullOrWhiteSpace(request.CropName) || request.PurchasedQuantity <= 0)
            {
                return BadRequest(new { success = false, message = "Valid CropName and PurchasedQuantity (> 0) are required." });
            }

            var userId = GetUserId();
            var created = await _inventoryService.CreateBatchAsync(userId, request);
            return CreatedAtAction(nameof(GetBatchById), new { id = created.StockId }, new { success = true, message = "Stock batch created successfully.", data = created });
        }

        /// <summary>
        /// Update stock batch (available quantity, godown location, minimum threshold, status).
        /// PUT /api/v1/middleman/inventory/batches/{id:long}
        /// </summary>
        [HttpPut("batches/{id:long}")]
        public async Task<IActionResult> UpdateBatch(long id, [FromBody] UpdateInventoryBatchRequest request)
        {
            var userId = GetUserId();
            var updated = await _inventoryService.UpdateBatchAsync(userId, id, request);
            if (updated == null) return NotFound(new { success = false, message = $"Stock batch with ID '{id}' not found." });
            return Ok(new { success = true, message = "Stock batch updated successfully.", data = updated });
        }
    }
}
