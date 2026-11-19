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
    [Route("api/v1/middleman/ledger")]
    [Tags("Middleman - Ledger")]
    [Authorize(Roles = "Middleman,Admin")]
    public class MiddlemanLedgerController : ControllerBase
    {
        private readonly IMiddlemanLedgerService _ledgerService;

        public MiddlemanLedgerController(IMiddlemanLedgerService ledgerService)
        {
            _ledgerService = ledgerService;
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
        /// Get all ledger postings and 8 financial summary KPI metrics (or single entry if query param ?id={id} is given).
        /// GET /api/v1/middleman/ledger
        /// GET /api/v1/middleman/ledger?id={id}
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetLedger([FromQuery] long? id = null)
        {
            var userId = GetUserId();

            if (id.HasValue && id.Value > 0)
            {
                var singleEntry = await _ledgerService.GetByIdAsync(id.Value, userId);
                if (singleEntry == null) return NotFound(new { success = false, message = "Ledger entry not found." });
                return Ok(new { success = true, data = singleEntry });
            }

            var summary = await _ledgerService.GetSummaryAsync(userId);
            return Ok(new { success = true, data = summary });
        }

        /// <summary>
        /// Get a single ledger entry voucher by ID using path parameter.
        /// GET /api/v1/middleman/ledger/{id}
        /// </summary>
        [HttpGet("{id:long}")]
        public async Task<IActionResult> GetById(long id)
        {
            var userId = GetUserId();
            var entry = await _ledgerService.GetByIdAsync(id, userId);
            if (entry == null) return NotFound(new { success = false, message = "Ledger entry not found." });
            return Ok(new { success = true, data = entry });
        }

        /// <summary>
        /// Create a new manual journal / ledger voucher entry.
        /// POST /api/v1/middleman/ledger
        /// </summary>
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateLedgerEntryRequest request)
        {
            var entry = await _ledgerService.CreateAsync(request, GetUserId());
            return Ok(new { success = true, message = "Ledger entry created successfully.", data = entry });
        }

        /// <summary>
        /// Update an existing ledger entry.
        /// PUT /api/v1/middleman/ledger/{id}
        /// </summary>
        [HttpPut("{id:long}")]
        public async Task<IActionResult> Update(long id, [FromBody] UpdateLedgerEntryRequest request)
        {
            var entry = await _ledgerService.UpdateAsync(id, request, GetUserId());
            if (entry == null) return NotFound(new { success = false, message = "Ledger entry not found." });
            return Ok(new { success = true, message = "Ledger entry updated successfully.", data = entry });
        }

        /// <summary>
        /// Settle an existing ledger voucher (full settlement or partial amount with payment details).
        /// POST /api/v1/middleman/ledger/{id}/settle
        /// PUT /api/v1/middleman/ledger/{id}/settle
        /// </summary>
        [HttpPost("{id:long}/settle")]
        [HttpPut("{id:long}/settle")]
        public async Task<IActionResult> Settle(long id, [FromBody] SettleLedgerRequest? request = null)
        {
            var entry = await _ledgerService.SettleAsync(id, request, GetUserId());
            if (entry == null) return NotFound(new { success = false, message = "Ledger entry not found." });
            return Ok(new { success = true, message = "Ledger entry settled successfully.", data = entry });
        }
    }
}
