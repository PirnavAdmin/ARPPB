using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace AgriPurchaseBilling.Application.DTOs
{
    public class SellProductOptionsDto
    {
        public List<OptionItemDto> BuyerCategories { get; set; } = new();
        public List<AvailableCropForSaleDto> AvailableCrops { get; set; } = new();
    }

    public class CreateSellOrderRequestDto
    {
        [Required(ErrorMessage = "Crop selection is required.")]
        [Range(1, long.MaxValue, ErrorMessage = "Please select a valid crop.")]
        public long CropId { get; set; }

        public string? CropName { get; set; }

        [Required(ErrorMessage = "Buyer Category is required.")]
        [RegularExpression("^(Middleman|Vendor|Customer)$", ErrorMessage = "Buyer Category must be 'Middleman', 'Vendor', or 'Customer'.")]
        public required string BuyerCategory { get; set; }

        [Required(ErrorMessage = "Buyer Name is required.")]
        [StringLength(150, ErrorMessage = "Buyer Name cannot exceed 150 characters.")]
        public required string BuyerName { get; set; }

        [Required(ErrorMessage = "Buyer Mobile Number is required.")]
        [RegularExpression(@"^[0-9]{10}$", ErrorMessage = "Enter a valid 10-digit Indian mobile number.")]
        public required string BuyerMobile { get; set; }

        private decimal _sellingQuantity;
        public decimal SellingQuantity
        {
            get => _sellingQuantity;
            set => _sellingQuantity = value;
        }

        public decimal Quantity
        {
            get => _sellingQuantity;
            set { if (value > 0 && _sellingQuantity == 0) _sellingQuantity = value; }
        }

        private decimal _pricePerUnit;
        public decimal PricePerUnit
        {
            get => _pricePerUnit;
            set => _pricePerUnit = value;
        }

        public decimal Rate
        {
            get => _pricePerUnit;
            set { if (value > 0 && _pricePerUnit == 0) _pricePerUnit = value; }
        }

        public string? QualityGrade { get; set; }
        public string? Unit { get; set; }

        [Required(ErrorMessage = "Pickup Location is required.")]
        [StringLength(255, ErrorMessage = "Pickup Location cannot exceed 255 characters.")]
        public required string PickupLocation { get; set; }

        [Required(ErrorMessage = "Expected Pickup Date is required.")]
        public DateTime ExpectedPickupDate { get; set; }

        [StringLength(1000, ErrorMessage = "Notes cannot exceed 1000 characters.")]
        public string? Notes { get; set; }
    }

    public class VerifySellOtpRequestDto
    {
        /// <summary>
        /// 6-digit OTP confirmation code generated for this transaction.
        /// </summary>
        public string Otp { get; set; } = string.Empty;
    }

    public class SellOrderResponseDto
    {
        public long Id { get; set; }
        public required string SaleCode { get; set; }
        public long FarmerId { get; set; }
        public long CropId { get; set; }

        public required string BuyerCategory { get; set; }
        public required string BuyerName { get; set; }
        public required string BuyerMobile { get; set; }

        public required string CropName { get; set; }
        public required string CropVariety { get; set; }
        public string? QualityGrade { get; set; }
        public decimal SellingQuantity { get; set; }
        public required string Unit { get; set; }
        public decimal PricePerUnit { get; set; }
        public decimal TotalAmount { get; set; }

        public required string PickupLocation { get; set; }
        public DateTime? ExpectedPickupDate { get; set; }
        public string? Notes { get; set; }

        public required string Status { get; set; }
        public string? OtpStatus { get; set; }
        public string? OtpCode { get; set; }
        public string? DevOtp { get; set; }
        public string TransactionId => SaleCode;
        public decimal Quantity => SellingQuantity;
        public decimal Rate => PricePerUnit;
        public DateTime? ConfirmedAt { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class AvailableCropForSaleDto
    {
        public long Id { get; set; }
        public string CropCode { get; set; } = string.Empty;
        public string CropName { get; set; } = string.Empty;
        public string CropCategory { get; set; } = string.Empty;
        public string CropVariety { get; set; } = string.Empty;
        public string? QualityGrade { get; set; }
        public decimal AvailableQuantity { get; set; }
        public string Unit { get; set; } = string.Empty;
        public decimal ExpectedSellingPrice { get; set; }
        public string? StorageLocation { get; set; }
    }
}
