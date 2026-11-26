using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using AgriPurchaseBilling.Application.DTOs;

namespace AgriPurchaseBilling.Application.Interfaces
{
    public interface IFarmerMarketPriceService
    {
        Task<ApiResponse<List<MarketPriceStateOptionDto>>> GetStatesAsync(CancellationToken ct = default);
        Task<ApiResponse<List<FarmerMarketPriceItemDto>>> GetMarketPricesAsync(FarmerMarketPriceFilterDto filters, CancellationToken ct = default);
        Task<ApiResponse<FarmerMarketPriceChartDto>> GetChartAsync(string idOrCode, CancellationToken ct = default);
    }
}
