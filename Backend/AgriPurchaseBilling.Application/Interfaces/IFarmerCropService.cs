using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using AgriPurchaseBilling.Application.DTOs;

namespace AgriPurchaseBilling.Application.Interfaces
{
    public interface IFarmerCropService
    {
        Task<ApiResponse<List<CropResponseDto>>> GetFarmerCropsAsync(
            long userId,
            string? category = null,
            string? season = null,
            string? search = null,
            CancellationToken cancellationToken = default);

        Task<ApiResponse<CropResponseDto>> GetCropByIdAsync(
            long userId,
            long cropId,
            CancellationToken cancellationToken = default);

        Task<ApiResponse<CropResponseDto>> RegisterCropAsync(
            long userId,
            CreateCropRequestDto request,
            CancellationToken cancellationToken = default);

        Task<ApiResponse<CropResponseDto>> UpdateCropAsync(
            long userId,
            long cropId,
            UpdateCropRequestDto request,
            CancellationToken cancellationToken = default);

        Task<ApiResponse<CropResponseDto>> AddCropYieldAsync(
            long userId,
            long cropId,
            AddCropYieldRequestDto request,
            CancellationToken cancellationToken = default);

        Task<ApiResponse<bool>> DeleteCropAsync(
            long userId,
            long cropId,
            CancellationToken cancellationToken = default);

        Task<ApiResponse<CropOptionsDto>> GetOptionsAsync(
            CancellationToken cancellationToken = default);

        Task<ApiResponse<CropMetadataDto>> GetMetadataAsync(
            CancellationToken cancellationToken = default);
    }
}
