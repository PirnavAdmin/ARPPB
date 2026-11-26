using System.Globalization;
using System.Text;
using System.Text.RegularExpressions;

namespace AgriPurchaseBilling.Application.DTOs.VendorPortal
{
    /// <summary>Shapes ledger vouchers for the My Ledger screen, its statement CSV and its print documents.</summary>
    public static class VendorLedgerMapper
    {
        private static readonly CultureInfo Indian = CultureInfo.GetCultureInfo("en-IN");

        public static readonly string[] ExportHeaders =
        {
            "Date", "Voucher ID", "Transaction ID", "Ledger Category", "Description", "Party Name", "Party Category",
            "Debit (INR)", "Credit (INR)", "Processing Expenses (INR)", "Running Balance (INR)",
            "Expected Payment Date", "Status"
        };

        public static readonly string[] PrintColumns =
        {
            "Date", "Txn ID", "Category", "Party", "Debit (Dr)", "Credit (Cr)", "Running Bal", "Status"
        };

        // ------------------------------------------------------------------
        // Tabs and filters (screen wording -> database values)
        // ------------------------------------------------------------------

        /// <summary>all | payables | receivables | expenses (screen) or suppliers | customers | processing (API) -> the procedure's tab.</summary>
        public static string? NormalizeTab(string? tab) => tab?.Trim().ToLowerInvariant() switch
        {
            "suppliers" or "supplier" or "payables" => "suppliers",
            "customers" or "customer" or "receivables" => "customers",
            "processing" or "expenses" => "processing",
            _ => null
        };

        /// <summary>Last part of the exported file name for a tab: All, Payables, Receivables or Expenses.</summary>
        public static string TabFileSuffix(string? tab) => NormalizeTab(tab) switch
        {
            "suppliers" => "Payables",
            "customers" => "Receivables",
            "processing" => "Expenses",
            _ => "All"
        };

        /// <summary>Screen category (Customer Sale, ...) or DB category (Sale, ...) -> DB category; party category is inferred for purchases.</summary>
        public static (string? LedgerCategory, string? PartyCategory) NormalizeCategory(string? category, string? partyCategory)
        {
            var key = category?.Trim();
            if (string.IsNullOrEmpty(key)) return (null, partyCategory);

            return key.ToLowerInvariant() switch
            {
                "customer sale" or "sale" => ("Sale", partyCategory),
                "customer payment" or "receipt" or "customer receipt" => ("Receipt", partyCategory),
                "supplier payment" or "payment" => ("Payment", partyCategory),
                "farmer purchase" => ("Purchase", partyCategory ?? "Farmer"),
                "middleman purchase" => ("Purchase", partyCategory ?? "Middleman"),
                "purchase" => ("Purchase", partyCategory),
                "processing expense" or "processing" => ("Processing Expense", partyCategory),
                _ => (key, partyCategory)
            };
        }

        /// <summary>Screen wording for a voucher's ledger category.</summary>
        public static string CategoryLabel(string ledgerCategory, string partyCategory) => ledgerCategory switch
        {
            "Sale" => "Customer Sale",
            "Receipt" => "Customer Payment",
            "Payment" => "Supplier Payment",
            "Purchase" => string.Equals(partyCategory, "Middleman", StringComparison.OrdinalIgnoreCase)
                ? "Middleman Purchase"
                : "Farmer Purchase",
            _ => ledgerCategory
        };

        private static readonly TimeSpan IndiaOffset = new(5, 30, 0);

        /// <summary>
        /// The screen's Date Range presets as UTC instants [from, toExclusive). Days are Indian Standard Time days
        /// (entry dates are stored in UTC). Null for "All Time" / unknown.
        /// </summary>
        public static (DateTime From, DateTime ToExclusive)? ResolveDateRange(string? preset, DateTime utcNow)
        {
            var today = (utcNow + IndiaOffset).Date;
            (DateTime Start, DateTime End)? local = preset?.Trim().ToLowerInvariant() switch
            {
                "today" => (today, today.AddDays(1)),
                "yesterday" => (today.AddDays(-1), today),
                "last 7 days" => (today.AddDays(-6), today.AddDays(1)),
                "this month" => (new DateTime(today.Year, today.Month, 1), new DateTime(today.Year, today.Month, 1).AddMonths(1)),
                "last month" => (new DateTime(today.Year, today.Month, 1).AddMonths(-1), new DateTime(today.Year, today.Month, 1)),
                _ => null
            };
            return local is null
                ? null
                : (DateTime.SpecifyKind(local.Value.Start - IndiaOffset, DateTimeKind.Utc),
                   DateTime.SpecifyKind(local.Value.End - IndiaOffset, DateTimeKind.Utc));
        }

        /// <summary>The sub-ledger buttons and every filter dropdown, as the screen offers them.</summary>
        public static LedgerFilterOptionsDto BuildFilterOptions(List<LedgerPartyOptionDto> parties, LedgerTabCountsDto counts) =>
            new()
            {
                Tabs = new List<LedgerTabDto>
                {
                    new() { Id = "All", Label = "All Journal Entries (Party-Wise Balances)", Tab = "", Count = counts.AllEntries },
                    new() { Id = "Payables", Label = "Supplier Payables Sub-Ledger (Farmers & Middlemen)", Tab = "suppliers", Count = counts.Payables },
                    new() { Id = "Receivables", Label = "Customer Receivables Sub-Ledger (Buyers)", Tab = "customers", Count = counts.Receivables },
                    new() { Id = "Expenses", Label = "Processing & Operating Expenses", Tab = "processing", Count = counts.Expenses }
                },
                DateRanges = Options(("All Time", ""), ("Today", "Today"), ("Yesterday", "Yesterday"),
                    ("Last 7 Days", "Last 7 Days"), ("This Month", "This Month"), ("Last Month", "Last Month")),
                LedgerCategories = Options(("All Ledger Categories", ""), ("Farmer Purchase", "Farmer Purchase"),
                    ("Middleman Purchase", "Middleman Purchase"), ("Processing Expense", "Processing Expense"),
                    ("Customer Sale", "Customer Sale"), ("Supplier Payment", "Supplier Payment"),
                    ("Customer Payment", "Customer Payment"), ("Transport Charges", "Transport Charges"),
                    ("Other Adjustments", "Other Adjustments")),
                PartyCategories = Options(("All Party Categories", ""), ("Farmer", "Farmer"), ("Middleman", "Middleman"),
                    ("Customer", "Customer"), ("Processing Plant", "Processing Plant")),
                Parties = parties,
                EntryTypes = Options(("Both Debit & Credit", ""), ("Debit Entries Only (Dr)", "Debit"), ("Credit Entries Only (Cr)", "Credit")),
                Statuses = Options(("All Statuses", ""), ("Paid", "Paid"), ("Partial", "Partial"), ("Unpaid", "Unpaid"), ("Cancelled", "Cancelled"))
            };

        private static List<LedgerFilterOptionDto> Options(params (string Label, string Value)[] items) =>
            items.Select(i => new LedgerFilterOptionDto { Label = i.Label, Value = i.Value }).ToList();

        /// <summary>Last digits of "VCH-0003", "LDG-0003", "3" -> 3.</summary>
        public static bool TryParseId(string? value, out long id)
        {
            id = 0;
            var match = Regex.Match(value ?? string.Empty, @"(\d+)\s*$");
            return match.Success && long.TryParse(match.Groups[1].Value, NumberStyles.None, CultureInfo.InvariantCulture, out id) && id > 0;
        }

        // ------------------------------------------------------------------
        // Voucher -> fields the screen reads
        // ------------------------------------------------------------------
        public static LedgerEntryDto Enrich(LedgerEntryDto e)
        {
            e.LedgerCode = string.IsNullOrWhiteSpace(e.VoucherCode)
                ? "VCH-" + e.Id.ToString("D4", CultureInfo.InvariantCulture)
                : e.VoucherCode!;
            e.TransactionId = e.TransactionCode;
            e.Category = CategoryLabel(e.LedgerCategory, e.PartyCategory);
            e.PartyId = e.PartyCode;
            e.Date = e.EntryDate;
            e.ProcessingExpenses = e.LedgerCategory == "Processing Expense" ? e.Debit : 0;

            var pending = e.LedgerCategory switch
            {
                "Purchase" => e.Credit - e.SettledAmount,
                "Sale" => e.Debit - e.SettledAmount,
                _ => 0m
            };
            e.OutstandingAmount = string.Equals(e.Status, "Cancelled", StringComparison.OrdinalIgnoreCase) ? 0 : Math.Max(0, pending);

            var firstName = (e.PartyName ?? string.Empty).Split(' ', StringSplitOptions.RemoveEmptyEntries).FirstOrDefault() ?? string.Empty;
            var suffix = e.PartyCategory switch
            {
                "Farmer" or "Middleman" => "Payable Due",
                "Customer" => "Receivable Due",
                _ => "Cum. Expense"
            };
            e.BalanceLabel = $"{firstName} {suffix}".Trim();
            return e;
        }

        // ------------------------------------------------------------------
        // Statement CSV (Vendor_Ledger_All.csv, ..._Payables, ..._Receivables, ..._Expenses)
        // ------------------------------------------------------------------
        public static byte[] ToCsv(IEnumerable<LedgerEntryDto> rows)
        {
            var sb = new StringBuilder();
            sb.Append(string.Join(",", ExportHeaders.Select(Quote))).Append("\r\n");

            foreach (var e in rows)
            {
                var cells = new[]
                {
                    Day(e.EntryDate), e.LedgerCode, e.TransactionId, e.Category, e.Description ?? string.Empty,
                    e.PartyName, e.PartyCategory, Number(e.Debit), Number(e.Credit), Number(e.ProcessingExpenses),
                    Number(e.RunningBalance), e.ExpectedPaymentDate.HasValue ? Day(e.ExpectedPaymentDate.Value) : string.Empty,
                    e.Status
                };
                sb.Append(string.Join(",", cells.Select(Quote))).Append("\r\n");
            }

            return Encoding.UTF8.GetPreamble().Concat(Encoding.UTF8.GetBytes(sb.ToString())).ToArray();
        }

        // ------------------------------------------------------------------
        // Print: statement and single voucher
        // ------------------------------------------------------------------
        public static OrdersPrintDto ToStatementPrint(
            IReadOnlyList<LedgerEntryDto> rows, LedgerSummaryDto s, string? tab, DateTime generatedAt) =>
            new()
            {
                Title = $"My Financial Ledger & Account Statements ({TabFileSuffix(tab)})",
                Subtitle = $"Total Entries: {rows.Count} | Generated on {Display(generatedAt)}",
                GeneratedAt = generatedAt,
                Metadata = new List<PrintMetadataDto>
                {
                    new() { Label = "1. Total Purchases", Value = Money(s.TotalPurchases) },
                    new() { Label = "2. Total Sales", Value = Money(s.TotalSales) },
                    new() { Label = "3. Processing Expenses", Value = Money(s.ProcessingExpenses) },
                    new() { Label = "4. Total Payables", Value = Money(s.TotalPayables) },
                    new() { Label = "5. Total Receivables", Value = Money(s.TotalReceivables) },
                    new() { Label = "6. Amount Received", Value = Money(s.AmountReceived) },
                    new() { Label = "7. Outstanding Amount", Value = Money(s.OutstandingAmount) },
                    new() { Label = "8. Estimated Profit", Value = Money(s.EstimatedProfit) }
                },
                Columns = PrintColumns.ToList(),
                Items = rows.Select(e => new Dictionary<string, string>
                {
                    ["Date"] = Display(e.EntryDate),
                    ["Txn ID"] = e.TransactionId,
                    ["Category"] = e.Category,
                    ["Party"] = $"{e.PartyName} ({e.PartyCategory})",
                    ["Debit (Dr)"] = Money(e.Debit),
                    ["Credit (Cr)"] = Money(e.Credit),
                    ["Running Bal"] = $"{Money(Math.Abs(e.RunningBalance))} ({e.BalanceLabel})",
                    ["Status"] = e.Status
                }).ToList()
            };

        public static OrdersPrintDto ToVoucherPrint(LedgerEntryDto e, DateTime generatedAt)
        {
            var processing = e.LedgerCategory == "Processing Expense";
            return new OrdersPrintDto
            {
                Title = $"Accounting Ledger Voucher – {e.LedgerCode}",
                Subtitle = $"Reference Transaction: {Dash(e.TransactionId)} | Posting Date: {Display(e.EntryDate)}",
                GeneratedAt = generatedAt,
                Metadata = new List<PrintMetadataDto>
                {
                    new() { Label = "Ledger Voucher ID", Value = e.LedgerCode },
                    new() { Label = "Transaction Reference", Value = Dash(e.TransactionId) },
                    new() { Label = "Ledger Category", Value = e.Category },
                    new() { Label = "Party Name", Value = e.PartyName },
                    new() { Label = "Party ID", Value = Dash(e.PartyId) },
                    new() { Label = "Party Category", Value = e.PartyCategory },
                    new() { Label = "Posting Date", Value = Display(e.EntryDate) },
                    new() { Label = "Expected Settlement Date", Value = e.ExpectedPaymentDate.HasValue ? Display(e.ExpectedPaymentDate.Value) : "—" },
                    new() { Label = "Settlement Status", Value = e.Status },
                    new() { Label = "Running Balance After Entry", Value = $"{Money(Math.Abs(e.RunningBalance))} ({e.BalanceLabel})" }
                },
                Columns = new List<string> { "Particulars", "Debit (Dr)", "Credit (Cr)", processing ? "Processing Exp" : "Outstanding Bal" },
                Items = new List<Dictionary<string, string>>
                {
                    new()
                    {
                        ["Particulars"] = e.Description ?? string.Empty,
                        ["Debit (Dr)"] = Money(e.Debit),
                        ["Credit (Cr)"] = Money(e.Credit),
                        [processing ? "Processing Exp" : "Outstanding Bal"] = Money(processing ? e.ProcessingExpenses : e.OutstandingAmount)
                    }
                }
            };
        }

        private static string Money(decimal value) => value.ToString("C2", Indian);
        private static string Dash(string? value) => string.IsNullOrWhiteSpace(value) ? "—" : value!;
        private static string Quote(string? value) => "\"" + (value ?? string.Empty).Replace("\"", "\"\"") + "\"";
        private static string Number(decimal value) => value.ToString("0.##", CultureInfo.InvariantCulture);
        private static string Day(DateTime value) => value.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture);
        private static string Display(DateTime value) => value.ToString("dd MMM yyyy", CultureInfo.InvariantCulture);
    }
}
