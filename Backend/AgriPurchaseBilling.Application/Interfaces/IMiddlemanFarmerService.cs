using System.Threading.Tasks;
using AgriPurchaseBilling.Application.DTOs;

namespace AgriPurchaseBilling.Application.Interfaces
{
    public interface IMiddlemanFarmerService
    {
        Task<MiddlemanFarmerPageDto> GetFarmersAsync(long middlemanId, MiddlemanFarmerQueryDto query);
        Task<MiddlemanFarmerDto?> GetFarmerByIdAsync(long middlemanId, string farmerId);
        Task<MiddlemanFarmerDto> RegisterFarmerAsync(long middlemanId, RegisterFarmerRequest request);
        Task<MiddlemanFarmerDto?> UpdateFarmerAsync(long middlemanId, string farmerId, UpdateFarmerRequest request);
        Task<MiddlemanFarmerHistoryDto> GetFarmerHistoryAsync(long middlemanId, string farmerId);
    }
}
