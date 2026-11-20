using System;
using System.Collections.Generic;

namespace AgriPurchaseBilling.Application.DTOs
{
    public class MiddlemanVendorDto
    {
        public long Id { get; set; }
        public long MiddlemanId { get; set; }

        public string VendorId { get; set; } = string.Empty;
        public string VendorCode => VendorId;

        public string BusinessName { get; set; } = string.Empty;
        public string OwnerName { get; set; } = string.Empty;
        public string Mobile { get; set; } = string.Empty;
        public string? Email { get; set; }

        public string BusinessType { get; set; } = "Wholesaler";
        public string? GstNumber { get; set; }
        public string? Gstin => GstNumber;

        public string? Address { get; set; }
        public string District { get; set; } = string.Empty;
        public string State { get; set; } = "Andhra Pradesh";
        public string? PinCode { get; set; }

        public int TotalPurchases { get; set; }
        public int Orders => TotalPurchases;

        public decimal TotalPurchaseValue { get; set; }
        public decimal TotalValue => TotalPurchaseValue;

        public decimal OutstandingReceivables { get; set; }

        public string Status { get; set; } = "Active";
        public string? Notes { get; set; }

        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }

    public class MiddlemanVendorQueryDto
    {
        public string? Search { get; set; }
        public string? Type { get; set; } = "ALL";
        public string? BusinessType { get => Type; set => Type = value; }
        public string? District { get; set; } = "ALL";
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 10;
    }

    public class MiddlemanVendorPageDto
    {
        public List<MiddlemanVendorDto> Items { get; set; } = new();
        public int TotalItems { get; set; }
        public int Page { get; set; }
        public int PageSize { get; set; }
        public int TotalPages => PageSize > 0 ? (int)Math.Ceiling((double)TotalItems / PageSize) : 0;
    }

    public class RegisterVendorRequest
    {
        public string BusinessName { get; set; } = string.Empty;
        public string OwnerName { get; set; } = string.Empty;
        public string Mobile { get; set; } = string.Empty;
        public string BusinessType { get; set; } = "Wholesaler";
        public string? GstNumber { get; set; }
        public string? Gstin { get => GstNumber; set => GstNumber = value; }
        public string? Email { get; set; }
        public string? Address { get; set; }
        public string District { get; set; } = string.Empty;
        public string? State { get; set; } = "Andhra Pradesh";
        public string? PinCode { get; set; }
        public string? Notes { get; set; }
    }

    public class UpdateVendorRequest
    {
        public string? BusinessName { get; set; }
        public string? OwnerName { get; set; }
        public string? Mobile { get; set; }
        public string? BusinessType { get; set; }
        public string? GstNumber { get; set; }
        public string? Gstin { get => GstNumber; set => GstNumber = value; }
        public string? Email { get; set; }
        public string? Address { get; set; }
        public string? District { get; set; }
        public string? State { get; set; }
        public string? PinCode { get; set; }
        public string? Status { get; set; }
        public string? Notes { get; set; }
    }

    public class MiddlemanVendorSaleDto
    {
        public long Id { get; set; }
        public long MiddlemanId { get; set; }

        public string SaleId { get; set; } = string.Empty;
        public string SaleCode => SaleId;

        public string VendorId { get; set; } = string.Empty;
        public string VendorName { get; set; } = string.Empty;
        public string? OwnerName { get; set; }
        public string? Mobile { get; set; }
        public string? BusinessName { get; set; }

        public string CropName { get; set; } = string.Empty;
        public string Variety { get; set; } = "Standard";
        public string QualityGrade { get; set; } = "Grade A";
        public string Quality => QualityGrade;

        public decimal Quantity { get; set; }
        public string Unit { get; set; } = "Quintal";

        public decimal Rate { get; set; }
        public decimal PricePerQuintal => Rate;

        public decimal Subtotal { get; set; }
        public decimal TransportationCharges { get; set; }
        public decimal Transportation => TransportationCharges;
        public decimal OtherCharges { get; set; }
        public decimal TotalAmount { get; set; }

        public DateTime SalesDate { get; set; }
        public DateTime? ExpectedDeliveryDate { get; set; }
        public DateTime? ExpectedPaymentDate { get; set; }
        public string? DeliveryLocation { get; set; }

        public string OtpStatus { get; set; } = "Pending OTP";
        public DateTime? ConfirmationDate { get; set; }
        public string Status { get; set; } = "Pending Confirmation";

        public string? AllocatedStockId { get; set; }
        public decimal Cogs { get; set; }
        public string? Notes { get; set; }

        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }

    public class CreateMiddlemanVendorSaleRequest
    {
        public string VendorId { get; set; } = string.Empty;
        public string? VendorName { get; set; }
        public string? BusinessName { get; set; }

        public string CropName { get; set; } = string.Empty;
        public string? Variety { get; set; } = "Standard";

        private string? _quality = "Grade A";
        public string? QualityGrade { get => _quality; set => _quality = value; }
        public string? Quality { get => _quality; set => _quality = value; }

        public decimal Quantity { get; set; }
        public string Unit { get; set; } = "Quintal";

        private decimal _rate;
        public decimal Rate { get => _rate; set => _rate = value; }
        public decimal PricePerQuintal { get => _rate; set => _rate = value; }

        private decimal _transportation = 0;
        public decimal TransportationCharges { get => _transportation; set => _transportation = value; }
        public decimal Transportation { get => _transportation; set => _transportation = value; }

        public decimal OtherCharges { get; set; } = 0;

        public DateTime? SalesDate { get; set; }
        public DateTime? ExpectedDeliveryDate { get; set; }
        public DateTime? ExpectedPaymentDate { get; set; }
        public string? DeliveryLocation { get; set; }
        public string? Notes { get; set; }

        public bool IsDraft { get; set; } = false;
    }

    public class MiddlemanVendorSaleQueryDto
    {
        public string? Search { get; set; }
        public string? Status { get; set; } = "ALL";
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 10;
    }

    public class MiddlemanVendorSalePageDto
    {
        public List<MiddlemanVendorSaleDto> Items { get; set; } = new();
        public int TotalItems { get; set; }
        public int Page { get; set; }
        public int PageSize { get; set; }
        public int TotalPages => PageSize > 0 ? (int)Math.Ceiling((double)TotalItems / PageSize) : 0;
    }
}
