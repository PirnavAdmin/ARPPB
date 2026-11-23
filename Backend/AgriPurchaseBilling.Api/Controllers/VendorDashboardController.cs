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
        private readonly IWebHostEnvironment _environment;
        private readonly IConfiguration _configuration;

        public VendorDashboardController(IVendorDashboardService dashboardService, IWebHostEnvironment environment, IConfiguration configuration)
        {
            _dashboardService = dashboardService;
            _environment = environment;
            _configuration = configuration;
        }

        private long CurrentVendorId
        {
            get
            {
                var value = User.FindFirstValue(ClaimTypes.NameIdentifier);
                return long.TryParse(value, out var userId) && userId > 0 ? userId : 1;
            }
        }

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

            var dashboard = await _dashboardService.GetDashboardAsync(
                CurrentVendorId, fromDate, toDate, CanExposeSandboxOtps, cancellationToken);
            return Ok(ApiResponse<VendorDashboardDto>.Ok(dashboard, "Vendor dashboard retrieved successfully."));
        }

        private static bool IsValidRange(DateTime? fromDate, DateTime? toDate) =>
            !fromDate.HasValue || !toDate.HasValue || fromDate.Value.Date <= toDate.Value.Date;

        private bool CanExposeSandboxOtps =>
            _environment.IsDevelopment() && _configuration.GetValue<bool>("VendorDashboard:ExposeSandboxOtps");
    }
}
