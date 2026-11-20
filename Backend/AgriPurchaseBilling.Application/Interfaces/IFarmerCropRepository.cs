using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using AgriPurchaseBilling.Domain.Entities;

namespace AgriPurchaseBilling.Application.Interfaces
{
    public interface IFarmerCropRepository
    {
        Task<Farmer?> GetFarmerByUserIdAsync(long userId, CancellationToken cancellationToken = default);

        Task<List<FarmerCrop>> GetCropsByFarmerIdAsync(
            long farmerId,
            string? category = null,
            string? season = null,
            string? search = null,
            CancellationToken cancellationToken = default);

        Task<FarmerCrop?> GetCropByIdAsync(
            long cropId,
            long farmerId,
            CancellationToken cancellationToken = default);

        Task<FarmerCrop> AddCropAsync(
            FarmerCrop crop,
            CancellationToken cancellationToken = default);

        Task<bool> UpdateCropAsync(
            FarmerCrop crop,
            CancellationToken cancellationToken = default);

        Task<bool> AddYieldStockAsync(
            long cropId,
            long farmerId,
            decimal additionalQuantity,
            CancellationToken cancellationToken = default);

        Task<bool> SoftDeleteCropAsync(
            long cropId,
            long farmerId,
            CancellationToken cancellationToken = default);

        Task<string> GenerateNextCropCodeAsync(
            CancellationToken cancellationToken = default);
    }
}
