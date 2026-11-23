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
    [Route("api/v1/middleman/transaction-history")]
    [Route("api/v1/middleman/sales-history")]
    [Route("api/v1/middleman/sales-order-history")]
    [Tags("Middleman - Transaction History")]
    [Authorize(Roles = "Middleman,Admin")]
    public class MiddlemanTransactionHistoryController : ControllerBase
    {
        private readonly IMiddlemanPurchaseService _purchaseService;
        private readonly IMiddlemanVendorService _vendorService;
        private readonly IMiddlemanCustomerService _customerService;

        public MiddlemanTransactionHistoryController(
            IMiddlemanPurchaseService purchaseService,
            IMiddlemanVendorService vendorService,
            IMiddlemanCustomerService customerService)
        {
            _purchaseService = purchaseService;
            _vendorService = vendorService;
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
        /// Unified transaction and sales order history endpoint across tabs: 'farmer', 'vendor', or 'customer', with badge counts, or single record by ID.
        /// Supports query parameters: tab, id, search, partyFilter, crop, status, page, pageSize.
        /// GET /api/v1/middleman/transaction-history
        /// GET /api/v1/middleman/sales-history
        /// GET /api/v1/middleman/sales-order-history
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetTransactionHistory(
            [FromQuery] string? tab = "farmer",
            [FromQuery] string? id = null,
            [FromQuery] string? search = null,
            [FromQuery] string? partyFilter = null,
            [FromQuery] string? crop = null,
            [FromQuery] string? status = "ALL",
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10)
        {
            var userId = GetUserId();

            if (!string.IsNullOrWhiteSpace(id))
            {
                return await GetTransactionById(id);
            }

            var activeTab = (tab ?? "farmer").Trim().ToLower();
            var effectiveSearch = !string.IsNullOrWhiteSpace(search) ? search : partyFilter;

            var purchasesPage = await _purchaseService.GetPurchasesAsync(userId, new MiddlemanPurchaseQueryDto
            {
                Search = activeTab == "farmer" ? effectiveSearch : null,
                CropName = activeTab == "farmer" ? crop : null,
                Status = activeTab == "farmer" ? status : "ALL",
                Page = activeTab == "farmer" ? page : 1,
                PageSize = activeTab == "farmer" ? pageSize : 1,
            });

            var vendorSalesPage = await _vendorService.GetVendorSalesAsync(userId, new MiddlemanVendorSaleQueryDto
            {
                Search = activeTab == "vendor" ? effectiveSearch : null,
                CropName = activeTab == "vendor" ? crop : null,
                Status = activeTab == "vendor" ? status : "ALL",
                Page = activeTab == "vendor" ? page : 1,
                PageSize = activeTab == "vendor" ? pageSize : 1,
            });

            var customerSalesPage = await _customerService.GetCustomerSalesAsync(userId, new MiddlemanCustomerSaleQueryDto
            {
                Search = activeTab == "customer" ? effectiveSearch : null,
                CropName = activeTab == "customer" ? crop : null,
                Status = activeTab == "customer" ? status : "ALL",
                Page = activeTab == "customer" ? page : 1,
                PageSize = activeTab == "customer" ? pageSize : 1,
            });

            object activeData = activeTab switch
            {
                "vendor" => vendorSalesPage,
                "customer" => customerSalesPage,
                _ => purchasesPage
            };

            return Ok(new
            {
                success = true,
                activeTab = activeTab,
                counts = new
                {
                    farmerCount = purchasesPage.TotalItems,
                    vendorCount = vendorSalesPage.TotalItems,
                    customerCount = customerSalesPage.TotalItems,
                    totalCount = purchasesPage.TotalItems + vendorSalesPage.TotalItems + customerSalesPage.TotalItems
                },
                farmerPurchases = purchasesPage,
                vendorSales = vendorSalesPage,
                customerSales = customerSalesPage,
                data = activeData
            });
        }

        /// <summary>
        /// Get Farmer Produce Procurement Purchase History (Tab 1: Farmer Purchase History)
        /// GET /api/v1/middleman/transaction-history/farmer-purchases
        /// GET /api/v1/middleman/sales-history/farmer-purchases
        /// </summary>
        [HttpGet("farmer-purchases")]
        [ApiExplorerSettings(IgnoreApi = true)]
        public async Task<IActionResult> GetFarmerPurchases([FromQuery] MiddlemanPurchaseQueryDto query, [FromQuery] string? partyFilter = null)
        {
            var userId = GetUserId();
            if (string.IsNullOrWhiteSpace(query.Search) && !string.IsNullOrWhiteSpace(partyFilter))
            {
                query.Search = partyFilter;
            }
            var result = await _purchaseService.GetPurchasesAsync(userId, query);
            return Ok(new { success = true, data = result });
        }

        /// <summary>
        /// Get Commercial Vendor Sales History (Tab 2: Sales to Vendors)
        /// GET /api/v1/middleman/transaction-history/vendor-sales
        /// GET /api/v1/middleman/sales-history/vendor-sales
        /// </summary>
        [HttpGet("vendor-sales")]
        [ApiExplorerSettings(IgnoreApi = true)]
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
        /// Get Retail Customer Sales History & Drafts (Tab 3: Sales to Customers)
        /// GET /api/v1/middleman/transaction-history/customer-sales
        /// GET /api/v1/middleman/sales-history/customer-sales
        /// </summary>
        [HttpGet("customer-sales")]
        [ApiExplorerSettings(IgnoreApi = true)]
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
        /// Get single transaction record details by ID (e.g., PUR-7213, SAL-0002, CUS-SAL-9692)
        /// GET /api/v1/middleman/transaction-history/{id}
        /// GET /api/v1/middleman/sales-history/{id}
        /// </summary>
        [HttpGet("{id}")]
        [ApiExplorerSettings(IgnoreApi = true)]
        public async Task<IActionResult> GetTransactionById(string id)
        {
            var userId = GetUserId();

            if (id.StartsWith("PUR-", StringComparison.OrdinalIgnoreCase))
            {
                var purchase = await _purchaseService.GetPurchaseByIdAsync(userId, id);
                if (purchase != null) return Ok(new { success = true, type = "FarmerPurchase", data = purchase });
            }
            else if (id.StartsWith("SAL-", StringComparison.OrdinalIgnoreCase))
            {
                var vendorSale = await _vendorService.GetVendorSaleByIdAsync(userId, id);
                if (vendorSale != null) return Ok(new { success = true, type = "VendorSale", data = vendorSale });
            }
            else if (id.StartsWith("CUS-", StringComparison.OrdinalIgnoreCase))
            {
                var customerSale = await _customerService.GetCustomerSaleByIdAsync(userId, id);
                if (customerSale != null) return Ok(new { success = true, type = "CustomerSale", data = customerSale });
            }

            // Fallback trial across all 3
            var pFallback = await _purchaseService.GetPurchaseByIdAsync(userId, id);
            if (pFallback != null) return Ok(new { success = true, type = "FarmerPurchase", data = pFallback });

            var vFallback = await _vendorService.GetVendorSaleByIdAsync(userId, id);
            if (vFallback != null) return Ok(new { success = true, type = "VendorSale", data = vFallback });

            var cFallback = await _customerService.GetCustomerSaleByIdAsync(userId, id);
            if (cFallback != null) return Ok(new { success = true, type = "CustomerSale", data = cFallback });

            return NotFound(new { success = false, message = $"Transaction record '{id}' not found." });
        }
    }
}
