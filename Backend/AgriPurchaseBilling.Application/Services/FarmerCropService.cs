using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using AgriPurchaseBilling.Application.DTOs;
using AgriPurchaseBilling.Application.Interfaces;
using AgriPurchaseBilling.Domain.Entities;

namespace AgriPurchaseBilling.Application.Services
{
    public class FarmerCropService : IFarmerCropService
    {
        private readonly IFarmerCropRepository _cropRepository;

        public FarmerCropService(IFarmerCropRepository cropRepository)
        {
            _cropRepository = cropRepository;
        }

        public async Task<ApiResponse<List<CropResponseDto>>> GetFarmerCropsAsync(
            long userId,
            string? category = null,
            string? season = null,
            string? search = null,
            CancellationToken cancellationToken = default)
        {
            try
            {
                var farmer = await _cropRepository.GetFarmerByUserIdAsync(userId, cancellationToken);
                if (farmer == null)
                {
                    return ApiResponse<List<CropResponseDto>>.Fail("Farmer profile not found for this user.");
                }

                string? normalizedCategory = NormalizeCategory(category);
                string? normalizedSeason = NormalizeSeason(season);

                var crops = await _cropRepository.GetCropsByFarmerIdAsync(
                    farmer.Id,
                    normalizedCategory,
                    normalizedSeason,
                    search,
                    cancellationToken);

                var dtos = crops.Select(MapToDto).ToList();
                return ApiResponse<List<CropResponseDto>>.Ok(dtos, $"Retrieved {dtos.Count} crop(s) successfully.");
            }
            catch (Exception ex)
            {
                return ApiResponse<List<CropResponseDto>>.Fail($"Error retrieving crops: {ex.Message}");
            }
        }

        public async Task<ApiResponse<CropResponseDto>> GetCropByIdAsync(
            long userId,
            long cropId,
            CancellationToken cancellationToken = default)
        {
            try
            {
                var farmer = await _cropRepository.GetFarmerByUserIdAsync(userId, cancellationToken);
                if (farmer == null)
                {
                    return ApiResponse<CropResponseDto>.Fail("Farmer profile not found for this user.");
                }

                var crop = await _cropRepository.GetCropByIdAsync(cropId, farmer.Id, cancellationToken);
                if (crop == null)
                {
                    return ApiResponse<CropResponseDto>.Fail("Crop not found or already archived.");
                }

                return ApiResponse<CropResponseDto>.Ok(MapToDto(crop), "Crop details retrieved successfully.");
            }
            catch (Exception ex)
            {
                return ApiResponse<CropResponseDto>.Fail($"Error retrieving crop: {ex.Message}");
            }
        }

        public async Task<ApiResponse<CropResponseDto>> RegisterCropAsync(
            long userId,
            CreateCropRequestDto request,
            CancellationToken cancellationToken = default)
        {
            try
            {
                var farmer = await _cropRepository.GetFarmerByUserIdAsync(userId, cancellationToken);
                if (farmer == null)
                {
                    return ApiResponse<CropResponseDto>.Fail("Farmer profile not found for this user.");
                }

                string cropCode = await _cropRepository.GenerateNextCropCodeAsync(cancellationToken);
                string cleanSeason = NormalizeSeason(request.Season) ?? request.Season.Trim();
                string cleanCategory = NormalizeCategory(request.CropCategory) ?? request.CropCategory.Trim();

                string status = "Ready to Sell";
                if (request.HarvestedQuantity <= 0)
                {
                    status = "Out of Stock";
                }
                else if (request.HarvestedQuantity <= 50)
                {
                    status = "Low Stock";
                }
                else if (request.ExpectedSellingPrice >= 7500 || (cleanCategory.Equals("Spices", StringComparison.OrdinalIgnoreCase) && request.ExpectedSellingPrice >= 6000))
                {
                    status = "High Demand";
                }

                var crop = new FarmerCrop
                {
                    CropCode = cropCode,
                    FarmerId = farmer.Id,
                    CropName = request.CropName.Trim(),
                    CropCategory = cleanCategory,
                    CropVariety = request.CropVariety.Trim(),
                    Season = cleanSeason,
                    CultivationAreaAcres = request.CultivationAreaAcres,
                    HarvestDate = request.HarvestDate,
                    HarvestedQuantity = request.HarvestedQuantity,
                    AvailableQuantity = request.HarvestedQuantity,
                    SoldQuantity = 0.00m,
                    Unit = NormalizeUnit(request.Unit),
                    ExpectedSellingPrice = request.ExpectedSellingPrice,
                    QualityGrade = NormalizeGrade(request.QualityGrade),
                    StorageLocation = request.StorageLocation.Trim(),
                    CropDescription = request.CropDescription?.Trim(),
                    Status = status,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                var created = await _cropRepository.AddCropAsync(crop, cancellationToken);
                return ApiResponse<CropResponseDto>.Ok(MapToDto(created), "New crop registered successfully.");
            }
            catch (Exception ex)
            {
                return ApiResponse<CropResponseDto>.Fail($"Error registering crop: {ex.Message}");
            }
        }

        public async Task<ApiResponse<CropResponseDto>> UpdateCropAsync(
            long userId,
            long cropId,
            UpdateCropRequestDto request,
            CancellationToken cancellationToken = default)
        {
            try
            {
                var farmer = await _cropRepository.GetFarmerByUserIdAsync(userId, cancellationToken);
                if (farmer == null)
                {
                    return ApiResponse<CropResponseDto>.Fail("Farmer profile not found for this user.");
                }

                var crop = await _cropRepository.GetCropByIdAsync(cropId, farmer.Id, cancellationToken);
                if (crop == null)
                {
                    return ApiResponse<CropResponseDto>.Fail("Crop not found or already archived.");
                }

                crop.CropName = request.CropName.Trim();
                crop.CropCategory = NormalizeCategory(request.CropCategory) ?? request.CropCategory.Trim();
                crop.CropVariety = request.CropVariety.Trim();
                crop.Season = NormalizeSeason(request.Season) ?? request.Season.Trim();
                crop.CultivationAreaAcres = request.CultivationAreaAcres;
                crop.HarvestDate = request.HarvestDate;
                crop.ExpectedSellingPrice = request.ExpectedSellingPrice;
                if (!string.IsNullOrWhiteSpace(request.Unit))
                {
                    crop.Unit = NormalizeUnit(request.Unit);
                }
                crop.QualityGrade = NormalizeGrade(request.QualityGrade);
                crop.StorageLocation = request.StorageLocation.Trim();
                crop.CropDescription = request.CropDescription?.Trim();

                bool updated = await _cropRepository.UpdateCropAsync(crop, cancellationToken);
                if (!updated)
                {
                    return ApiResponse<CropResponseDto>.Fail("Failed to update crop details.");
                }

                return ApiResponse<CropResponseDto>.Ok(MapToDto(crop), "Crop details updated successfully.");
            }
            catch (Exception ex)
            {
                return ApiResponse<CropResponseDto>.Fail($"Error updating crop: {ex.Message}");
            }
        }

        public async Task<ApiResponse<CropResponseDto>> AddCropYieldAsync(
            long userId,
            long cropId,
            AddCropYieldRequestDto request,
            CancellationToken cancellationToken = default)
        {
            try
            {
                var farmer = await _cropRepository.GetFarmerByUserIdAsync(userId, cancellationToken);
                if (farmer == null)
                {
                    return ApiResponse<CropResponseDto>.Fail("Farmer profile not found for this user.");
                }

                bool added = await _cropRepository.AddYieldStockAsync(cropId, farmer.Id, request.AdditionalQuantity, cancellationToken);
                if (!added)
                {
                    return ApiResponse<CropResponseDto>.Fail("Failed to add stock yield. Crop might not exist.");
                }

                var updatedCrop = await _cropRepository.GetCropByIdAsync(cropId, farmer.Id, cancellationToken);
                return ApiResponse<CropResponseDto>.Ok(MapToDto(updatedCrop!), "Stock yield added successfully.");
            }
            catch (Exception ex)
            {
                return ApiResponse<CropResponseDto>.Fail($"Error adding harvest yield: {ex.Message}");
            }
        }

        public async Task<ApiResponse<bool>> DeleteCropAsync(
            long userId,
            long cropId,
            CancellationToken cancellationToken = default)
        {
            try
            {
                var farmer = await _cropRepository.GetFarmerByUserIdAsync(userId, cancellationToken);
                if (farmer == null)
                {
                    return ApiResponse<bool>.Fail("Farmer profile not found for this user.");
                }

                bool deleted = await _cropRepository.SoftDeleteCropAsync(cropId, farmer.Id, cancellationToken);
                if (!deleted)
                {
                    return ApiResponse<bool>.Fail("Crop not found or could not be deleted.");
                }

                return ApiResponse<bool>.Ok(true, "Crop deleted successfully.");
            }
            catch (Exception ex)
            {
                return ApiResponse<bool>.Fail($"Error deleting crop: {ex.Message}");
            }
        }

        public Task<ApiResponse<CropOptionsDto>> GetOptionsAsync(CancellationToken cancellationToken = default)
        {
            var options = new CropOptionsDto
            {
                Seasons = new List<OptionItemDto>
                {
                    new() { Code = "Kharif", Label = "Kharif (Monsoon)" },
                    new() { Code = "Rabi", Label = "Rabi (Winter)" },
                    new() { Code = "Zaid", Label = "Zaid (Summer)" },
                    new() { Code = "Annual", Label = "Annual" }
                },
                Categories = new List<OptionItemDto>
                {
                    new() { Code = "Cereals", Label = "Cereals (Paddy, Wheat, Maize)" },
                    new() { Code = "Spices", Label = "Spices (Turmeric, Chilli)" },
                    new() { Code = "Oilseeds", Label = "Oilseeds (Groundnut, Mustard)" },
                    new() { Code = "Commercial", Label = "Commercial or Cash Crops (Cotton, Sugarcane)" },
                    new() { Code = "Pulses", Label = "Pulses (Red Gram, Bengal Gram)" },
                    new() { Code = "Horticulture", Label = "Horticulture (Fruits, Vegetables)" }
                },
                QualityGrades = new List<OptionItemDto>
                {
                    new() { Code = "Grade A", Label = "Grade A (Premium Export Quality)" },
                    new() { Code = "Grade B", Label = "Grade B (Standard Commercial)" },
                    new() { Code = "Grade C", Label = "Grade C (Processing Grade)" }
                },
                Units = new List<OptionItemDto>
                {
                    new() { Code = "Quintals", Label = "Quintals (qtl)" },
                    new() { Code = "Kilograms", Label = "Kilograms (kg)" },
                    new() { Code = "Bags", Label = "Bags (50kg)" },
                    new() { Code = "Tonnes", Label = "Tonnes" }
                }
            };

            return Task.FromResult(ApiResponse<CropOptionsDto>.Ok(options, "Crop form options retrieved successfully."));
        }

        public async Task<ApiResponse<CropMetadataDto>> GetMetadataAsync(CancellationToken cancellationToken = default)
        {
            var optionsResult = await GetOptionsAsync(cancellationToken);
            var metadata = new CropMetadataDto
            {
                Seasons = optionsResult.Data?.Seasons ?? new(),
                Categories = optionsResult.Data?.Categories ?? new(),
                QualityGrades = optionsResult.Data?.QualityGrades ?? new(),
                Units = optionsResult.Data?.Units ?? new()
            };
            return ApiResponse<CropMetadataDto>.Ok(metadata, "Metadata retrieved successfully.");
        }

        private static string? NormalizeSeason(string? season)
        {
            if (string.IsNullOrWhiteSpace(season)) return null;
            if (season.Contains("Kharif", StringComparison.OrdinalIgnoreCase)) return "Kharif";
            if (season.Contains("Rabi", StringComparison.OrdinalIgnoreCase)) return "Rabi";
            if (season.Contains("Zaid", StringComparison.OrdinalIgnoreCase)) return "Zaid";
            if (season.Contains("Annual", StringComparison.OrdinalIgnoreCase)) return "Annual";
            return season.Trim();
        }

        private static string? NormalizeCategory(string? category)
        {
            if (string.IsNullOrWhiteSpace(category)) return null;
            if (category.Contains("Cereal", StringComparison.OrdinalIgnoreCase)) return "Cereals";
            if (category.Contains("Spice", StringComparison.OrdinalIgnoreCase)) return "Spices";
            if (category.Contains("Oilseed", StringComparison.OrdinalIgnoreCase)) return "Oilseeds";
            if (category.Contains("Commercial", StringComparison.OrdinalIgnoreCase) || category.Contains("Cash", StringComparison.OrdinalIgnoreCase)) return "Commercial";
            if (category.Contains("Pulse", StringComparison.OrdinalIgnoreCase)) return "Pulses";
            if (category.Contains("Horticulture", StringComparison.OrdinalIgnoreCase) || category.Contains("Fruit", StringComparison.OrdinalIgnoreCase) || category.Contains("Vegetable", StringComparison.OrdinalIgnoreCase)) return "Horticulture";
            return category.Trim();
        }

        private static string NormalizeUnit(string? unit)
        {
            if (string.IsNullOrWhiteSpace(unit)) return "Quintals (qtl)";
            if (unit.Contains("Quintal", StringComparison.OrdinalIgnoreCase) || unit.Contains("qtl", StringComparison.OrdinalIgnoreCase)) return "Quintals (qtl)";
            if (unit.Contains("Kilo", StringComparison.OrdinalIgnoreCase) || unit.Contains("kg", StringComparison.OrdinalIgnoreCase)) return "Kilograms (kg)";
            if (unit.Contains("Bag", StringComparison.OrdinalIgnoreCase)) return "Bags (50kg)";
            if (unit.Contains("Tonn", StringComparison.OrdinalIgnoreCase)) return "Tonnes";
            return unit.Trim();
        }

        private static string? NormalizeGrade(string? grade)
        {
            if (string.IsNullOrWhiteSpace(grade)) return null;
            if (grade.Contains("Grade A", StringComparison.OrdinalIgnoreCase)) return "Grade A (Premium Export Quality)";
            if (grade.Contains("Grade B", StringComparison.OrdinalIgnoreCase) || grade.Contains("Commercial", StringComparison.OrdinalIgnoreCase)) return "Grade B (Standard Commercial)";
            if (grade.Contains("Grade C", StringComparison.OrdinalIgnoreCase) || grade.Contains("Processing", StringComparison.OrdinalIgnoreCase)) return "Grade C (Processing Grade)";
            return grade.Trim();
        }

        private static string ComputeCropStatus(FarmerCrop c)
        {
            // 1. 0 Quantil = Out of Stock
            if (c.AvailableQuantity <= 0)
            {
                return "Out of Stock";
            }

            // 2. Low Stock <= 50
            if (c.AvailableQuantity <= 50)
            {
                return "Low Stock";
            }

            // 3. If the price is high it will be High in Demand (e.g. >= ₹7,500 INR/Qtl, or Spices >= ₹6,000)
            bool isHighPrice = c.ExpectedSellingPrice >= 7500
                            || (c.CropCategory.Equals("Spices", StringComparison.OrdinalIgnoreCase) && c.ExpectedSellingPrice >= 6000);

            if (isHighPrice)
            {
                return "High Demand";
            }

            // 4. Normal / Ready to Sell >= 50
            return "Ready to Sell";
        }

        private static CropResponseDto MapToDto(FarmerCrop c)
        {
            return new CropResponseDto
            {
                Id = c.Id,
                CropCode = c.CropCode,
                FarmerId = c.FarmerId,
                CropName = c.CropName,
                CropCategory = c.CropCategory,
                CropVariety = c.CropVariety,
                Season = c.Season,
                CultivationAreaAcres = c.CultivationAreaAcres,
                HarvestDate = c.HarvestDate,
                HarvestedQuantity = c.HarvestedQuantity,
                AvailableQuantity = c.AvailableQuantity,
                SoldQuantity = c.SoldQuantity,
                Unit = c.Unit,
                ExpectedSellingPrice = c.ExpectedSellingPrice,
                QualityGrade = c.QualityGrade,
                StorageLocation = c.StorageLocation,
                CropDescription = c.CropDescription,
                Status = ComputeCropStatus(c),
                CreatedAt = c.CreatedAt,
                UpdatedAt = c.UpdatedAt
            };
        }
    }
}
