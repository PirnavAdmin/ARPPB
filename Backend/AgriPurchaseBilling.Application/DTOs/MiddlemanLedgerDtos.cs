using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace AgriPurchaseBilling.Application.DTOs
{
    public class MiddlemanLedgerDto
    {
        [JsonPropertyName("id")]
        public long Id { get; set; }

        [JsonPropertyName("ledgerId")]
        public string LedgerId { get; set; } = string.Empty;

        [JsonPropertyName("date")]
        public string Date { get; set; } = string.Empty;

        [JsonPropertyName("transactionId")]
        public string? TransactionId { get; set; }

        [JsonPropertyName("category")]
        public string Category { get; set; } = string.Empty;

        [JsonPropertyName("description")]
        public string? Description { get; set; }

        [JsonPropertyName("partyId")]
        public string? PartyId { get; set; }

        [JsonPropertyName("partyName")]
        public string? PartyName { get; set; }

        [JsonPropertyName("partyCategory")]
        public string PartyCategory { get; set; } = string.Empty;

        [JsonPropertyName("subLedgerGroup")]
        public string SubLedgerGroup { get; set; } = string.Empty;

        [JsonPropertyName("balanceLabel")]
        public string BalanceLabel { get; set; } = string.Empty;

        [JsonPropertyName("debit")]
        public decimal Debit { get; set; }

        [JsonPropertyName("credit")]
        public decimal Credit { get; set; }

        [JsonPropertyName("processingExpenses")]
        public decimal ProcessingExpenses { get; set; }

        [JsonPropertyName("runningBalance")]
        public decimal RunningBalance { get; set; }

        [JsonPropertyName("settledAmount")]
        public decimal SettledAmount { get; set; }

        [JsonPropertyName("outstandingAmount")]
        public decimal OutstandingAmount { get; set; }

        [JsonPropertyName("expectedPaymentDate")]
        public string? ExpectedPaymentDate { get; set; }

        [JsonPropertyName("status")]
        public string Status { get; set; } = "Pending";

        [JsonPropertyName("paymentMode")]
        public string? PaymentMode { get; set; }

        [JsonPropertyName("referenceNo")]
        public string? ReferenceNo { get; set; }

        [JsonPropertyName("originalAmount")]
        public decimal OriginalAmount => Debit > 0 ? Debit : Credit;

        [JsonPropertyName("paidAmount")]
        public decimal PaidAmount => SettledAmount;

        [JsonPropertyName("paymentHistory")]
        public List<MiddlemanPaymentDto> PaymentHistory { get; set; } = new();
    }

    public class MiddlemanPaymentDto
    {
        [JsonPropertyName("id")]
        public long Id { get; set; }

        [JsonPropertyName("paymentCode")]
        public string PaymentCode { get; set; } = string.Empty;

        [JsonPropertyName("ledgerId")]
        public long? LedgerId { get; set; }

        [JsonPropertyName("transactionId")]
        public string TransactionId { get; set; } = string.Empty;

        [JsonPropertyName("partyCategory")]
        public string PartyCategory { get; set; } = string.Empty;

        [JsonPropertyName("partyId")]
        public string? PartyId { get; set; }

        [JsonPropertyName("partyName")]
        public string PartyName { get; set; } = string.Empty;

        [JsonPropertyName("paymentDirection")]
        public string PaymentDirection { get; set; } = "Paid";

        [JsonPropertyName("originalAmount")]
        public decimal OriginalAmount { get; set; }

        [JsonPropertyName("paymentAmount")]
        public decimal PaymentAmount { get; set; }

        [JsonPropertyName("totalPaidAfter")]
        public decimal TotalPaidAfter { get; set; }

        [JsonPropertyName("balanceAfter")]
        public decimal BalanceAfter { get; set; }

        [JsonPropertyName("paymentMode")]
        public string PaymentMode { get; set; } = "NEFT / RTGS";

        [JsonPropertyName("referenceNo")]
        public string? ReferenceNo { get; set; }

        [JsonPropertyName("status")]
        public string Status { get; set; } = "Successful";

        [JsonPropertyName("notes")]
        public string? Notes { get; set; }

        [JsonPropertyName("paymentDate")]
        public string PaymentDate { get; set; } = string.Empty;
    }

    public class MiddlemanLedgerSummaryDto
    {
        [JsonPropertyName("totalPurchases")]
        public decimal TotalPurchases { get; set; }

        [JsonPropertyName("totalPurchaseValue")]
        public decimal TotalPurchaseValue => TotalPurchases;

        [JsonPropertyName("totalSales")]
        public decimal TotalSales { get; set; }

        [JsonPropertyName("totalSalesValue")]
        public decimal TotalSalesValue => TotalSales;

        [JsonPropertyName("costOfGoodsSold")]
        public decimal CostOfGoodsSold { get; set; }

        [JsonPropertyName("cogs")]
        public decimal Cogs => CostOfGoodsSold;

        [JsonPropertyName("totalCogs")]
        public decimal TotalCogs => CostOfGoodsSold;

        [JsonPropertyName("totalPayables")]
        public decimal TotalPayables { get; set; }

        [JsonPropertyName("expectedPayables")]
        public decimal ExpectedPayables => TotalPayables;

        [JsonPropertyName("totalReceivables")]
        public decimal TotalReceivables { get; set; }

        [JsonPropertyName("expectedReceivables")]
        public decimal ExpectedReceivables => TotalReceivables;

        [JsonPropertyName("amountReceived")]
        public decimal AmountReceived { get; set; }

        [JsonPropertyName("amountPaid")]
        public decimal AmountPaid { get; set; }

        [JsonPropertyName("netPosition")]
        public decimal NetPosition { get; set; }

        [JsonPropertyName("netOutstanding")]
        public decimal NetOutstanding => NetPosition;

        [JsonPropertyName("grossProfit")]
        public decimal GrossProfit { get; set; }

        [JsonPropertyName("unpaidCount")]
        public int UnpaidCount { get; set; }

        [JsonPropertyName("partiallyPaidCount")]
        public int PartiallyPaidCount { get; set; }

        [JsonPropertyName("paidCount")]
        public int PaidCount { get; set; }

        [JsonPropertyName("totalEntries")]
        public int TotalEntries { get; set; }

        [JsonPropertyName("entries")]
        public List<MiddlemanLedgerDto> Entries { get; set; } = new();
    }

    public class CreateLedgerEntryRequest
    {
        [JsonPropertyName("date")]
        public string? Date { get; set; }

        [JsonPropertyName("transactionId")]
        public string? TransactionId { get; set; }

        [JsonPropertyName("category")]
        public string? Category { get; set; }

        [JsonPropertyName("description")]
        public string? Description { get; set; }

        [JsonPropertyName("partyId")]
        public string? PartyId { get; set; }

        [JsonPropertyName("partyName")]
        public string? PartyName { get; set; }

        [JsonPropertyName("partyCategory")]
        public string PartyCategory { get; set; } = string.Empty;

        [JsonPropertyName("debit")]
        public decimal? Debit { get; set; }

        [JsonPropertyName("credit")]
        public decimal? Credit { get; set; }

        [JsonPropertyName("processingExpenses")]
        public decimal? ProcessingExpenses { get; set; }

        [JsonPropertyName("settledAmount")]
        public decimal? SettledAmount { get; set; }

        [JsonPropertyName("outstandingAmount")]
        public decimal? OutstandingAmount { get; set; }

        [JsonPropertyName("expectedPaymentDate")]
        public string? ExpectedPaymentDate { get; set; }

        [JsonPropertyName("status")]
        public string? Status { get; set; }
    }

    public class UpdateLedgerEntryRequest
    {
        [JsonPropertyName("date")]
        public string? Date { get; set; }

        [JsonPropertyName("description")]
        public string? Description { get; set; }

        [JsonPropertyName("category")]
        public string? Category { get; set; }

        [JsonPropertyName("debit")]
        public decimal? Debit { get; set; }

        [JsonPropertyName("credit")]
        public decimal? Credit { get; set; }

        [JsonPropertyName("processingExpenses")]
        public decimal? ProcessingExpenses { get; set; }

        [JsonPropertyName("settledAmount")]
        public decimal? SettledAmount { get; set; }

        [JsonPropertyName("outstandingAmount")]
        public decimal? OutstandingAmount { get; set; }

        [JsonPropertyName("expectedPaymentDate")]
        public string? ExpectedPaymentDate { get; set; }

        [JsonPropertyName("status")]
        public string? Status { get; set; }
    }

    public class SettleLedgerRequest
    {
        [JsonPropertyName("amount")]
        public decimal? Amount { get; set; }

        [JsonPropertyName("paymentMode")]
        public string? PaymentMode { get; set; }

        [JsonPropertyName("notes")]
        public string? Notes { get; set; }

        [JsonPropertyName("referenceNo")]
        public string? ReferenceNo { get; set; }

        [JsonPropertyName("referenceId")]
        public string? ReferenceId { get; set; }
    }
}
