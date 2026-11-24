using System.Globalization;
using System.Text;

namespace AgriPurchaseBilling.Application.DTOs.VendorPortal
{
    /// <summary>Shapes sales rows into Customer Orders rows, the CSV export and the print register.</summary>
    public static class VendorOrderMapper
    {
        private static readonly CultureInfo Indian = CultureInfo.GetCultureInfo("en-IN");

        public static readonly string[] ExportHeaders =
        {
            "Order ID", "Sales ID", "Customer Name", "Product", "Quantity", "Unit", "Price (INR)",
            "Total Amount (INR)", "Order Date", "Expected Delivery Date", "OTP Status", "Payment Status", "Order Status"
        };

        public static readonly string[] PrintColumns =
        {
            "Order ID", "Customer", "Product", "Qty", "Total Amount", "Order Date", "Expected Delivery", "OTP", "Status"
        };

        // ------------------------------------------------------------------
        // Date Range presets and filter dropdowns
        // ------------------------------------------------------------------
        private static readonly TimeSpan IndiaOffset = new(5, 30, 0);

        /// <summary>
        /// The screen's Date Range presets as inclusive calendar days (Indian Standard Time), to compare with the sale date.
        /// Null for "All Time" / unknown.
        /// </summary>
        public static (DateTime From, DateTime To)? ResolveDayRange(string? preset, DateTime utcNow)
        {
            var today = (utcNow + IndiaOffset).Date;
            var monthStart = new DateTime(today.Year, today.Month, 1);
            return preset?.Trim().ToLowerInvariant() switch
            {
                "today" => (today, today),
                "yesterday" => (today.AddDays(-1), today.AddDays(-1)),
                "last 7 days" => (today.AddDays(-6), today),
                "this month" => (monthStart, monthStart.AddMonths(1).AddDays(-1)),
                "last month" => (monthStart.AddMonths(-1), monthStart.AddDays(-1)),
                _ => null
            };
        }

        public static OrderFilterOptionsDto BuildOrderFilterOptions(OrdersSummaryDto s, List<OrderCustomerOptionDto> customers) =>
            new()
            {
                Tabs = new List<OrderTabDto>
                {
                    new() { Id = "All", Label = "All", Status = "", Count = s.Total },
                    new() { Id = "New", Label = "New", Status = "New", Count = s.New },
                    new() { Id = "Confirmed", Label = "Confirmed", Status = "Confirmed", Count = s.Confirmed },
                    new() { Id = "Processing", Label = "Processing", Status = "Processing", Count = s.Processing },
                    new() { Id = "Packed", Label = "Packed", Status = "Packed", Count = s.Packed },
                    new() { Id = "Shipped", Label = "Shipped", Status = "Shipped", Count = s.Shipped },
                    new() { Id = "Delivered", Label = "Delivered", Status = "Delivered", Count = s.Delivered },
                    new() { Id = "Completed", Label = "Completed", Status = "Completed", Count = s.Completed },
                    new() { Id = "Cancelled", Label = "Cancelled", Status = "Cancelled", Count = s.Cancelled }
                },
                DateRanges = Select(("All Time", ""), ("Today", "Today"), ("Yesterday", "Yesterday"),
                    ("Last 7 Days", "Last 7 Days"), ("This Month", "This Month"), ("Last Month", "Last Month")),
                Customers = customers,
                OtpStatuses = Select(("All OTP Status", ""), ("Verified", "Verified"), ("Pending", "Pending"), ("Cancelled", "Cancelled")),
                PaymentStatuses = Select(("All Payment Status", ""), ("Paid", "Paid"), ("Partial", "Partial"), ("Unpaid", "Unpaid"), ("Pending", "Pending"))
            };

        private static List<SelectOptionDto> Select(params (string Label, string Value)[] items) =>
            items.Select(i => new SelectOptionDto { Label = i.Label, Value = i.Value }).ToList();

        // ------------------------------------------------------------------
        // Sale -> Order row
        // ------------------------------------------------------------------
        public static OrderDto ToOrder(SaleDto sale, IEnumerable<OrderTimelineEntryDto>? timeline = null)
        {
            var items = sale.Items;
            var totalQty = items.Sum(i => i.Quantity);
            var totalValue = items.Sum(i => i.LineTotal);
            var units = items.Select(i => i.Unit).Where(u => !string.IsNullOrWhiteSpace(u)).Distinct().ToList();
            var first = items.FirstOrDefault();

            return new OrderDto
            {
                Id = sale.Id,
                OrderCode = sale.OrderCode,
                SalesCode = sale.SaleCode,
                CustomerUserId = sale.CustomerUserId,
                CustomerCode = sale.CustomerCode,
                CustomerName = sale.CustomerName,
                BusinessName = sale.BusinessName,
                MobileNumber = sale.CustomerMobile,
                Email = sale.CustomerEmail,
                District = sale.CustomerDistrict,
                State = sale.CustomerState,
                DeliveryAddress = sale.DeliveryAddress,
                Product = first is null
                    ? string.Empty
                    : first.ProductName + (items.Count > 1 ? $" +{items.Count - 1} more" : string.Empty),
                BatchReferences = items.Select(i => i.BatchCode).Where(c => !string.IsNullOrWhiteSpace(c)).Distinct().ToList(),
                Quantity = totalQty,
                Unit = units.Count > 1 ? "Mixed" : units.FirstOrDefault() ?? string.Empty,
                Price = totalQty > 0 ? Math.Round(totalValue / totalQty, 2) : 0,
                Subtotal = sale.ItemsSubtotal,
                Discount = sale.DiscountAmount,
                Tax = sale.TaxAmount,
                DeliveryCharges = sale.DeliveryCharges,
                OtherCharges = sale.OtherCharges,
                TotalAmount = sale.TotalAmount,
                AmountReceived = sale.AmountReceived,
                OrderDate = sale.SaleDate,
                ExpectedDeliveryDate = sale.ExpectedDeliveryDate,
                ExpectedPaymentDate = sale.ExpectedPaymentDate,
                PaymentTerms = sale.PaymentTerms,
                Notes = sale.Notes,
                OtpId = sale.OtpConfirmationCode,
                OtpConfirmationId = sale.OtpConfirmationId,
                OtpExpiresAt = sale.OtpExpiresAt,
                OtpStatus = OtpLabel(sale.OtpStatus, sale.OrderStatus),
                PaymentStatus = PaymentLabel(sale.PaymentStatus),
                OrderStatus = sale.OrderStatus,
                StockAllocationStage = StockStage(sale.OrderStatus),
                CancelReason = sale.CancelReason,
                DeliveredAt = sale.DeliveredAt,
                CreatedAt = sale.CreatedAt,
                UpdatedAt = sale.UpdatedAt,
                Timeline = timeline?.ToList() ?? new List<OrderTimelineEntryDto>(),
                Items = items
            };
        }

        /// <summary>OTP wording used on the Customer Orders screen.</summary>
        public static string OtpLabel(string otpStatus, string orderStatus)
        {
            if (string.Equals(orderStatus, "Cancelled", StringComparison.OrdinalIgnoreCase)) return "Cancelled";
            return otpStatus switch
            {
                "Sent" or "NotSent" => "Pending",
                _ => otpStatus
            };
        }

        public static string PaymentLabel(string paymentStatus) =>
            string.Equals(paymentStatus, "Unpaid", StringComparison.OrdinalIgnoreCase) ? "Pending" : paymentStatus;

        public static string StockStage(string orderStatus) => orderStatus switch
        {
            "Cancelled" => "Restored",
            "Shipped" or "Delivered" or "Completed" => "Deducted",
            _ => "Reserved"
        };

        // ------------------------------------------------------------------
        // Sale -> fields the Sales History / Sell Products screens read
        // ------------------------------------------------------------------
        public static readonly string[] SalesExportHeaders =
        {
            "Sales ID", "Order ID", "Customer Name", "Product", "Quantity", "Unit", "Unit Price (INR)",
            "Total Amount (INR)", "Sales Date", "Confirmation Status", "Expected Payment Date", "Payment Status", "Sales Status"
        };

        public static readonly string[] SalesPrintColumns =
        {
            "Sales ID", "Customer", "Product", "Qty", "Total Amount", "Sales Date", "OTP", "Payment", "Status"
        };

        /// <summary>Fills the flattened product / quantity / price / status fields from the sale's lines.</summary>
        public static SaleDto EnrichSale(SaleDto sale)
        {
            var items = sale.Items;
            var totalQty = items.Sum(i => i.Quantity);
            var totalValue = items.Sum(i => i.LineTotal);
            var units = items.Select(i => i.Unit).Where(u => !string.IsNullOrWhiteSpace(u)).Distinct().ToList();
            var first = items.FirstOrDefault();

            sale.Product = first is null
                ? string.Empty
                : first.ProductName + (items.Count > 1 ? $" +{items.Count - 1} more" : string.Empty);
            sale.BatchNumber = first?.BatchCode ?? string.Empty;
            sale.BatchId = first?.FinishedBatchId;
            sale.Quantity = totalQty;
            sale.Unit = units.Count > 1 ? "Mixed" : units.FirstOrDefault() ?? string.Empty;
            sale.UnitPrice = totalQty > 0 ? Math.Round(totalValue / totalQty, 2) : 0;
            sale.Subtotal = sale.ItemsSubtotal;
            sale.Discount = sale.DiscountAmount;
            sale.Tax = sale.TaxAmount;
            sale.ReceivedAmount = sale.AmountReceived;
            sale.SalesDate = sale.SaleDate;
            sale.MobileNumber = sale.CustomerMobile;
            sale.Email = sale.CustomerEmail;
            sale.District = sale.CustomerDistrict;
            sale.State = sale.CustomerState;
            sale.OtpId = sale.OtpConfirmationCode;
            sale.ConfirmationStatus = ConfirmationLabel(sale.OtpStatus);
            sale.SalesStatus = sale.OrderStatus;
            sale.StockAllocationStage = StockStage(sale.OrderStatus);
            sale.BalanceDue = string.Equals(sale.OrderStatus, "Cancelled", StringComparison.OrdinalIgnoreCase)
                ? 0
                : Math.Max(0, sale.TotalAmount - sale.AmountReceived);

            // The details popup reads each product line as batchNumber / sellingQuantity / unitPrice / subtotal.
            foreach (var item in items)
            {
                item.BatchNumber = item.BatchCode;
                item.SellingQuantity = item.Quantity;
                item.UnitPrice = item.PricePerUnit;
                item.Subtotal = item.LineTotal;
            }
            return sale;
        }

        // ------------------------------------------------------------------
        // Sales Invoice & Order Details popup: Print Invoice / Download Summary
        // ------------------------------------------------------------------
        public static readonly string[] ReceiptPaymentModes = { "NEFT / RTGS", "UPI / IMPS", "Cheque / DD", "Cash" };

        public static readonly string[] InvoiceCsvHeaders =
        {
            "Sales ID", "Order ID", "Customer Name", "Product", "Quantity", "Unit", "Unit Price", "Total Amount",
            "Amount Received", "Balance Due", "Sales Date", "OTP Confirmation", "Payment Status", "Sales Status"
        };

        public static readonly string[] InvoiceItemColumns = { "Product", "Batch", "Quantity", "Unit Price", "Subtotal" };

        /// <summary>"Download Summary": a one-row CSV of the invoice (file name Sales_Invoice_SALE-0015.csv).</summary>
        public static byte[] ToInvoiceCsv(SaleDto s)
        {
            var cells = new[]
            {
                s.SaleCode, s.OrderCode, s.CustomerName, s.Product,
                s.Quantity.ToString("0.###", CultureInfo.InvariantCulture), s.Unit,
                s.UnitPrice.ToString("0.##", CultureInfo.InvariantCulture),
                s.TotalAmount.ToString("0.##", CultureInfo.InvariantCulture),
                s.AmountReceived.ToString("0.##", CultureInfo.InvariantCulture),
                s.BalanceDue.ToString("0.##", CultureInfo.InvariantCulture),
                s.SaleDate.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture),
                s.ConfirmationStatus, s.PaymentStatus, s.SalesStatus
            };

            var sb = new StringBuilder();
            sb.Append(string.Join(",", InvoiceCsvHeaders.Select(Quote))).Append("\r\n");
            sb.Append(string.Join(",", cells.Select(Quote))).Append("\r\n");
            return Encoding.UTF8.GetPreamble().Concat(Encoding.UTF8.GetBytes(sb.ToString())).ToArray();
        }

        /// <summary>"Print Invoice": the tax invoice header, detail lines and one row per sold product.</summary>
        public static OrdersPrintDto ToInvoicePrint(SaleDto s, DateTime generatedAt) =>
            new()
            {
                Title = $"Tax Invoice & Sales Summary – {s.SaleCode}",
                Subtitle = $"Order Reference: {Dash(s.OrderCode)} | Sales Date: {s.SaleDate.ToString("dd MMM yyyy", CultureInfo.InvariantCulture)}",
                GeneratedAt = generatedAt,
                Metadata = new List<PrintMetadataDto>
                {
                    new() { Label = "Sales Invoice ID", Value = s.SaleCode },
                    new() { Label = "Order ID", Value = Dash(s.OrderCode) },
                    new() { Label = "Customer Name", Value = s.CustomerName },
                    new() { Label = "Business Name", Value = Dash(s.BusinessName) },
                    new() { Label = "Mobile Number", Value = Dash(s.CustomerMobile) },
                    new() { Label = "Delivery Address", Value = Dash(s.DeliveryAddress) },
                    new() { Label = "OTP Confirmation", Value = s.ConfirmationStatus },
                    new() { Label = "Payment Status", Value = s.PaymentStatus },
                    new() { Label = "Expected Payment Date", Value = s.ExpectedPaymentDate.HasValue ? s.ExpectedPaymentDate.Value.ToString("dd MMM yyyy", CultureInfo.InvariantCulture) : "—" },
                    new() { Label = "Final Invoice Amount", Value = s.TotalAmount.ToString("C2", Indian) }
                },
                Columns = InvoiceItemColumns.ToList(),
                Items = s.Items.Select(i => new Dictionary<string, string>
                {
                    ["Product"] = i.ProductName,
                    ["Batch"] = i.BatchCode,
                    ["Quantity"] = $"{i.Quantity.ToString("0.###", CultureInfo.InvariantCulture)} {i.Unit}".Trim(),
                    ["Unit Price"] = i.PricePerUnit.ToString("C2", Indian),
                    ["Subtotal"] = i.LineTotal.ToString("C2", Indian)
                }).ToList()
            };

        /// <summary>The Sales History dropdowns: customers and products that really appear on this vendor's sales.</summary>
        public static SalesFilterOptionsDto BuildSalesFilterOptions(
            List<OrderCustomerOptionDto> customers,
            List<SalesProductOptionDto> products,
            IReadOnlyDictionary<string, long> statusCounts)
        {
            long Count(string status) => statusCounts.TryGetValue(status, out var c) ? c : 0;
            var statuses = new[] { "New", "Confirmed", "Processing", "Packed", "Shipped", "Delivered", "Completed", "Cancelled" };

            return new SalesFilterOptionsDto
            {
                DateRanges = Select(("All Time", ""), ("Today", "Today"), ("Yesterday", "Yesterday"),
                    ("Last 7 Days", "Last 7 Days"), ("This Month", "This Month"), ("Last Month", "Last Month")),
                Customers = customers,
                Products = products,
                ConfirmationStatuses = Select(("All OTP Status", ""), ("Verified", "Verified"), ("Pending", "Pending"),
                    ("Not Sent", "Not Sent"), ("Failed", "Failed"), ("Expired", "Expired")),
                PaymentStatuses = Select(("All Payment Status", ""), ("Paid", "Paid"), ("Partial", "Partial"), ("Unpaid", "Unpaid"), ("Pending", "Pending")),
                SalesStatuses = new[] { new OrderTabDto { Id = "All", Label = "All Sales Status", Status = "", Count = statusCounts.Values.Sum() } }
                    .Concat(statuses.Select(s => new OrderTabDto { Id = s, Label = s, Status = s, Count = Count(s) }))
                    .ToList(),
                PaymentModes = ReceiptPaymentModes.Select(m => new SelectOptionDto { Label = m, Value = m }).ToList()
            };
        }

        private static string Dash(string? value) => string.IsNullOrWhiteSpace(value) ? "—" : value!;

        /// <summary>Confirmation wording used on the Sales History screen.</summary>
        public static string ConfirmationLabel(string otpStatus) => otpStatus switch
        {
            "Sent" => "Pending",
            "NotSent" => "Not Sent",
            _ => otpStatus
        };

        // ------------------------------------------------------------------
        // Sales History: Export / Print Sales
        // ------------------------------------------------------------------
        public static byte[] ToSalesCsv(IEnumerable<SaleExportRowDto> rows)
        {
            var sb = new StringBuilder();
            sb.Append(string.Join(",", SalesExportHeaders.Select(Quote))).Append("\r\n");

            foreach (var r in rows)
            {
                var cells = new[]
                {
                    r.SaleCode, r.OrderCode, r.CustomerName, r.Product,
                    Number(r.Quantity), r.Unit, Number(r.UnitPrice), Number(r.TotalAmount),
                    Day(r.SaleDate), r.ConfirmationStatus, Day(r.ExpectedPaymentDate), r.PaymentStatus, r.SalesStatus
                };
                sb.Append(string.Join(",", cells.Select(Quote))).Append("\r\n");
            }

            return Encoding.UTF8.GetPreamble().Concat(Encoding.UTF8.GetBytes(sb.ToString())).ToArray();
        }

        public static OrdersPrintDto ToSalesPrint(
            IReadOnlyList<SaleExportRowDto> rows, SalesHistorySummaryDto summary, DateTime generatedAt) =>
            new()
            {
                Title = "Finished Products Sales History & Receivables Register",
                Subtitle = $"Total Filtered Sales: {rows.Count} | Generated on {Display(generatedAt)}",
                GeneratedAt = generatedAt,
                Metadata = new List<PrintMetadataDto>
                {
                    new() { Label = "Total Sales Records", Value = summary.TotalSales.ToString(CultureInfo.InvariantCulture) },
                    new() { Label = "Completed Sales", Value = summary.CompletedSales.ToString(CultureInfo.InvariantCulture) },
                    new() { Label = "Confirmed Sales Revenue", Value = summary.TotalRevenue.ToString("C2", Indian) },
                    new() { Label = "Outstanding Receivables", Value = summary.OutstandingReceivables.ToString("C2", Indian) }
                },
                Columns = SalesPrintColumns.ToList(),
                Items = rows.Select(r => new Dictionary<string, string>
                {
                    ["Sales ID"] = r.SaleCode,
                    ["Customer"] = r.CustomerName,
                    ["Product"] = r.Product,
                    ["Qty"] = $"{Number(r.Quantity)} {r.Unit}".Trim(),
                    ["Total Amount"] = r.TotalAmount.ToString("C2", Indian),
                    ["Sales Date"] = Display(r.SaleDate),
                    ["OTP"] = r.ConfirmationStatus,
                    ["Payment"] = r.PaymentStatus,
                    ["Status"] = r.SalesStatus
                }).ToList()
            };

        // ------------------------------------------------------------------
        // Export Orders CSV (same 13 columns as the screen)
        // ------------------------------------------------------------------
        public static byte[] ToCsv(IEnumerable<OrderExportRowDto> rows)
        {
            var sb = new StringBuilder();
            sb.Append(string.Join(",", ExportHeaders.Select(Quote))).Append("\r\n");

            foreach (var r in rows)
            {
                var cells = new[]
                {
                    r.OrderCode, r.SaleCode, r.CustomerName, r.Product,
                    Number(r.Quantity), r.Unit, Number(r.Price), Number(r.TotalAmount),
                    Day(r.OrderDate), Day(r.ExpectedDeliveryDate),
                    r.OtpStatus, r.PaymentStatus, r.OrderStatus
                };
                sb.Append(string.Join(",", cells.Select(Quote))).Append("\r\n");
            }

            // UTF-8 with BOM so Excel shows the rupee sign / Indian names correctly.
            return Encoding.UTF8.GetPreamble().Concat(Encoding.UTF8.GetBytes(sb.ToString())).ToArray();
        }

        // ------------------------------------------------------------------
        // Print register
        // ------------------------------------------------------------------
        public static OrdersPrintDto ToPrint(
            IReadOnlyList<OrderExportRowDto> rows, OrdersSummaryDto summary, string? statusTab, DateTime generatedAt)
        {
            var tab = string.IsNullOrWhiteSpace(statusTab) ? "All" : statusTab!;
            return new OrdersPrintDto
            {
                Title = "Customer Orders & Fulfilment Register",
                Subtitle = $"Filter Tab: {tab} | Total Orders: {rows.Count}",
                GeneratedAt = generatedAt,
                Metadata = new List<PrintMetadataDto>
                {
                    new() { Label = "Total Orders", Value = summary.Total.ToString(CultureInfo.InvariantCulture) },
                    new() { Label = "Active Pipeline Orders", Value = (summary.Total - summary.Completed - summary.Cancelled).ToString(CultureInfo.InvariantCulture) },
                    new() { Label = "Completed Orders", Value = summary.Completed.ToString(CultureInfo.InvariantCulture) },
                    new() { Label = "Cancelled Orders", Value = summary.Cancelled.ToString(CultureInfo.InvariantCulture) }
                },
                Columns = PrintColumns.ToList(),
                Items = rows.Select(r => new Dictionary<string, string>
                {
                    ["Order ID"] = r.OrderCode,
                    ["Customer"] = r.CustomerName,
                    ["Product"] = r.Product,
                    ["Qty"] = $"{Number(r.Quantity)} {r.Unit}".Trim(),
                    ["Total Amount"] = r.TotalAmount.ToString("C2", Indian),
                    ["Order Date"] = Display(r.OrderDate),
                    ["Expected Delivery"] = r.ExpectedDeliveryDate.HasValue ? Display(r.ExpectedDeliveryDate.Value) : "—",
                    ["OTP"] = r.OtpStatus,
                    ["Status"] = r.OrderStatus
                }).ToList()
            };
        }

        private static string Quote(string? value) => "\"" + (value ?? string.Empty).Replace("\"", "\"\"") + "\"";
        private static string Number(decimal value) => value.ToString("0.###", CultureInfo.InvariantCulture);
        private static string Day(DateTime? value) => value?.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture) ?? string.Empty;
        private static string Display(DateTime value) => value.ToString("dd MMM yyyy", CultureInfo.InvariantCulture);
    }
}
