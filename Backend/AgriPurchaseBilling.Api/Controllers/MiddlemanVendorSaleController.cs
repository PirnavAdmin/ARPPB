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
    [Route("api/v1/middleman/vendor-sales")]
    [Route("api/v1/middleman/sales/vendors")]
    [Route("api/v1/middleman/sales-to-vendors")]
    [Route("api/v1/middleman/vendor-sales-history")]
    [Tags("Middleman - Vendor Sales")]
    [Authorize(Roles = "Middleman,Admin")]
    public class MiddlemanVendorSaleController : ControllerBase
    {
        private readonly IMiddlemanVendorService _vendorService;

        public MiddlemanVendorSaleController(IMiddlemanVendorService vendorService)
        {
            _vendorService = vendorService;
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
        /// Get sales transactions to vendors with status filtering, search, partyFilter, and pagination.
        /// GET /api/v1/middleman/vendor-sales
        /// GET /api/v1/middleman/sales/vendors
        /// GET /api/v1/middleman/sales-to-vendors
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetVendorSales([FromQuery] MiddlemanVendorSaleQueryDto query, [FromQuery] string? partyFilter = null)
        {
            var userId = GetUserId();
            if (string.IsNullOrWhiteSpace(query.Search) && !string.IsNullOrWhiteSpace(partyFilter))
            {
                query.Search = partyFilter;
            }
            var result = await _vendorService.GetVendorSalesAsync(userId, query);
            return Ok(new { success = true, data = result });
        }

        /// <summary>
        /// Get single vendor sale transaction details by ID or Sale Code (e.g. SAL-7816).
        /// GET /api/v1/middleman/vendor-sales/{id}
        /// </summary>
        [HttpGet("{id}")]
        public async Task<IActionResult> GetVendorSaleById(string id)
        {
            var userId = GetUserId();
            var sale = await _vendorService.GetVendorSaleByIdAsync(userId, id);
            if (sale == null)
            {
                return NotFound(new { success = false, message = $"Sale transaction '{id}' not found." });
            }
            return Ok(new { success = true, data = sale });
        }

        /// <summary>
        /// Create a new commercial sale transaction to a registered vendor or save as draft.
        /// POST /api/v1/middleman/vendor-sales
        /// </summary>
        [HttpPost]
        public async Task<IActionResult> CreateVendorSale([FromBody] CreateMiddlemanVendorSaleRequest request)
        {
            if (request == null)
            {
                return BadRequest(new { success = false, message = "Invalid vendor sale request." });
            }

            if (!request.IsDraft)
            {
                if (string.IsNullOrWhiteSpace(request.VendorId))
                {
                    return BadRequest(new { success = false, message = "Registered vendor selection is required." });
                }
                if (string.IsNullOrWhiteSpace(request.CropName))
                {
                    return BadRequest(new { success = false, message = "Crop name is required." });
                }
                if (request.Quantity <= 0)
                {
                    return BadRequest(new { success = false, message = "Selling quantity must be greater than zero." });
                }
                if (request.Rate <= 0)
                {
                    return BadRequest(new { success = false, message = "Selling price must be greater than zero." });
                }
            }

            var userId = GetUserId();
            var sale = await _vendorService.CreateVendorSaleAsync(userId, request);

            var message = request.IsDraft
                ? "Sale draft saved successfully."
                : "Vendor sale request created successfully. Pending buyer OTP authorization.";

            return Ok(new { success = true, message, data = sale });
        }
    }
}
