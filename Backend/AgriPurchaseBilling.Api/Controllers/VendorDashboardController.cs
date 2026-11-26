using System;
using System.IO;
using System.Linq;
using System.Security.Claims;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using AgriPurchaseBilling.Application.DTOs;
using AgriPurchaseBilling.Application.DTOs.VendorOperations;
using AgriPurchaseBilling.Application.Interfaces;
using AgriPurchaseBilling.Application.Interfaces.VendorPortal;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;

namespace AgriPurchaseBilling.Api.Controllers
{
    [ApiController]
    [Authorize(Roles = "Vendor")]
    [Route("api/v1/vendor/dashboard")]
    [Produces("application/json")]
    public sealed class VendorDashboardController : ControllerBase
    {
        private readonly IVendorDashboardService _dashboardService;
        private readonly IVendorResolver _vendorResolver;
        private readonly IWebHostEnvironment _environment;
        private readonly IConfiguration _configuration;

        public VendorDashboardController(
            IVendorDashboardService dashboardService,
            IVendorResolver vendorResolver,
            IWebHostEnvironment environment,
            IConfiguration configuration)
        {
            _dashboardService = dashboardService;
            _vendorResolver = vendorResolver;
            _environment = environment;
            _configuration = configuration;
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

        /// <summary>
        /// Single unified GET endpoint returning the complete vendor dashboard:
        /// KPIs, Purchase Overview &amp; Trends, Raw Material Inventory by Crop, Finished Products,
        /// Sales Analytics, Estimated Profit &amp; Loss, Pending OTP Confirmations, and Recent Transactions.
        /// GET /api/v1/vendor/dashboard
        /// </summary>
        [HttpGet]
        [ProducesResponseType(typeof(ApiResponse<VendorDashboardDto>), 200)]
        [ProducesResponseType(typeof(ApiResponse<VendorDashboardDto>), 400)]
        public async Task<IActionResult> GetDashboard(
            [FromQuery] DateTime? fromDate,
            [FromQuery] DateTime? toDate,
            CancellationToken cancellationToken)
        {
            if (!IsValidRange(fromDate, toDate))
                return BadRequest(ApiResponse<VendorDashboardDto>.Fail("fromDate must be earlier than or equal to toDate."));

            var vendorId = await ResolveVendorIdAsync(cancellationToken);
            var dashboard = await _dashboardService.GetDashboardAsync(
                vendorId, fromDate, toDate, CanExposeSandboxOtps, cancellationToken);
            return Ok(ApiResponse<VendorDashboardDto>.Ok(dashboard, "Vendor dashboard retrieved successfully."));
        }

        private static bool IsValidRange(DateTime? fromDate, DateTime? toDate) =>
            !fromDate.HasValue || !toDate.HasValue || fromDate.Value.Date <= toDate.Value.Date;

        private bool CanExposeSandboxOtps =>
            _environment.IsDevelopment() && _configuration.GetValue<bool>("VendorDashboard:ExposeSandboxOtps");
    }
}
