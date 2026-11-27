using System.Threading;
using System.Threading.Tasks;
using AgriPurchaseBilling.Application.DTOs;

namespace AgriPurchaseBilling.Application.Interfaces
{
    public interface IMiddlemanCentralIntegrationService
    {
        Task<UnifiedPortalSummaryDto> GetPortalSummaryAsync(long middlemanId, CancellationToken ct = default);
        Task<UnifiedPagedResultDto<UnifiedFarmerItemDto>> GetFarmersAsync(long middlemanId, UnifiedPortalQueryDto query, CancellationToken ct = default);
        Task<UnifiedPagedResultDto<UnifiedVendorItemDto>> GetVendorsAsync(long middlemanId, UnifiedPortalQueryDto query, CancellationToken ct = default);
        Task<UnifiedPagedResultDto<UnifiedCustomerItemDto>> GetCustomersAsync(long middlemanId, UnifiedPortalQueryDto query, CancellationToken ct = default);
        Task<UnifiedPagedResultDto<UnifiedMiddlemanItemDto>> GetMiddlemenAsync(long middlemanId, UnifiedPortalQueryDto query, CancellationToken ct = default);
        Task<UnifiedPagedResultDto<UnifiedFarmerPurchaseItemDto>> GetFarmerPurchasesAsync(long middlemanId, UnifiedPortalQueryDto query, CancellationToken ct = default);
        Task<UnifiedPagedResultDto<SellOrderResponseDto>> GetFarmerSellProductsAsync(long middlemanId, UnifiedPortalQueryDto query, CancellationToken ct = default);
        Task<UnifiedPagedResultDto<UnifiedMiddlemanBuyerOrderDto>> GetCustomerOrdersAsync(long middlemanId, UnifiedPortalQueryDto query, CancellationToken ct = default);
        Task<UnifiedPagedResultDto<UnifiedMiddlemanBuyerOrderDto>> GetVendorOrdersAsync(long middlemanId, UnifiedPortalQueryDto query, CancellationToken ct = default);
        Task<UnifiedPagedResultDto<UnifiedMiddlemanBuyerOrderDto>> GetBuyerOrdersAsync(long middlemanId, UnifiedPortalQueryDto query, CancellationToken ct = default);
    }
}
