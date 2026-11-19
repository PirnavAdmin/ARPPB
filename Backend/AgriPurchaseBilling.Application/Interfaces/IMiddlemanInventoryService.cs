using System.Threading.Tasks;
using AgriPurchaseBilling.Application.DTOs;

namespace AgriPurchaseBilling.Application.Interfaces
{
    public interface IMiddlemanInventoryService
    {
        Task<MiddlemanInventorySummaryDto> GetSummaryAsync(long middlemanId);
        Task<MiddlemanInventoryPageDto> GetBatchesAsync(long middlemanId, MiddlemanInventoryQueryDto query);
        Task<MiddlemanInventoryBatchDto?> GetBatchByIdAsync(long middlemanId, string idOrCode);
        Task<MiddlemanInventoryBatchDto> CreateBatchAsync(long middlemanId, CreateInventoryBatchRequest request);
        Task<MiddlemanInventoryBatchDto?> UpdateBatchAsync(long middlemanId, long id, UpdateInventoryBatchRequest request);
    }
}
