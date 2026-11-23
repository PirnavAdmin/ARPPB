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
        /// Get unified transaction history for Sales Order History screen across tabs: 'farmer', 'vendor', or 'customer', with badge counts.
        /// GET /api/v1/middleman/transaction-history
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetTransactionHistory(
            [FromQuery] string? tab = "farmer",
            [FromQuery] string? search = null,
            [FromQuery] string? crop = null,
            [FromQuery] string? status = "ALL",
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10)
        {
            var userId = GetUserId();
            var activeTab = (tab ?? "farmer").Trim().ToLower();

            // Fetch tab counts for badges
            var purchasesPage = await _purchaseService.GetPurchasesAsync(userId, new MiddlemanPurchaseQueryDto
            {
                Search = activeTab == "farmer" ? search : null,
                Status = activeTab == "farmer" ? status : "ALL",
                Page = activeTab == "farmer" ? page : 1,
                PageSize = activeTab == "farmer" ? pageSize : 1,
            });

            var vendorSalesPage = await _vendorService.GetVendorSalesAsync(userId, new MiddlemanVendorSaleQueryDto
            {
                Search = activeTab == "vendor" ? search : null,
                Status = activeTab == "vendor" ? status : "ALL",
                Page = activeTab == "vendor" ? page : 1,
                PageSize = activeTab == "vendor" ? pageSize : 1,
            });

            var customerSalesPage = await _customerService.GetCustomerSalesAsync(userId, new MiddlemanCustomerSaleQueryDto
            {
                Search = activeTab == "customer" ? search : null,
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
                },
                data = activeData
            });
        }

        /// <summary>
        /// Get Farmer Produce Procurement Purchase History (Tab 1: Farmer Purchase History)
        /// GET /api/v1/middleman/transaction-history/farmer-purchases
        /// </summary>
        [HttpGet("farmer-purchases")]
        public async Task<IActionResult> GetFarmerPurchases([FromQuery] MiddlemanPurchaseQueryDto query)
        {
            var userId = GetUserId();
            var result = await _purchaseService.GetPurchasesAsync(userId, query);
            return Ok(new { success = true, data = result });
        }

        /// <summary>
        /// Get Commercial Vendor Sales History (Tab 2: Sales to Vendors)
        /// GET /api/v1/middleman/transaction-history/vendor-sales
        /// </summary>
        [HttpGet("vendor-sales")]
        public async Task<IActionResult> GetVendorSales([FromQuery] MiddlemanVendorSaleQueryDto query)
        {
            var userId = GetUserId();
            var result = await _vendorService.GetVendorSalesAsync(userId, query);
            return Ok(new { success = true, data = result });
        }

        /// <summary>
        /// Get Retail Customer Sales History & Drafts (Tab 3: Sales to Customers)
        /// GET /api/v1/middleman/transaction-history/customer-sales
        /// </summary>
        [HttpGet("customer-sales")]
        public async Task<IActionResult> GetCustomerSales([FromQuery] MiddlemanCustomerSaleQueryDto query)
        {
            var userId = GetUserId();
            var result = await _customerService.GetCustomerSalesAsync(userId, query);
            return Ok(new { success = true, data = result });
        }

        /// <summary>
        /// Get single transaction record details by ID (e.g., PUR-7213, SAL-0002, CUS-SAL-9692)
        /// GET /api/v1/middleman/transaction-history/{id}
        /// </summary>
        [HttpGet("{id}")]
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
