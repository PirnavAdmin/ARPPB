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
    [Route("api/v1/middleman/customer-sales")]
    [Route("api/v1/middleman/sales/customers")]
    [Route("api/v1/middleman/sales-to-customers")]
    [Route("api/v1/middleman/customer-sales-history")]
    [Tags("Middleman - Customer Sales")]
    [Authorize(Roles = "Middleman,Admin")]
    public class MiddlemanCustomerSaleController : ControllerBase
    {
        private readonly IMiddlemanCustomerService _customerService;

        public MiddlemanCustomerSaleController(IMiddlemanCustomerService customerService)
        {
            _customerService = customerService;
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
        /// Get sales transactions to customers with search, crop, partyFilter, status filtering, and pagination.
        /// GET /api/v1/middleman/customer-sales
        /// GET /api/v1/middleman/sales/customers
        /// GET /api/v1/middleman/sales-to-customers
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetCustomerSales([FromQuery] MiddlemanCustomerSaleQueryDto query, [FromQuery] string? partyFilter = null)
        {
            var userId = GetUserId();
            if (string.IsNullOrWhiteSpace(query.Search) && !string.IsNullOrWhiteSpace(partyFilter))
            {
                query.Search = partyFilter;
            }
            var result = await _customerService.GetCustomerSalesAsync(userId, query);
            return Ok(new { success = true, data = result });
        }

        /// <summary>
        /// Get single customer sale transaction details by ID or Sale Code (e.g. CUS-SAL-7062).
        /// GET /api/v1/middleman/customer-sales/{id}
        /// </summary>
        [HttpGet("{id}")]
        public async Task<IActionResult> GetCustomerSaleById(string id)
        {
            var userId = GetUserId();
            var sale = await _customerService.GetCustomerSaleByIdAsync(userId, id);
            if (sale == null)
            {
                return NotFound(new { success = false, message = $"Sale transaction '{id}' not found." });
            }
            return Ok(new { success = true, data = sale });
        }

        /// <summary>
        /// Create a new customer retail sale transaction or save order as draft.
        /// POST /api/v1/middleman/customer-sales
        /// </summary>
        [HttpPost]
        public async Task<IActionResult> CreateCustomerSale([FromBody] CreateMiddlemanCustomerSaleRequest request)
        {
            if (request == null)
            {
                return BadRequest(new { success = false, message = "Invalid customer sale request." });
            }

            if (!request.IsDraft)
            {
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
            var sale = await _customerService.CreateCustomerSaleAsync(userId, request);

            var message = request.IsDraft
                ? "Order draft saved successfully."
                : "Customer sale request created successfully. Pending buyer OTP authorization.";

            return Ok(new { success = true, message, data = sale });
        }
    }
}
