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
    [Route("api/v1/middleman/my-inventory")]
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
        /// Unified My Inventory endpoint: returns 4 KPI metrics, godown statistics, and active stock batches with batch tracing, or single batch by ID.
        /// GET /api/v1/middleman/inventory
        /// GET /api/v1/middleman/my-inventory
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetInventory(
            [FromQuery] string? id = null,
            [FromQuery] string? batchId = null,
            [FromQuery] MiddlemanInventoryQueryDto? query = null)
        {
            var userId = GetUserId();
            var targetId = id ?? batchId;
            if (!string.IsNullOrWhiteSpace(targetId))
            {
                var batch = await _inventoryService.GetBatchByIdAsync(userId, targetId);
                if (batch == null) return NotFound(new { success = false, message = $"Stock batch '{targetId}' not found." });
                return Ok(new { success = true, data = batch });
            }

            var summary = await _inventoryService.GetSummaryAsync(userId);
            return Ok(new
            {
                success = true,
                summary = summary,
                totalPurchasedQuantity = summary.TotalPurchasedStock,
                totalSoldQuantity = summary.TotalSoldStock,
                availableStockQuantity = summary.AvailableStock,
                lowStockBatchCount = summary.LowStockBatches,
                batches = summary.Batches,
                data = summary
            });
        }

        [HttpGet("summary")]
        [ApiExplorerSettings(IgnoreApi = true)]
        public async Task<IActionResult> GetSummary()
        {
            var userId = GetUserId();
            var summary = await _inventoryService.GetSummaryAsync(userId);
            return Ok(new { success = true, data = summary });
        }

        [HttpGet("batches")]
        [ApiExplorerSettings(IgnoreApi = true)]
        public async Task<IActionResult> GetBatches([FromQuery] MiddlemanInventoryQueryDto query)
        {
            var userId = GetUserId();
            var page = await _inventoryService.GetBatchesAsync(userId, query);
            return Ok(new { success = true, data = page });
        }

        [HttpGet("batches/{id}")]
        [ApiExplorerSettings(IgnoreApi = true)]
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
        /// POST /api/v1/middleman/my-inventory/batches
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
        /// Accepts numeric ID or stock code (e.g. 1 or STK-0001).
        /// PUT /api/v1/middleman/inventory/batches/{id}
        /// </summary>
        [HttpPut("batches/{id}")]
        public async Task<IActionResult> UpdateBatch(string id, [FromBody] UpdateInventoryBatchRequest request)
        {
            var userId = GetUserId();
            long numericId = 0;
            if (long.TryParse(id, out var parsed) && parsed > 0)
            {
                numericId = parsed;
            }
            else
            {
                var existing = await _inventoryService.GetBatchByIdAsync(userId, id);
                if (existing != null) numericId = existing.Id;
                else
                {
                    var match = System.Text.RegularExpressions.Regex.Match(id ?? string.Empty, @"\d+");
                    if (match.Success && long.TryParse(match.Value, out var num) && num > 0) numericId = num;
                }
            }

            var updated = await _inventoryService.UpdateBatchAsync(userId, numericId, request);
            if (updated == null) return NotFound(new { success = false, message = $"Stock batch with ID '{id}' not found." });
            return Ok(new { success = true, message = "Stock batch updated successfully.", data = updated });
        }
    }
}
