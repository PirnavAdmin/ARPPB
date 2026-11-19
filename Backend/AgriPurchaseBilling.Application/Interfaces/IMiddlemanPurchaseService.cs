using System.Threading.Tasks;
using AgriPurchaseBilling.Application.DTOs;

namespace AgriPurchaseBilling.Application.Interfaces
{
    public interface IMiddlemanPurchaseService
    {
        Task<MiddlemanPurchasePageDto> GetPurchasesAsync(long middlemanId, MiddlemanPurchaseQueryDto query);
        Task<MiddlemanPurchaseDto?> GetPurchaseByIdAsync(long middlemanId, string purchaseId);
        Task<MiddlemanPurchaseDto> CreatePurchaseAsync(long middlemanId, CreateMiddlemanPurchaseRequest request);
    }
}
