using System.Globalization;
using System.Text;

namespace AgriPurchaseBilling.Application.DTOs.VendorPortal
{
    /// <summary>Shapes OTP confirmation rows for the OTP Confirmations screen, its attempt log and the audit-log CSV.</summary>
    public static class VendorOtpMapper
    {
        public static readonly string[] ExportHeaders =
        {
            "OTP ID", "Transaction ID", "Party Name", "Party Category", "Mobile Number", "Transaction Type", "Product",
            "Quantity", "Amount (INR)", "OTP Status", "Initiated Date", "Confirmation Date", "Expiry Time"
        };

        /// <summary>
        /// Final status wording: a pending OTP past its expiry is "Expired", and an unverified OTP of a cancelled order
        /// is "Cancelled".
        /// </summary>
        public static string StatusLabel(OtpConfirmationDto dto, DateTime utcNow)
        {
            if (string.Equals(dto.SaleOrderStatus, "Cancelled", StringComparison.OrdinalIgnoreCase) &&
                !string.Equals(dto.OtpStatus, "Verified", StringComparison.OrdinalIgnoreCase))
                return "Cancelled";

            if (string.Equals(dto.OtpStatus, "Sent", StringComparison.OrdinalIgnoreCase) && dto.ExpiresAt <= utcNow)
                return "Expired";

            return dto.OtpStatus;
        }

        /// <summary>Fills the field names the screen reads and builds the attempt log.</summary>
        public static OtpConfirmationDto Enrich(OtpConfirmationDto dto)
        {
            dto.TransactionId = dto.TransactionCode;
            dto.PartyId = dto.PartyCode;
            dto.MobileNumber = dto.Mobile;
            dto.InitiatedDate = Stamp(dto.SentAt);
            dto.ConfirmationDate = dto.ConfirmedAt.HasValue ? Stamp(dto.ConfirmedAt.Value) : null;
            dto.ExpiryTime = Stamp(dto.ExpiresAt);
            dto.MaxAttempts = 5;

            // A verified OTP was entered correctly at least once.
            if (string.Equals(dto.OtpStatus, "Verified", StringComparison.OrdinalIgnoreCase) && dto.Attempts < 1)
                dto.Attempts = 1;

            var log = new List<OtpAttemptLogDto>
            {
                new()
                {
                    Timestamp = Stamp(dto.SentAt),
                    Status = "Sent",
                    Note = $"OTP verification request dispatched to {dto.PartyName} ({dto.Mobile})."
                }
            };

            switch (dto.OtpStatus)
            {
                case "Verified":
                    log.Add(new()
                    {
                        Timestamp = dto.ConfirmationDate ?? Stamp(dto.UpdatedAt),
                        Status = "Verified",
                        Note = $"Transaction {dto.TransactionCode} verified and synced with inventory & ledger."
                    });
                    break;
                case "Cancelled":
                    dto.Notes = $"Order {dto.SaleOrderCode} was cancelled before the OTP was verified.";
                    log.Add(new() { Timestamp = Stamp(dto.UpdatedAt), Status = "Cancelled", Note = dto.Notes });
                    break;
                case "Failed":
                    log.Add(new()
                    {
                        Timestamp = Stamp(dto.UpdatedAt),
                        Status = "Failed",
                        Note = "Too many failed attempts. A new OTP must be sent."
                    });
                    break;
                case "Expired":
                    log.Add(new() { Timestamp = dto.ExpiryTime, Status = "Expired", Note = "The OTP expired before it was verified." });
                    break;
                default:
                    if (dto.Attempts > 0)
                    {
                        log.Add(new()
                        {
                            Timestamp = Stamp(dto.UpdatedAt),
                            Status = "Sent",
                            Note = $"{dto.Attempts} incorrect attempt(s) recorded; {Math.Max(0, dto.MaxAttempts - dto.Attempts)} remaining."
                        });
                    }
                    break;
            }

            dto.AttemptHistory = log;
            return dto;
        }

        /// <summary>"Export OTP Audit Log": the 13 screen columns.</summary>
        public static byte[] ToCsv(IEnumerable<OtpConfirmationDto> rows)
        {
            var sb = new StringBuilder();
            sb.Append(string.Join(",", ExportHeaders.Select(Quote))).Append("\r\n");

            foreach (var r in rows)
            {
                var cells = new[]
                {
                    r.ConfirmationCode ?? string.Empty, r.TransactionCode, r.PartyName, r.PartyCategory, r.Mobile ?? string.Empty,
                    r.TransactionType, r.Product ?? string.Empty,
                    $"{r.Quantity.ToString("0.###", CultureInfo.InvariantCulture)} {r.Unit}".Trim(),
                    r.Amount.ToString("0.##", CultureInfo.InvariantCulture),
                    r.OtpStatus, r.InitiatedDate, r.ConfirmationDate ?? string.Empty, r.ExpiryTime
                };
                sb.Append(string.Join(",", cells.Select(Quote))).Append("\r\n");
            }

            // UTF-8 with BOM so Excel opens it correctly.
            return Encoding.UTF8.GetPreamble().Concat(Encoding.UTF8.GetBytes(sb.ToString())).ToArray();
        }

        /// <summary>Tabs, Category / OTP Status / Time dropdowns of the OTP Confirmations screen.</summary>
        public static OtpFilterOptionsDto BuildFilterOptions(long total, long farmer, long middleman, long customer,
            long pending, long verified, long expired, long failed, long cancelled)
        {
            static OtpFilterOptionDto O(string label, string value, long count = 0) => new() { Label = label, Value = value, Count = count };
            return new OtpFilterOptionsDto
            {
                Tabs = new() { O("Farmer Confirmations", "Farmer", farmer), O("Middleman Confirmations", "Middleman", middleman), O("Customer Confirmations", "Customer", customer), O("All Confirmations", "", total) },
                Categories = new() { O("All Categories", ""), O("Farmer", "Farmer", farmer), O("Middleman", "Middleman", middleman), O("Customer", "Customer", customer) },
                Statuses = new()
                {
                    O("All OTP Status", "", total), O("Not Sent", "Not Sent"), O("Sent", "Sent", pending), O("Pending", "Pending", pending),
                    O("Verified", "Verified", verified), O("Expired", "Expired", expired), O("Failed", "Failed", failed), O("Cancelled", "Cancelled", cancelled)
                },
                DateRanges = new() { O("All Time", ""), O("Today", "Today"), O("Yesterday", "Yesterday"), O("Last 7 Days", "Last 7 Days"), O("This Month", "This Month") }
            };
        }

        private static string Quote(string? value) => "\"" + (value ?? string.Empty).Replace("\"", "\"\"") + "\"";
        private static string Stamp(DateTime value) => value.ToString("yyyy-MM-dd HH:mm", CultureInfo.InvariantCulture);
    }
}
