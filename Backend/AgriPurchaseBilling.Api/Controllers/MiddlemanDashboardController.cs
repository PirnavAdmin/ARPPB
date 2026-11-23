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
    [Route("api/v1/middleman/dashboard")]
    [Tags("Middleman - Dashboard")]
    [Authorize(Roles = "Middleman,Admin")]
    public class MiddlemanDashboardController : ControllerBase
    {
        private readonly IMiddlemanDashboardService _dashboardService;

        public MiddlemanDashboardController(IMiddlemanDashboardService dashboardService)
        {
            _dashboardService = dashboardService;
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
        /// Get the unified Middleman Dashboard view model containing all fields and screens:
        /// 10 KPI carousel metrics (Primary 1/2 & Additional 2/2), 6-month purchase vs sales comparison series,
        /// 6-crop inventory stock breakdown (250 Qtl), 3 pending OTP confirmations, 6 recent transactions,
        /// and dedicated purchases, vendor sales, and customer sales audit feeds.
        /// GET /api/v1/middleman/dashboard
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetDashboard()
        {
            var userId = GetUserId();
            var data = await _dashboardService.GetDashboardAsync(userId);
            return Ok(new { success = true, data });
        }
    }
}
