using System;
using System.Collections.Generic;

namespace AgriPurchaseBilling.Application.DTOs
{
    public class MiddlemanPurchaseDto
    {
        public long Id { get; set; }
        public long MiddlemanId { get; set; }

        public string PurchaseId { get; set; } = string.Empty;
        public string PurchaseCode => PurchaseId;

        public string FarmerId { get; set; } = string.Empty;
        public string FarmerName { get; set; } = string.Empty;
        public string? FarmerMobile { get; set; }

        public string CropName { get; set; } = string.Empty;
        public string Variety { get; set; } = "Standard";
        public string QualityGrade { get; set; } = "Grade A";

        public decimal Quantity { get; set; }
        public string Unit { get; set; } = "Quintal";

        public decimal Rate { get; set; }
        public decimal PricePerQuintal => Rate;

        public decimal Subtotal { get; set; }
        public decimal TransportationCharges { get; set; }
        public decimal LoadingCharges { get; set; }
        public decimal OtherCharges { get; set; }
        public decimal AdditionalCharges { get; set; }
        public decimal TotalAmount { get; set; }

        public DateTime PurchaseDate { get; set; }
        public DateTime? ExpectedPaymentDate { get; set; }

        public string? PickupLocation { get; set; }
        public DateTime? DeliveryDate { get; set; }

        public string Status { get; set; } = "Pending Confirmation";
        public string OtpStatus { get; set; } = "Pending OTP";

        public string? Notes { get; set; }

        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }

    public class CreateMiddlemanPurchaseRequest
    {
        public string FarmerId { get; set; } = string.Empty;
        public string? FarmerName { get; set; }
        public string? FarmerMobile { get; set; }

        public string CropName { get; set; } = string.Empty;
        public string? Variety { get; set; } = "Standard";
        public string? QualityGrade { get; set; } = "Grade A";

        public decimal Quantity { get; set; }
        public string Unit { get; set; } = "Quintal";
        public decimal PricePerQuintal { get; set; }
        public decimal Rate => PricePerQuintal;

        public decimal TransportationCharges { get; set; } = 0;
        public decimal LoadingCharges { get; set; } = 0;
        public decimal OtherCharges { get; set; } = 0;

        public DateTime? PurchaseDate { get; set; }
        public DateTime? ExpectedPaymentDate { get; set; }

        public string? PickupLocation { get; set; }
        public DateTime? DeliveryDate { get; set; }

        public string? Notes { get; set; }

        public bool IsDraft { get; set; } = false;
    }

    public class MiddlemanPurchaseQueryDto
    {
        public string? Search { get; set; }
        public string? Status { get; set; } = "ALL";
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 10;
    }

    public class MiddlemanPurchasePageDto
    {
        public List<MiddlemanPurchaseDto> Items { get; set; } = new();
        public int TotalItems { get; set; }
        public int Page { get; set; }
        public int PageSize { get; set; }
        public int TotalPages => PageSize > 0 ? (int)Math.Ceiling((double)TotalItems / PageSize) : 0;
    }
}
