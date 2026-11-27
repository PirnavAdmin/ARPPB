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
    [Route("api/v1/middleman/ledger")]
    [Route("api/v1/middleman/my-ledger")]
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

        private static long ResolveLedgerId(string id)
        {
            if (long.TryParse(id, out var parsed) && parsed > 0) return parsed;
            var match = System.Text.RegularExpressions.Regex.Match(id ?? string.Empty, @"\d+");
            if (match.Success && long.TryParse(match.Value, out var num) && num > 0) return num;
            return 0;
        }

        /// <summary>
        /// Get all ledger postings and 8 financial summary KPI metrics with search and party filtering (or single entry if ?id={id} is given).
        /// Supports query parameters: partyFilter (from Farmer Ledger button), partyId, partyName, partyCategory, category, status, search.
        /// GET /api/v1/middleman/ledger
        /// GET /api/v1/middleman/my-ledger
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetLedger(
            [FromQuery] string? id = null,
            [FromQuery] string? partyFilter = null,
            [FromQuery] string? partyId = null,
            [FromQuery] string? partyName = null,
            [FromQuery] string? partyCategory = null,
            [FromQuery] string? category = null,
            [FromQuery] string? status = null,
            [FromQuery] string? search = null)
        {
            var userId = GetUserId();

            if (!string.IsNullOrWhiteSpace(id))
            {
                var numId = ResolveLedgerId(id);
                if (numId > 0)
                {
                    var singleEntry = await _ledgerService.GetByIdAsync(numId, userId);
                    if (singleEntry != null) return Ok(new { success = true, data = singleEntry });
                }
                return NotFound(new { success = false, message = $"Ledger entry '{id}' not found." });
            }

            var summary = await _ledgerService.GetSummaryAsync(userId);

            var filterTerm = (partyFilter ?? search ?? partyName ?? partyId)?.Trim();
            var hasFilter = !string.IsNullOrWhiteSpace(filterTerm) ||
                            (!string.IsNullOrWhiteSpace(partyCategory) && !string.Equals(partyCategory, "All", StringComparison.OrdinalIgnoreCase)) ||
                            (!string.IsNullOrWhiteSpace(category) && !string.Equals(category, "All", StringComparison.OrdinalIgnoreCase)) ||
                            (!string.IsNullOrWhiteSpace(status) && !string.Equals(status, "All", StringComparison.OrdinalIgnoreCase));

            if (!hasFilter)
            {
                return Ok(new { success = true, data = summary });
            }

            var entries = summary.Entries.AsEnumerable();

            if (!string.IsNullOrWhiteSpace(filterTerm))
            {
                entries = entries.Where(x =>
                    (x.PartyId != null && x.PartyId.Contains(filterTerm, StringComparison.OrdinalIgnoreCase)) ||
                    (x.PartyName != null && x.PartyName.Contains(filterTerm, StringComparison.OrdinalIgnoreCase)) ||
                    (x.TransactionId != null && x.TransactionId.Contains(filterTerm, StringComparison.OrdinalIgnoreCase)) ||
                    (x.LedgerId != null && x.LedgerId.Contains(filterTerm, StringComparison.OrdinalIgnoreCase)) ||
                    (x.Description != null && x.Description.Contains(filterTerm, StringComparison.OrdinalIgnoreCase)));
            }

            if (!string.IsNullOrWhiteSpace(partyCategory) && !string.Equals(partyCategory, "All", StringComparison.OrdinalIgnoreCase))
            {
                entries = entries.Where(x => string.Equals(x.PartyCategory, partyCategory, StringComparison.OrdinalIgnoreCase));
            }

            if (!string.IsNullOrWhiteSpace(category) && !string.Equals(category, "All", StringComparison.OrdinalIgnoreCase))
            {
                entries = entries.Where(x => string.Equals(x.Category, category, StringComparison.OrdinalIgnoreCase));
            }

            if (!string.IsNullOrWhiteSpace(status) && !string.Equals(status, "All", StringComparison.OrdinalIgnoreCase))
            {
                entries = entries.Where(x => string.Equals(x.Status, status, StringComparison.OrdinalIgnoreCase));
            }

            var filteredList = entries.ToList();
            var filteredSummary = new MiddlemanLedgerSummaryDto
            {
                TotalPurchases = summary.TotalPurchases,
                TotalSales = summary.TotalSales,
                CostOfGoodsSold = summary.CostOfGoodsSold,
                TotalPayables = summary.TotalPayables,
                TotalReceivables = summary.TotalReceivables,
                AmountReceived = summary.AmountReceived,
                NetPosition = summary.NetPosition,
                GrossProfit = summary.GrossProfit,
                TotalEntries = filteredList.Count,
                Entries = filteredList
            };

            return Ok(new { success = true, data = filteredSummary });
        }

        /// <summary>
        /// Get 8 standardized financial summary KPI cards and sub-ledger totals.
        /// GET /api/v1/middleman/ledger/summary
        /// </summary>
        [HttpGet("summary")]
        [ApiExplorerSettings(IgnoreApi = true)]
        public async Task<IActionResult> GetSummary(
            [FromQuery] string? partyFilter = null,
            [FromQuery] string? partyId = null,
            [FromQuery] string? partyName = null,
            [FromQuery] string? partyCategory = null,
            [FromQuery] string? category = null,
            [FromQuery] string? status = null,
            [FromQuery] string? search = null)
        {
            return await GetLedger(null, partyFilter, partyId, partyName, partyCategory, category, status, search);
        }

        /// <summary>
        /// Get a single ledger entry voucher by numeric ID or code (e.g. 1 or LED-0001).
        /// GET /api/v1/middleman/ledger/{id}
        /// </summary>
        [HttpGet("{id}")]
        [ApiExplorerSettings(IgnoreApi = true)]
        public async Task<IActionResult> GetById(string id)
        {
            var userId = GetUserId();
            var numId = ResolveLedgerId(id);
            if (numId <= 0) return NotFound(new { success = false, message = $"Ledger entry '{id}' not found." });
            var entry = await _ledgerService.GetByIdAsync(numId, userId);
            if (entry == null) return NotFound(new { success = false, message = $"Ledger entry '{id}' not found." });
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
        /// Update an existing ledger entry by numeric ID or code.
        /// PUT /api/v1/middleman/ledger/{id}
        /// </summary>
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(string id, [FromBody] UpdateLedgerEntryRequest request)
        {
            var userId = GetUserId();
            var numId = ResolveLedgerId(id);
            if (numId <= 0) return NotFound(new { success = false, message = $"Ledger entry '{id}' not found." });
            var entry = await _ledgerService.UpdateAsync(numId, request, userId);
            if (entry == null) return NotFound(new { success = false, message = $"Ledger entry '{id}' not found." });
            return Ok(new { success = true, message = "Ledger entry updated successfully.", data = entry });
        }

        /// <summary>
        /// Settle an existing ledger voucher (full settlement or partial amount with payment details).
        /// POST /api/v1/middleman/ledger/{id}/settle
        /// PUT /api/v1/middleman/ledger/{id}/settle
        /// </summary>
        [HttpPost("{id}/settle")]
        [HttpPut("{id}/settle")]
        public async Task<IActionResult> Settle(string id, [FromBody] SettleLedgerRequest? request = null)
        {
            var userId = GetUserId();
            var numId = ResolveLedgerId(id);
            if (numId <= 0) return NotFound(new { success = false, message = $"Ledger entry '{id}' not found." });

            if (request?.Amount.HasValue == true && request.Amount.Value <= 0)
            {
                return BadRequest(new { success = false, message = "Payment amount must be greater than zero." });
            }

            var entry = await _ledgerService.SettleAsync(numId, request, userId);
            if (entry == null) return NotFound(new { success = false, message = $"Ledger entry '{id}' not found." });
            return Ok(new { success = true, message = "Ledger entry settled successfully.", data = entry });
        }

        /// <summary>
        /// Get payment installment history for a specific ledger voucher or reference transaction ID.
        /// GET /api/v1/middleman/ledger/{id}/payments
        /// GET /api/v1/middleman/payments
        /// </summary>
        [HttpGet("{id}/payments")]
        public async Task<IActionResult> GetPaymentsByEntry(string id)
        {
            var userId = GetUserId();
            var numId = ResolveLedgerId(id);
            var history = await _ledgerService.GetPaymentHistoryAsync(userId, id, numId > 0 ? numId : null);
            return Ok(new { success = true, data = history });
        }
    }
}
