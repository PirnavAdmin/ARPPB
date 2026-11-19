using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace AgriPurchaseBilling.Application.DTOs
{
    public class CreateCropRequestDto
    {
        [Required(ErrorMessage = "Crop Name is required.")]
        [StringLength(100, ErrorMessage = "Crop Name cannot exceed 100 characters.")]
        public required string CropName { get; set; }

        [Required(ErrorMessage = "Crop Category is required.")]
        [StringLength(60, ErrorMessage = "Crop Category cannot exceed 60 characters.")]
        public required string CropCategory { get; set; }

        [Required(ErrorMessage = "Crop Variety is required.")]
        [StringLength(150, ErrorMessage = "Crop Variety cannot exceed 150 characters.")]
        public required string CropVariety { get; set; }

        [Required(ErrorMessage = "Season is required.")]
        [StringLength(50, ErrorMessage = "Season cannot exceed 50 characters.")]
        public required string Season { get; set; }

        [Required(ErrorMessage = "Cultivation Area is required.")]
        [Range(0.01, 100000.0, ErrorMessage = "Cultivation Area must be greater than 0.")]
        public decimal CultivationAreaAcres { get; set; }

        [Required(ErrorMessage = "Harvest Date is required.")]
        public DateTime HarvestDate { get; set; }

        [Required(ErrorMessage = "Harvested Quantity is required.")]
        [Range(0.01, 10000000.0, ErrorMessage = "Harvested Quantity must be greater than 0.")]
        public decimal HarvestedQuantity { get; set; }

        public string Unit { get; set; } = "Quintals";

        [Required(ErrorMessage = "Expected Selling Price is required.")]
        [Range(0.01, 10000000.0, ErrorMessage = "Expected Selling Price must be greater than 0.")]
        public decimal ExpectedSellingPrice { get; set; }

        [StringLength(100, ErrorMessage = "Quality Grade cannot exceed 100 characters.")]
        public string? QualityGrade { get; set; }

        [Required(ErrorMessage = "Storage or Farm Location is required.")]
        [StringLength(255, ErrorMessage = "Storage Location cannot exceed 255 characters.")]
        public required string StorageLocation { get; set; }

        [StringLength(1000, ErrorMessage = "Crop Description cannot exceed 1000 characters.")]
        public string? CropDescription { get; set; }
    }

    public class UpdateCropRequestDto
    {
        [Required(ErrorMessage = "Crop Name is required.")]
        [StringLength(100, ErrorMessage = "Crop Name cannot exceed 100 characters.")]
        public required string CropName { get; set; }

        [Required(ErrorMessage = "Crop Category is required.")]
        [StringLength(60, ErrorMessage = "Crop Category cannot exceed 60 characters.")]
        public required string CropCategory { get; set; }

        [Required(ErrorMessage = "Crop Variety is required.")]
        [StringLength(150, ErrorMessage = "Crop Variety cannot exceed 150 characters.")]
        public required string CropVariety { get; set; }

        [Required(ErrorMessage = "Season is required.")]
        [StringLength(50, ErrorMessage = "Season cannot exceed 50 characters.")]
        public required string Season { get; set; }

        [Required(ErrorMessage = "Cultivation Area is required.")]
        [Range(0.01, 100000.0, ErrorMessage = "Cultivation Area must be greater than 0.")]
        public decimal CultivationAreaAcres { get; set; }

        [Required(ErrorMessage = "Harvest Date is required.")]
        public DateTime HarvestDate { get; set; }

        [Required(ErrorMessage = "Expected Selling Price is required.")]
        [Range(0.01, 10000000.0, ErrorMessage = "Expected Selling Price must be greater than 0.")]
        public decimal ExpectedSellingPrice { get; set; }

        public string? Unit { get; set; }

        [StringLength(100, ErrorMessage = "Quality Grade cannot exceed 100 characters.")]
        public string? QualityGrade { get; set; }

        [Required(ErrorMessage = "Storage or Farm Location is required.")]
        [StringLength(255, ErrorMessage = "Storage Location cannot exceed 255 characters.")]
        public required string StorageLocation { get; set; }

        [StringLength(1000, ErrorMessage = "Crop Description cannot exceed 1000 characters.")]
        public string? CropDescription { get; set; }
    }

    public class AddCropYieldRequestDto
    {
        [Required(ErrorMessage = "Additional harvested quantity is required.")]
        [Range(0.01, 10000000.0, ErrorMessage = "Additional quantity must be greater than 0.")]
        public decimal AdditionalQuantity { get; set; }
    }

    public class CropResponseDto
    {
        public long Id { get; set; }
        public required string CropCode { get; set; }
        public long FarmerId { get; set; }
        public required string CropName { get; set; }
        public required string CropCategory { get; set; }
        public required string CropVariety { get; set; }
        public required string Season { get; set; }
        public decimal CultivationAreaAcres { get; set; }
        public DateTime HarvestDate { get; set; }
        public decimal HarvestedQuantity { get; set; }
        public decimal AvailableQuantity { get; set; }
        public decimal SoldQuantity { get; set; }
        public required string Unit { get; set; }
        public decimal ExpectedSellingPrice { get; set; }
        public string? QualityGrade { get; set; }
        public required string StorageLocation { get; set; }
        public string? CropDescription { get; set; }
        public required string Status { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }

    public class OptionItemDto
    {
        public required string Code { get; set; }
        public required string Label { get; set; }
    }

    public class CropOptionsDto
    {
        public List<OptionItemDto> Categories { get; set; } = new();
        public List<OptionItemDto> Seasons { get; set; } = new();
        public List<OptionItemDto> QualityGrades { get; set; } = new();
        public List<OptionItemDto> Units { get; set; } = new();
    }

    public class CropMetadataDto : CropOptionsDto { }
}
