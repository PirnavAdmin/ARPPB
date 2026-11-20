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

        [JsonPropertyName("netPosition")]
        public decimal NetPosition { get; set; }

        [JsonPropertyName("netOutstanding")]
        public decimal NetOutstanding => NetPosition;

        [JsonPropertyName("grossProfit")]
        public decimal GrossProfit { get; set; }

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
    }
}
