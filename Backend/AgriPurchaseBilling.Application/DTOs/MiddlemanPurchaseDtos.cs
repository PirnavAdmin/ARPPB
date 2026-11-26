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
        public string Quality => QualityGrade;

        public decimal Quantity { get; set; }
        public string Unit { get; set; } = "Quintal";

        public decimal Rate { get; set; }
        public decimal PricePerQuintal => Rate;

        public decimal Subtotal { get; set; }
        public decimal TransportationCharges { get; set; }
        public decimal Transportation => TransportationCharges;
        public decimal LoadingCharges { get; set; }
        public decimal Loading => LoadingCharges;
        public decimal OtherCharges { get; set; }
        public decimal AdditionalCharges { get; set; }
        public decimal TotalAmount { get; set; }
        public decimal AverageCostPerUnit => Quantity > 0 ? Math.Round(TotalAmount / Quantity, 2) : 0;

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
        public string? FarmerLocation { get; set; }

        public string CropName { get; set; } = string.Empty;
        public string? Variety { get; set; } = "Standard";

        private string? _quality = "Grade A";
        public string? QualityGrade { get => _quality; set => _quality = value; }
        public string? Quality { get => _quality; set => _quality = value; }

        public decimal Quantity { get; set; }
        public string Unit { get; set; } = "Quintal";

        private decimal _rate;
        public decimal PricePerQuintal { get => _rate; set => _rate = value; }
        public decimal Rate { get => _rate; set => _rate = value; }

        private decimal _transportation = 0;
        public decimal TransportationCharges { get => _transportation; set => _transportation = value; }
        public decimal Transportation { get => _transportation; set => _transportation = value; }

        private decimal _loading = 0;
        public decimal LoadingCharges { get => _loading; set => _loading = value; }
        public decimal Loading { get => _loading; set => _loading = value; }

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
        public string? CropName { get; set; }
        public string? Crop { get => CropName; set => CropName = value; }
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
